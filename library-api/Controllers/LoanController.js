const sqlite3 = require('sqlite3').verbose();       // include sqlite library ..
const TransactionDatabase = require("sqlite3-transactions").TransactionDatabase;

let db = new sqlite3.Database('./db/library.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        return console.log(err.message);
    }
    console.log('Connected to the file-based SQlite database ..');
})

const e = require('express');
const _functions = require('../Generic Methods/GlobalFunctions'); // import the routes


var tdb = new TransactionDatabase(db); // wrap database into a transaction object ..


// --------------------
//     API CALLS :
// --------------------


// {POST}: localhost:3000/library/loan/add
const AddNewLoan = (req, res) => {
    const posted_loan = req.body; // submitted module - picked from body
    const dateDue = new Date(req.body.Due)
    var currentDate = new Date();


    if (!posted_loan || !posted_loan.BookID || !posted_loan.StudentID || !posted_loan.Due ||
        _functions.isBlank(posted_loan.BookID) || _functions.isBlank(posted_loan.StudentID) ||
        _functions.isBlank(posted_loan.Due) || isNaN(posted_loan.BookID) || isNaN(posted_loan.StudentID)) {
        res.status(422) // bad request
            .setHeader('content-type', 'application/json')
            .send({ error: `Invalid format of Loan's parameters` });

    } else {

        console.log(`BOOK ID: ${posted_loan.BookID} | STUDENT ID: ${posted_loan.StudentID} | Due: ${posted_loan.Due}`)
        tdb.beginTransaction(async function (err, transaction) { // BEGIN TRANSACTION



            // Check Due (date) format
            if (dateDue >= currentDate) {
                const diffTime = Math.abs(dateDue) - currentDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 90) {
                    transaction.rollback((err) => { // ROLLBACK
                        if (err) console.log(`error: ${err}`)
                    });

                    res.status(422) // bad request
                        .setHeader('content-type', 'application/json')
                        .send({ error: `Due date must be less than 90 days` })
                }
                else {

                    transaction.get(`SELECT BookID, StudentID, Returned from Loans where BookID = ? AND StudentID = ? AND Returned = false`,
                        [posted_loan.BookID, posted_loan.StudentID], (err, target_row) => {

                            // Student already loans this book
                            if (target_row) {
                                transaction.rollback((err) => { // ROLLBACK
                                    if (err) console.log(`error: ${err}`);
                                });

                                console.log(`Student with id: ${posted_loan.StudentID} already loans book with id ${posted_loan.BookID}`)
                                res.status(422) // bad request
                                    .setHeader('content-type', 'application/json')
                                    .send({ error: `Student with id: ${posted_loan.StudentID} already loans book with id ${posted_loan.BookID}` })
                            }
                            // No such entry exist .. move to next steps ..
                            else {
                                transaction.get(`SELECT id, Loanable, Quantity from Books where id = ?`, [posted_loan.BookID], (err, x) => {

                                    // Book can not be lent ..
                                    if (!x.Loanable) {
                                        transaction.rollback((err) => { // ROLLBACK
                                            if (err) console.log(`error: ${err}`);
                                        });

                                        res.status(422)
                                            .setHeader('content-type', 'application/json')
                                            .send({ error: `Book with Id ${posted_loan.BookID} can not be lent` })
                                    }
                                    // Book can be lent .. move to next actions ..
                                    else {
                                        // get the quantity of the already loan books ..
                                        transaction.get(`SELECT COUNT(BookId) as Count FROM Loans WHERE BookID = ? AND Returned = false`, posted_loan.BookID, (er, c) => {

                                            if (c.Count >= x.Quantity) {
                                                transaction.rollback((err) => { // ROLLBACK
                                                    if (err) console.log(`error: ${err}`);
                                                });
                                                res.status(422)
                                                    .setHeader('content-type', 'application/json')
                                                    .send({ error: `No other books available to loan` })
                                            } else {
                                                var parameters = [
                                                    posted_loan.BookID,
                                                    posted_loan.StudentID,
                                                    dateDue.toISOString().slice(0, 10),
                                                    currentDate.toISOString().slice(0, 10)
                                                ];
                                                transaction.run(`INSERT INTO Loans (BookID, StudentId, Due, Checkout) VALUES(?, ?, ?, ?)`, parameters, (errorTransaction) => {
                                                    console.log(`TRANSACTION ERROR | ${errorTransaction}`)
                                                    if (errorTransaction) {
                                                        if (errorTransaction.code == 'SQLITE_CONSTRAINT') {
                                                            transaction.rollback((err) => { // ROLLBACK
                                                                if (err) console.log(`error: ${err}`);
                                                            });
                                                            res.status(409)
                                                                .setHeader('content-type', 'application/json')
                                                                .send({ error: `Contraint Error | ${errorTransaction.message}` })
                                                        }
                                                        else {
                                                            transaction.rollback((err) => { // ROLLBACK
                                                                if (err) console.log(`error: ${err}`);
                                                            });
                                                            res.status(500)
                                                                .setHeader('content-type', 'application/json')
                                                                .send({ errorTransaction })
                                                        }
                                                    }
                                                    else {
                                                        transaction.commit((errorCommit) => { // COMMIT
                                                            if (err) console.log(`error: ${errorCommit}`);
                                                        });

                                                        res.status(200)
                                                            .setHeader('content-type', 'application/json')
                                                            .send({ message: "Loan added", id: this.lastID });
                                                    }

                                                });
                                                transaction.commit((errorCommit) => { // COMMIT
                                                    if (err) console.log(`error: ${errorCommit}`);
                                                });

                                            }


                                        })

                                    }


                                }


                                )
                            }


                        });
                }
            } else {
                transaction.rollback((err) => { // ROLLBACK
                    if (err) console.log(`error: ${err}`);
                });

            }
        });
    }


};


