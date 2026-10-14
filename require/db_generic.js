const utils = require('./utils.js');
module.exports = {
  find: function (options, data) {
    if (!options.canOrderBy.includes(data.orderBy)) {
      throw 'wrong_orderBy';
    }
    if (!['asc', 'desc'].includes(data.orderWay)) {
      throw 'wrong_orderWay';
    }
    let clauses = '';
    let params = {};
    const logicOperators = ['and', 'or'];
    const comparisonOperators = ['=', '<>', '<', '>', '<=', '>=', 'like', 'in'];
    let index = 0;
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
        if (!options.tables.includes(clause.type)) {
          throw 'wrong_table';
        }
        const name = `var_${index}`;
        let column = '';
        column = `"${utils.clean(clause.type)}".`;
        column += `"${utils.clean(clause.key)}"`;
        if (clause.number) {
          column = `cast(${column} as numeric)`;
        }
        if (clause.operator == 'in') {
          if (!Array.isArray(clause.value)) {
            throw 'in_clause_value_not_array';
          }
          const inValues = [];
          for (let valueItem of clause.value) {
            inValues.push(`'${utils.clean(valueItem)}'`);
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
      clauses += `\n${groupStart}${clauses ? ` ${item.logicOperator} ` : ''}( ${groupClauses} )${groupEnd}`;
    }
    const joinList = [];
    for (let item of options.foreignKeys) {
      joinList.push(`left join ${item.split('.')[0]} on ${options.groupBy} = ${item}`);
    }
    const query = `select ${options.select} from ${options.tables[0]}` +
    `\n${joinList.join('\n')}` +
    `\n${clauses ? `where ${clauses}` : ''}` +
    `\ngroup by ${options.groupBy}` +
    `\norder by ${data.orderBy} ${data.orderWay}`;
    const totalQuery = `select count(*) as total from (${query})`;
    const total = this.db.prepare(totalQuery).get(params).total;
    let products = this.db.prepare(`${query} limit :limit offset :offset`).all({
      ...params,
      limit: data.limit,
      offset: data.offset
    });
    return { list: products, total }
  },
  /*
   * pkColumns - array of primary key columns
   * toSetColumns - array of columns which will be set apart from the pkColumns
   * options:
   *   skipBegin - if true does not start transaction
   */
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
        rollback(this.db);
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
      item.value = utils.parseNumber(item.value);
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
      item.value = utils.parseNumber(item.value);
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
      entries[map[item.product_id]].prices[item.currency] = utils.parseNumber(item.value);
    }
    return entries;
  },
  getOrderItems: function (entries) {
    const ids = [];
    const map = {};
    for (let i = 0; i < entries.length; i++) {
      entries[i].order_items = [];
      ids.push(entries[i].id);
      map[entries[i].id] = i;
    }
    const order_items = this.db.prepare(`select * from order_items where order_id in (${ids.join(', ')}) order by order_id asc`).all();
    for (let item of order_items) {
      entries[map[item.order_id]].order_items.push(item);
    }
    return entries;
  },
  rollback: (db) => {
    if (db && db.isOpen && db.isTransaction) {
      db.exec('rollback');
    }
  }
}
