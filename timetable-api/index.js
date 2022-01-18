

const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

var timetable_data = {
    modules: [
        {id: 1, code: "CO3409", name: "Distributed Enterprise Applications"},
        {id: 2, code: "CO2509", name: "Mobile Computing"},
    ],

    rooms: [
        {id: 1, code: "120", descriptiom: "Standard Lecture Room", capacity: 20,
            type: "Lecture Room", floor: 1},
        {id: 2, code: "014", description: "Main Computer Lab", capacity: 32,
            type: "Computer Lab", floor: 0},
        {id: 3, code: "113", description: "Secondary Computer Lab", capacity: 16,
            type: "Computer Lab", floor: 1},
        {id: 4, code: "B036", description: "Inspire Lab", capacity: 12,
            type: "Research Lab", floor: -1}
    ],

    sessions: [
        {id: 1, moduleId: 1, roomId: 1, day: "Tuesday", start: 5, finish: 6},
        {id: 2, moduleId: 1, roomId: 3, day: "Tuesday", start: 6, finish: 7},
        {id: 3, moduleId: 2, roomId: 1, day: "Wednesday", start: 11, finish: 12},
        {id: 4, moduleId: 2, roomId: 2, day: "Wednesday", start: 12, finish: 13}
    ]

};


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

app.listen( port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.log(`Press Ctrl+C to exit...`)
} )