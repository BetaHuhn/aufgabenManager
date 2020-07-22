const io = require('@pm2/io')
io.init({
    transactions: true,
    http: true
})

const express = require('express');
const bodyParser = require('body-parser')
require('dotenv').config();
const app = express();
const cors = require('cors')
const compression = require('compression');
const helmet = require('helmet');
const hpp = require('hpp');
const { routeLog } = require("./middleware/middleware")
const statusCodes = require("./utils/status");
const log = require("./utils/log");
const database = require('./database/database');

const authRouter = require('./router/auth')
const appRouter = require('./router/app.js')
const apiRouter = require('./router/api.js')

const session = require('express-session')
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');

app.use(express.static('public'));
app.use(express.json({ limit: '2mb' }));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(hpp());
app.use(compression());
app.use(helmet());
app.use(helmet.hidePoweredBy({ setTo: 'Nokia 3310' }));
app.use((req, res, next) => {
    res.append('marco', 'polo');
    res.append('answer', '42');
    res.append('x-han', 'Shot first!');
    next();
});
const corsOptions = {
    origin: 'https://' + process.env.DOMAIN,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.set('trust proxy', 1);

/**
 * Connect to database and listen to given port
 */
async function startServer() {
    try {
        database.connect();

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

        app.use(routeLog())
        app.use(authRouter)
        app.use(appRouter)
        app.use(apiRouter)

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => log.success("listening on port " + PORT));
    } catch (err) {
        log.fatal("Server setup failed. Wrong server IP or authentication?");
        log.fatal(err);
        process.exit(1);
    }
}
startServer();

app.use(function(req, res, next) {
    res.status(statusCodes.NOT_FOUND);
    if (req.accepts('json')) {
        res.send({ status: statusCodes.NOT_FOUND, response: 'Not found' });
        return;
    }
    res.type('txt').send('Not found');
});