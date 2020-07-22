const express = require('express')
const generate = require('nanoid/generate')
const fileUpload = require('express-fileupload');
const request = require('request');
const _ = require('lodash');
const path = require('path');
const ejs = require("ejs");
const pdf = require("html-pdf");
const rateLimit = require("express-rate-limit");
const isObjectIdValid = require("../utils/isObjectIdValid");
const middleware = require("../middleware/middleware");
const statusCodes = require("../utils/status");
const log = require("../utils/log");
const router = express.Router();
const mongoose = require('mongoose');

const Exercise = require('../models/exercise');
const User = require('../models/user');
const Invite = require("../models/invite");
const Class = require("../models/class");
const School = require("../models/school");
const Solution = require("../models/solution");
const Meeting = require("../models/meeting");

router.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 52428800 }
}));

const limitApi = rateLimit({
    windowMs: 60 * 60 * 1000, //1 hour time frame
    max: 100, //Number of requests in time frame  8 Anfragen in 5 Minuten
    handler: function(req, res, /*next*/ ) {
        log.info(req.ip + " has exceeded rate limit")
        res.status(statusCodes.TOO_MANY_REQUESTS).send({
            status: statusCodes.TOO_MANY_REQUESTS,
            type: 'error',
            response: "rate limit ueberschritten",
            error: {
                text: 'rate limit ueberschritten',
                limit: req.rateLimit.limit,
                current: req.rateLimit.current,
                remaining: req.rateLimit.remaining,
                resetTime: req.rateLimit.resetTime
            }
        });
    },
    headers: true
});

const apiKey = process.env.API_KEY

router.get('/api/v1/status', async(req, res) => {
    const url = "https://zgk.statuspage.io/api/v2/summary.json"
    request(url, (err, response, body) => {
        if (err) {
            log.fatal(err);
            return middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
        }
        middleware.sendResult(res, JSON.parse(body), statusCodes.OK);
    });
})

router.post('/api/v1/create/school', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == 'Start$') {
            const name = req.body.name;
            const query = {
                _id: new mongoose.Types.ObjectId(),
                name: name,
                createdAt: new Date(),
            }
            try {
                const school = new School(query)
                school.save(async function(err, doc) {
                    if (err) {
                        log.fatal(err);
                        middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                    } else {
                        log.info("School created: " + doc.name + " ID: " + doc._id)
                        middleware.sendResult(res, doc, statusCodes.OK);
                    }
                })
            } catch (err) {
                log.fatal(err)
                middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
            }
        } else {
            middleware.sendResult(res, "nicht autorisiert", statusCodes.UNAUTHORIZED);
        }
    } else {
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
})

router.post('/api/v1/create/class', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == 'Start$') {
            const name = req.body.name;
            const school = await School.findOne({ _id: req.body.school });
            if (!school) {
                log.warn("school not found")
                return middleware.sendResult(res, "not found", statusCodes.NOT_FOUND);
            }
            const query = {
                _id: new mongoose.Types.ObjectId(),
                name: name,
                school: school._id,
                createdAt: new Date(),
            }
            try {
                const newClass = new Class(query)
                newClass.save(async function(err, doc) {
                    if (err) {
                        log.fatal(err)
                        middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                    } else {
                        school.classes.push(doc._id)
                        school.save(async function(err, doc) {
                            if (err) {
                                log.fatal(err)
                                middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                            } else {
                                log.info("Class created: " + newClass.name + " ID: " + newClass._id);
                                middleware.sendResult(res, newClass, statusCodes.OK);
                            }
                        })
                    }
                })
            } catch (err) {
                log.info(err)
                middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
            }
        } else {
            middleware.sendResult(res, "nicht autorisiert", statusCodes.UNAUTHORIZED);
        }
    } else {
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
})

router.post('/api/v1/add/admin', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == 'Start$') {
            const user = await User.findOne({ _id: req.body.user });
            if (!user) {
                log.warn("user not found")
                return middleware.sendResult(res, "user not found", statusCodes.NOT_FOUND);
            }
            const school = await School.findOne({ _id: req.body.school });
            if (!school) {
                log.warn("school not found")
                return middleware.sendResult(res, "school not found", statusCodes.NOT_FOUND);
            }
            school.admins.push(user._id)
            school.save(async function(err, doc) {
                if (err) {
                    log.fatal(err)
                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                } else {
                    log.info("Admin added: " + user._id + " to: " + doc._id)
                    middleware.sendResult(res, doc, statusCodes.OK);
                }
            })
        } else {
            middleware.sendResult(res, "nicht autorisiert", statusCodes.UNAUTHORIZED);
        }
    } else {
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
})

