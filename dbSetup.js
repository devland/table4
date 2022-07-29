if (!process.argv[2]) return console.log('missing_hashed_admin_password');
const couch = require('./core/couch.js');
const toDo = [];
toDo.push(couch.upsert({
  type: 'user',
  name: 'admin',
  key: process.argv[2],
  roles: ['admin']
}, 'user:admin'));
toDo.push(couch.index({
  index: {
    fields: ['type']
  },
  name: 'index:type',
  type: 'json'
}));
toDo.push(couch.index({
  index: {
    fields: ['type', 'name']
  },
  name: 'index:type+name',
  type: 'json'
}));
Promise.allSettled(toDo)
  .then((result) => {
    console.log(result);
  });
