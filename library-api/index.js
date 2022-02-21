//const routes = require('./Routes/book'); // import the routes
const sqlite3 = require('sqlite3').verbose();       // include sqlite library ..
const _functions = require('./Generic Methods/GlobalFunctions'); // import the routes


let db = new sqlite3.Database('./db/library.db', (err) => {
    if (err) {
        return console.log(err.message);
    }
    console.log('Connected to the file-based SQlite database ..');
})


const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());



// // -------------------
// //      API CALLS:
// // -------------------

// ---------
//  BOOK:
// ---------

//app.use('/', routes); //to use the routes

// {POST}: localhost:3000/library/book
app.post('/library/book', (req, res) => {
    const posted_book = req.body; // submitted module - picked from body
    console.log(posted_book);


    if (!posted_book || !posted_book.Authors || !posted_book.Title || !posted_book.ISBN || !posted_book.Year
        || !posted_book.Loanable || !posted_book.Quantity) {
        res.status(422) // bad request
            .setHeader('content-type', 'application/json')
            .send({ error: `Invalid Book format !!` });

    } else {

        db.run('INSERT INTO Books (Authors, Title, ISBN, Year, Loanable, Quantity) VALUES (?,?,?,?,?,?)',
            [posted_book.Authors, posted_book.Title, posted_book.ISBN, posted_book.Year, posted_book.Loanable, posted_book.Quantity],
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
});


// GET: {local}/library/books
app.get('/library/books', (req, res) => {
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

})

// GET: {local}/library/book/ :id
app.get('/library/book/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books WHERE ID=?', [id.trim()], (err, rows) => {
        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
        }

        if (isNaN(id) || _functions.isBlank(id)) {
            res.status(422)
                .setHeader('content-type', 'application/json')
                .send({ error: "Book id is of invalid format" });
        } else
            if (!rows) {
                res.status(404)
                    .setHeader('content-type', 'application/json')
                    .send({ error: "Book with id `${id}` was not found .." });
            }
            else {
                res.status(200)
                    .setHeader('content-type', 'application/json')
                    .send({ id: rows.id, Authors: rows.Authors, Title: rows.Title, ISBN: rows.ISBN, Loanable: rows.Loanable, Quantity: rows.Quantity });
            }

    });

})


// GET: {local}/library/book?title= {title}
app.get('/library/book', (req, res) => {
    let title = req.query.Title;      // extract 'title' from request
    let param = '%' + title + '%';
    var books = [];
    db.all('SELECT ID, Authors, Title, ISBN, Year, Loanable, Quantity from Books WHERE Title LIKE ?', param, (err, rows) => {

        console.log(`PARAMETER TITLE: ${title}`);
        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
        }
        else if (_functions.isBlank(title)) {
            res.status(422)
                .setHeader('content-type', 'application/json')
                .send({ error: `Book Title ${title} is of invalid format` });
        }
        else if (rows.length == 0) {
            res.status(404)
                .setHeader('content-type', 'application/json')
                .send({ error: `Book with Title ${title} was not found ..` });
        }
        else {
            rows.forEach(row =>
                books.push({ id: row.id, Authors: row.Authors, Title: row.Title, ISBN: row.ISBN, Year: row.Year, Loanable: row.Loanable, Quantity: row.Quantity }));

            res.status(200)
                .setHeader('content-type', 'application/json')
                .send(books);
        }

    });


})

// PUT: {local}/library/book/edit
app.put('/library/book/edit', (req, res) => {
    const put_book = req.body;                      // submitted book - picked from body

    if (!posted_book || !put_book.Authors || !put_book.Title || !put_book.ISBN || !posteput_bookd_book.Year
        || !put_book.Loanable || !put_book.Quantity) {
        res.status(422) // bad request
            .setHeader('content-type', 'application/json')
            .send({ error: `Invalid Book format !!` });

    } else {

        db.run(' UPDATE Books SET Authors = ? SET Title',
            [posted_book.Authors, posted_book.Title, posted_book.ISBN, posted_book.Year, posted_book.Loanable, posted_book.Quantity],
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

});





app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.log(`Press Ctrl+C to exit...`)
})

