const express = require('express')
const generate = require('nanoid/generate')
const fileUpload = require('express-fileupload');
const request = require('request');
const _ = require('lodash');
const path = require('path');
const ejs = require("ejs");
const pdf = require("html-pdf");
const rateLimit = require("express-rate-limit");
const CurrentDate = require("../utils/currentDate")
const isObjectIdValid = require("../utils/isObjectIdValid")
const middleware = require("../middleware/middleware")
const router = express.Router()

const mongoose = require('mongoose')
const Exercise = require('../models/exercise')
const User = require('../models/user')
const Invite = require("../models/invite")
const Class = require("../models/class")
const School = require("../models/school")
const Solution = require("../models/solution")
const Meeting = require("../models/meeting");

router.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 52428800 }
}));

const limitApi = rateLimit({
    windowMs: 60 * 60 * 1000, //1 hour time frame
    max: 100, //Number of requests in time frame  8 Anfragen in 5 Minuten
    handler: function(req, res, /*next*/ ) {
        console.log(req.ip + " has exceeded rate limit")
        res.status(429).send({
            status: 429,
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
            console.log(err)
            res.status(500).json({
                status: 500,
                response: "error"
            })
        }
        res.json({
            status: 200,
            response: "success",
            data: JSON.parse(body)
        })
    });
})

router.post('/api/v1/create/school', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == 'Start$') {
            const name = req.body.name;
            const query = {
                _id: new mongoose.Types.ObjectId(),
                name: name,
                createdAt: CurrentDate(),
            }
            try {
                const school = new School(query)
                school.save(async function(err, doc) {
                    if (err) {
                        console.error(err)
                        res.json({
                            status: '400'
                        });
                    } else {
                        console.log("School created: " + doc.name + " ID: " + doc._id)
                        res.json({
                            status: '200',
                            response: "success",
                            data: doc
                        });
                    }
                })
            } catch (error) {
                console.log(error)
                res.json({
                    status: '400'
                });
            }
        } else {
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
})

router.post('/api/v1/create/class', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == 'Start$') {
            const name = req.body.name;
            const school = await School.findOne({ _id: req.body.school });
            if (!school) {
                return res.json({ status: 404, response: "school not found" })
            }
            const query = {
                _id: new mongoose.Types.ObjectId(),
                name: name,
                school: school._id,
                createdAt: CurrentDate(),
            }
            try {
                const newClass = new Class(query)
                newClass.save(async function(err, doc) {
                    if (err) {
                        console.error(err)
                        res.json({
                            status: '400'
                        });
                    } else {
                        school.classes.push(doc._id)
                        school.save(async function(err, doc) {
                            if (err) {
                                console.error(err)
                                res.json({
                                    status: '400'
                                });
                            } else {
                                console.log("Class created: " + newClass.name + " ID: " + newClass._id)
                                res.json({
                                    status: '200',
                                    response: "success",
                                    data: newClass
                                });
                            }
                        })
                    }
                })
            } catch (error) {
                console.log(error)
                res.json({
                    status: '400'
                });
            }
        } else {
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
})

router.post('/api/v1/add/admin', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == 'Start$') {
            const user = await User.findOne({ _id: req.body.user });
            if (!user) {
                return res.json({ status: 404, response: "user not found" })
            }
            const school = await School.findOne({ _id: req.body.school });
            if (!school) {
                return res.json({ status: 404, response: "school not found" })
            }
            school.admins.push(user._id)
            school.save(async function(err, doc) {
                if (err) {
                    console.error(err)
                    res.json({
                        status: '400'
                    });
                } else {
                    console.log("Admin added: " + user._id + " to: " + doc._id)
                    res.json({
                        status: '200',
                        response: "success",
                        data: doc
                    });
                }
            })
        } else {
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
})

