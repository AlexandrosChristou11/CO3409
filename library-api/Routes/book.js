

const express = require('express'); //import express

// 1.
const router  = express.Router(); 
// 2.
const bookController = require("../Controllers/BookController");
// 3.
router.post('/library/book', bookController.AddNewBook);
router.get('/library/books/ :id',bookController.GetBooksById);

// 4. 
module.exports = router; // export to use in server.js