
const express = require('express');
const app = express();
const port = 3000;

// -----------------------
//          GET 
// -----------------------
app.get( '/test', (req, res) =>{
    res.status(200)
            .setHeader('content-type', 'application/json') // body ..
            .send( { message: 'Testing GET method' } );        
} );


// -----------------------
//          POST 
// -----------------------
app.get( '/test', (req, res) =>{
    res.status(200)
            .setHeader('content-type', 'application/json') // body ..
            .send( { message: 'Testing POST method' } );        
} );



// -----------------------
//          PUT 
// -----------------------
app.put( '/test', (req, res) =>{
    res.status(200)
            .setHeader('content-type', 'application/json') // body ..
            .send( { message: 'Testing PUT method' } );        
} );


// -----------------------
//          PUT 
// -----------------------
app.delete( '/test', (req, res) =>{
    res.status(200)
            .setHeader('content-type', 'application/json') // body ..
            .send( { message: 'Testing POST method' } );        
} );


app.listen ( port, ()=> {
    console.log ( 'Example app listening at http://localhost:' +port);

} )