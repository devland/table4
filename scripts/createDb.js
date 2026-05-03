const shell = require('../sqlite3console/index.js');
const fs = require('fs');
let query = fs.readFileSync('./table4.sql', 'utf-8');
// show tables so that promise does not stall since create/insert commands do not output result
query += "select name from sqlite_master where type='table';\n";
let sql;
shell(['../test.db']) // sqlite3 db to use; other sqlite3 cli arguments can be provided as array items
  .then((result) => {
    sql = result;
    return sql.run(query);
  })
  .then((result) => {
    console.log('>>> db tables');
    console.log(result);
    return sql.end(); // end shell process
  })
  .catch((error) => {
    console.log('>>> query error');
    console.log(error);
    process.exit(1);
  });
