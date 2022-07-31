if (!process.argv[2]) return console.log('missing_hashed_admin_password');
const couch = require('./core/couch.js');
const toDo = [];
toDo.push(couch.bulk([{
  _id: 'user:admin',
  type: 'user',
  name: 'admin',
  key: process.argv[2],
  roles: ['admin']
}]));
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
    for (let item of result) console.log(item);
  });
