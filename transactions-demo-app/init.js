const constants = require('./constants');
const sqlite3 = require('sqlite3').verbose();   // include sqlite3 library

let db = new sqlite3.Database('./db/transactions-demo.db');



db.serialize(() => {

    // create 'accounts' table if needed
    db.run(`CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY, balance INTEGER)`, [], function(err) {
        if(err) console.log(`error while creating table 'accounts': ${err}`)
        else console.log(`table created: 'accounts'`)
    });

    // empty table if needed
    db.run(`DELETE FROM accounts`, [], (err) => {
        if(err) console.log(`Error while deleting entries from table 'accounts': ${err}`)
        else console.log(`table cleaned: 'accounts'`)
    });

    for(var i = 0; i < constants.MAX_ID; i++) { // id is primary key, thus computed automatically
        db.get(`INSERT INTO accounts (balance) VALUES (?)`, constants.INITIAL_BALANCE, (err, row) => {
            if(err) console.log(`error: ${err}`);
        });
    }
    console.log(`adding ${constants.MAX_ID} rows`);
});