// GET: {local}/library/loans
const GetLoans = (req, res) => {
    var _loans = [];
    db.all('SELECT BookID, StudentID, Due, Checkout, Returned from Loans', (err, rows) => {
        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
            console.log(`error: ${err.code} | ${err.name}`)
        }

        rows.forEach(row =>
            _loans.push({ BookID: row.BookID, StudentID: row.StudentID, Checkout: row.Checkout, Due: row.Due, Returned: row.Returned }));
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send(_loans);

    });

}

// https://stackoverflow.com/questions/15128849/using-multiple-parameters-in-url-in-express


// TODOO ... :
// Also make a query on books table and check whether the book exists or not ..
// GET: {local} /library/loans/book/:bookId?pending=true
const GetLoansByBookId = (req, res) => {
    const { bookId } = req.params;
    const Returned = req.query.pending;

    var loans = [];

    // bood id is of invalid format ..
    if (!bookId || _functions.isBlank(bookId)) {
        res.status(422)
            .setHeader('content-type', 'application/json')
            .send({ error: "Book id can not be empty .." });
    } else if (isNaN(bookId)) {
        res.status(422)
            .setHeader('content-type', 'application/json')
            .send({ error: "Book id should be an integer .." });
    } else {

        let id = parseInt(bookId);
        // check if bood id exist ..
        db.get('SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books WHERE WHERE ID=?', [id], (e, x => {

            // No such book exist ..
            if (!x || id == 0) {
                res.status(404)
                    .setHeader('content-type', 'application/json')
                    .send({ e: `Book with id ${bookId} does not exist ..` });
            }
            // book exist -> go find all books that are lent ..
            else {
                // check if a 'returned' value  is given
                if (Returned == undefined) {
                    db.all('SELECT BookID, StudentID, Due, Checkout, Returned from Loans WHERE BookID=?', [bookId.trim()], (err, rows) => {
                        if (err) {
                            console.error('Problem while querying database: ' + err);
                            res.status(500) // internal server error ..
                                .setHeader('content-type', 'application/json')
                                .send({ err: "Problem while querying database" });
                        }
                        else
                            rows.forEach(row =>
                                loans.push({ BookID: row.BookID, StudentID: row.StudentID, Checkout: row.Checkout, Due: row.Due, Returned: row.Returned }));

                        if (!rows) {
                            res.status(404)
                                .setHeader('content-type', 'application/json')
                                .send({ err: `No matches found for parameters: 'BookId=${bookId}` });
                        }
                        else {
                            res.status(200)
                                .setHeader('content-type', 'application/json')
                                .send(loans);
                        }

                    });

                }
                else {
                    // Check returned format ..
                    if (!Returned || _functions.isBlank(Returned)) {
                        res.status(422)
                            .setHeader('content-type', 'application/json')
                            .send({ error: "Returned parameter is optional. Please remove '&' if you don't specify it!" });
                    } else if (Returned.trim().toLowerCase() != "true" && Returned.trim().toLowerCase() != "false") {
                        res.status(422)
                            .setHeader('content-type', 'application/json')
                            .send({ error: "Pending parameter must be either 'true' or 'false'!!" });
                    } else {
                        var returned = (Returned.trim() === 'true');
                        db.all('SELECT BookID, StudentID, Due, Checkout, Returned from Loans WHERE BookID=? AND Returned=?', [bookId.trim(), returned], (err, rows) => {
                            if (err) {
                                console.error('Problem while querying database: ' + err);
                                res.status(500) // internal server error ..
                                    .setHeader('content-type', 'application/json')
                                    .send({ error: "Problem while querying database" });
                            }
                            else
                                rows.forEach(row =>
                                    loans.push({ BookID: row.BookID, StudentID: row.StudentID, Checkout: row.Checkout, Due: row.Due, Returned: row.Returned }));

                            if (loans.length == 0) {
                                res.status(404)
                                    .setHeader('content-type', 'application/json')
                                    .send({ error: `No matches found for parameters: 'bookId = ${bookId}' and 'pending = ${Returned}'` });
                            }
                            else {
                                res.status(200)
                                    .setHeader('content-type', 'application/json')
                                    .send(loans);
                            }

                        });
                    }


                }


            }

        }));
    }
}

