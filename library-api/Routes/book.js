

const express = require('express'); //import express

// 1.
const router  = express.Router(); 
// 2.
const bookController = require("../Controllers/BookController");
const studentController = require("../Controllers/StudentController");
const moduleController = require("../Controllers/ModuleController");
const loanController = require("../Controllers/LoanController");

// 3.

// (A) BOOK
router.post('/library/book', bookController.AddNewBook);
router.get('/library/books',bookController.GetBooks);
router.get('/library/book/:id',bookController.GetBooksById);
router.get('/library/book', bookController.GetBookByTitleQuery);
router.put('/library/book/edit/:id', bookController.EditBook);

// (B) STUDENT
router.post('/library/student/add', studentController.AddNewStudent);
router.get('/library/students', studentController.GetStudents);
router.get('/library/student/:id', studentController.GetStudentById);
router.get('/library/student', studentController.GetStudentByNameQuery);
router.put('/library/student/edit/:id', studentController.EditStudent);

// (C) MODULE
router.post('/library/module/add', moduleController.AddNewModule);
router.get('/library/modules', moduleController.GetModules);
router.get('/library/module/:code', moduleController.GetModuleByCode);
router.get('/library/module', moduleController.GetModuleByNameQuery);
router.put('/library/module/edit/:code', moduleController.EditModule);

// (D) LOAN
router.post('/library/loan/add', loanController.AddNewLoan );
router.get('/library/loans', loanController.GetLoans );
router.get('/library/loans/book/:bookId', loanController.GetLoansByBookId );
router.put('/library/loans/edit/:loanId', loanController.EditLoan );


// 4. 
module.exports = router; // export to use in server.js

