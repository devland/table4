module.exports = function (options) {
  const { DatabaseSync } = require('node:sqlite');
  const getFieldAssignments = (data) => {
    const fields = [];
    for (let key of Object.keys(data)) {
      if (typeof data[key] == 'undefined') {
        delete data[key];
        continue;
      }
      fields.push(`${key} = :${key}`);
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
      let fields = [];
      for (let item of toSet) {
        fields.push(`${item} = :${item}`);
      }
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
      // to do
    }
  }
  this.tagKeys = {
    get: function () {
      return this.db.prepare('select * from tag_keys').all();
    },
    update: function (data) {
      return self.generic.update('tag_keys', ['key'], ['one_per'], data);
    }
  }
  this.tags = {
    get: function (data) {
      let fields = getFieldAssignments(data);
      return this.db.prepare(`select * from tags where ${fields.join(' and ')}`).all(data);
    },
    update: function (data) {
      return self.generic.update('tags', ['for_table', 'for_id', 'key', 'language'], ['value'], data);
    }
  }
  this.plugins = {
    getAll: function () {
      return this.db.prepare('select * from plugins').all();
    },
    getActive: function () {
      return this.db.prepare('select * from plugins where active = \'true\'').all();
    }
  }
  this.generic = {
    update: function (table, pkColumns, toSetColumns, data) {
      try {
        this.db.exec('begin');
        let selectWhere = [];
        let selectParams = {}
        const allColumns = pkColumns.concat(toSetColumns);
        let index = 0;
        const output = {}
        const computeClause = (columns, prefix = '', separator, options = {}) => {
          let clauses = [];
          const params = [];
          for (let column of columns) {
            const columnEquals = !options.noColumn ? `${column} = ` : '';
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
        for (let item of data) {
          selectWhere.push(computeClause(pkColumns, index, ' and '));
          selectParams = { ...selectParams, ...computeParams(pkColumns, item, index) };
          index++;
        }
        const existing = this.db.prepare(`select * from ${table} where ${selectWhere.join(' or ')}`).all(selectParams);
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
            }
            else {
              delete item.remove;
              const updateSet = computeClause(toSetColumns, '', ', ', { noBrackets: true });
              const updateWhere = computeClause(pkColumns, '', ' and ');
              update.push({
                query: `update ${table} set ${updateSet} where ${updateWhere}`,
                params: computeParams(allColumns, item)
              });
            }
          }
          else if (!item.remove) {
            delete item.remove;
            insert.push(computeClause(allColumns, index, ', ', { noColumn: true }));
            insertParams = { ...insertParams, ...computeParams(allColumns, item, index) };
          }
          index++;
        }
        if (insert.length) {
          output.inserted = this.db.prepare(`insert into ${table} (${allColumns.join(', ')}) values ${insert.join(', ')}`).run(insertParams);
        }
        if (update.length) {
          output.updated = [];
          for (let item of update) {
            output.updated = output.updated.concat(this.db.prepare(item.query).run(item.params));
          }
        }
        if (remove.length) {
          output.removed = this.db.prepare(`delete from ${table} where ${remove.join(' or ')}`).run(removeParams);
        }
        output.tags = this.db.prepare(`select * from ${table} where ${selectWhere.join(' or ')}`).all(selectParams);
        this.db.exec('commit');
        return output;
      }
      catch (error) {
        this.db.exec('rollback');
        throw error;
      }
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
    for (let method in this[table]) {
      wrap(table, method, this[table][method]);
    }
  }
}
