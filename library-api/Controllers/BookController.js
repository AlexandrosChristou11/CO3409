const sqlite3 = require('sqlite3').verbose();       // include sqlite library ..


let db = new sqlite3.Database('./db/library.db', (err) => {
    if (err) {
        return console.log(err.message);
    }
    console.log('Connected to the file-based SQlite database ..');
})

const _functions = require('../Generic Methods/GlobalFunctions'); // import the routes

// -------------------
//      API CALLS:
// -------------------

// ---------
//  BOOK:
// ---------
//app.post('/library/book',

const AddNewBook = (req, res) => {
    const posted_book = req.body; // submitted module - picked from body
    console.log(posted_book);


    if (!posted_book || !posted_book.Authors || !posted_book.Title || !posted_book.ISBN || !posted_book.Year
        || !posted_book.Loanable || !posted_book.Quantity) {
        _functions.sendResponse(422, res, `Book attributes must be defined!`);

    }
    else if (_functions.isBlank(posted_book.Authors) || _functions.isBlank(posted_book.Title)
        || _functions.isBlank(posted_book.ISBN) || _functions.isBlank(posted_book.Year)
        || _functions.isBlank(posted_book.Loanable) || _functions.isBlank(posted_book.Quantity)) {
        _functions.sendResponse(422, res, `Book attributes can not be null or empty!`);
    }
    else if (!Number.isInteger(posted_book.Year)) {
        _functions.sendResponse(422, res, `Year must be an integer.`);
    }
    else if (!Number.isInteger(posted_book.Quantity)) {
        _functions.sendResponse(422, res, `Quantity must be an integer`);
    }
    else if (posted_book.Quantity < 1) {
        _functions.sendResponse(422, res, `Quantity must be at least 1.`);
    }
    else if (
        (posted_book.Loanable.toString().trim().toLowerCase() != "true" && posted_book.Loanable.toString().trim().toLowerCase() != "false")
    ) {
        _functions.sendResponse(422, res, `Loanable must be either 'true' or 'false'`);
    }



    else {

        db.run('INSERT INTO Books (Authors, Title, ISBN, Year, Loanable, Quantity) VALUES (?,?,?,?,?,?)',
            [posted_book.Authors.toLowerCase(), posted_book.Title.toLowerCase(), posted_book.ISBN.toLowerCase(), posted_book.Year, posted_book.Loanable, posted_book.Quantity],
            function (error) {

                if (error) {
                    if (error.code == 'SQLITE_CONSTRAINT') {

                        res.status(409)
                            .setHeader('content-type', 'application/json')
                            //.send({ error: `Book with ISBN ${posted_book.ISBN} already exists. ` })
                            .send({ error: `Contraint Error | ${error.message}` })
                    }
                    else {
                        res.status(500)
                            .setHeader('content-type', 'application/json')
                            .send({ error })
                    }
                } else {
                    res.status(200)
                        .setHeader('content-type', 'application/json')
                        .send({ message: "Book added", id: posted_book.Title, id: this.lastID });
                }

            });


    }
};


// GET: {local}/library/books
const GetBooks = (req, res) => {
    var books = [];
    db.all('SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books', (err, rows) => {
        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
            console.log(`error: ${err.code} | ${err.name}`)
        }

        rows.forEach(row =>
            books.push({ id: row.id, Authors: row.Authors, Title: row.Title, ISBN: row.ISBN, Year: row.Year, Loanable: row.Loanable, Quantity: row.Quantity }));
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send(books);

    });

}

// GET: {local}/library/book/ :id
// app.get('/library/book/:id',
const GetBooksById = (req, res) => {
    const { id } = req.params;

    db.get('SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books WHERE ID=?', [id.toString().trim()], (err, rows) => {
        if (err) {
            _functions.sendResponse(500, res, `ERROR || SERVER`)
        }

        if (isNaN(parseInt(id)) || _functions.isBlank(id)) {
            _functions.sendResponse(422, res, `Book Id must be an Integer`);
        } else
            if (!rows) {
                _functions.sendResponse(404, res, `Book with Id: ${id} was not found ..`);
            }
            else {
                res.status(200)
                    .setHeader('content-type', 'application/json')
                    .send({ id: rows.id, Authors: rows.Authors, Title: rows.Title, ISBN: rows.ISBN, Loanable: rows.Loanable, Quantity: rows.Quantity });
            }

    });

}


// GET: {local}/library/book?title= {title}
//app.get('/library/book', 

