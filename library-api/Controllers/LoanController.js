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
const { post } = require('../Routes/API');


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

            // Check if empty..
            if (!_functions.isDateEmpty(posted_loan.Due)) {
                _functions.sendResponse(422, res, 'Due field can not be empty.');
                transaction.rollback((err) => { // ROLLBACK
                    if (err) console.log(`error: ${err}`);
                });
            }
            // check if it is of valid format ..
            else if (_functions.isValidDate(posted_loan.Due) === true) {
                _functions.sendResponse(422, res, 'Due field should be of format yyyy-mm-dd');
                transaction.rollback((err0) => { // ROLLBACK
                    if (err) console.log(`error: ${err}`);
                });
            }

            // Check Due (date) format
            else if (dateDue >= currentDate) {
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


                    transaction.get(`SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books WHERE ID=?`, posted_loan.BookID, (e, j) => {

                        if (!j) {
                            transaction.rollback((err) => { // ROLLBACK
                                if (err) console.log(`error: ${err}`);
                            });
                            _functions.sendResponse(404, res, `Book id ${posted_loan.BookID} does not exist`);
                        }
                        else if (j) {
                            transaction.get(`SELECT ID, Name, YOB from Students where ID=?`, posted_loan.StudentID, (e, student) => {

                                if (!student) {
                                    transaction.rollback((err) => { // ROLLBACK
                                        if (err) console.log(`error: ${err}`);
                                    });
                                    _functions.sendResponse(404, res, `Student with id ${posted_loan.StudentID} does not exist`);
                                }
                                else if (student) {
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
                                                               

                                                            }


                                                        })

                                                    }


                                                }


                                                )
                                            }


                                        });

                                }

                            });

                        }


                    });


                }
            } else {
                transaction.rollback((err) => { // ROLLBACK
                    if (err) console.log(`error: ${err}`);
                });
                _functions.sendResponse(422,res, `Due date can not be in the past`);

            }
        });
    }


};


