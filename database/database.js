let mongoose = require('mongoose');

const server = '127.0.0.1:27017';
const database = 'zgkDev'; // REPLACE WITH MongDB DB NAME

mongoose.connect(`mongodb://${server}/${database}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, )
    .then(() => {
        console.log('Database connection successfull: ' + database)
    })
    .catch(err => {
        console.error('Fucked up while connecting to the database: ' + err)
        process.exit();
    })