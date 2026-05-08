const { execSync } = require('child_process');
const config = require('../config.js');
execSync(`
mkdir -p backups
sqlite3 ${config.dbPath} .dump > backups/backup_${(new Date()).toISOString()}.sql
`, { stdio: 'inherit' });