router.post('/api/v1/create/invite', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == 'Start$') {
            const sendClass = await Class.findOne({ _id: req.body.class });
            if (!sendClass) {
                log.warn("class not found");
                return middleware.sendResult(res, "class not found", statusCodes.NOT_FOUND);
            }
            const role = req.body.role;
            let roleString;
            switch (role) {
                case 'admin':
                    roleString = 'Admin';
                    break;
                case 'teacher':
                case 'lehrer':
                    roleString = 'Lehrer';
                    break;
                default:
                    roleString = 'Schüler';
            }
            const name = (req.body.name != undefined) ? req.body.name : (sendClass.name + " " + roleString + " Invite Link");
            const token = generate('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 32);
            const inviteUrl = 'https://zgk.mxis.ch/register?token=' + token;
            const used = {
                active: true,
                count: 0,
                max: req.body.max
            }
            const query = {
                _id: new mongoose.Types.ObjectId(),
                name: name,
                used: used,
                class: sendClass._id,
                school: sendClass.school, //OR sendClass.school._id dunno yet
                role: role,
                token: token,
                inviteUrl: inviteUrl,
                createdAt: new Date(),
            }
            try {
                const invite = new Invite(query)
                invite.save(async function(err, doc) {
                    if (err) {
                        log.fatal(err)
                        middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                    } else {
                        sendClass.invites.push(doc._id)
                        sendClass.save(async function(err, doc) {
                            if (err) {
                                log.fatal(err)
                                middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                            } else {
                                log.info("Invite created: " + invite.token + " with role: " + invite.role)
                                middleware.sendResult(res, {
                                    _id: invite._id,
                                    name: invite.name,
                                    token: invite.token,
                                    role: invite.role,
                                    type: invite.type,
                                    class: invite.class,
                                    school: invite.school,
                                    used: invite.used,
                                    max: invite.max,
                                    inviteUrl: invite.inviteUrl
                                }, statusCodes.OK);
                            }
                        })
                    }
                })
            } catch (err) {
                log.fatal(err)
                middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
            }
        } else {
            middleware.sendResult(res, "nicht autorisiert", statusCodes.UNAUTHORIZED);
        }
    } else {
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
})

router.get('/api/v1/get/invites', limitApi, async(req, res) => {
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            try {
                let invite;
                if (req.query.id != undefined) {
                    invite = await Invite.find({ _id: req.query.id })
                } else if (req.query.token != undefined) {
                    invite = await Invite.find({ token: req.query.token })
                } else if (req.query.klasse != undefined) {
                    invite = await Invite.find({ class: req.query.class })
                } else if (req.query.role != undefined) {
                    invite = await Invite.find({ role: req.query.role })
                } else if (req.query.type != undefined) {
                    invite = await Invite.find({ type: req.query.type })
                } else if (req.query.name != undefined) {
                    invite = await Invite.find({ name: req.query.name })
                } else {
                    invite = await Invite.find()
                }
                let data = []
                for (i in invite) {
                    data.push({
                        _id: invite[i]._id,
                        name: invite[i].name,
                        token: invite[i].token,
                        role: invite[i].role,
                        type: invite[i].type,
                        class: invite[i].class,
                        used: invite[i].used.count,
                        active: invite[i].used.active,
                        max: invite[i].used.max,
                        inviteUrl: invite[i].inviteUrl
                    })
                }
                middleware.sendResult(res, data, statusCodes.OK);
            } catch (err) {
                if (err.code == 405) {
                    log.warn("Invite not found");
                    middleware.sendResult(res, "invite not found", statusCodes.NOT_FOUND);
                } else {
                    log.fatal(err)
                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                }
            }
        } else {
            middleware.sendResult(res, "nicht autorisert", statusCodes.UNAUTHORIZED);
        }
    } else {
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
})

