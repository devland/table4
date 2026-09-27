const { DatabaseSync } = require('node:sqlite');
const dbPath = 'test.db';

console.log('> read');
let benchmarkStart = performance.now();
let db = new DatabaseSync(dbPath);
let result = db.prepare('select * from users where id = 1').all();
let benchmarkTime = (performance.now() - benchmarkStart).toFixed(3);
db.close();
console.log(`>>> done in ${benchmarkTime} ms`);
console.log(result);

console.log('> write');
benchmarkStart = performance.now();
db = new DatabaseSync(dbPath);
//db.exec('PRAGMA synchronous=OFF;');
//db.exec('PRAGMA journal_mode = WAL;');
result = db.prepare('update users set name = :value where id = 1').run({ value: Math.random() });
db.close();
benchmarkTime = (performance.now() - benchmarkStart).toFixed(3);
console.log(`>>> done in ${benchmarkTime} ms`);
console.log(result);

