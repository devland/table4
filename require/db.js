module.exports = function (options) {
  const { DatabaseSync } = require('node:sqlite');
  const clean = (input) => {
    if (isNaN(input)) {
      return input.replaceAll(/[^a-z0-9_]/mgi, '');
    }
    else {
      return parseFloat(input);
    }
  }
  const getFieldAssignments = (data) => {
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
      return this.db.prepare('select * from reset_codes where code = :code').get(data);
    },
    add: function (data, duration) {
      const query = this.db.prepare('insert into reset_codes (code, user_id, expires_at) values (:code, :user_id, :expires_at)');
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
      let query;
      if (data.id) {
        query = this.db.prepare('select * from users where id = :id');
      }
      else if (data.email) {
        query = this.db.prepare('select * from users where email = :email');
      }
      return query.get(data);
    },
    get: function (data, limit = 10, offset = 0) {
      let fields = getFieldAssignments(data);
      return this.db.prepare(`select id, email, type, created_at from users where ${fields.join(' and ')} limit :limit offset :offset`).all({ ...data, limit, offset });
    },
    set: function (data, toSet) {
      let fields = getFieldAssignments(data);
      return this.db.prepare(`update users set ${fields.join(', ')} where id = :id`).run(data);
    },
    setPassword: function (data) {
      const query = this.db.prepare('update users set password = :password where id = :id');
      return query.run(data);
    },
    add: function (data) {
      const query = this.db.prepare('insert into users (email, password, type, created_at) values (:email, :password, :type, :created_at)');
      return query.run({
        ...data,
        created_at: new Date().toISOString()
      });
    },
    remove: function (data) {
      // to do <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
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
      let fields = getFieldAssignments(data);
      return this.db.prepare(`select * from tags where ${fields.join(' and ')}`).all(data);
    },
    update: function (data) {
      return self.generic.update.apply(this, ['tags', ['for_table', 'for_id', 'key', 'language'], ['value'], data]);
    }
  }
  this.plugins = {
    get: function () {
      return this.db.prepare('select * from plugins').all();
    },
    getActive: function () {
      return this.db.prepare('select * from plugins where active = :active').all({ active: 'yes' });
    },
    update: function (data) {
      return self.generic.update.apply(this, ['plugins', ['name'], ['name', 'active'], data]);
    }
  }
  this.products = {
    get: function (data) {
      let where = '';
      if (data.ids && data.ids.length) {
        for (let i = 0; i < data.ids.length; i++) {
          data.ids[i] = clean(data.ids[i]);
        }
        where = ` where id in (${data.ids.join(', ')}) `;
        delete data.ids;
      }
      const products = this.db.prepare(`select * from products${where} order by id asc limit :limit offset :offset`).all(data);
      return self.generic.getTags.apply(this, ['products', products]);
    },
    find: function (data) {
      if (!['tags.value', 'prices.price'].includes(data.orderBy)) {
        throw 'invalid_orderBy';
        return;
      }
      if (!['asc', 'desc'].includes(data.orderWay)) {
        throw 'invalid_orderWay';
        return;
      }
      if (!data.where.length) {
        const ids = this.db.prepare(`select for_id as id from tags group by for_id order by ${data.orderBy} ${data.orderWay} limit :limit offset :offset`).all({
          limit: data.limit,
          offset: data.offset
        });
        return ids;
      }
      let where = '';
      let params = {}
      const tables = ['tags', 'prices'];
      const logicOperators = ['and', 'or'];
      const operators = ['=', '<', '>', '<=', '>=', 'like'];
      let index = 0;
      let tagClauseCount = 0;
      for (let item of data.where) {
        if (!logicOperators.includes(item.groupOperator) || !logicOperators.includes(item.clauseOperator)) {
          throw 'invalid_operator';
          return;
        }
        const groupClauses = [];
        for (let clause of item.clauses) {
          if (!operators.includes(clause.operator)) {
            throw 'invalid_operator';
            return;
          }
          const name = `var_${index}`;
          let column = '';
          if (tables.includes(clause.type)) {
            column = `"${clean(clause.type)}".`;
          }
          column += `"${clean(clause.key)}"`;
          if (clause.number) {
            column = `cast(${column} as numeric)`;
          }
          groupClauses.push(`${column} ${clause.operator} :${name}`);
          params[name] = clause.value;
          index++;
          if (clause.type == 'tags' && clause.key == 'key') {
            tagClauseCount++;
          }
        }
        const groupWhere = groupClauses.join(` ${item.clauseOperator} `);
        const operator = where ? ` ${item.groupOperator} ` : '';
        const groupStart = item.groupStart ? '( ' : '';
        const groupEnd = item.groupEnd ? ' )' : '';
        where += `${groupStart}${operator}( ${groupWhere} )${groupEnd}`;
      }
      const query = `select for_id as id from tags inner join prices on product_id = for_id where currency = :currency and for_table = 'products' and ${where} group by for_id having count(for_id) = ${tagClauseCount} order by ${data.orderBy} ${data.orderWay} limit :limit offset :offset`;
      const ids = this.db.prepare(query).all({
        currency: data.currency,
        limit: data.limit,
        offset: data.offset,
        ...params
      });
      return ids;
    },
    update: function (data) {
      return self.generic.update.apply(this, ['products', ['id'], ['stock'], data, {
        noInsertPks: true
      }]);
    }
  }
  this.cart = {
    get: function (data) {
      return this.db.prepare('select * from cart where user_id = :user_id').all(data);
    },
    update: function (data) {
      for (let i = 0; i < data.length; i++) {
        data[i].created_at = new Date().toISOString();
      }
      return self.generic.update.apply(this, ['cart', ['user_id', 'product_id'], ['quantity', 'created_at'], data]);
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
      let fields = getFieldAssignments(data);
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
          return;
        }
        result = self.generic.update.apply(this, ['order_flows', ['id'], ['tree', 'active', 'created_at'], data, {
          skipBegin: true,
          noInsertPks: true
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
  this.generic = {
    update: function (table, pkColumns, toSetColumns, data, options = {}) {
      try {
        if (!options.skipBegin) {
          this.db.exec('begin');
        }
        let selectWhere = [];
        let selectParams = {}
        const allColumns = pkColumns.concat(toSetColumns);
        const insertColumns = options.noInsertPks ? toSetColumns : allColumns;
        let index = 0;
        const output = {
          inserted: 0,
          updated: 0,
          removed: 0
        }
        const computeClause = (columns, prefix = '', separator, options = {}) => {
          let clauses = [];
          const params = [];
          for (let column of columns) {
            const columnEquals = options.justValues ? '' : `${column} = `;
            clauses.push(`${columnEquals}:${prefix != '' ? prefix + '_' : ''}${column}`);
          }
          if (options.noBrackets) {
            return clauses.join(separator);
          }
          else {
            return `(${clauses.join(separator)})`;
          }
        }
        const computeParams = (columns, data, prefix = '') => {
          const params = {}
          for (let column of columns) {
            params[`${prefix != '' ? prefix + '_' : ''}${column}`] = data[column];
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
            insert.push(computeClause(insertColumns, index, ', ', { justValues: true }));
            insertParams = { ...insertParams, ...computeParams(insertColumns, item, index) };
            output.inserted++;
          }
          index++;
        }
        if (insert.length) {
          this.db.prepare(`insert into ${table} (${insertColumns.join(', ')}) values ${insert.join(', ')}`).run(insertParams);
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
        entries[map[item.for_id]].tags[item.key] = isNaN(item.value) ? item.value : parseFloat(item.value);
      }
      return entries;
    }
  }
  // run each method within its own db instance
  const wrap = (table, method, run) => {
    this[table][method] = function () {
      const self = {}
      self.db = new DatabaseSync(options.dbPath);
      const result = run.apply(self, arguments);
      self.db.close();
      return result;
    }
  }
  for (let table in this) {
    if (table == 'generic') {
      continue;
    }
    for (let method in this[table]) {
      wrap(table, method, this[table][method]);
    }
  }
}