router.get('/api/v1/download/:code', limitApi, middleware.auth(), async(req, res) => {
    try {
        const code = req.params.code.split(".")[0];
        if (isObjectIdValid(code)) {
            const aufgabe = await Exercise.findOne({ _id: code })
            if (!aufgabe) {
                log.warn("File not found")
                return res.render('error.ejs', { code: statusCodes.NOT_FOUND, short: "Datei nicht gefunden", message: "Diese Aufgabe existiert nicht (mehr)", redirectLink: "/dashboard", redirectText: "Zum Dashboard" })
            }
            const count = await Exercise.increaseDownloads(aufgabe._id, req.session)
            log.info("Sending file: " + aufgabe.files.fileName + '.' + aufgabe.files.type + " - downloaded " + count + " times so far")
            res.download(path.join(__dirname, '../files/', aufgabe._id + '.' + aufgabe.files.type), aufgabe.files.fileName + '.' + aufgabe.files.type);
        } else {
            log.warn("not a valid ObjectID: " + code)
            res.render('error.ejs', { code: statusCodes.NOT_FOUND, short: "Datei nicht gefunden", message: "Diese Aufgabe existiert nicht (mehr)", redirectLink: "/dashboard", redirectText: "Zum Dashboard" })
        }
    } catch (error) {
        if (error.code == 405) {
            log.warn("File not found")
            res.render('error.ejs', { code: statusCodes.NOT_FOUND, short: "Datei nicht gefunden", message: "Diese Aufgabe existiert nicht (mehr)", redirectLink: "/dashboard", redirectText: "Zum Dashboard" })
        } else {
            log.fatal(error)
            res.render('error.ejs', { code: statusCodes.NOT_FOUND, short: "Datei nicht gefunden", message: "Diese Aufgabe existiert nicht (mehr)", redirectLink: "/dashboard", redirectText: "Zum Dashboard" })
        }
    }
});

router.get('/api/v1/solution/download', limitApi, middleware.auth(), async(req, res) => {
    try {
        log.info(req.session.name + " is getting solutions: " + req.query.id)
        const solution = await Solution.findOne({ _id: req.query.id }).populate('user', 'name')
        if (!solution) {
            log.warn("Fehler: Solution existiert nicht")
            return res.render('error.ejs', { code: statusCodes.NOT_FOUND, short: "Datei nicht gefunden", message: "Diese Datei existiert nicht (mehr)", redirectLink: "/dashboard", redirectText: "Zum Dashboard" })
        }
        if (solution.access.includes(req.session._id) || req.session.role == "admin") {
            log.info("Sending file: " + solution._id)
            if (solution.file.multiple) {
                res.download(path.join(__dirname, '../files/solutions/' + solution._id + ".zip"), solution.user.name.replace(/\s+/g, '') + '.zip');
            } else {
                res.download(path.join(__dirname, '../files/solutions/' + solution._id + "/" + solution.versions[0].files.fileName + "." + solution.file.type), solution.user.name.replace(/\s+/g, '') + '.' + solution.file.type);
            }
        } else {
            log.warn("Fehler: " + req.session.name + " nicht der Inhaber von: " + solution._id)
            return res.render('error.ejs', { code: statusCodes.FORBIDDEN, short: "Nicht Autorisiert", message: "Du hast besitzt nicht die erforderlichen Rechte um diese Datei herunterzuladen", redirectLink: "/dashboard", redirectText: "Zum Dashboard" })
        }
    } catch (error) {
        if (error.code == 405) {
            log.warn("Fehler: Datei existiert nicht")
            res.render('error.ejs', { code: statusCodes.NOT_FOUND, short: "Datei nicht gefunden", message: "Diese Datei existiert nicht (mehr)", redirectLink: "/dashboard", redirectText: "Zum Dashboard" })
        } else {
            log.fatal(error)
            res.render('error.ejs', { code: statusCodes.SERVER_ERROR, short: "Fehler", message: "Es ist ein Fehler aufgetreten, bitte versuche es erneut", redirectLink: "/dashboard", redirectText: "Zum Dashboard" })
        }
    }
});

router.post('/api/v1/change/user', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey === apiKey) {
            try {
                let user;
                if (req.body.user_id != undefined) {
                    user = await User.findOne({ _id: req.body.user_id })
                } else if (req.body.email != undefined) {
                    user = await User.findByOneEmail(req.body.email)
                } else {
                    log.warn("fields missing");
                    middleware.sendResult(res, "error", statusCodes.BAD_REQUEST);
                }
                log.info(user)
                if (req.body.role != undefined) {
                    user.role = req.body.role
                }
                if (req.body.klassen != undefined) {
                    user.klassen = req.body.klassen
                }
                user.save(function(err) {
                    if (err) {
                        log.fatal(err);
                        middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                    }
                });
                middleware.sendResult(res, "success", statusCodes.OK);
            } catch (err) {
                if (err.code == 405) {
                    log.warn("user not found")
                    middleware.sendResult(res, "user not found", statusCodes.NOT_FOUND);
                } else {
                    log.fatal(err)
                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                }
            }
        } else {
            middleware.sendResult(res, "nicht autorisert", statusCodes.UNAUTHORIZED);
        }
    } else {
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
});

