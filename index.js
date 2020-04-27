const io = require('@pm2/io')
io.init({
    transactions: true, // will enable the transaction tracing
    http: true // will enable metrics about the http server (optional)
})

const express = require('express');
const bodyParser = require('body-parser')
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const cors = require('cors')
const compression = require('compression');
const helmet = require('helmet');
const hpp = require('hpp');
const authRouter = require('./router/auth')
const appRouter = require('./router/app.js')
const apiRouter = require('./router/api.js')
const middleware = require("./middleware/middleware")

const session = require('express-session')
const MongoStore = require('connect-mongo')(session);
let mongoose = require('mongoose');
require('./database/database').connect()

var mongoStore = new MongoStore({
    mongooseConnection: mongoose.connection,
    collection: 'sessions'
});

app.use(session({
    secret: process.env.KEY,
    name: "msuid",
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 48 * 60 * 60 * 1000,
        sameSite: "lax"
    },
    store: mongoStore
}));

app.listen(process.env.PORT, () => console.log('listening on port ' + process.env.PORT));
app.use(express.static('public'));
app.use(express.json({ limit: '2mb' }));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(hpp());
app.use(compression());
app.use(helmet());
app.use(helmet.hidePoweredBy({setTo: 'Nokia 3310'}));
app.use((req, res, next) => {
    res.append('marco', 'polo');
    res.append('answer', '42');
    res.append('x-han', 'Shot first!');
    next();
});
app.use(middleware.log())
app.use(authRouter)
app.use(appRouter)
app.use(apiRouter)
app.set('trust proxy', 1);
//app.disable('x-powered-by')

var corsOptions = {
    origin: 'https://' + process.env.DOMAIN,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

console.log("Ready")

process.on('unhandledRejection', (reason, p) => {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});
process.on('uncaughtException', (error) => {
    console.log('Shit hit the fan (uncaughtException): ', error);
    //process.exit(1);
})

app.get('/test', (request, response) => {
    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log('Got a test request from: ' + ip);
    response.json({
        status: '200',
        response: "GET request successfull"
    });
});

app.post('/test', (request, response) => {
    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log('Got a test request from: ' + ip);
    response.json({
        status: '200',
        response: "POST request successfull"
    });
});

app.use(function(req, res, next) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    var time = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
    console.log(time + " " + req.method + " " + req.originalUrl + ' request from: ' + ip + " -> 404");
    res.status(404);
    // respond with html page
    // respond with json
    if (req.accepts('json')) {
        res.send({ status: 404, response: 'Not found' });
        return;
    }
    // default to plain-text. send()
    res.type('txt').send('Not found');
});
