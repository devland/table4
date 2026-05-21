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
  this.tags = {
    get: function (data) {
      let fields = getFieldAssignments(data);
      return this.db.prepare(`select * from tags where ${fields.join(' and ')}`).all(data);
    },
    update: function (data) {
      try {
        this.db.exec('begin');
        let where = [];
        let params = {}
        let index = 0;
        const output = {}
        for (let item of data) {
          where.push(`(for_table = :${index}_for_table and for_id = :${index}_for_id and key = :${index}_key and language = :${index}_language)`);
          params[`${index}_for_table`] = item.for_table;
          params[`${index}_for_id`] = item.for_id;
          params[`${index}_key`] = item.key;
          params[`${index}_language`] = item.language;
          index++;
        }
        const existing = this.db.prepare(`select * from tags where ${where.join(' or ')}`).all(params);
        const insert = [];
        const insertParams = {}
        const update = [];
        const remove = [];
        const removeParams = {}
        index = 0;
        for (let item of data) {
          let exists = false;
          for (let entry of existing) {
            if (item.for_table == entry.for_table && item.for_id == entry.for_id && item.key == entry.key && item.language == entry.language) {
              exists = true;
              continue;
            }
          }
          if (exists) {
            if (item.remove) {
              remove.push(`(for_table = :${index}_for_table and for_id = :${index}_for_id and key = :${index}_key and language = :${index}_language)`);
              removeParams[`${index}_for_table`] = item.for_table;
              removeParams[`${index}_for_id`] = item.for_id;
              removeParams[`${index}_key`] = item.key;
              removeParams[`${index}_language`] = item.language;
              delete item.remove;
            }
            else {
              update.push({
                query: `update tags set value = :value, one_per = :one_per where for_table = :for_table and for_id =:for_id and key = :key and language = :language`,
                params: {
                  for_table: item.for_table,
                  for_id: item.for_id,
                  key: item.key,
                  value: item.value,
                  language: item.language,
                  one_per: item.one_per
                }
              });
            }
          }
          else if (!item.remove) {
            insert.push(`(:${index}_for_table, :${index}_for_id, :${index}_key, :${index}_value, :${index}_language, :${index}_one_per)`);
            insertParams[`${index}_for_table`] = item.for_table;
            insertParams[`${index}_for_id`] = item.for_id;
            insertParams[`${index}_key`] = item.key;
            insertParams[`${index}_value`] = item.value;
            insertParams[`${index}_language`] = item.language;
            insertParams[`${index}_one_per`] = item.one_per;
          }
          index++;
        }
        if (insert.length) {
          output.inserted = this.db.prepare(`insert into tags (for_table, for_id, key, value, language, one_per) values ${insert.join(', ')}`).run(insertParams);
        }
        if (update.length) {
          output.updated = [];
          for (let item of update) {
            output.updated = output.updated.concat(this.db.prepare(item.query).run(item.params));
          }
        }
        if (remove.length) {
          output.removed = this.db.prepare(`delete from tags where ${remove.join(' or ')}`).run(removeParams);
        }
        output.tags = this.db.prepare(`select * from tags where ${where.join(' or ')}`).all(params);
        this.db.exec('commit');
        return output;
      }
      catch (error) {
        this.db.exec('rollback');
        throw error;
      }
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
