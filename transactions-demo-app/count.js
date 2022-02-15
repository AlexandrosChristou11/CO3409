var sqlite3 = require("sqlite3");

var db = new sqlite3.Database("db/transactions-demo.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

db.get(`SELECT COUNT(*) AS count, SUM(balance) AS sum, MAX(balance) AS max, MIN(balance) AS min FROM accounts`, [], (err, row) => {
    if (err) console.log(`error: ${err}`);
    else console.log(`Table 'accounts' -> rows: ${row.count}, sum: ${row.sum} - min: ${row.min}, max: ${row.max}`);
});
