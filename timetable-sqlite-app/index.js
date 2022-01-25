
const sqlite3 = require('sqlite3').verbose();       // include sqlite library ..
const express = require('express');
const app = express();
const port = 3000;

let db = new sqlite3.Database('./db/timetable.db', (err)=> {
    if (err){
        return console.log(err.message);
    }
    console.log('Connected to the file-based SQlite database ..');
})


app.use(express.json());


// GET: {local}/timetable/module
app.get('/timetable/modules', (req,res)=> {
    var modules = [];
    db.all('SELECT id, code, name FROM modules', (err, rows)=> {
        if (err){
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
            .setHeader('content-type', 'application/json')
            .send({error: "Problem while querying database"});
        }

        rows.forEach(row =>
            modules.push({id: row.id, code: row.code, name: row.name}));
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send(modules);

    });

})

// GET: {local}/timetable/module/ {code}
app.get('/timetable/module', (req,res)=> {
    const code = req.query.code;      // extract 'code' from request
    db.get('SELECT id, code, name FROM modules where code=?',[code], (err, rows)=> {
        if (err){
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
            .setHeader('content-type', 'application/json')
            .send({error: "Problem while querying database"});
        }

        if(!rows){
            res.status(404)
            .setHeader('content-type', 'application/json')
            .send({error: "Module with code ${code} was not found .."});
        }else {
            res.status(200)
            .setHeader('content-type', 'application/json')
            .send({id: rows.id, code: rows.code, name: rows.name });
        }

    });


})


// GET: {local}/timetable/module/ {id}
app.get('/timetable/module/:id', (req,res)=> {
    const {id} = req.params;      // extract 'code' from request
    db.get('SELECT id, code, name FROM modules where id=?',[id], (err, rows)=> {
        if (err){
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
            .setHeader('content-type', 'application/json')
            .send({error: "Problem while querying database"});
        }

        if(!rows){
            res.status(404)
            .setHeader('content-type', 'application/json')
            .send({error: "Module with code `${id}` was not found .."});
        }else {
            res.status(200)
            .setHeader('content-type', 'application/json')
            .send({id: rows.id, code: rows.code, name: rows.name });
        }
    });


})

// {POST}: localhost:3000/timetable/module
app.post('/timetable/module', (req, res) => {
    const posted_module = req.body; // submitted module - picked from body
    console.log(posted_module);
    // look up for existing module with  given code 
    if(!posted_module || !posted_module.code || !posted_module.name) { // true if 'module' set (found)
        res.status(400) // bad request
            .setHeader('content-type', 'application/json')
            .send({ error: `Module must define a code and name`});
    } else {
        
        db.run( 'INSERT INTO modules (code, name) VALUES (?,?)',
                    [posted_module.code, posted_module.name], function(err){

                        if (err){
                            if (err.code == 'SQLITE_CONSTRAINT'){
                                res.status(409)
                                .setHeader('content-type', 'application/json')
                                .send({ error: 'Module already exists: '+posted_module.code })
                            }
                            else{
                            res.status(500)
                            .setHeader('content-type', 'application/json')
                            .send({ error })
                             }
                        }else{
                            res.status(200)
                                .setHeader('content-type', 'application/json')
                                .send({ message: "Module added", code: posted_module.code, id : this.lastID});
                        }

                    } );

        
    }
});


// GET: {local}/timetable/rooms
app.get('/timetable/rooms', (req,res)=> {
    var rooms = [];
    db.all('SELECT id, code, description FROM rooms', (err, rows)=> {
        if (err){
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
            .setHeader('content-type', 'application/json')
            .send({error: "Problem while querying database"});
        }

        rows.forEach(row => rooms.push({id: row.id, code: row.code, description: row.description}));
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send(rooms);

    });

})

// GET: {local}/timetable/rooms
app.get('/timetable/rooms/:id', (req,res)=> {
    const {id} = req.params;
    db.get('SELECT id, code, description FROM rooms WHERE id=(?)',[id], (err, rows)=> {
        if (err){
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
            .setHeader('content-type', 'application/json')
            .send({error: "Problem while querying database"});
        }

        if(!rows){
            res.status(404)
            .setHeader('content-type', 'application/json')
            .send({error: "Room with code `${id}` was not found .."});
        }
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send({id : rows.id, name: rows.name, description: rows.description} );

    });

})


// GET: {local}/timetable/room/ {code}
app.get('/room', (req,res)=> {
    const code = req.query.code;      // extract 'code' from request
    db.get('SELECT id, code, description FROM rooms where code=?',[code], (err, rows)=> {
        if (err){
            console.error('Problem while querying database: ' + err);
            res.status(500) // internal server error ..
            .setHeader('content-type', 'application/json')
            .send({error: "Problem while querying database"});
        }

        if(!rows){
            res.status(404)
            .setHeader('content-type', 'application/json')
            .send({error: "Room with code ${code} was not found .."});
        }else {
            res.status(200)
            .setHeader('content-type', 'application/json')
            .send({id: rows.id, code: rows.code, description: rows.description });
        }

    });


})


