const sqlite3 = require('sqlite3').verbose();       // include sqlite library ..


let db = new sqlite3.Database('./db/library.db', (err) => {
    if (err) {
        return console.log(err.message);
    }
    console.log('Connected to the file-based SQlite database ..');
})

const _functions = require('../Generic Methods/GlobalFunctions'); // import the routes



// {POST}: localhost:3000/library/bibliography/add
const AddNewBibliography = (req, res) => {
    const posted_bib = req.body;         // submitted bibliography - picked from body

    if (!posted_bib || !posted_bib.ModuleCODE || !posted_bib.BookID) {
        _functions.sendResponse(409, res, `Invalid format of parameters`);
    }
    else if (_functions.isBlank(posted_bib.ModuleCODE)) {
        _functions.sendResponse(409, res, `Module code can not be null`);
    }
    else if (isNaN(posted_bib.BookID)) {
        _functions.sendResponse(409, res, `Bookd Id must be an integer ..`)
    }
    else if (_functions.isBlank(posted_bib.BookID)) {
        _functions.sendResponse(409, res, `Bookd Id can not be empty ..`)
    }
    else {
        
        db.get(`SELECT id, ModuleCODE, BookID FROM Bibliographies WHERE ModuleCODE = ? AND BookID = ?`,
            [posted_bib.ModuleCODE.trim().toLowerCase(), posted_bib.BookID], (err, x) => {

                // no such record exist .. go and add the new bibliography
                if (!x) {

                    // check if book id  exist
                    db.get(`SELECT  Code, Name from Modules WHERE Code = ? `, [posted_bib.ModuleCODE.trim().toLowerCase()], (e, k) => {
                        // no such entry exist ..
                        if (!k) {
                            _functions.sendResponse(404, res, `Module Code with code: ${[posted_bib.ModuleCODE]} does not exist..`);
                        }
                        // book id exists, go and look for module code..
                        else {
                            db.get(`SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books WHERE ID =?`, posted_bib.BookID, (error, rows) => {

                                // no such  module exist ..
                                if (!rows) {
                                    _functions.sendResponse(404, res, `book with id: ${[posted_bib.BookID]} does not exist..`);
                                }
                                else {
                                    db.run('INSERT INTO Bibliographies (ModuleCODE, BookID) VALUES (?, ?)',
                                        [posted_bib.ModuleCODE.trim().toLowerCase(), posted_bib.BookID.trim()], function (error) {
                                            if (error) {
                                                if (error.code == 'SQLITE_CONSTRAINT') {
                                                    _functions.sendResponse(409, res, `Constraint Error | ${error.message}`);
                                                }
                                                else {
                                                    _functions.sendResponse(500, res, error.message);
                                                }
                                            }
                                            else {
                                                _functions.sendResponse(200, res, `Bibliography added.`);
                                            }
                                        });
                                }
                            });
                        }

                    });


                }
                // record exist.. returned error message
                else if (x) {
                    _functions.sendResponse(200, res, `RECORD NOT FOUND`)
                }
            })

    }
};



// GET: {local}/library/bibliographies
const GetBibliographies = (req, res) => {
    var bib = [];
    db.all('SELECT ID, ModuleCODE, BookId from Bibliographies', (err, rows) => {
        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
            console.log(`error: ${err.code} | ${err.name}`)
        }

        rows.forEach(row =>
            bib.push({ id: row.id, ModuleCODE: row.ModuleCODE, BookID: row.BookID }));
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send(bib);

    });

}




