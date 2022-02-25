const sqlite3 = require('sqlite3').verbose(); // include sqlite library

let db = new sqlite3.Database('./db/library.db');



// -----------
//    BOOKS:
// -----------
db.serialize(() => {
    // create 'accounts' table if needed
    db.run(`CREATE TABLE IF NOT EXISTS Books (id INTEGER not null PRIMARY KEY AUTOINCREMENT , Authors TEXT not null,
             Title TEXT not null, ISBN TEXT NOT NULL UNIQUE, Year INTEGER not null, Loanable BOOLEAN NOT NULL,
             Quantity INTEGER not null, 
             
             CHECK (Year >= 1900 AND Year <= 2022 ),
             CHECK (Quantity >=1)
             )` ,
    
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
    db.run(`CREATE TABLE IF NOT EXISTS Students (id INTEGER not null PRIMARY KEY AUTOINCREMENT UNIQUE, Name  TEXT not null,
             YOB INTEGER not null,
             
             CHECK (YOB >= 1900 AND YOB <= 2022 ))` ,
    
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
    db.run(`CREATE TABLE IF NOT EXISTS Modules (Code TEXT PRIMARY KEY not null UNIQUE, Name TEXT not null)` ,
    
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
    db.run(`CREATE TABLE IF NOT EXISTS Loans (
        id INTEGER not null PRIMARY KEY AUTOINCREMENT ,
        BookID INTEGER  not null, StudentID INTEGER  not null, Checkout DATE , Due DATE, Returned BOOLEAN NOT NULL DEFAULT 0,
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
        ModuleCODE TEXT  not null, BookID INTEGER  not null,
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

// db.serialize(() => {
//     // create 'Loan' table if needed
//     db.run(`DROP TABLE Loans` ,
    
//     [], function (err) {
//         if (err) console.log(`error while deleting table 'students': ${err}`)
//         else console.log(`table deleted: 'students'`)
//     });
// });