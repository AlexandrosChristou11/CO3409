const sqlite3 = require('sqlite3').verbose();       // include sqlite library ..


let db = new sqlite3.Database('./db/library.db', (err) => {
    if (err) {
        return console.log(err.message);
    }
    console.log('Connected to the file-based SQlite database ..');
})

const _functions = require('../Generic Methods/GlobalFunctions'); // import the routes


// {POST}: localhost:3000/library/module/add
const AddNewModule = (req, res) => {
    const posted_module = req.body; // submitted module - picked from body


    if (!posted_module || !posted_module.Name ||
        !posted_module.Code || _functions.isBlank(posted_module.Name)
        || _functions.isBlank(posted_module.Code) || posted_module.Code == ""
        || posted_module.Name == "") {
        _functions.sendResponse(422, res, `Module's attributes must be defined!`);

    } else {
        var code = posted_module.Code.trim().toLowerCase();
        var name = posted_module.Name.trim().toLowerCase();
        db.run('INSERT INTO Modules (Code, Name) VALUES (?,?)',
            [code, name],
            function (error) {

                if (error) {
                    if (error.code == 'SQLITE_CONSTRAINT') {

                        res.status(409)
                            .setHeader('content-type', 'application/json')
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
                        .send({ message: "Module added", id: this.lastID });
                }

            });


    }
};

// GET: {local}/library/modules
const GetModules = (req, res) => {
    var modules = [];
    db.all('SELECT id, Code, Name from Modules', (err, rows) => {
        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
            console.log(`error: ${err.code} | ${err.name}`)
        }

        rows.forEach(row =>
            modules.push({ id: row.id, Code: row.Code, Name: row.Name }));
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send(modules);

    });

}

// GET: {local}/library/module/get/:id
const GetModuleById = (req, res) => {
    const { id } = req.params;

    if (_functions.isBlank(id)) {
        _functions.sendResponse(422, res, `Module id can not be empty`)
    }
    else if (isNaN(id)) {
        _functions.sendResponse(422, res, `Module id must be an Integer.`)
    }

    else {
        db.get('SELECT id ,Code, Name from Modules WHERE id = ?', [id], (err, rows) => {

            if (err) {
                console.error('Problem while querying database: ' + err);
                _functions.sendResponse(500, res, `SERVER || ERROR`)
            }

            else if (!rows) {
                _functions.sendResponse(404, res, `Module with id: ${id} was not found ..`);

            }
            else {
                res.status(200)
                    .setHeader('content-type', 'application/json')
                    .send({ Code: rows.Code, Name: rows.Name });
            }

        });
    }

}


// GET: {local}/library/module/:code
const GetModuleByCode = (req, res) => {
    const { code } = req.params;

    db.get('SELECT Code, Name from Modules WHERE Code = ?', [code.trim().toLowerCase()], (err, rows) => {

        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
        }
        else if (_functions.isBlank(code)) {
            _functions.sendResponse(422, res, `Module code can not be empty..`);
        }
        else if (!isNaN(code)) {
            _functions.sendResponse(422, res, `Module code is not only numbers ..`);
        }
        else if (!rows) {
            _functions.sendResponse(404, res, `Module with code: ${code} was not found ..`);
        }
        else {
            res.status(200)
                .setHeader('content-type', 'application/json')
                .send({ Code: rows.Code, Name: rows.Name });
        }

    });

}

// GET: {local}/library/module?Code= {code}
const GetModuleByNameQuery = (req, res) => {
    let name = req.query.Name.toLowerCase();      // extract 'name' from request
    let param = '%' + name.toLowerCase() + '%';
    var modules = [];
    db.all('SELECT Code, Name from Modules WHERE Name LIKE ?', param, (err, rows) => {

        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Server Error " });
        }
        else if (_functions.isBlank(name)) {
            res.status(422)
                .setHeader('content-type', 'application/json')
                .send({ error: `Module name is of invalid format` });
        }
        else if (rows.length == 0) {
            res.status(404)
                .setHeader('content-type', 'application/json')
                .send({ error: `Module with name: ${name},  was not found ..` });
        }
        else {
            rows.forEach(row =>
                modules.push({ Code: row.Code, Name: row.Name }));

            res.status(200)
                .setHeader('content-type', 'application/json')
                .send(modules);
        }

    });


}


// PUT: {local}/library/module/edit/{:code}
const EditModule = (req, res) => {
    const { code } = req.params; // get id from params
    const posted_module = req.body;           // submitted book

    if (!code || _functions.isBlank(code)) {
        res.status(422)
            .setHeader('content-type', 'application/json')
            .send({ error: `Module Code can not be empty` }); // resource not found
    } else {
        db.get(`SELECT id, Code, Name from Modules WHERE Code = ?`, [code.trim().toLowerCase()], (err, row) => {

            if (err) {
                res.status(500)
                    .setHeader('content-type', 'application/json')
                    .send({ error: "Server error: " + err });
            }
            else {

                if ((posted_module.Name && _functions.isBlank(posted_module.Name) || posted_module.Name == "") ||
                    (posted_module.Code && _functions.isBlank(posted_module.Code) || posted_module.Code == "")) {
                    res.status(422)
                        .setHeader('content-type', 'application/json')
                        .send({ error: `Update values can not be empty` }); // resource not found
                }
                else if (!posted_module.Name){
                    res.status(422)
                    .setHeader('content-type', 'application/json')
                    .send({ error: `Module name must be given` }); // resource not found
                } 


                else if (!row) { // true if 'module' not set
                    res.status(404)
                        .setHeader('content-type', 'application/json')
                        .send({ error: "Module not found for code: " + code }); // resource not found
                }
                else { // student found, let's update it

                    const parameters = [
                        posted_module.Code == undefined ?  row.Code :  posted_module.Code.toString().toLowerCase(),
                        posted_module.Name == undefined ? row.Name : posted_module.Name.toString().toLowerCase(),
                        code.trim().toLowerCase()
                    ];

                    db.run(`UPDATE Modules SET Code = ?, Name = ? WHERE Code = ?`, parameters, (err) => {
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
                                .send({ message: `Module with code ${code} was updated!` });
                        }
                    });
                }
            }
        });
    }
};



module.exports = { AddNewModule, GetModules, GetModuleByCode, GetModuleByNameQuery, EditModule, GetModuleById };