router.post('/api/v1/create/invite', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == 'Start$') {
            const sendClass = await Class.findOne({ _id: req.body.class });
            if (!sendClass) {
                return res.json({ status: 404, response: "class not found" })
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
            console.log(name)
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
                createdAt: CurrentDate(),
            }
            try {
                const invite = new Invite(query)
                invite.save(async function(err, doc) {
                    if (err) {
                        console.error(err)
                        res.json({
                            status: '400'
                        });
                    } else {
                        sendClass.invites.push(doc._id)
                        sendClass.save(async function(err, doc) {
                            if (err) {
                                console.error(err)
                                res.json({
                                    status: '400'
                                });
                            } else {
                                console.log("Invite created: " + invite.token + " with role: " + invite.role)
                                res.json({
                                    status: '200',
                                    response: "invite created",
                                    data: {
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
                                    }
                                });
                            }
                        })
                    }
                })
            } catch (error) {
                console.log(error)
                res.json({
                    status: '400'
                });
            }
        } else {
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
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
                res.json({
                    status: 200,
                    response: 'success',
                    type: 'data',
                    data: data
                })
            } catch (error) {
                if (error.code == 405) {
                    console.log("Invite not found")
                    res.json({ status: 404, response: "Invite nicht gefunden" })
                } else {
                    console.log(error)
                    res.json({ status: 500, response: "internal error bitte kontaktiere den support" })
                }
            }
        } else {
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
})

router.get('/api/v1/download/:code', limitApi, middleware.auth(), async(req, res) => {
    try {
        const code = req.params.code.split(".")[0];
        if (isObjectIdValid(code)) {
            const aufgabe = await Exercise.findOne({ _id: code })
            if (!aufgabe) {
                console.log("File not found")
                return res.sendStatus(404);
            }
            const count = await Exercise.increaseDownloads(aufgabe._id, req.session)
            console.log("Sending file: " + aufgabe.files.fileName + '.' + aufgabe.files.type + " - downloaded " + count + " times so far")
            res.download(path.join(__dirname, '../files/', aufgabe._id + '.' + aufgabe.files.type), aufgabe.files.fileName + '.' + aufgabe.files.type);
        } else {
            console.log("not a valid ObjectID: " + code)
            res.sendStatus(404);
        }
    } catch (error) {
        if (error.code == 405) {
            console.log("File not found")
            res.sendStatus(404);
        } else {
            console.log(error)
            res.sendStatus(404);
        }
    }
});

router.get('/api/v1/solution/download', limitApi, middleware.auth(), async(req, res) => {
    try {
        console.log(req.session.name + " is getting solutions: " + req.query.id)
        const solution = await Solution.findOne({ _id: req.query.id }).populate('user', 'name')
        if (!solution) {
            console.log("Fehler: Solution existiert nicht")
            return res.sendStatus(404);
        }
        if (solution.access.includes(req.session._id) || req.session.role == "admin") {
            console.log("Sending file: " + solution._id)
            if (solution.file.multiple) {
                res.download(path.join(__dirname, '../files/solutions/' + solution._id + ".zip"), solution.user.name.replace(/\s+/g, '') + '.zip');
            } else {
                res.download(path.join(__dirname, '../files/solutions/' + solution._id + "/" + solution.versions[0].files.fileName + "." + solution.file.type), solution.user.name.replace(/\s+/g, '') + '.' + solution.file.type);
            }
        } else {
            console.log("Fehler: " + req.session.name + " nicht der Inhaber von: " + solution._id)
            return res.sendStatus(404);
        }
    } catch (error) {
        if (error.code == 405) {
            console.log("Fehler: Datei existiert nicht")
            res.sendStatus(404);
        } else {
            console.log(error)
            res.sendStatus(404);
        }
    }
});