// GET: {local}/library/bibliographies/get/ :ModuleCODE
const GetBibliographiesByModuleCode = (req, res) => {
    const { ModuleCODE } = req.params;
    var bib = [];
    if (!ModuleCODE || _functions.isBlank(ModuleCODE)) {
        _functions.sendResponse(409, res, `Invalid format of parameters`);
    }
    else {

        // check if module code exist ..
        db.get('SELECT Code, Name from Modules WHERE Code = ? ', [ModuleCODE.trim().toLowerCase()], (e, x) => {

            // module code does not exist ..
            if (!x) {
                _functions.sendResponse(409, res, `Module code ${ModuleCODE} does not exist!!`);
            }
            else {
                db.get("PRAGMA foreign_keys = ON");
                // check for bibliographies ..
                db.all('SELECT id, ModuleCODE, BookID FROM Bibliographies WHERE ModuleCODE = ?', [ModuleCODE.trim().toLowerCase()], (err, rows) => {

                    if (err) {
                        console.error('Problem while querying database: ' + err);
                        _functions.sendResponse(500, res, `SERVER ERROR || ${err.message}`)
                    }

                    else if (rows.length == 0) {
                        _functions.sendResponse(404, res, `No bibliography exists with module code: ${ModuleCODE}`);
                    }
                    else {

                        rows.forEach(row => {
                            bib.push({ id: row.id, ModuleCODE: row.ModuleCODE, BookID: row.BookID })
                        });

                        res.status(200)
                            .setHeader('content-type', 'application/json')
                            .send(bib);
                    }

                });
            }

        });



    }

}




// PUT: {local}/library/student/edit/{:id}
const DeleteBibliography = (req, res) => {
    const posted_bib = req.body;         // submitted bibliography - picked from body

    if (!posted_bib || !posted_bib.ModuleCODE || !posted_bib.BookID) {
        _functions.sendResponse(409, res, `Invalid format of parameters`);
    }
    else if (_functions.isBlank(posted_bib.ModuleCODE)) {
        _functions.sendResponse(409, res, `Module code can not be null`);
    }
    else if (isNaN(posted_bib.BookID)) {
        _functions.sendResponse(409, res, `Bookd Id must be an integer ..`)
    }
    else if (_functions.isBlank(posted_bib.BookID)) {
        _functions.sendResponse(409, res, `Bookd Id can not be null ..`)
    }
    else {
        // Check if bibliography exist ..
        db.get("PRAGMA foreign_keys = ON");
        db.get(`SELECT id, ModuleCODE, BookID FROM Bibliographies WHERE ModuleCODE = ? AND BookID = ?`,
            [posted_bib.ModuleCODE.trim().toLowerCase(), posted_bib.BookID], (err, x) => {

                // no such record exist ..  check whether book id or module code exists ..
                if (!x) {

                    // check if book id  exist
                    db.get(`SELECT  Code, Name from Modules WHERE Code = ? `, [posted_bib.ModuleCODE.trim().toLowerCase()], (e, k) => {
                        // no such entry exist ..
                        if (!k) {
                            _functions.sendResponse(409, res, `Module Code with code: ${[posted_bib.ModuleCODE]} does not exist..`);
                        }
                        // book id exists, go and look for module code..
                        else {
                            db.get(`SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books WHERE ID =?`, posted_bib.BookID, (error, rows) => {

                                // no such  module exist ..
                                if (!rows) {
                                    _functions.sendResponse(409, res, `book with id: ${[posted_bib.BookID]} does not exist..`);
                                }
                                else{
                                    _functions.sendResponse(409, res, `Bibliography with module code: ${posted_bib.ModuleCODE} & book id: ${posted_bib.BookID} does not exist ..`);
                                }
                            });
                        }

                    });


                }
                // record exist.. returned error message
                else if (x) {
                    db.get("PRAGMA foreign_keys = ON");

                    db.run('DELETE FROM Bibliographies WHERE ModuleCODE = ? and BookID = ?',
                        [posted_bib.ModuleCODE.trim().toLowerCase(), posted_bib.BookID], function (error) {
                            if (error) {
                                if (error.code == 'SQLITE_CONSTRAINT') {
                                    _functions.sendResponse(409, res, `Constraint Error | ${error.message}`);
                                }
                                else {
                                    _functions.sendResponse(500, res, error.message);
                                }
                            }
                            else {
                                _functions.sendResponse(200, res, `Bibliography deleted!`);
                            }
                        });

                }
            })

    }

};



module.exports = { AddNewBibliography, GetBibliographies, GetBibliographiesByModuleCode, DeleteBibliography };