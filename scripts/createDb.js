const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('./test.db');
const fs = require('fs');
let query = fs.readFileSync('./table4.sql', 'utf-8');
db.exec(query);
let insert = db.prepare('insert into users (name, password, email, created_at) values (:name, :password, :email, :created_at)');
insert.run({
  name: 'gigi',
  password: 'cheesecake',
  email: 'yup2@lol.net',
  created_at: new Date().toISOString()
});
query = db.prepare("select *, unixepoch('now') - unixepoch(created_at) as time_diff from users");
console.log(query.all());
//console.log(db.prepare("select name from sqlite_master where type='table'").all());
