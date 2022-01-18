function sayHello(name){
    console.log('Hello ' + name);
}

//sayHello('Alex');

const http = require('http'); // use external http libary

const hostname = '127.0.0.1'; // localhost ..
const port = 3000;

const server = http.createServer( (req, res) => { // request, response ..
    res.statusCode = 200; 
    res.setHeader('Content-Type', 'text/plain');
    res.end('sayHello');
} );

server.listen(port, hostname, ()=> {
    console.log('Server running at http://${hostname}: ${port}');
})