// GET: {local} /library/loans/student/:id ? pending=true
const GetLoansByStudentId = (req, res) => {
    // const studentId = req.query.studentId;
    const { studentId } = req.params;
    const Returned = req.query.pending;

    var _studentsBooks = [];
    let id = parseInt(studentId);
    // student id is of invalid format ..
    if (!studentId || _functions.isBlank(studentId)) {
        res.status(422)
            .setHeader('content-type', 'application/json')
            .send({ error: "Student id can not be empty .." });
    } else if (isNaN(id)) {
        res.status(422)
            .setHeader('content-type', 'application/json')
            .send({ error: "Student id should be an integer .." });
    } else {


        // check if student id exist ..
        db.get("SELECT ID, Name, YOB from Students WHERE ID = ?", [studentId.trim()], (e, x) => {

            // No such student exist ..
            if (!x || id == 0) {
                res.status(404)
                    .setHeader('content-type', 'application/json')
                    .send({ e: `Student with id ${studentId} does not exist ..` });
            }
            // student exist -> go find all books that are lent ..
            else {
                // check if a 'returned' value  is given
                if (Returned == undefined) {
                    db.all('SELECT BookID, StudentID, Due, Checkout, Returned from Loans WHERE StudentID=?', [studentId.trim()], (err, rows) => {
                        if (err) {
                            console.error('Problem while querying database: ' + err);
                            res.status(500) // internal server error ..
                                .setHeader('content-type', 'application/json')
                                .send({ err: "Problem while querying database" });
                        }
                        else
                            rows.forEach(row =>
                                _studentsBooks.push({ BookID: row.BookID, StudentID: row.StudentID, Checkout: row.Checkout, Due: row.Due, Returned: row.Returned }));

                        if (!rows) {
                            res.status(404)
                                .setHeader('content-type', 'application/json')
                                .send({ err: `No matches found for parameters: 'studentId=${studentId}` });
                        }
                        else {
                            res.status(200)
                                .setHeader('content-type', 'application/json')
                                .send(_studentsBooks);
                        }

                    });

                }
                else {
                    // Check returned format ..
                    if (!Returned || _functions.isBlank(Returned)) {
                        res.status(422)
                            .setHeader('content-type', 'application/json')
                            .send({ error: "Returned parameter is optional. Please remove '&' if you don't specify it!" });
                    } else if (Returned.trim().toLowerCase() != "true" && Returned.trim().toLowerCase() != "false") {
                        res.status(422)
                            .setHeader('content-type', 'application/json')
                            .send({ error: "Pending parameter must be either 'true' or 'false'!!" });
                    } else {
                        var returned = (Returned.trim() === 'true');
                        db.all('SELECT BookID, StudentID, Due, Checkout, Returned from Loans WHERE StudentID=? AND Returned=?', [studentId.trim(), returned], (err, rows) => {
                            if (err) {
                                console.error('Problem while querying database: ' + err);
                                res.status(500) // internal server error ..
                                    .setHeader('content-type', 'application/json')
                                    .send({ error: "Problem while querying database" });
                            }
                            else
                                rows.forEach(row =>
                                    _studentsBooks.push({ BookID: row.BookID, StudentID: row.StudentID, Checkout: row.Checkout, Due: row.Due, Returned: row.Returned }));

                            if (_studentsBooks.length == 0) {
                                res.status(404)
                                    .setHeader('content-type', 'application/json')
                                    .send({ error: `No matches found for parameters: 'studentId = ${studentId}' and 'pending = ${Returned}'` });
                            }
                            else {
                                res.status(200)
                                    .setHeader('content-type', 'application/json')
                                    .send(_studentsBooks);
                            }

                        });
                    }


                }


            }

        });
    }
}


// PUT: {local}/library/loan/edit/{:studnetId} / :{bookId}
const EditLoan = (req, res) => {
    const { bookId } = req.params;      // get bookId from params
    const { studentId } = req.params;      // get studentId from params

    const posted_loan = req.body;           // submitted book

    if (!bookId || _functions.isBlank(code)) {
        res.status(422)
            .setHeader('content-type', 'application/json')
            .send({ error: `Book Id can not be empty` });
    }
    else if (isNaN(bookId)) {
        res.status(422)
            .setHeader('content-type', 'application/json')
            .send({ error: `Bood id should be an integer` }); // resource not found
    }
    else if (!studentId || _functions.isBlank(studentId)) {
        res.status(422)
            .setHeader('content-type', 'application/json')
            .send({ error: `Student Id can Snot be empty` });
    }
    else if (isNaN(studentId)) {
        res.status(422)
            .setHeader('content-type', 'application/json')
            .send({ error: `Student id should be an integer` }); // resource not found
    }

    else {

        tdb.beginTransaction(async function (err, transaction) { // BEGIN TRANSACTION
            console.log(`validation was ok!`);

        });

    }
};



module.exports = { AddNewLoan, GetLoans, GetLoansByBookId, GetLoansByStudentId, EditLoan };