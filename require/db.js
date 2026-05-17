module.exports = function (options) {
  const { DatabaseSync } = require('node:sqlite');
  this.db = new DatabaseSync(options.dbPath);
  this.tokens = {
    get: (data) => {
      return this.db.prepare('select * from tokens where token = :token').get(data);
    },
    add: (data, duration) => {
      const query = this.db.prepare('insert into tokens (token, user_id, expires_at) values (:token, :user_id, :expires_at)');
      const expires_at = new Date();
      expires_at.setTime(expires_at.getTime() + duration);
      return query.run({
        ...data,
        expires_at: expires_at.toISOString()
      });
    },
    clean: (user_id) => {
      const query = this.db.prepare('delete from tokens where expires_at < :maxTime or user_id = :user_id');
      return query.run({
        user_id,
        maxTime: new Date().toISOString()
      });
    }
  }
  this.reset_codes = {
    get: (data) => {
      return this.db.prepare('select * from reset_codes where code = :code').get(data);
    },
    add: (data, duration) => {
      const query = this.db.prepare('insert into reset_codes (code, user_id, expires_at) values (:code, :user_id, :expires_at)');
      const expires_at = new Date();
      expires_at.setTime(expires_at.getTime() + duration);
      return query.run({
        ...data,
        expires_at: expires_at.toISOString()
      });
    },
    clean: (user_id) => {
      const query = this.db.prepare('delete from reset_codes where expires_at < :maxTime or user_id = :user_id');
      return query.run({
        user_id,
        maxTime: new Date().toISOString()
      });
    }
  }
  this.users = {
    get: (data) => {
      let query;
      if (data.id) {
        query = this.db.prepare('select * from users where id = :id');
      }
      else if (data.email) {
        query = this.db.prepare('select * from users where email = :email');
      }
      return query.get(data);
    },
    set: (data, toSet) => {
      let fields = [];
      for (let item of toSet) {
        fields.push(`${item} = :${item}`);
      }
      return this.db.prepare(`update users set ${fields.join(', ')} where id = :id`).run(data);
    },
    setPassword: (data) => {
      const query = this.db.prepare('update users set password = :password where id = :id');
      return query.run(data);
    },
    add: (data) => {
      const query = this.db.prepare('insert into users (email, password, type, created_at) values (:email, :password, :type, :created_at)');
      return query.run({
        ...data,
        created_at: new Date().toISOString()
      });
    }
  }
  this.plugins = {
    getAll: () => {
      return this.db.prepare('select * from plugins').all();
    },
    getActive: () => {
      return this.db.prepare('select * from plugins where active = 1').all();
    }
  }
}
