const config = require('../config.js');
const db = new (require('../require/db.js'))({ dbPath: config.dbPath });
const user = db.users.get({ email: process.argv[2] });
if (!user) {
  console.log('no_user');
  return;
}
const result = db.users.set({
  id: user.id,
  type: 'admin'
}, ['type']);
console.log(result);