router.get('/api/v1/get/aufgabe', limitApi, async(req, res) => {
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            try {
                if (!(req.query.new !== undefined && req.query.new.toLowerCase() === "true" && middleware.getIsNew() === false)) {
                    let exercises;
                    if (req.query.id != undefined) {
                        exercises = await Exercise.find({ _id: req.query.id }).populate('class school', 'name')
                    } else if (req.query.user != undefined) {
                        exercises = await Exercise.find({ user: req.query.user }).populate('class school', 'name')
                    } else if (req.query.klasse != undefined) {
                        exercises = await Exercise.find({ class: req.query.class }).populate('class school', 'name')
                    } else if (req.query.abgabe != undefined) {
                        exercises = await Exercise.find({ deadline: req.query.deadline }).populate('class school', 'name')
                    } else {
                        exercises = await Exercise.find().populate('class school', 'name')
                    }
                    let data = []
                    for (i in exercises) {
                        data.push({
                            _id: exercises[i]._id, //Update Bot API to use new key names
                            user: exercises[i].user,
                            text: exercises[i].text,
                            subject: exercises[i].subject,
                            class: exercises[i].class,
                            school: exercises[i].school,
                            deadline: exercises[i].deadline,
                            createdAt: exercises[i].createdAt,
                            downloads: exercises[i].downloads,
                            files: exercises[i].files
                        })
                    }
                    middleware.setIsNew(false)
                    middleware.sendResult(res, data, statusCodes.OK);
                } else {
                    middleware.sendResult(res, "keine neuen exercises", 204);
                }
            } catch (err) {
                if (err.code == 405) {
                    log.warn("Exercise not found");
                    middleware.sendResult(res, "exercise not found", statusCodes.NOT_FOUND);
                } else {
                    log.fatal(err);
                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                }
            }
        } else {
            middleware.sendResult(res, "nicht autorisiert", statusCodes.UNAUTHORIZED);
        }
    } else {
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
});

router.get('/api/v1/get/user', limitApi, async(req, res) => {
    log.info(req.query)
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            try {
                let user;
                if (req.query.id != undefined) {
                    user = await User.find({ _id: req.query.id }).populate('classes school', 'name')
                } else if (req.query.klasse != undefined) {
                    user = await User.find({ class: req.query.class }).populate('classes school', 'name')
                } else if (req.query.email != undefined) {
                    user = await User.findByEmail(req.query.email)
                } else if (req.query.role != undefined) {
                    user = await User.find({ role: req.query.role }).populate('classes school', 'name')
                } else {
                    user = await User.find().populate('classes school', 'name')
                }
                let data = []
                for (i in user) {
                    data.push({
                        _id: user[i]._id,
                        name: user[i].name,
                        email: user[i].email,
                        classes: user[i].classes,
                        school: user[i].school,
                        role: user[i].role,
                        registeredAt: user[i].registeredAt
                    })
                }
                log.info(data)
                middleware.sendResult(res, data, statusCodes.OK);
            } catch (err) {
                if (err.code == 405) {
                    log.warn("User not found");
                    middleware.sendResult(res, "user nicht gefunden", statusCodes.NOT_FOUND);
                } else {
                    log.fatal(err);
                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                }
            }
        } else {
            log.warn("not authorized");
            middleware.sendResult(res, "nicht autorisiert", statusCodes.UNAUTHORIZED);
        }
    } else {
        log.warn("no api key sent")
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
});