// GET: {local}/library/loans
const GetLoans = (req, res) => {
    var _loans = [];
    db.all('SELECT id, BookID, StudentID, Due, Checkout, Returned from Loans', (err, rows) => {
        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
            console.log(`error: ${err.code} | ${err.name}`)
        }

        rows.forEach(row =>
            _loans.push({ id: row.id, BookID: row.BookID, StudentID: row.StudentID, Checkout: row.Checkout, Due: row.Due, Returned: row.Returned }));
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send(_loans);

    });

}



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
        db.get('SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books WHERE  ID=?', id, (e, x )=> {

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

        });
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
                        else{
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

async function ContinueWithNextValidations(posted_loan, transaction, due, checkout, returned, res) {

    // returned field validatoin ..
    if (posted_loan.returned != undefined) {

        // check if its not empty strings ..
        if (_functions.isBlank(returned)) {

            transaction.rollback((err) => { // ROLLBACK
                if (err) console.log(`error: ${err}`)
            });
            res.status(422)
                .setHeader('content-type', 'application/json')
                .send({ error: "Returned parameter can not be empty!" });
        }
        // check if values an not in 'true' or 'false'
        else if (returned.trim().toLowerCase() != "true" && returned.trim().toLowerCase() != "false") {


            res.status(422)
                .setHeader('content-type', 'application/json')
                .send({ error: "Returned parameter must be either 'true' or 'false'!!" });
            transaction.rollback((err) => { // ROLLBACK
                if (err) console.log(`error: ${err}`)
            });
        } else {

            const parameters = [
                posted_loan.checkout ?? x.Checkout,
                posted_loan.due ?? x.Due,
                _functions.isTrue([posted_loan.returned.toString().trim().toLowerCase()]) ?? x.returned,
                loanId
            ];

            transaction.run(`UPDATE Loans SET Checkout = ?, Due = ?, Returned = ? WHERE id=?`, parameters, (errorTransaction) => {

                if (errorTransaction) {
                    if (errorTransaction.code == 'SQLITE_CONSTRAINT') {
                        transaction.rollback((err) => { // ROLLBACK
                            if (err) console.log(`error: ${err}`);
                        });
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
                        .send({ message: "Loan updated", id: this.lastID });
                }

            });
            transaction.commit((errorCommit) => { // COMMIT
                if (err) console.log(`error: ${errorCommit}`);
            });

        }

    } else {

        const parameters = [
            posted_loan.checkout ?? x.Checkout,
            posted_loan.due ?? x.Due,
            _functions.isTrue([posted_loan.returned.toString().trim().toLowerCase()]) ?? x.returned,
            loanId
        ];

        transaction.run(`UPDATE Loans SET Checkout = ?, Due = ?, Returned = ? WHERE id=?`, parameters, (errorTransaction) => {

            if (errorTransaction) {
                if (errorTransaction.code == 'SQLITE_CONSTRAINT') {
                    transaction.rollback((err) => { // ROLLBACK
                        if (err) console.log(`error: ${err}`);
                    });
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
                    .send({ message: "Loan updated", id: this.lastID });
            }

        });
        transaction.commit((errorCommit) => { // COMMIT
            if (err) console.log(`error: ${errorCommit}`);
        });

    }


}








function UpdateLoanValues(res, transaction, parameters, err) {

    transaction.run(`UPDATE Loans SET Checkout = ?, Due = ?, Returned = ? WHERE id=?`, parameters, (errorTransaction) => {

        if (errorTransaction) {
            if (errorTransaction.code == 'SQLITE_CONSTRAINT') {
                transaction.rollback((err) => { // ROLLBACK
                    if (err) console.log(`error: ${err}`);
                });
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

            _functions.sendResponse(200, res, `Loan was updated.`);
        }

    });

}


// PUT: {local}/library/loans/edit/{:loanId}
const EditLoan = (req, res) => {

    const { loanId } = req.params;            // get loanId from params

    const posted_loan = req.body;           // submitted loan

    if (!loanId || _functions.isBlank(loanId)) {
        _functions.sendResponse(422, res, "Loan Id can not be empty ..")
    }
    else if (isNaN(loanId)) {
        _functions.sendResponse(422, res, "Loan Id should be an integer ..")
    }
    else {
        tdb.beginTransaction(async function (err, transaction) { // BEGIN TRANSACTION

            transaction.get('SELECT id, BookId, StudentId, Checkout, Due, Returned FROM Loans WHERE id = ? ', [loanId], (e, x) => {
                var isCheckoutValid = _functions.isValidDate(posted_loan.checkout)
                // Loan id does not exist in the dataset ..
                if (!x || loanId == 0) {
                    _functions.sendResponse(404, res, "Loan Id does not exist ..")
                    transaction.rollback((err) => { // ROLLBACK
                        if (err) console.log(`error: ${err}`);
                    });
                }

                // loan id is valid and exist .. move to next steps ..
                else {
                    var checkout = posted_loan.checkout;
                    var due = posted_loan.due;
                    var returned = posted_loan.returned;
                    var now = new Date();
                    var _dueDate = new Date(posted_loan.due);

                    // posted loan exist check its format and move to next steps ..
                    if (posted_loan.checkout != undefined) {

                        // Check if empty..
                        if (!_functions.isDateEmpty(posted_loan.checkout)) {
                            _functions.sendResponse(422, res, 'Checkout field can not be empty.');
                            transaction.rollback((err) => { // ROLLBACK
                                if (err) console.log(`error: ${err}`);
                            });
                        }
                        // check if it is of valid format ..
                        else if (isCheckoutValid === true) {
                            _functions.sendResponse(422, res, 'Checkout field should be of format yyyy-mm-dd');
                            transaction.rollback((err0) => { // ROLLBACK
                                if (err) console.log(`error: ${err}`);
                            });
                        }

                        /*
                        Scenario 1: 
                        Checkout: OK,
                        Due: undefined,
                        Returnd: undefined
                        */
                        else if (posted_loan.due == undefined) {

                            // check if returned is also undefined ..
                            if (posted_loan.returned == undefined) {
                                const parameters = [
                                    posted_loan.checkout ?? x.Checkout,
                                    posted_loan.due ?? x.Due,
                                    x.Returned,
                                    loanId
                                ];

                                UpdateLoanValues(res, transaction, parameters, err);
                                transaction.commit((errorCommit) => { // COMMIT
                                    if (err) console.log(`error: ${errorCommit}`);
                                });
                            }
                            else if (posted_loan.returned != undefined) {

                                // check if its empty strings
                                if (_functions.isBlank(posted_loan.returned)) {
                                    _functions.sendResponse(422, res, 'returned field can not be empty strings.');
                                    transaction.rollback((err0) => { // ROLLBACK
                                        if (err) console.log(`error: ${err}`);
                                    });
                                }
                                // check format
                                else if (posted_loan.returned.trim().toLowerCase() != "true" && posted_loan.returned.trim().toLowerCase() != "false") {
                                    _functions.sendResponse(422, res, 'returned values can be only true or false');
                                    transaction.rollback((err0) => { // ROLLBACK
                                        if (err) console.log(`error: ${err}`);
                                    });
                                }
                                // all ok send response!
                                else {
                                    const parameters = [
                                        posted_loan.checkout ?? x.Checkout,
                                        posted_loan.due ?? x.Due,
                                        _functions.isTrue([posted_loan.returned.toString().trim().toLowerCase()]) ?? x.Returned,
                                        loanId
                                    ];
                                    UpdateLoanValues(res, transaction, parameters, err);
                                    transaction.commit((errorCommit) => { // COMMIT
                                        if (err) console.log(`error: ${errorCommit}`);
                                    });
                                }



                            }
                        }
                        else if (posted_loan.due != undefined) {


                            // Check if empty..
                            if (!_functions.isDateEmpty(posted_loan.due)) {
                                _functions.sendResponse(422, res, 'Due field can not be empty.');
                                transaction.rollback((err) => { // ROLLBACK
                                    if (err) console.log(`error: ${err}`);
                                });
                            }
                            // check if it is of valid format ..
                            else if (_functions.isValidDate(posted_loan.due) === true) {
                                _functions.sendResponse(422, res, 'Due field should be of format yyyy-mm-dd');
                                transaction.rollback((err0) => { // ROLLBACK
                                    if (err) console.log(`error: ${err}`);
                                });
                            }
                            // check that it is not int the past
                            else if (_dueDate < now) {
                                _functions.sendResponse(422, res, 'Due date can not be in the past');
                                transaction.rollback((err0) => { // ROLLBACK
                                    if (err) console.log(`error: ${err}`);
                                });
                            }
                            else if (Date.parse(posted_loan.due) > Date.parse(posted_loan.checkout)) {
                                var dueDate = new Date(posted_loan.due);
                                var checkoutDate = new Date(posted_loan.checkout);
                                const diffTime = Math.abs(dueDate - checkoutDate);
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                if (diffDays > 90) {
                                    _functions.sendResponse(422, res, 'Due date can not be more than 90 from checkout date');
                                    transaction.rollback((err) => { // ROLLBACK
                                        if (err) console.log(`error: ${err}`)
                                    });

                                } else if (posted_loan.returned == undefined) {
                                    const parameters = [
                                        posted_loan.checkout ?? x.Checkout,
                                        posted_loan.due ?? x.Due,
                                        x.Returned,
                                        loanId
                                    ];
                                    UpdateLoanValues(res, transaction, parameters, err);
                                    transaction.commit((errorCommit) => { // COMMIT
                                        if (err) console.log(`error: ${errorCommit}`);
                                    });
                                } else if (posted_loan.returned != undefined) {

                                    // check if its empty strings
                                    if (_functions.isBlank(posted_loan.returned)) {
                                        _functions.sendResponse(422, res, 'returned field can not be empty strings.');
                                        transaction.rollback((err0) => { // ROLLBACK
                                            if (err) console.log(`error: ${err}`);
                                        });
                                    }
                                    // check format
                                    else if (posted_loan.returned.trim().toLowerCase() != "true" && posted_loan.returned.trim().toLowerCase() != "false") {
                                        _functions.sendResponse(422, res, 'returned values can be only true or false');
                                        transaction.rollback((err0) => { // ROLLBACK
                                            if (err) console.log(`error: ${err}`);
                                        });
                                    }
                                    // all ok send response!
                                    else {
                                        const parameters = [
                                            posted_loan.checkout ?? x.Checkout,
                                            posted_loan.due ?? x.Due,
                                            _functions.isTrue([posted_loan.returned.toString().trim().toLowerCase()]) ?? x.Returned,
                                            loanId
                                        ];
                                        UpdateLoanValues(res, transaction, parameters, err);
                                        transaction.commit((errorCommit) => { // COMMIT
                                            if (err) console.log(`error: ${errorCommit}`);
                                        });
                                    }



                                }
                            }


                        }


                    }

                    else if (posted_loan.checkout == undefined) {

                        if (posted_loan.due != undefined) {


                            // Check if empty..
                            if (!_functions.isDateEmpty(posted_loan.due)) {
                                _functions.sendResponse(422, res, 'Due field can not be empty.');
                                transaction.rollback((err) => { // ROLLBACK
                                    if (err) console.log(`error: ${err}`);
                                });
                            }
                            // check if it is of valid format ..
                            else if (_functions.isValidDate(posted_loan.due) === true) {
                                _functions.sendResponse(422, res, 'Due field should be of format yyyy-mm-dd');
                                transaction.rollback((err0) => { // ROLLBACK
                                    if (err) console.log(`error: ${err}`);
                                });
                            }
                            // check that it is not int the past
                            else if (_dueDate < now) {
                                _functions.sendResponse(422, res, 'Due date can not be in the past');
                                transaction.rollback((err0) => { // ROLLBACK
                                    if (err) console.log(`error: ${err}`);
                                });
                            }
                            else if ((posted_loan.due) > x.Checkout) {
                                var dueDate = new Date(posted_loan.due);
                                var checkoutDate = new Date(x.Checkout);
                                const diffTime = Math.abs(dueDate - checkoutDate);
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                if (diffDays > 90) {
                                    _functions.sendResponse(422, res, 'Due date can not be more than 90 from checkout date');
                                    transaction.rollback((err) => { // ROLLBACK
                                        if (err) console.log(`error: ${err}`)
                                    });

                                } else if (posted_loan.returned == undefined) {
                                    const parameters = [
                                        posted_loan.checkout ?? x.Checkout,
                                        posted_loan.due ?? x.Due,
                                        x.Returned,
                                        loanId
                                    ];
                                    UpdateLoanValues(res, transaction, parameters, err);
                                    transaction.commit((errorCommit) => { // COMMIT
                                        if (err) console.log(`error: ${errorCommit}`);
                                    });
                                }
                                else if (posted_loan.returned != undefined) {

                                    // check if its empty strings
                                    if (_functions.isBlank(posted_loan.returned)) {
                                        _functions.sendResponse(422, res, 'returned field can not be empty strings.');
                                        transaction.rollback((err0) => { // ROLLBACK
                                            if (err) console.log(`error: ${err}`);
                                        });
                                    }
                                    // check format
                                    else if (posted_loan.returned.trim().toLowerCase() != "true" && posted_loan.returned.trim().toLowerCase() != "false") {
                                        _functions.sendResponse(422, res, 'returned values can be only true or false');
                                        transaction.rollback((err0) => { // ROLLBACK
                                            if (err) console.log(`error: ${err}`);
                                        });
                                    }
                                    // all ok send response!
                                    else {
                                        const parameters = [
                                            posted_loan.checkout ?? x.Checkout,
                                            posted_loan.due ?? x.Due,
                                            _functions.isTrue([posted_loan.returned.toString().trim().toLowerCase()]) ?? x.Returned,
                                            loanId
                                        ];
                                        UpdateLoanValues(res, transaction, parameters, err);
                                        transaction.commit((errorCommit) => { // COMMIT
                                            if (err) console.log(`error: ${errorCommit}`);
                                        });
                                    }

                                }
                            }
                            else if (posted_loan.returned == undefined) {
                                const parameters = [
                                    posted_loan.checkout ?? x.Checkout,
                                    posted_loan.due ?? x.Due,
                                    x.Returned,
                                    loanId
                                ];
                                UpdateLoanValues(res, transaction, parameters, err);
                                transaction.commit((errorCommit) => { // COMMIT
                                    if (err) console.log(`error: ${errorCommit}`);
                                });
                            }
                            else if (posted_loan.returned != undefined) {

                                // check if its empty strings
                                if (_functions.isBlank(posted_loan.returned)) {
                                    _functions.sendResponse(422, res, 'returned field can not be empty strings.');
                                    transaction.rollback((err0) => { // ROLLBACK
                                        if (err) console.log(`error: ${err}`);
                                    });
                                }
                                // check format
                                else if (posted_loan.returned.trim().toLowerCase() != "true" && posted_loan.returned.trim().toLowerCase() != "false") {
                                    _functions.sendResponse(422, res, 'returned values can be only true or false');
                                    transaction.rollback((err0) => { // ROLLBACK
                                        if (err) console.log(`error: ${err}`);
                                    });
                                }
                                // all ok send response!
                                else {
                                    const parameters = [
                                        posted_loan.checkout ?? x.Checkout,
                                        posted_loan.due ?? x.Due,
                                        _functions.isTrue([posted_loan.returned.toString().trim().toLowerCase()]) ?? x.Returned,
                                        loanId
                                    ];
                                    UpdateLoanValues(res, transaction, parameters, err);
                                    transaction.commit((errorCommit) => { // COMMIT
                                        if (err) console.log(`error: ${errorCommit}`);
                                    });
                                }

                            }


                        }
                        else if (posted_loan.due == undefined) {

                            if (  posted_loan.returned == null) {
                                _functions.sendResponse(422, res, 'returned field can not bet null.');
                                transaction.rollback((err0) => { // ROLLBACK
                                    if (err) console.log(`error: ${err}`);
                                });
                            }
                            else if (posted_loan.returned != undefined) {

                                // check if its empty strings
                                if (_functions.isBlank(posted_loan.returned) || posted_loan.returned == null) {
                                    _functions.sendResponse(422, res, 'returned field can not be empty strings.');
                                    transaction.rollback((err0) => { // ROLLBACK
                                        if (err) console.log(`error: ${err}`);
                                    });
                                }
                                // check format
                                else if (posted_loan.returned.trim().toLowerCase() != "true" && posted_loan.returned.trim().toLowerCase() != "false") {
                                    _functions.sendResponse(422, res, 'returned values can be only true or false');
                                    transaction.rollback((err0) => { // ROLLBACK
                                        if (err) console.log(`error: ${err}`);
                                    });
                                }
                                // all ok send response!
                                else {
                                    const parameters = [
                                        posted_loan.checkout ?? x.Checkout,
                                        posted_loan.due ?? x.Due,
                                        _functions.isTrue([posted_loan.returned.toString().trim().toLowerCase()]) ?? x.Returned,
                                        loanId
                                    ];
                                    UpdateLoanValues(res, transaction, parameters, err);
                                    transaction.commit((errorCommit) => { // COMMIT
                                        if (err) console.log(`error: ${errorCommit}`);
                                    });
                                }

                            }
                        }

                    }



                }



            })

        });

    }

}








module.exports = { AddNewLoan, GetLoans, GetLoansByBookId, GetLoansByStudentId, EditLoan };