const { Sequelize, DataTypes } = require('sequelize') // import sequelize

const sequelize = new Sequelize({
    dialect: 'sqlite',              // use sqlite dialect ..
    storage: 'db/timetable.db'      // .. and pont to the DB file
});

const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());

// ------------------
//  DEFINE ORM MODEL
// ------------------

const Module = sequelize.define('Module', {
    id: {
        type: DataTypes.INTEGER,
        require: true,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING
    },
    compulsory: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'modules', // table name
    timestamps: false // skip custom timestamp columns
});

async function printAllModules1(){
    console.log('1a. Right before getting the modules -  blocking')
    var modules = await Module.findAll();       // await forces the code to block until done
    console.log('1b. Ok, got the modules');
    modules.forEach(x => console.log (` id:  ${x.id}, code: ${x.code}, name: ${x.name}, compulsory: ${x.compulsory}`));
    console.log('1c. Modules printed');
    console.log('1x. Next command')
}
function printAllModules2() {
    console.log(`2a. Right before getting the modules - call queued`)
    Module.findAll().then(modules => {
        console.log(`2b. Ok, got the modules`)
        modules.forEach(module => console.log(`id: ${module.id}, code: ${module.code}, name: ${module.name}, compulsory: ${module.compulsory}`));
        console.log(`2c. Modules printed`)
    });
    console.log(`2x. Next command`)
}

/*
console.log('---------- START SCENARIO 1 --------------');
printAllModules1();
console.log('---------- end SCENARIO 1 --------------');



console.log('---------- START SCENARIO 2 --------------');
printAllModules2();
console.log('---------- end SCENARIO 2 --------------');
*/

async function CRUD_Operations(){

console.log(`Create, update, then delete module`);

var advProg =  await Module.create({code: 'CO1234', name: 'New Module'});
console.log ( `create: ${advProg.id} -> ${advProg.code} : ${advProg.name} ` );
advProg.name = 'New Module with C++';
await advProg.save();
advProg = await Module.findOne({ where: {code: 'CO1234'} });
console.log(` udpated: ${advProg.id} -> ${advProg.code} : ${advProg.name}   `);
await advProg.destroy();        // delete from db ..
console.log(` module deleted from db: ${advProg.id} -> ${advProg.code} : ${advProg.name}   `);

var module = await Module.findAll();
module.forEach(x => console.log(`id: ${x.id}, code: ${x.code}, name: ${x.name}, compulsory: ${x.compulsory}`));

module = await Module.create({ code: 'CO1912', name: 'My new modules'});
console.log(` NEW ENTRY ADDED : ${module.name} `);

var k = await Module.findAll();
k.forEach(x => console.log(`id: ${x.id}, code: ${x.code}, name: ${x.name}, compulsory: ${x.compulsory}`));
k = await Module.findOne( {where : {code : 'CO1911'}} );
k.name = 'ANORTHOSIS 1911';
await k.save();

console.log(` AFTER UPDATE `);

var k = await Module.findAll();
k.forEach(x => console.log(`id: ${x.id}, code: ${x.code}, name: ${x.name}, compulsory: ${x.compulsory}`));

}

//CRUD_Operations();

// -------------------
//      API CALLS:
// -------------------

// GET: {local}/timetable/modules
app.get('/timetable/modules', (req,res)=> {
  
    Module.findAll()
        .then( x => {
            res.status(200)
            .setHeader('content-type', 'application/json')
            .send(x); // body is JSON
        } )
        .catch ( e=> {
            res.status(500)
            .setHeader('content-type', 'application/json')
            .send({e : `Server error: ${e.name}`});
        } )
   


})


// GET: {local}/timetable/module/ {id}
app.get('/timetable/module/:id', (req,res)=> {
  
    const {id} = req.params;  // extract id from request ..
    Module.findAll( { where : { id : id } })
        .then( x => {
            res.status(200)
            .setHeader('content-type', 'application/json')
            .send(x); // body is JSON
        } )
        .catch ( e=> {
            res.status(404)
            .setHeader('content-type', 'application/json')
            .send({ message: `Module with id: ${id} could not be found!` });
        } )
   
})


// GET: {local}/timetable/module?code = {code}
app.get('/timetable/module', (req,res)=> {
  
    const code = req.query.code;  // extract code from request ..
    Module.findOne( { where : { code : code } })
        .then( x => {
            if (x){
            res.status(200)
            .setHeader('content-type', 'application/json')
            .send(x); // body is JSON
        }
        else {
            res.status(404)
            .setHeader('content-type', 'application/json')
            .send({ message: `Module with code: ${code} could not be found!` });
        } })
        .catch ( e=> {
            res.status(500)
            .setHeader('content-type', 'application/json')
            .send({e : `Server error: ${e.name}`});
        } )
   
})

// POST: {local}/timetable/module
app.post('/timetable/module', (req,res)=> {
    
    const posted_module = req.body;             //   submitted module
    
    if ( !posted_module || !posted_module.code )    // invalid
    {
        res.status(400)
        .setHeader('content-type', 'application/json')
        .send ({ error: `bad request - must post a proper module in JSON` })
    }
    else{

        Module.create( { code: `${posted_module.code}`, name: posted_module.name, compulsory: posted_module.compulsory } )
        .then( x => {
            res.status(200)
            .setHeader('content-type', 'application/json')
            .send( {message: `Module added`, module: x} )
        })
        .catch( e => {
            if(error.name === 'SequelizeUniqueConstraintError') {
                res.status(409)
                    .setHeader('content-type', 'application/json')
                    .send({error: `Module already exists for code: ${posted_module.code}`}); // resource already exists
            } else {
                res.status(500)
                    .setHeader('content-type', 'application/json')
                    .send({error: `Server error: ${error.name}`});
            }
        } );
    }});



// PUT: {local}/timetable/module/id
app.put('/timetable/module/id', (req,res)=> {
    const {id} = req.params;
    const posted_code = req.body.code;
    if ( !posted_code) {
        res.status(400)
        .setHeader('content-type', 'application/json')
        .send ({ error: `bad request - must post a proper module in JSON` })
    }else{
        Module.findOne( { where: { id: id} } )
            .then( x => {
                x.code = posted_code.code;
                x.save().
                    then( s =>{
                        res.status(200)
                         .setHeader('content-type', 'application/json')
                        .send({message: `Module coded updated`}); // body is JSON
                    } )
                .catch( e => {
                    .setHeader('content-type', 'application/json')
                    .send({message: `Session updated`, session: s}); // body is JSON
                } )
            })

    }

    
    
   
});







app.listen( port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
    console.log(`Press Ctrl+C to exit...`)
} )

