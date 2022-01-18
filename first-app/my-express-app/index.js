
const express = require('express'); // use external lib 'express'
const app = express(); // init express ..

const port = 3000;


app.get('/', (req, res) => {        // handle GET request at '/'
    res.send('Hello World!!');      // Simply send back 'Hello World'
} );

app.listen(port, ()=> {     // listen for calls = localhost implied ..
    console.log('Server running at http://localhost' + port);
})
