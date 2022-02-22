const sqlite3 = require('sqlite3').verbose();       // include sqlite library ..


let db = new sqlite3.Database('./db/library.db', (err)=> {
    if (err){
        return console.log(err.message);
    }
    console.log('Connected to the file-based SQlite database ..');
})

const _functions = require('../Generic Methods/GlobalFunctions'); // import the routes



// {POST}: localhost:3000/library/student/add
const AddNewStudent = (req, res) => {
    const posted_student = req.body; // submitted module - picked from body


if (!posted_student || !posted_student.Name || !posted_student.YOB || _functions.isBlank(posted_student.Name) || isNaN(posted_student.YOB)) {
        res.status(422) // bad request
            .setHeader('content-type', 'application/json')
            .send({ error: `Invalid Student format !!` });

    } else {

        db.run('INSERT INTO Students (Name, YOB) VALUES (?,?)',
            [posted_student.Name, posted_student.YOB],
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
                        .send({ message: "Student added", id: posted_student.id, Name: posted_student.Name, YOB: posted_student.YOB });
                }

            });


    }
};



// GET: {local}/library/students
const GetStudents =  (req, res) => {
    var books = [];
    db.all('SELECT ID, Name, YOB from Students', (err, rows) => {
        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
            console.log(`error: ${err.code} | ${err.name}`)
        }

        rows.forEach(row =>
            books.push({ id: row.id, Name: row.Name, YOB: row.YOB }));
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send(books);

    });

}

// GET: {local}/library/student/:id
const GetStudentById =  (req, res) => {
    const  {id}  = req.params;
    db.get('SELECT ID, Name, YOB from Students WHERE ID = ?', [id.trim()], (err, rows) => {
        console.log(`ID: ${id}`);
        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
        }

        if (isNaN(id) || _functions.isBlank(id)) {
            res.status(422)
                .setHeader('content-type', 'application/json')
                .send({ error: "Student id is of invalid format" });
        } 
        else if (!rows) {
                res.status(404)
                    .setHeader('content-type', 'application/json')
                    .send({ error: `Student with id: ${id} was not found ..` });
            }
            else {
                res.status(200)
                    .setHeader('content-type', 'application/json')
                    .send({ id: rows.id, Name: rows.Name, YOB: rows.YOB });
            }

    });

}


// GET: {local}/library/student?Name= {name}
const GetStudentByNameQuery = (req, res) => {
    let name = req.query.Name;      // extract 'name' from request
    let param = '%' + name + '%';
    var students = [];
    db.all('SELECT ID, Name, YOB from Students WHERE Name LIKE ?', param, (err, rows) => {

        if (err) {
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
                .setHeader('content-type', 'application/json')
                .send({ error: "Problem while querying database" });
        }
        else if (_functions.isBlank(name)) {
            res.status(422)
                .setHeader('content-type', 'application/json')
                .send({ error: `Student name is of invalid format` });
        }
        else if (rows.length == 0) {
            res.status(404)
                .setHeader('content-type', 'application/json')
                .send({ error: `Student with name: ${name},  was not found ..` });
        }
        else {
            rows.forEach(row =>
                students.push({ id: row.id, Name: row.Name, YOB: row.YOB,  }));

            res.status(200)
                .setHeader('content-type', 'application/json')
                .send(students);
        }

    });


}


// PUT: {local}/library/student/edit/{:id}
const EditStudent = (req, res) => {
    const { id } = req.params; // get id from params
    const posted_student = req.body;           // submitted book

    if (!id || _functions.isBlank(id) || isNaN(id)) {
        res.status(422)
            .setHeader('content-type', 'application/json')
            .send({ error: `Id is of invalid format` }); // resource not found
    } else {
        db.get(`SELECT ID, Name, YOB from Students where ID=?`, [id], (err, row) => {

            if (err) {
                res.status(500)
                    .setHeader('content-type', 'application/json')
                    .send({ error: "Server error: " + err });
            }
            else {
            
                if ((posted_student.Name && _functions.isBlank(posted_student.Name)) ||
                    (posted_student.YOB && _functions.isBlank(posted_student.YOB))) {
                    res.status(422)
                        .setHeader('content-type', 'application/json')
                        .send({ error: `Invalid structure of JSON Parameters` }); // resource not found
                }


                else if (!row) { // true if 'student' not set
                    res.status(404)
                        .setHeader('content-type', 'application/json')
                        .send({ error: "Student not found for id: " + id }); // resource not found
                }
                else { // student found, let's update it

                    const parameters = [
                        posted_student.Name ?? row.Name,
                        posted_student.YOB ?? row.YOB,
                        id];

                    db.run(`UPDATE Students SET Name = ?, YOB = ? WHERE ID=?`, parameters, (err) => {
                        if (err) {
                            if (err.code === 'SQLITE_CONSTRAINT') {
                                res.status(409) // resource already exists
                                    .setHeader('content-type', 'application/json')
                                    .send({ error: `Constraint error: ${err}` });
                            } else { // other server-side error
                                res.status(500)
                                    .setHeader('content-type', 'application/json')
                                    .send({ error: "Server error: " + err });
                            }
                        } else {
                            res.status(200)
                                .setHeader('content-type', 'application/json')
                                .send({ message: `Student with id ${id} was updated!` });
                        }
                    });
                }
            }
        });
    }
};



module.exports = {AddNewStudent, GetStudents, GetStudentById, GetStudentByNameQuery, EditStudent};