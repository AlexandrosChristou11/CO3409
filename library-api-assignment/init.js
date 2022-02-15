const sqlite3 = require('sqlite3').verbose(); // include sqlite library
let db = new sqlite3.Database('./db/library.db');


const MAX_ID = 100;
const INITIAL_BALANCE = 5;

// -----------
//    BOOKS:
// -----------
db.serialize(() => {
    // create 'accounts' table if needed
    db.run(`CREATE TABLE IF NOT EXISTS Book (id INTEGER PRIMARY KEY, Authors TEXT,
             Title TEXT, ISBN TEXT NOT NULL UNIQUE, Year INTEGER, Loanable BOOLEAN NOT NULL CHECK (Loanable IN (0,1)) ,
             Quantity INTEGER)` ,
    
    [], function (err) {
        if (err) console.log(`error while creating table 'accounts': ${err}`)
        else console.log(`table created: 'Books'`)
    });


});


// -----------
//  STUDENT:
// -----------
db.serialize(() => {
    // create 'accounts' table if needed
    db.run(`CREATE TABLE IF NOT EXISTS Student (id INTEGER PRIMARY KEY, Name TEXT,
             YOB REAL)` ,
    
    [], function (err) {
        if (err) console.log(`error while creating table 'Student': ${err}`)
        else console.log(`table created: 'Student'`)
    });


});

// -----------
//  MODULE:
// -----------
db.serialize(() => {
    // create 'accounts' table if needed
    db.run(`CREATE TABLE IF NOT EXISTS Module (CODE TEXT PRIMARY KEY, Name TEXT)` ,
    
    [], function (err) {
        if (err) console.log(`error while creating table 'Module': ${err}`)
        else console.log(`table created: 'Module'`)
    });


});

// -----------
//  LOAN:
// -----------
db.serialize(() => {
    // create 'Loan' table if needed
    db.run(`CREATE TABLE IF NOT EXISTS Loan (
        BookID INTEGER, StudentID INTEGER, Checkout DATE, Due DATE, Returned BOOLEAN NOT NULL CHECK (Returned IN (0,1) )DEFAULT 0,
        PRIMARY KEY(BookID, StudentID),
        FOREIGN KEY (BookID) 
         REFERENCES Book (id) 
          ON DELETE CASCADE 
          ON UPDATE NO ACTION,
        FOREIGN KEY (StudentID) 
         REFERENCES Student (id) 
          ON DELETE CASCADE 
          ON UPDATE NO ACTION
        )` ,
    
    [], function (err) {
        if (err) console.log(`error while creating table 'Loan': ${err}`)
        else console.log(`table created: 'Loan'`)
    });


});

db.serialize(() => {
    // create 'Loan' table if needed
    db.run(`CREATE TABLE IF NOT EXISTS Loan (
        BookID INTEGER, StudentID INTEGER, Checkout DATE, Due TEXT, Returned BOOLEAN NOT NULL CHECK (Returned IN (0,1) )DEFAULT 0,
        PRIMARY KEY(BookID, StudentID),
        FOREIGN KEY (BookID) 
         REFERENCES Book (id) 
          ON DELETE CASCADE 
          ON UPDATE NO ACTION,
        FOREIGN KEY (StudentID) 
         REFERENCES Student (id) 
          ON DELETE CASCADE 
          ON UPDATE NO ACTION
        )` ,
    
    [], function (err) {
        if (err) console.log(`error while creating table 'Loan': ${err}`)
        else console.log(`table created: 'Loan'`)
    });


});

// ---------------
//  BIBLIOGRAPHY:
// ---------------
db.serialize(() => {
    // create 'Loan' table if needed
    db.run(`CREATE TABLE IF NOT EXISTS Bibliography (
        ModuleCODE TEXT, BookID INTEGER,
        PRIMARY KEY(ModuleCODE, BookID),
        FOREIGN KEY (BookID) 
         REFERENCES Book (id) 
          ON DELETE CASCADE 
          ON UPDATE NO ACTION,
        FOREIGN KEY (ModuleCODE) 
         REFERENCES Module (CODE) 
          ON DELETE CASCADE 
          ON UPDATE NO ACTION
        )` ,
    
    [], function (err) {
        if (err) console.log(`error while creating table 'Bibliography': ${err}`)
        else console.log(`table created: 'Bibliography'`)
    });


});