const GetBookByTitleQuery = (req, res) => {
    let title = req.query.Title;      // extract 'title' from request
    let param = '%' + title.trim().toLowerCase() + '%';
    var books = [];
    db.all('SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books WHERE Title LIKE ?', param, (err, rows) => {

        if (err) {
            _functions.sendResponse(500, res, `ERROR | SERVER`)
        }
        else if (_functions.isBlank(title)) {
            _functions.sendResponse(422, res, `Please use a valid format for a book title.`);
        }
        else if (rows.length == 0) {
            _functions.sendResponse(404, res, `No books found ..`);
        }
        else {
            rows.forEach(row =>
                books.push({ id: row.id, Authors: row.Authors, Title: row.Title, ISBN: row.ISBN, Year: row.Year, Loanable: row.Loanable, Quantity: row.Quantity }));

            res.status(200)
                .setHeader('content-type', 'application/json')
                .send(books);
        }

    });


}



// PUT: {local}/library/book/edit/{:id}
const EditBook = (req, res) => {
    const { id } = req.params; // get id from params
    const posted_book = req.body;           // submitted book

    if (!id || _functions.isBlank(id) || isNaN(id)) {
        _functions.sendResponse(422, res, `Please use a valid format for a book id.`);
    } else {
        db.get(`SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books WHERE ID=?`, id, (err, row) => {


            if (err) {
                _functions.sendResponse(500, res, `SERVER || ERROR`);
            }
            else if (!row){
                _functions.sendResponse(404, res, `Book not found`);
            }
            else {

                if ((posted_book.Quantity != null &&  !Number.isInteger(posted_book.Quantity))) {
                    _functions.sendResponse(422, res, `Please use a valid format for quantity.`);
                }
                else if (posted_book.Quantity != null && (posted_book.Quantity <= row.Quantity) ){
                    _functions.sendResponse(422, res, `Quantity can only be increased!`);
                }
                else if ((posted_book.Authors && _functions.isBlank(posted_book.Authors)) ||
                    (posted_book.Title && _functions.isBlank(posted_book.Title)) ||
                    (posted_book.Year && _functions.isBlank(posted_book.Year)) ||
                    (posted_book.Loanable && _functions.isBlank(posted_book.Loanable))) {
                    _functions.sendResponse(422, res, `Field can not be empty`);
                }
                else if (posted_book.Year && !Number.isInteger(posted_book.Year)) {
                    _functions.sendResponse(422, res, `Year must be an integer.`);
                }
                else if (posted_book.Quantity && !Number.isInteger(posted_book.Quantity)) {
                    _functions.sendResponse(422, res, `Quantity must be an integer`);
                }
                else if (posted_book.Quantity && posted_book.Quantity < 1) {
                    _functions.sendResponse(422, res, `Quantity must be at least 1.`);
                }
                else if (
                    (posted_book.Loanable && posted_book.Loanable.toString().trim().toLowerCase() != "true" && posted_book.Loanable.toString().trim().toLowerCase() != "false")
                ) {
                    _functions.sendResponse(422, res, `Loanable must be either 'true' or 'false'`);
                }
                else if ( posted_book.Authors && _functions.isBlank(posted_book.Authors)){
                    _functions.sendResponse(422, res, `Authors can not be empty'`);
                }
                else if ( posted_book.Title && _functions.isBlank(posted_book.Title)){
                    _functions.sendResponse(422, res, `Title can not be empty'`);
                }
                else if ( posted_book.ISBN && _functions.isBlank(posted_book.ISBN)){
                    _functions.sendResponse(422, res, `ISBN can not be empty'`);
                }


                else if (!row) { // true if 'book' not set
                    res.status(404)
                        .setHeader('content-type', 'application/json')
                        .send({ error: "Book not found for id: " + id }); // resource not found
                }
                else { // book found, let's update it
                    var loanableField;
                    if (posted_book.Loanable == null || posted_book.Loanable == undefined) {
                        loanableField = row.Loanable

                    } else {
                        loanableField = _functions.isTrue(posted_book.Loanable);
                    }
                    const parameters = [posted_book.Authors ?? row.Authors,
                    posted_book.Title ?? row.Title,
                    posted_book.ISBN ?? row.ISBN,
                    posted_book.Year ?? row.Year,
                    posted_book.Quantity ?? row.Quantity,
                        loanableField,
                        id];

                    db.run(`UPDATE Books SET Authors = ?, Title = ?, ISBN = ?, Year = ?, Quantity = ?, Loanable = ? WHERE ID=?`, parameters, (err) => {
                        if (err) {
                            if (err.code === 'SQLITE_CONSTRAINT') {
                                res.status(409) // resource already exists
                                    .setHeader('content-type', 'application/json')
                                    .send({ error: `Constraint error: ${err.message}` });
                            } else { // other server-side error
                                res.status(500)
                                    .setHeader('content-type', 'application/json')
                                    .send({ error: "Server error: " + err });
                            }
                        } else {
                            res.status(200)
                                .setHeader('content-type', 'application/json')
                                .send({ message: `Book with id ${id} was updated!` });
                        }
                    });
                }
            }
        });
    }
};


module.exports = { AddNewBook, GetBooks, GetBooksById, GetBookByTitleQuery, EditBook };
