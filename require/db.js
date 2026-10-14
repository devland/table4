module.exports = function (options) {
  const { DatabaseSync } = require('node:sqlite');
  const utils = require('./utils.js');
  const generic = require('./db_generic.js');
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
      let fields = utils.cleanKeys(data);
      return this.db.prepare(`select id, email, password, type, created_at from users where ${fields.join(' and ')}`).get(data);
    },
    get: function (data, limit = 10, offset = 0) {
      let fields = utils.cleanKeys(data);
      const total = this.db.prepare(`select count(id) as total from users where ${fields.join(' and ')}`).get(data);
      const list = this.db.prepare(`select id, email, type, created_at from users where ${fields.join(' and ')} limit :limit offset :offset`).all({ ...data, limit, offset });
      return { list, ...total };
    },
    set: function (data, toSet) {
      let fields = utils.cleanKeys(data);
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
      return generic.update.apply(this, ['tag_keys', ['key'], ['active'], data]);
    }
  }
  this.tags = {
    get: function (data) {
      let fields = utils.cleanKeys(data);
      return this.db.prepare(`select * from tags where ${fields.join(' and ')}`).all(data);
    },
    update: function (data) {
      return generic.update.apply(this, ['tags', ['id'], ['for_table', 'for_id', 'key', 'language', 'value'], data]);
    }
  }
  this.product_flags = {
    get: function (data) {
      let fields = utils.cleanKeys(data);
      const flags = this.db.prepare(`select * from product_flags where ${fields.join(' and ')}`).all(data);
      for (let item of flags) {
        item.value = utils.parseNumber(item.value);
      }
      return flags;
    },
    update: function (data) {
      return generic.update.apply(this, ['product_flags', ['id'], ['product_id', 'key', 'value'], data]);
    }
  }
  this.products = {
    getByIds: function (data) {
      if (!data.ids || !data.ids.length) {
        return { list: [], total: 0};
      }
      let where = '';
      for (let i = 0; i < data.ids.length; i++) {
        data.ids[i] = utils.clean(data.ids[i]);
      }
      where = ` where id in (${data.ids.join(', ')}) `;
      const total = data.ids.length;
      delete data.ids;
      let limitOffset = '';
      if (typeof data.limit != 'undefined' && typeof data.offset != 'undefined') {
        limitOffset = ' limit :limit offset :offset';
      }
      let products = this.db.prepare(`select * from products${where} order by id asc${limitOffset}`).all(data);
      products = generic.getProductFlags.apply(this, [products]);
      products = generic.getTags.apply(this, ['products', products]);
      products = generic.getPrices.apply(this, [products]);
      return { list: products, total }
    },
    find: function (data) {
      const options = {
        canOrderBy: ['products.id', 'product_flags.value', 'tags.value', 'prices.value'],
        tables: ['products', 'product_flags', 'tags', 'prices'],
        select: 'products.id, products.stock',
        foreignKeys: ['tags.for_id', 'product_flags.product_id', 'prices.product_id'],
        groupBy: 'products.id'
      }
      const result = generic.find.apply(this, [options, data]);
      result.list = generic.getProductFlags.apply(this, [result.list]);
      result.list = generic.getTags.apply(this, ['products', result.list]);
      result.list = generic.getPrices.apply(this, [result.list]);
      return result;
    },
    update: function (data) {
      return generic.update.apply(this, ['products', ['id'], ['stock'], data]);
    }
  }
  this.currencies = {
    get: function () {
      return this.db.prepare('select * from currencies').all();
    },
    update: function (data) {
      return generic.update.apply(this, ['currencies', ['code'], ['active'], data]);
    }
  }
  this.prices = {
    get: function (data) {
      let fields = utils.cleanKeys(data);
      return this.db.prepare(`select * from prices where ${fields.join(' and ')}`).all(data);
    },
    update: function (data) {
      return generic.update.apply(this, ['prices', ['product_id', 'currency'], ['value'], data]);
    }
  }
  this.order_history = {
    get: function (data) {
      let fields = utils.cleanKeys(data);
      return this.db.prepare(`select * from order_history where ${fields.join(' and ')}`).all(data);
    },
    update: function (data) {
      return generic.update.apply(this, ['prices', ['product_id', 'currency'], ['value'], data]);
    }
  }
  this.orders = {
    get: function (data, limit = 10, offset = 0) {
      let fields = utils.cleanKeys(data);
      const total = this.db.prepare(`select count(*) as total from orders where ${fields.join(' and ')}`).get(data);
      let list = this.db.prepare(`select * from orders where ${fields.join(' and ')} limit :limit offset :offset`).all({ ...data, limit, offset });
      list = generic.getOrderItems.apply(this, [list]);
      return { list, ...total };
    },
    find: function (data) {
      const options = {
        canOrderBy: ['orders.id', 'orders.total', 'orders.created_at', 'prices.value'],
        tables: ['orders', 'order_items'],
        select: 'orders.id, orders.flow, orders.user_id, orders.uuid, orders.currency, orders.total, orders.status, orders.notes, orders.created_at',
        foreignKeys: ['order_items.order_id'],
        groupBy: 'orders.id'
      }
      const result = generic.find.apply(this, [options, data]);
      result.list = generic.getOrderItems.apply(this, [result.list]);
      return result;
    },
    updateStatus: function (data) {
      data.created_at = new Date().toISOString();
      // to do
    },
    create: function (data) {
      try {
        this.db.exec('begin');
        if (!utils.flowExists(data.flow)) {
          throw 'wrong_flow';
        }
        let basket = self.cart.get.apply(this, [data]);
        basket = checkProducts.apply(this, [basket]);
        basket.cart.flow = data.flow;
        basket.cart.user_id = data.user_id || null;
        basket.cart.status = utils.getFirstFlowStatus(data.flow);
        basket.cart.notes = data.notes;
        basket.cart.created_at = new Date().toISOString();
        delete basket.cart.key;
        delete basket.cart.updated_at;
        this.db.prepare('insert into orders (flow, user_id, uuid, currency, total, status, notes, created_at) values (:flow, :user_id, :uuid, :currency, :total, :status, :notes, :created_at)').run(basket.cart);
        const order = this.db.prepare('select * from orders where uuid = :uuid').get({ uuid: basket.cart.uuid });
        const insertOrderItem = this.db.prepare('insert into order_items (order_id, product_id, parent_id, quantity, unit_price, subtotal, action) values (:order_id, :product_id, :parent_id, :quantity, :unit_price, :subtotal, :action)');
        for (let i = 0; i < basket.list.length; i++) {
          basket.list[i].order_id = order.id;
          delete basket.list[i].uuid;
          insertOrderItem.run(basket.list[i]);
        }
        // to do - update product stock
        this.db.exec('commit');
        return self.orders.get({ uuid: basket.cart.uuid }).list[0];
      }
      catch (error) {
        generic.rollback(this.db);
        throw error;
      }
    }
  }
  this.cart = {
    get: function (data) {
      const cart = this.db.prepare('select * from carts where uuid = :uuid').get({ uuid: data.uuid });
      if (!cart || cart.key != data.key) {
        throw 'wrong_uuid_key';
      }
      const list = this.db.prepare('select * from cart_items where uuid = :uuid').all({ uuid: data.uuid });
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
        let cart = this.db.prepare('select * from carts where uuid = :uuid').get({ uuid });
        if (!cart) {
          if (uuid.length < 36) {
            throw 'short_uuid';
          }
          this.db.prepare('insert into carts (uuid, key, currency, updated_at) values (:uuid, :key, :currency, :updated_at)').run({
            uuid,
            key: data.key,
            currency: data.currency,
            updated_at: new Date().toISOString()
          });
          cart = this.db.prepare('select * from carts where uuid = :uuid').get({ uuid });
        }
        if (cart.key != data.key) {
          throw 'wrong_uuid_key';
        }
        this.db.prepare('update carts set currency = :currency, updated_at = :updated_at where uuid = :uuid').run({
          uuid,
          currency: data.currency,
          updated_at: new Date().toISOString()
        });
        const result = generic.update.apply(this, ['cart_items', ['uuid', 'product_id'], ['parent_id', 'quantity', 'action'], data.list, {
          skipBegin: true
        }]);
        this.db.exec('commit');
        return result;
      }
      catch (error) {
        generic.rollback(this.db);
        throw error;
      }
    },
    clean: function (maxDuration) {
      let maxTime = new Date();
      maxTime.setTime(maxTime.getTime() - maxDuration);
      maxTime = maxTime.toISOString();
      this.db.prepare('delete from cart_items where uuid in (select uuid from carts where updated_at < :maxTime)').run({ maxTime });
      return this.db.prepare('delete from carts where updated_at < :maxTime').run({ maxTime });
    }
  }
  const checkProducts = function (basket) {
    const actions = ['add', 'remove'];
    const ids = [];
    for (let item of basket.list) {
      ids.push(item.product_id);
    }
    const products = self.products.getByIds.apply(this, [{ ids }]).list;
    const map = {};
    for (let item of products) {
      map[item.id] = item;
      for (let key of Object.keys(item.product_flags)) {
        const values = [];
        for (let flag of item.product_flags[key]) {
          values.push(flag.value);
        }
        item.product_flags[key] = values;
      }
    }
    let total = 0;
    for (let item of basket.list) {
      const id = item.product_id;
      const pid = item.parent_id;
      let hasParent = false;
      if (!Number.isInteger(item.quantity)) {
        throw `quantity_not_integer@product_id=${id}`;
      }
      if (!actions.includes(item.action)) {
        throw `wrong_action@product_id=${id}`;
      }
      if (!map[id]) {
        throw `missing_product_entry@product_id=${id}`;
      }
      if (typeof map[id].prices[basket.cart.currency] == 'undefined') {
        throw `missing_price@product_id=${id},currency=${basket.cart.currency}`;
      }
      item.unit_price = map[id].prices[basket.cart.currency];
      if (pid) {
        if (!map[pid]) {
          throw `missing_parent_entry@product_id=${id},parent_id=${pid}`;
        }
        if (!map[id].product_flags.parent_type ||
        !map[pid].product_flags.type ||
        !utils.arrayIncludesSome(map[pid].product_flags.type, map[id].product_flags.parent_type)) {
          throw `missing_parent_type_flag@product_id=${id},parent_id=${pid}`;
        }
        hasParent = true;
      }
      if (item.action == 'add') {
        if (map[id].stock > 0 && item.quantity > map[id].stock) {
          throw `insufficient_stock@product_id=${id}`;
        }
        item.subtotal = item.unit_price * 100 * item.quantity / 100;
      }
      if (item.action == 'remove') {
        if (!pid) {
          throw `cannot_remove_parent_product@product_id=${id}`;
        }
        if (!hasParent) {
          throw `cannot_remove_product_without_parent@product_id=${id}`;
        }
        if (!map[id].product_flags.active_parent_type ||
        !utils.arrayIncludesSome(map[pid].product_flags.type, map[id].product_flags.active_parent_type)) {
          throw `missing_active_parent_type_flag@product_id=${id},parent_id=${pid}`;
        }
        if (!map[id].product_flags.active_quantity) {
          throw `missing_active_quantity_flag@product_id=${id}`;
        }
        if (Array.isArray(map[id].product_flags.subtractable_price) && map[id].product_flags.subtractable_price.length > 1) {
          throw `multiple_values_for_subtractable_price_flag@product_id=${id}`;
        }
        if (Array.isArray(map[id].product_flags.active_quantity) && map[id].product_flags.active_quantity.length > 1) {
          throw `multiple_values_for_active_quantity_flag@product_id=${id}`;
        }
        item.subtotal = 0;
        if (Array.isArray(map[id].product_flags.subtractable_price) && map[id].product_flags.subtractable_price[0] == 'yes') {
          if (!map[id].product_flags.active_quantity) {
            throw `missing_active_quantity_flag@product_id=${id}`;
          }
          if (Array.isArray(map[id].product_flags.active_quantity) && item.quantity > map[id].product_flags.active_quantity[0]) {
            throw `insufficient_active_quantity@product_id=${id}`;
          }
          item.subtotal = item.unit_price * 100 * item.quantity / 100 * -1;
        }
      }
      total += item.subtotal * 100;
    }
    basket.cart.total = total / 100;
    return basket;
  }
  // run each method within its own db instance
  const wrap = (table, method) => {
    this.methods ??= {}; // preserve db methods without own db connection
    this.methods[table] ??= {};
    this.methods[table][method] = this[table][method];
    this[table][method] = function () {
      if (!this.db) {
        this.db = new DatabaseSync(options.dbPath);
      }
      const result = self.methods[table][method].apply(this, arguments);
      if (this.db && this.db.isOpen && !this.db.isTransaction) {
        this.db.close();
        delete this.db;
      }
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