router.get('/api/v1/get/meetings', limitApi, async(req, res) => {
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            try {
                let meeting;
                if (req.query.id != undefined) {
                    meeting = await Meeting.find({ _id: req.query.id }).populate('class school', 'name').sort({ date: 'asc' })
                } else if (req.query.klasse != undefined) {
                    meeting = await Meeting.find({ class: req.query.class }).populate('class school', 'name').sort({ date: 'asc' })
                } else if (req.query.subject != undefined) {
                    meeting = await Meeting.find({ subject: req.query.subject }).populate('class school', 'name').sort({ date: 'asc' })
                } else if (req.query.date != undefined) {
                    meeting = await Meeting.find({ date: req.query.date }).populate('class school', 'name').sort({ date: 'asc' })
                } else {
                    meeting = await Meeting.find().populate('class school', 'name').sort({ date: 'asc' })
                }
                let data = []
                for (i in meeting) {
                    data.push({
                        _id: meeting[i]._id,
                        user: meeting[i].user,
                        class: meeting[i].class,
                        school: meeting[i].school,
                        subject: meeting[i].subject,
                        date: meeting[i].date,
                        createdAt: meeting[i].createdAt
                    })
                }
                middleware.sendResult(res, data, statusCodes.OK);
            } catch (err) {
                if (err.code == 405) {
                    log.warn("Meeting not found");
                    middleware.sendResult(res, "meeting not found", statusCodes.NOT_FOUND);
                } else {
                    log.fatal(err);
                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                }
            }
        } else {
            log.warn("not authorized")
            middleware.sendResult(res, "nicht autorisert", statusCodes.UNAUTHORIZED);
        }
    } else {
        log.warn("no api key sent")
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
});

router.get('/t/:token', limitApi, async(req, res) => {
    try {
        const user = await User.findOne({ botKey: req.params.token });
        if (!user) {
            log.warn("no user with botkey: " + req.params.token);
            return middleware.sendResult(res, "user not found", statusCodes.NOT_FOUND);
        }
        log.info("User: " + user.name + " is redirected to t.me with code: " + user.botKey);
        res.redirect("https://t.me/zgkmsgbot?startgroup=" + user.botKey);
    } catch (err) {
        log.fatal(err);
        middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
    }
})

router.get('/api/v1/verify', limitApi, async(req, res) => {
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            if (req.query.email) {
                try {
                    const user = await User.findByOneEmail(req.query.email);
                    const botKey = await User.generateBotKey(user._id);
                    log.info("Verifying User: " + user.name + " with code: " + botKey)
                    middleware.sendResult(res, {
                        code: botKey,
                        user: user._id
                    }, statusCodes.OK);
                } catch (err) {
                    if (err.code == 405) {
                        log.warn("User not found");
                        middleware.sendResult(res, "user not found", statusCodes.NOT_FOUND);
                    } else {
                        log.fatal(err);
                        middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                    }
                }
            } else if (req.query.token) {
                try {
                    const user = await User.findOne({ botKey: req.query.token }).populate('classes school', 'name')
                    if (!user) {
                        log.warn("no user with botkey: " + req.query.token)
                        return middleware.sendResult(res, "user not found", statusCodes.NOT_FOUND);
                    }
                    log.info("User: " + user.name + " used t.me link to add bot with code: " + user.botKey);
                    middleware.sendResult(res, {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        classes: user.classes,
                        school: user.school,
                        role: user.role,
                        botKey: user.botKey,
                        registeredAt: user.registeredAt
                    }, statusCodes.OK);
                } catch (err) {
                    log.fatal(err);
                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                }
            } else {
                middleware.sendResult(res, "parameter missing", statusCodes.BAD_REQUEST);
            }
        } else {
            middleware.sendResult(res, "nicht autorisert", statusCodes.UNAUTHORIZED);
        }
    } else {
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
});

router.post('/api/v1/delete/aufgabe', limitApi, middleware.auth(), async(req, res) => {
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            try {
                const aufgabe = await Exercise.findOne({ _id: req.query.id })
                if (!aufgabe) {
                    log.warn("exercise not found");
                    return middleware.sendResult(res, "exercise not found", statusCodes.NOT_FOUND);
                }
                await aufgabe.deleteOne({ _id: aufgabe._id })
                    .then(doc => {
                        log.info("Exercise: " + aufgabe._id + " was deleted by API")
                        middleware.resetCache(doc.class);
                        middleware.sendResult(res, "success", statusCodes.OK);
                    })
                    .catch(err => {
                        log.fatal(err);
                        middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                    })
            } catch (err) {
                log.info(err);
                middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
            }
        } else {
            middleware.sendResult(res, "nicht autorisert", statusCodes.UNAUTHORIZED);
        }
    } else {
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
});