// {POST}: localhost:3000/room
app.post('/room', (req, res) => {
    const posted_room = req.body; // submitted module - picked from body
    console.log(posted_room);
    // look up for existing module with  given code 
    if(!posted_room || !posted_room.code || !posted_room.description) { // true if 'module' set (found)
        res.status(400) // bad request
            .setHeader('content-type', 'application/json')
            .send({ error: `Module must define a code and name`});
    } else {
        
        db.run( 'INSERT INTO rooms (code, description) VALUES (?,?)',
                    [posted_room.code, posted_room.description], function(err){

                        if (err){
                            if (err.code == 'SQLITE_CONSTRAINT'){
                                res.status(409)
                                .setHeader('content-type', 'application/json')
                                .send({ error: 'Module already exists: '+posted_room.code })
                            }
                            else{
                            res.status(500)
                            .setHeader('content-type', 'application/json')
                            .send({ error })
                             }
                        }else{
                            res.status(200)
                                .setHeader('content-type', 'application/json')
                                .send({ message: "Module added", code: posted_room.code, description: posted_room.description ,id : this.lastID});
                        }

                    } );

        
    }
});




//db.close();

/*
// {GET}: localhost:3000/timetable/modules
app.get('/timetable/modules/', (req, res) => {
    res.status(200)
        .setHeader('content-type', 'application/json')
        .send(timetable_data.modules)
} );


// {GET}: localhost:3000/timetable/modules/ {id}
app.get( '/timetable/module/:id', (req, res) => {
    const { id } = req.params; // extract 'id' from request (String)

    // find 'module' by iterating 'modules' and checking their 'id'
    var module = timetable_data.modules.find ( m => m.id.toString().toLowerCase() == id.toString().toLowerCase() );
    if (!module) {
        res.status(404).send(); // resource not found ..
    }else{
        res.status(200).setHeader('content-type', 'application/json').send(module);
    }
} );



// {GET}: localhost:3000/timetable/modules?code={code}
app.get('/timetable/module', (req, res) => {
    const code = req.query.code; // extract 'code' from request
    // find 'module' by iterating 'modules' and checking their 'code'
    var module = timetable_data.modules.find(m => m.code === code);
    if(!module) { // true if 'module' not set
        res.status(404).send(); // resource not found
    } else {
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send(module);
    }
});

// {POST}: localhost:3000/timetable/ {module}
app.post('/timetable/module', (req, res) => {
    const posted_module = req.body; // submitted module - picked from body
    // look up for existing module with  given code 
    var module = timetable_data.modules.find(m => m.code === posted_module.code);
    if(module) { // true if 'module' set (found)
        res.status(409).send(); // resource already exists
    } else {
        
        timetable_data.modules.push(posted_module); // add to local model
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send({ message: "Module added"});
    }
});


// {DELETE}: localhost:3000/timetable/ {module}
app.delete('/timetable/module', (req, res) => {
    const code = req.query.code; // look for ?code=... param
    // look up for existing module with  given code 
    var module = timetable_data.modules.find(m => m.code === code);
    if(!module) { // true if 'module' not set/found
        res.status(404).send(); // resource not found
    } else {
        var index = timetable_data.modules.findIndex(m => m.code === code);
        timetable_data.modules.splice(index, 1);
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send({ message: "Module deleted"});
    }
});


// {GET}: localhost:3000/timetable/rooms
app.get('/timetable/rooms/', (req, res) => {
    res.status(200)
        .setHeader('content-type', 'application/json')
        .send(timetable_data.rooms)
} );


// {GET}: localhost:3000/timetable/rooms/ {id}
app.get( '/timetable/room/:id', (req, res) => {
    const { id } = req.params; // extract 'id' from request (String)

    // find 'module' by iterating 'modules' and checking their 'id'
    var roomLoc = timetable_data.rooms.find ( m => m.id.toString().toLowerCase() == id.toString().toLowerCase() );
    if (!roomLoc) {
        res.status(404).send(); // resource not found ..
    }else{
        res.status(200).setHeader('content-type', 'application/json').send(roomLoc);
    }
} );


// {GET}: localhost:3000/timetable/room?code={code}
app.get('/timetable/room', (req, res) => {
    const code = req.query.code; // extract 'code' from request
    // find 'room' by iterating 'rooms' and checking their 'code'
    var room = timetable_data.rooms.find(m => m.code == code);
    if(!room) { // true if 'module' not set
        res.status(404).send(); // resource not found
    } else {
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send(room);
    }
});

// {POST}: localhost:3000/timetable/ {rooms}
app.post('/timetable/rooms', (req, res) => {
    const posted_rooms = req.body; // submitted module - picked from body
    // look up for existing module with  given code 
    var rooms = timetable_data.rooms.find(m => m.code === posted_module.code);
    if(rooms) { // true if 'module' set (found)
        res.status(409).send(); // resource already exists
    } else {
        
        timetable_data.room.push(posted_rooms); // add to local model
        res.status(200)
            .setHeader('content-type', 'application/json')
            .send({ message: "Module added"});
    }
});
*/
app.listen( port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.log(`Press Ctrl+C to exit...`)
} )

