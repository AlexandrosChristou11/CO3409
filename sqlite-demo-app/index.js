const sqlite3 = require('sqlite3').verbose(); // include sqlite library

let db = new sqlite3.Database('./db/demo.db', (err)=> {
    
    if (err){
        return console.error(err.message)
    }
    console.log('Connected to the file-based Sqlite Database ..');
});      // create in-memory database ..


// SQL QUERIES COMMANDS ..

db.serialize( ()=>{
db.run(`CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`);

db.run('INSERT INTO test (name) VALUES (?)', ["HELLO"]);
db.run('INSERT INTO test (name) VALUES (?)', ["World"]);

db.each('SELECT id, name FROM test', (err, row)=> {
    if (err){
        console.log('Problem whily querying database: ' + err);
    }
    console.log(row.id + ' -> ' + row.name);
})
});

db.close( (err)=> {
    if (err){
        return console.log(err.message);
    }
    console.log('Disconnected and closed SQlite database ..');
} );