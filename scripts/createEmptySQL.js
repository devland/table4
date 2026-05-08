const { execSync } = require('child_process');
const config = require('../config.js');
execSync(`
sqlite3 ${config.dbPath} .schema > schema.sql
sed 's/CREATE TABLE sqlite_sequence(name,seq);//' schema.sql > db.sql
rm schema.sql
`, { stdio: 'inherit' });
