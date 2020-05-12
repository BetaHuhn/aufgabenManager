const io = require('@pm2/io')
io.init({
    transactions: true, // will enable the transaction tracing
    http: true // will enable metrics about the http server (optional)
})

const express = require('express');
const bodyParser = require('body-parser')
const dotenv = require('dotenv').config();
const app = express();
const cors = require('cors')
const compression = require('compression');
const helmet = require('helmet');
const hpp = require('hpp');
const authRouter = require('./router/auth')
const appRouter = require('./router/app.js')
const apiRouter = require('./router/api.js')
const middleware = require("./middleware/middleware")
const CurrentDate = require("./utils/currentDate")
const { getClientIp } = require('request-ip')

const session = require('express-session')
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
require('./database/database').connect()

const mongoStore = new MongoStore({
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
        maxAge: 7 * 24 * 60 * 60 * 1000, //7 Tage
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

const corsOptions = {
    origin: 'https://' + process.env.DOMAIN,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

process.on('unhandledRejection', (reason, p) => {
    console.error("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});
process.on('uncaughtException', (error) => {
    console.error('Shit hit the fan (uncaughtException): ', error);
    //process.exit(1);
})

app.use(function(req, res, next) {
    const ip = getClientIp(req);
    const time = CurrentDate()
    console.log(`${time} ${req.method} ${req.originalUrl} request from: ${ip} -> 404`)
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