router.get("/api/v1/generate/pdf", limitApi, middleware.auth({ lehrer: true }), async(req, res) => {
    const id = req.query.id;
    log.info("Generating PDF for Exercise: " + req.query.id)
    const exercise = await Exercise.findOne({ _id: id }).populate({
        path: 'class',
        select: 'name users',
        populate: {
            path: 'users',
            select: 'name role solutions',
            populate: {
                path: 'solutions',
                select: 'file createdAt',
                match: { exercise: id }
            }
        }
    })
    let students = []
    for (i in exercise.class.users) {
        if (exercise.class.users[i].role == "user") {
            if (exercise.class.users[i].solutions.length >= 1) {
                let datum = new Date(exercise.class.users[i].solutions[0].createdAt)
                datum = ("0" + datum.getDate()).slice(-2) + "." + ("0" + (datum.getMonth() + 1)).slice(-2) + "." + datum.getFullYear() + ", " + ("0" + datum.getHours()).slice(-2) + ":" + ("0" + datum.getMinutes()).slice(-2);
                students.push({
                    name: exercise.class.users[i].name,
                    datum: datum,
                    link: "https://zgk.mxis.ch/api/v1/solution/download?id=" + exercise.class.users[i].solutions[0]._id,
                    status: "ja"
                })
            } else {
                students.push({
                    name: exercise.class.users[i].name,
                    datum: "-",
                    link: 0,
                    status: "nein"
                })
            }
        }
    }
    let abgabe = new Date(exercise.deadline)
    abgabe = ("0" + abgabe.getDate()).slice(-2) + "." + ("0" + (abgabe.getMonth() + 1)).slice(-2) + "." + abgabe.getFullYear();
    let today = new Date()
    today = ("0" + today.getDate()).slice(-2) + "." + ("0" + (today.getMonth() + 1)).slice(-2) + "." + today.getFullYear() + ", " + ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2);
    ejs.renderFile(path.join(__dirname, '../views/', "pdfTemplate.ejs"), { link: "https://zgk.mxis.ch/aufgabe?id=" + exercise._id, createdAt: today, fach: exercise.subject, text: exercise.text, abgabe: abgabe, klasse: String(exercise.class.name), students: students }, (err, data) => {
        if (err) {
            log.fatal(err);
            res.status(statusCodes.SERVER_ERROR).send("error");
        } else {
            const options = {
                "height": "11.25in",
                "width": "8.5in",
                "header": {
                    "height": "20mm"
                },
                "footer": {
                    "height": "20mm",
                },
            };
            pdf.create(data, options).toStream(function(err, stream) {
                if (err) {
                    log.fatal(err);
                    res.status(statusCodes.SERVER_ERROR).send("error");
                } else {
                    res.setHeader("content-type", "application/pdf");
                    res.setHeader("Content-Disposition", `attachment; filename=${exercise.subject}-${exercise.class.name}.pdf`)
                    stream.pipe(res);
                }
            });
        }
    });
})

router.post('/api/v1/add/users/', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == "Start$") {
            log.info("Parsing users...")
            try {
                const uClass = await Class.findOne({ _id: req.body.class })
                let users = []
                let ids = []
                for (i in req.body.data) {
                    const user = req.body.data[i];
                    const nUser = {
                        _id: new mongoose.Types.ObjectId(),
                        email: user.email,
                        name: user.name,
                        classes: [uClass._id],
                        school: req.body.school,
                        password: user.password,
                        registeredAt: new Date(user.registeredAt),
                        botKey: user.botKey,
                        invite: req.body.invite,
                        role: user.role
                    };
                    users.push(nUser);
                    ids.push(nUser._id)
                }
                log.info("Saving...");
                User.insertMany(users)
                    .then(function(docs) {
                        log.info("done")
                        uClass.users = ids;
                        uClass.save(function(err) {
                            if (err) {
                                log.fatal(err);
                                return middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                            }
                            log.info("Users added to class " + uClass.name);
                            middleware.sendResult(res, docs, statusCodes.OK);
                        });
                    })
                    .catch(function(err) {
                        log.fatal(err);
                        middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                    });
            } catch (err) {
                if (err.code == 405) {
                    log.warn("user not found");
                    middleware.sendResult(res, "user not found", statusCodes.NOT_FOUND);
                } else {
                    log.fatal(err);
                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                }
            }
        } else {
            middleware.sendResult(res, "nicht autorisert", statusCodes.UNAUTHORIZED);
        }
    } else {
        middleware.sendResult(res, "kein API key gesendet", statusCodes.BAD_REQUEST);
    }
});

module.exports = router