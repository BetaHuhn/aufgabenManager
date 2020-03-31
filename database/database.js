let mongoose = require('mongoose');
var password = require('../key.json').db

const server = '127.0.0.1:27017';
const database = 'zgkDev'; // REPLACE WITH MongDB DB NAME
const options = {
    user:"zgk",
    pass: password,
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    useNewUrlParser: true,
    useUnifiedTopology: true
};

mongoose.connect(`mongodb://${server}/${database}?authSource=zgkDev`, options, )
    .then(() => {
        console.log('Database connection successfull: ' + database)
    })
    .catch(err => {
        console.error('Fucked up while connecting to the database: ' + err)
        process.exit();
    })

mongoose.connection.on('error', err => {
    console.error(err);
});
