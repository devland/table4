const { execSync } = require('child_process');
const config = require('../config.js');
execSync(`sqlite3 ${config.dbPath} db.sql`, { stdio: 'inherit' });