router.post('/api/v1/change/user', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey) {
            try {
                let user;
                if (req.body.user_id != undefined) {
                    user = await User.findOne({ _id: req.body.user_id })
                } else if (req.body.email != undefined) {
                    user = await User.findByOneEmail(req.body.email)
                } else {
                    return res.json({ status: 400, response: "error" })
                }
                console.log(user)
                if (req.body.role != undefined) {
                    user.role = req.body.role
                }
                if (req.body.klassen != undefined) {
                    user.klassen = req.body.klassen
                }
                user.save(function(err) {
                    if (err) {
                        console.error(err);
                    }
                });
                res.json({
                    status: 200,
                    response: "success"
                })
            } catch (error) {
                if (error.code == 405) {
                    console.log("user not found")
                    res.json({ status: 404, response: "user not found" })
                } else {
                    console.log(error)
                    res.json({ status: 400, response: "error" })
                }
            }
        } else {
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.get('/api/v1/get/aufgabe', limitApi, async(req, res) => {
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            try {
                let run = true;
                if (req.query.new != undefined) {
                    if (req.query.new.toLowerCase() === "true" && middleware.getIsNew() == false) {
                        let run = false;
                    }
                }
                if (run) {
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
                    res.json({
                        status: 200,
                        response: 'success',
                        type: 'data',
                        data: data
                    })
                } else {
                    res.json({
                        status: 204, //No new content
                        response: "keine neuen exercises"
                    })
                }
            } catch (error) {
                if (error.code == 405) {
                    console.log("Exercise not found")
                    res.json({ status: 404, response: "aufgabe nicht gefunden" })
                } else {
                    console.log(error)
                    res.json({ status: 500, response: "internal error bitte kontaktiere den support" })
                }
            }
        } else {
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.get('/api/v1/get/user', limitApi, async(req, res) => {
    console.log(req.query)
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
                console.log("Sending user")
                console.log(data)
                res.json({
                    status: 200,
                    response: 'success',
                    type: 'data',
                    data: data
                })
            } catch (error) {
                if (error.code == 405) {
                    console.log("User not found")
                    res.json({ status: 404, response: "user nicht gefunden" })
                } else {
                    console.log(error)
                    res.json({ status: 500, response: "internal error, bitte kontaktiere support" })
                }
            }
        } else {
            console.log("not authorized")
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        console.log("not api key sent")
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.get('/api/v1/get/meetings', limitApi, async(req, res) => {
    console.log(req.query)
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            try {
                let meeting;
                if (req.query.id != undefined) {
                    meeting = await Meeting.find({ _id: req.query.id }).populate('class school', 'name')
                } else if (req.query.klasse != undefined) {
                    meeting = await Meeting.find({ class: req.query.class }).populate('class school', 'name')
                } else if (req.query.subject != undefined) {
                    meeting = await Meeting.find({ subject: req.query.subject }).populate('class school', 'name')
                } else if (req.query.date != undefined) {
                    meeting = await Meeting.find({ date: req.query.date }).populate('class school', 'name')
                } else {
                    meeting = await Meeting.find().populate('class school', 'name')
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
                console.log("Sending meetings")
                console.log(data)
                res.json({
                    status: 200,
                    response: 'success',
                    type: 'data',
                    data: data
                })
            } catch (error) {
                if (error.code == 405) {
                    console.log("Meeting not found")
                    res.json({ status: 404, response: "meeting nicht gefunden" })
                } else {
                    console.log(error)
                    res.json({ status: 500, response: "internal error, bitte kontaktiere support" })
                }
            }
        } else {
            console.log("not authorized")
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        console.log("not api key sent")
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.get('/t/:token', limitApi, async(req, res) => {
    try {
        const user = await User.findOne({ botKey: req.params.token })
        if (!user) {
            console.log("no user with botkey: " + req.params.token)
            return res.sendStatus(404)
        }
        console.log("User: " + user.name + " is redirected to t.me with code: " + user.botKey)
        res.redirect("https://t.me/zgkmsgbot?startgroup=" + user.botKey)
    } catch (error) {
        console.log(error)
        res.json({ status: 500, response: "internal error, bitte kontaktiere support" })
    }
})

router.get('/api/v1/verify', limitApi, async(req, res) => {
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            if (req.query.email) {
                try {
                    const user = await User.findByOneEmail(req.query.email)
                    try {
                        let botKey = await User.generateBotKey(user._id)
                    } catch (error) {
                        if (error.code == 405) {
                            console.log("User not found - botkey")
                            res.json({ status: 404, response: "user nicht gefunden" })
                        } else {
                            console.log(error)
                            res.json({ status: 500, response: "internal error, bitte kontaktiere support" })
                        }
                    }
                    console.log("Verifying User: " + user.name + " with code: " + botKey)
                    res.json({
                        status: 200,
                        response: 'success',
                        type: 'data',
                        data: {
                            code: botKey,
                            user: user._id
                        }
                    })
                } catch (error) {
                    if (error.code == 405) {
                        console.log("User not found")
                        res.json({ status: 404, response: "user nicht gefunden" })
                    } else {
                        console.log(error)
                        res.json({ status: 500, response: "internal error, bitte kontaktiere support" })
                    }
                }
            } else if (req.query.token) {
                try {
                    const user = await User.findOne({ botKey: req.query.token }).populate('classes school', 'name')
                    if (!user) {
                        console.log("no user with botkey: " + req.query.token)
                        return res.json({
                            status: 404,
                            response: "botkey existiert nicht"
                        })
                    }
                    console.log("User: " + user.name + " used t.me link to add bot with code: " + user.botKey)
                    res.json({
                        status: 200,
                        response: 'success',
                        type: 'data',
                        data: {
                            _id: user._id,
                            name: user.name,
                            email: user.email,
                            classes: user.classes,
                            school: user.school,
                            role: user.role,
                            botKey: user.botKey,
                            registeredAt: user.registeredAt
                        }
                    })
                } catch (error) {
                    console.log(error)
                    res.json({ status: 500, response: "internal error, bitte kontaktiere support" })
                }
            } else {
                res.json({
                    status: '405',
                    response: 'kein parameter gesendet'
                });
            }
        } else {
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.post('/api/v1/delete/aufgabe', limitApi, middleware.auth(), async(req, res) => {
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            try {
                const aufgabe = await Exercise.findOne({ _id: req.query.id })
                if (!aufgabe) {
                    throw ({ error: 'aufgabe not found', code: 405 })
                }
                await aufgabe.deleteOne({ _id: aufgabe._id })
                    .then(doc => {
                        console.log("Exercise: " + aufgabe._id + " was deleted by API")
                        middleware.resetCache(doc.class)
                        res.json({
                            status: 200,
                            response: 'success'
                        })
                    })
                    .catch(err => {
                        console.error(err)
                        res.json({ status: 500, response: "es ist ein fehler aufgetreten" })
                    })
            } catch (error) {
                if (error.code == 405) {
                    console.log("aufgabe not found")
                    res.json({ status: 404, response: "aufgabe nicht gefunden" })
                } else {
                    console.log(error)
                    res.json({ status: 500, response: "es ist ein fehler aufgetreten" })
                }
            }
        } else {
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.get("/api/v1/generate/pdf", limitApi, middleware.auth({ lehrer: true }), async(req, res) => {
    const id = req.query.id;
    console.log("Generating PDF for Exercise: " + req.query.id)
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
            console.log(err);
            res.send("error")
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
            pdf.create(data, options).toFile("report.pdf", function(err, data) {
                if (err) {
                    res.send(err);
                } else {
                    //res.send("File created successfully");
                    res.download(path.join(__dirname, '../report.pdf'), exercise.subject + exercise.class.name + ".pdf");
                }
            });
        }
    });
})

router.post('/api/v1/add/users/', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == "Start$") {
            console.log("Parsing users...")
            try {
                const uClass = await Class.findOne({ _id: req.body.class })
                let users = []
                let ids = []
                for (i in req.body.data) {
                    const user = req.body.data[i];
                    console.log("Creating user: user.name")
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
                console.log("Saving...")
                User.insertMany(users)
                    .then(function(docs) {
                        console.log(docs)
                        console.log("done")
                        uClass.users = ids;
                        uClass.save(function(err) {
                            if (err) {
                                console.error(err);
                                res.json({ status: 400, response: "error" })
                            }
                            console.log("Users added to class " + uClass.name)
                            res.json({ status: 200, response: "success", data: docs });
                        });
                    })
                    .catch(function(err) {
                        console.log(err)
                        res.json({ status: 500 })
                    });
            } catch (error) {
                if (error.code == 405) {
                    console.log("user not found")
                    res.json({ status: 404, response: "user not found" })
                } else {
                    console.log(error)
                    res.json({ status: 400, response: "error" })
                }
            }
        } else {
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    } else {
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

String.prototype.isLowerCase = function() {
    return this.valueOf().toLowerCase() === this.valueOf();
};

module.exports = router