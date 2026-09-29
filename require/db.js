module.exports = function (options) {
  const { DatabaseSync } = require('node:sqlite');
  const { parseNumber, clean } = require('./utils.js');
  const cleanKeys = (data) => {
    const fields = [];
    for (let key of Object.keys(data)) {
      if (typeof data[key] == 'undefined') {
        delete data[key];
        continue;
      }
      const name = clean(key);
      fields.push(`"${name}" = :${name}`);
    }
    return fields;
  }
  const self = this;
  const checkProducts = (list) => {
    // check if cart/order products obey product_flags rules
  }
  this.tokens = {
    getFirst: function (data) {
      return this.db.prepare('select * from tokens where token = :token').get(data);
    },
    add: function (data, duration) {
      const query = this.db.prepare('insert into tokens (token, user_id, expires_at) values (:token, :user_id, :expires_at)');
      const expires_at = new Date();
      expires_at.setTime(expires_at.getTime() + duration);
      return query.run({
        ...data,
        expires_at: expires_at.toISOString()
      });
    },
    clean: function (user_id) {
      const query = this.db.prepare('delete from tokens where expires_at < :maxTime or user_id = :user_id');
      return query.run({
        user_id,
        maxTime: new Date().toISOString()
      });
    }
  }
  this.reset_codes = {
    get: function (data) {
      return this.db.prepare('select * from reset_codes where code = :code and type = :type').get(data);
    },
    add: function (data, duration) {
      const query = this.db.prepare('insert into reset_codes (code, user_id, type, data, expires_at) values (:code, :user_id, :type, :data, :expires_at)');
      const expires_at = new Date();
      expires_at.setTime(expires_at.getTime() + duration);
      return query.run({
        ...data,
        expires_at: expires_at.toISOString()
      });
    },
    clean: function (user_id) {
      const query = this.db.prepare('delete from reset_codes where expires_at < :maxTime or user_id = :user_id');
      return query.run({
        user_id,
        maxTime: new Date().toISOString()
      });
    }
  }
  this.users = {
    getFirst: function (data) {
      let fields = cleanKeys(data);
      return this.db.prepare(`select id, email, password, type, created_at from users where ${fields.join(' and ')}`).get(data);
    },
    get: function (data, limit = 10, offset = 0) {
      let fields = cleanKeys(data);
      const total = this.db.prepare(`select count(id) as total from users where ${fields.join(' and ')}`).get();
      const list = this.db.prepare(`select id, email, type, created_at from users where ${fields.join(' and ')} limit :limit offset :offset`).all({ ...data, limit, offset });
      return { list, ...total }
    },
    set: function (data, toSet) {
      let fields = cleanKeys(data);
      return this.db.prepare(`update users set ${fields.join(', ')} where id = :id`).run(data);
    },
    setPassword: function (data) {
      return this.db.prepare('update users set password = :password where id = :id').run(data);
    },
    add: function (data) {
      data.created_at = new Date().toISOString();
      return this.db.prepare('insert into users (email, password, type, created_at) values (:email, :password, :type, :created_at)').run(data);
    },
    remove: function (data) {
      // to do; all user associated data has to be removed...
    }
  }
  this.tagKeys = {
    get: function () {
      return this.db.prepare('select * from tag_keys').all();
    },
    update: function (data) {
      return self.generic.update.apply(this, ['tag_keys', ['key'], ['active'], data]);
    }
  }
  this.tags = {
    get: function (data) {
      let fields = cleanKeys(data);
      return this.db.prepare(`select * from tags where ${fields.join(' and ')}`).all(data);
    },
    update: function (data) {
      return self.generic.update.apply(this, ['tags', ['id'], ['for_table', 'for_id', 'key', 'language', 'value'], data]);
    }
  }
  this.product_flags = {
    get: function (data) {
      let fields = cleanKeys(data);
      return this.db.prepare(`select * from product_flags where ${fields.join(' and ')}`).all(data);
    },
    update: function (data) {
      return self.generic.update.apply(this, ['product_flags', ['id'], ['product_id', 'key', 'value'], data]);
    }
  }
  this.products = {
    getByIds: function (data) {
      if (!data.ids || !data.ids.length) {
        return { list: [], total: 0};
      }
      let where = '';
      for (let i = 0; i < data.ids.length; i++) {
        data.ids[i] = clean(data.ids[i]);
      }
      where = ` where id in (${data.ids.join(', ')}) `;
      const total = data.ids.length;
      delete data.ids;
      let products = this.db.prepare(`select * from products${where} order by id asc limit :limit offset :offset`).all(data);
      products = self.generic.getProductFlags.apply(this, [products]);
      products = self.generic.getTags.apply(this, ['products', products]);
      products = self.generic.getPrices.apply(this, [products]);
      return { list: products, total }
    },
    find: function (data) {
      const canOrderBy = ['products.id', 'product_flags.value', 'tags.value', 'prices.value'];
      if (!canOrderBy.includes(data.orderBy)) {
        throw 'wrong_orderBy';
      }
      if (!['asc', 'desc'].includes(data.orderWay)) {
        throw 'wrong_orderWay';
      }
      let clauses = '';
      let where = [];
      let params = {}
      const tables = ['products', 'product_flags', 'tags', 'prices'];
      const logicOperators = ['and', 'or'];
      const comparisonOperators = ['=', '<>', '<', '>', '<=', '>=', 'like', 'in'];
      let index = 0;
      let usedClauses = {};
      for (let item of data.where) {
        if (!logicOperators.includes(item.logicOperator)) {
          throw 'wrong_group_logic_operator';
        }
        let groupClauses = '';
        for (let clause of item.clauses) {
          if (!logicOperators.includes(clause.logicOperator)) {
            throw 'wrong_clause_logic_operator';
          }
          if (!comparisonOperators.includes(clause.operator)) {
            throw 'wrong_comparison_operator';
          }
          if (!tables.includes(clause.type)) {
            throw 'wrong_table';
          }
          usedClauses[clause.type] ??= true;
          const name = `var_${index}`;
          let column = '';
          column = `"${clean(clause.type)}".`;
          column += `"${clean(clause.key)}"`;
          if (clause.number) {
            column = `cast(${column} as numeric)`;
          }
          if (clause.operator == 'in') {
            if (!Array.isArray(clause.value)) {
              throw 'in_clause_value_not_array';
            }
            const inValues = [];
            for (let valueItem of clause.value) {
              inValues.push(`'${clean(valueItem)}'`);
            }
            groupClauses += `${groupClauses ? ` ${clause.logicOperator} ` : ''}${column} ${clause.operator} (${inValues.join(', ')})`;
          }
          else {
            groupClauses += `${groupClauses ? ` ${clause.logicOperator} ` : ''}${column} ${clause.operator} :${name}`;
            params[name] = clause.value;
          }
          index++;
        }
        const groupStart = item.groupStart ? '( ' : '';
        const groupEnd = item.groupEnd ? ' )' : '';
        clauses += `${groupStart}${clauses ? ` ${item.logicOperator} ` : ''}( ${groupClauses} )${groupEnd}`;
      }
      if (clauses) {
        where.push(clauses);
      }
      if (usedClauses['product_flags']) {
        where.unshift('tags.for_table = \'products\'');
      }
      const query = `select products.id from products
      left join tags on products.id = tags.for_id
      left join product_flags on products.id = product_flags.product_id
      left join prices on products.id = prices.product_id
      ${where.length ? 'where ' + where.join(' and ') : ''}
      group by products.id
      order by ${data.orderBy} ${data.orderWay}`;
      const totalQuery = `select count(*) as total from (${query})`;
      if (!usedClauses['prices']) {
        delete params.currency;
      }
      const total = this.db.prepare(totalQuery).get(params).total;
      let products = this.db.prepare(`${query} limit :limit offset :offset`).all({
        ...params,
        limit: data.limit,
        offset: data.offset
      });
      products = self.generic.getProductFlags.apply(this, [products]);
      products = self.generic.getTags.apply(this, ['products', products]);
      products = self.generic.getPrices.apply(this, [products]);
      return { list: products, total }
    },
    update: function (data) {
      return self.generic.update.apply(this, ['products', ['id'], ['stock'], data]);
    }
  }
  this.currencies = {
    get: function () {
      return this.db.prepare('select * from currencies').all();
    },
    update: function (data) {
      return self.generic.update.apply(this, ['currencies', ['code'], ['active'], data]);
    }
  }
  this.prices = {
    get: function (data) {
      let fields = cleanKeys(data);
      return this.db.prepare(`select * from prices where ${fields.join(' and ')}`).all(data);
    },
    update: function (data) {
      return self.generic.update.apply(this, ['prices', ['product_id', 'currency'], ['value'], data]);
    }
  }
  this.orderFlows = {
    get: function () {
      return this.db.prepare('select * from order_flows').all();
    },
    update: function (data) {
      try {
        this.db.exec('begin');
        const ids = [];
        for (let i = 0; i < data.length; i++) {
          data[i].created_at = new Date().toISOString();
          if (data[i].id) {
            ids.push(clean(data[i].id));
          }
        }
        let result = this.db.prepare(`select count(*) as count from orders where flow_id in (${ids.join(', ')})`).get();
        if (result.count > 0) {
          this.db.exec('rollback');
          throw 'order_flow_has_orders';
        }
        result = self.generic.update.apply(this, ['order_flows', ['id'], ['tree', 'active', 'created_at'], data, {
          skipBegin: true
        }]);
        this.db.exec('commit');
        return result;
      }
      catch (error) {
        this.db.exec('rollback');
        throw error;
      }
    }
  }
  this.orders = {
    get: function (data, limit = 10, offset = 0) {
      let fields = cleanKeys(data);
      const total = this.db.prepare(`select count(*) as total from orders where ${fields.join(' and ')}`).get();
      const list = this.db.prepare(`select * from orders where ${fields.join(' and ')} limit :limit offset :offset`).all({ ...data, limit, offset });
      return { list, ...total }
    },
    update: function (data) {
      data.created_at = new Date().toISOString();
      return self.generic.update.apply(this, ['orders', ['id'], ['flow_id', 'user_id', 'uuid', 'currency', 'payment', 'status', 'notes', 'created_at'], data, {
        skipBegin: true
      }]);
    }
  }
  this.cart = {
    get: function (data) {
      const cart = this.db.prepare('select * from cart_keys where uuid = :uuid').get({ uuid: data.uuid });
      if (!cart || cart.key != data.key) {
        throw 'wrong_uuid_key';
      }
      const list = this.db.prepare('select * from cart where uuid = :uuid').all({ uuid: data.uuid });
      return { cart, list }
    },
    update: function (data) {
      try {
        this.db.exec('begin');
        if (data?.key.length < 36) {
          throw 'short_key';
        }
        let uuid;
        for (let i = 0; i < data.list.length; i++) {
          if (!data.list[i].uuid) {
            throw 'uuid_missing';
          }
          uuid ??= data.list[i].uuid;
          if (data.list[i].uuid != uuid) {
            throw 'different_uuids';
          }
        }
        let cart = this.db.prepare('select * from cart_keys where uuid = :uuid').get({ uuid });
        if (!cart) {
          if (uuid.length < 36) {
            throw 'short_uuid';
          }
          this.db.prepare('insert into cart_keys (uuid, key, updated_at) values (:uuid, :key, :updated_at)').run({
            uuid,
            key: data.key,
            updated_at: new Date().toISOString()
          });
          cart = this.db.prepare('select * from cart_keys where uuid = :uuid').get({ uuid });
        }
        if (cart.key != data.key) {
          throw 'wrong_uuid_key';
        }
        this.db.prepare('update cart_keys set updated_at = :updated_at where uuid = :uuid').run({
          uuid,
          updated_at: new Date().toISOString()
        });
        const result = self.generic.update.apply(this, ['cart', ['uuid', 'product_id'], ['user_id', 'parent_id', 'quantity', 'action'], data.list, {
          skipBegin: true
        }]);
        this.db.exec('commit');
        return result;
      }
      catch (error) {
        this.db.exec('rollback');
        throw error;
      }
    },
    clean: function (maxDuration) {
      let maxTime = new Date();
      maxTime.setTime(maxTime.getTime() - maxDuration);
      maxTime = maxTime.toISOString();
      this.db.prepare('delete from cart where uuid in (select uuid from cart_keys where updated_at < :maxTime)').run({ maxTime });
      return this.db.prepare('delete from cart_keys where updated_at < :maxTime').run({ maxTime });
    }
  }
  /*
   * pkColumns - array of primary key columns
   * toSetColumns - array of columns which will be set apart from the pkColumns
   * options:
   *   skipBegin - if true does not start transaction
   */
  this.generic = {
    update: function (table, pkColumns, toSetColumns, data, options = {}) {
      try {
        if (!options.skipBegin) {
          this.db.exec('begin');
        }
        let selectWhere = [];
        let selectParams = {}
        const allColumns = pkColumns.concat(toSetColumns);
        let index = 0;
        const output = {
          inserted: 0,
          updated: 0,
          removed: 0
        }
        const computeClause = (columns, prefix = '', separator, optionals = {}) => {
          let clauses = [];
          const params = [];
          for (let column of columns) {
            const columnEquals = optionals.justValues ? '' : `${column} = `;
            clauses.push(`${columnEquals}:${prefix != '' ? prefix + '_' : ''}${column}`);
          }
          if (optionals.noBrackets) {
            return clauses.join(separator);
          }
          else {
            return `(${clauses.join(separator)})`;
          }
        }
        const computeParams = (columns, data, prefix = '') => {
          const params = {}
          for (let column of columns) {
            params[`${prefix != '' ? prefix + '_' : ''}${column}`] = data[column] ?? null;
          }
          return params;
        }
        const hasKeys = (input, list) => {
          let has = true;
          for (let key of list) {
            if (typeof input[key] == 'undefined') {
              has = false;
              break;
            }
          }
          return has;
        }
        for (let item of data) {
          if (!hasKeys(item, pkColumns)) {
            continue;
          }
          selectWhere.push(computeClause(pkColumns, index, ' and '));
          selectParams = { ...selectParams, ...computeParams(pkColumns, item, index) };
          index++;
        }
        let existing = [];
        if (selectWhere.length) {
          existing = this.db.prepare(`select * from ${table} where ${selectWhere.join(' or ')}`).all(selectParams);
        }
        const insert = [];
        let insertParams = {}
        const update = [];
        const remove = [];
        let removeParams = {}
        index = 0;
        for (let item of data) {
          let exists = false;
          for (let entry of existing) {
            let matchingCols = 0;
            for (let column of pkColumns) {
              if (item[column] == entry[column]) {
                matchingCols++;
              }
            }
            if (pkColumns.length == matchingCols) {
              exists = true;
              continue;
            }
          }
          if (exists) {
            if (item.remove) {
              delete item.remove;
              remove.push(computeClause(pkColumns, index, ' and '));
              removeParams = { ...removeParams, ...computeParams(pkColumns, item, index) };
              output.removed++;
            }
            else {
              delete item.remove;
              const updateSet = computeClause(toSetColumns, '', ', ', { noBrackets: true });
              const updateWhere = computeClause(pkColumns, '', ' and ');
              update.push({
                query: `update ${table} set ${updateSet} where ${updateWhere}`,
                params: computeParams(allColumns, item)
              });
              output.updated++;
            }
          }
          else if (!item.remove) {
            delete item.remove;
            insert.push(computeClause(allColumns, index, ', ', { justValues: true }));
            insertParams = { ...insertParams, ...computeParams(allColumns, item, index) };
            output.inserted++;
          }
          index++;
        }
        if (insert.length) {
          this.db.prepare(`insert into ${table} (${allColumns.join(', ')}) values ${insert.join(', ')}`).run(insertParams);
        }
        if (update.length) {
          for (let item of update) {
            this.db.prepare(item.query).run(item.params);
          }
        }
        if (remove.length) {
          this.db.prepare(`delete from ${table} where ${remove.join(' or ')}`).run(removeParams);
        }
        if (!options.skipBegin) {
          this.db.exec('commit');
        }
        return output;
      }
      catch (error) {
        if (!options.skipBegin) {
          this.db.exec('rollback');
        }
        throw error;
      }
    },
    getProductFlags: function (entries) {
      const ids = [];
      const map = {};
      for (let i = 0; i < entries.length; i++) {
        entries[i].product_flags = {};
        ids.push(entries[i].id);
        map[entries[i].id] = i;
      }
      const product_flags = this.db.prepare(`select * from product_flags where product_id in (${ids.join(', ')}) order by product_id asc`).all();
      for (let item of product_flags) {
        entries[map[item.product_id]].product_flags[item.key] ??= [];
        item.value = parseNumber(item.value);
        entries[map[item.product_id]].product_flags[item.key].push({
          id: item.id,
          value: item.value
        });
      }
      return entries;
    },
    getTags: function (table, entries) {
      const ids = [];
      const map = {};
      for (let i = 0; i < entries.length; i++) {
        entries[i].tags = {};
        ids.push(entries[i].id);
        map[entries[i].id] = i;
      }
      const tags = this.db.prepare(`select * from tags where for_table = :table and for_id in (${ids.join(', ')}) order by for_id asc`).all({ table });
      for (let item of tags) {
        entries[map[item.for_id]].tags[item.key] ??= [];
        item.value = parseNumber(item.value);
        entries[map[item.for_id]].tags[item.key].push({
          id: item.id,
          language: item.language,
          value: item.value
        });
      }
      return entries;
    },
    getPrices: function (entries) {
      const ids = [];
      const map = {};
      for (let i = 0; i < entries.length; i++) {
        entries[i].prices = {};
        ids.push(entries[i].id);
        map[entries[i].id] = i;
      }
      const prices = this.db.prepare(`select * from prices where product_id in (${ids.join(', ')}) order by product_id asc`).all();
      for (let item of prices) {
        entries[map[item.product_id]].prices[item.currency] = parseNumber(item.value);
      }
      return entries;
    }
  }
  // run each method within its own db instance
  const wrap = (table, method) => {
    this.methods ??= {}; // preserve db methods without own db connection
    this.methods[table] ??= {};
    this.methods[table][method] = this[table][method];
    this[table][method] = function () {
      this.db = new DatabaseSync(options.dbPath);
      const result = self.methods[table][method].apply(this, arguments);
      this.db.close();
      return result;
    }
  }
  for (let table in this) {
    if (table == 'generic') {
      continue;
    }
    for (let method in this[table]) {
      wrap(table, method);
    }
  }
}
