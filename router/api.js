const express = require('express')
const generate = require('nanoid/generate')
const fs = require('fs');
const fileUpload = require('express-fileupload');
const request = require('request');
const _ = require('lodash');
var path = require('path');
const zipFolder = require('zip-folder');
var ejs = require("ejs");
const rateLimit = require("express-rate-limit");
const Aufgabe = require('../models/aufgabe.js')
const User = require('../models/user.js')
const Invite = require("../models/invite")
const Klasse = require("../models/klasse")
const Solution = require("../models/solution")
const middleware = require("../middleware/middleware")
const router = express.Router()

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
    draft_polli_ratelimit_headers: true,
    headers: true
});

var isNew = true;
var apiKey = require('../key.json').key

async function sendPush(name, klasse, fach, abgabe) {
    /*
    var url = "https://maker.ifttt.com/trigger/aufgabenBotAufgabe/with/key/eRyGmfJa6ti49eJB84D5xSEGfvYYmasLmNkrhOPPXlp"
    request(url + "?value1=" + name + "&value2=" + fach +"(" + klasse + ")" + "&value3=" + abgabe, (err, res, body) => {
        if(err){
            console.log(err)
        }
    });
    var url = "https://maker.ifttt.com/trigger/meow/with/key/c93lQIUSaBNCaVxAimevf"
    request(url + "?value1=" + name + "&value2=" + fach + "&value3=" + abgabe, (err, res, body) => {
        if(err){
            console.log(err)
        }
    });
    */
}

router.post('/api/v1/create/invite', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == 'Start$') {
            var klasse = req.body.klasse;
            var role = req.body.role;
            var roleString = req.body.roleString;
            var type = req.body.type;
            var name = req.body.name;
            let token = generate('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 32);
            var inviteUrl = 'https://zgk.mxis.ch/register?token=' + token;
            var used = {
                active: true,
                count: 0,
                max: req.body.max
            }
            var query = {
                invite_id: generate('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 7),
                type: type,
                name: name,
                used: used,
                klasse: klasse,
                role: role,
                roleString: roleString,
                token: token,
                inviteUrl: inviteUrl,
                createdAt: CurrentDate(),
            }
            try {
                let user = new Invite(query)
                user.save(async function(err, doc) {
                    if (err) {
                        console.log(err)
                        if (err.code == 11000) {
                            console.log("Invite already in use")
                            res.json({
                                status: '400',
                                response: "error"
                            });
                        } else {
                            console.error(err)
                            res.json({
                                status: '400'
                            });
                        }
                    } else {
                        console.log("Invite created: " + doc.token + " with role: " + doc.role)
                        res.json({
                            status: '200',
                            response: "invite created",
                            data: {
                                name: doc.name,
                                token: doc.token,
                                role: doc.role,
                                type: doc.type,
                                klasse: doc.klasse,
                                used: doc.used,
                                max: doc.max,
                                inviteUrl: doc.inviteUrl
                            }
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

router.get('/api/v1/get/invites', limitApi, async(req, res) => {
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            try {
                if (req.query.id != undefined) {
                    var invite = await Invite.findById(req.query.id)
                } else if (req.query.token != undefined) {
                    var invite = await Invite.findByToken(req.query.token)
                } else if (req.query.klasse != undefined) {
                    var invite = await Invite.findByKlasse(req.query.klasse)
                } else if (req.query.role != undefined) {
                    var invite = await Invite.findByRole(req.query.role)
                } else if (req.query.type != undefined) {
                    var invite = await Invite.findByType(req.query.type)
                } else if (req.query.name != undefined) {
                    var invite = await Invite.findByName(req.query.name)
                } else {
                    var invite = await Invite.findAll()
                }
                //console.log(invite)
                var data = []
                for (i in invite) {
                    data.push({
                        name: invite[i].name,
                        token: invite[i].token,
                        role: invite[i].role,
                        type: invite[i].type,
                        klasse: invite[i].klasse,
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
                    console.log("Aufgabe not found")
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
})

router.get('/api/v1/download/:code', limitApi, async(req, res) => {
    try {
        var code = req.params.code.split(".")[0];
        //console.log(code)
        var aufgabe = await Aufgabe.findOneById(code)
        var count = await Aufgabe.increaseDownloads(aufgabe.aufgaben_id)
            //console.log(aufgabe)
        console.log("Sending file: " + aufgabe.files.fileName + '.' + aufgabe.files.type + " - downloaded " + count + " times so far")
        res.download(path.join(__dirname, '../files/', aufgabe.aufgaben_id + '.' + aufgabe.files.type), aufgabe.files.fileName + '.' + aufgabe.files.type);
    } catch (error) {
        if (error.code == 405) {
            console.log("File not found")
            res.json({ status: 404, response: "file not found" })
        } else {
            console.log(error)
            res.json({ status: 404, response: "file not found" })
        }
    }
    //res.sendFile(path.join(__dirname, '../files/', req.params.code));
});

router.get('/api/v1/solution/download/:code', limitApi, middleware.auth(), async(req, res) => {
    try {
        var solution_id = req.params.code.split(".")[0];
        //console.log(code)
        var solution = await Solution.findOneBySolutionId(solution_id)
        if (solution.access.includes(req.session.user_id)) {
            console.log("Sending file: " + solution.files.fileName + '.' + solution.files.type)
            res.download(path.join(__dirname, '../files/', solution.solution_id + '.' + solution.files.type), solution.files.fileName + '.' + solution.files.type);
        } else {
            console.log("Fehler: " + req.session.name + " ist nicht in der access liste")
            res.status(403);
            if (req.accepts('json')) {
                res.send({ status: 403, response: 'nicht autorisiert' });
                return;
            }
            res.type('txt').send('Nicht autorisiert');
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
    //res.sendFile(path.join(__dirname, '../files/', req.params.code));
});

router.post('/api/v1/change/user', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey) {
            try {
                if (req.body.user_id != undefined) {
                    var user = await User.findByOneUserId(req.body.user_id)
                } else if (req.body.email != undefined) {
                    var user = await User.findByOneEmail(req.body.email)
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
                if (req.query.new != undefined) {
                    //console.log(req.query.new)
                    if (req.query.new == 'true') {
                        if (isNew == true) {
                            var run = true;
                        } else {
                            var run = false;
                        }
                    } else {
                        var run = true;
                    }
                } else {
                    var run = true;
                }
                if (run) {
                    if (req.query.id != undefined) {
                        var aufgaben = await Aufgabe.findById(req.query.id)
                    } else if (req.query.user != undefined) {
                        var aufgaben = await Aufgabe.findByUserId(req.query.user)
                    } else if (req.query.klasse != undefined) {
                        var aufgaben = await Aufgabe.findByKlasse(req.query.klasse)
                    } else if (req.query.abgabe != undefined) {
                        var aufgaben = await Aufgabe.findByAbgabe(req.query.abgabe)
                    } else {
                        var aufgaben = await Aufgabe.findAll()
                    }
                    console.log("API is getting data")
                    console.log(req.query)
                    var data = []
                    for (i in aufgaben) {
                        data.push({
                            aufgaben_id: aufgaben[i].aufgaben_id,
                            user_id: aufgaben[i].user_id,
                            text: aufgaben[i].text,
                            fach: aufgaben[i].fach,
                            klasse: aufgaben[i].klasse,
                            abgabe: aufgaben[i].abgabe,
                            createdAt: aufgaben[i].createdAt,
                            downloads: aufgaben[i].downloads,
                            files: aufgaben[i].files
                        })
                    }
                    isNew = false;
                    res.json({
                        status: 200,
                        response: 'success',
                        type: 'data',
                        data: data
                    })
                } else {
                    res.json({
                        status: 204, //No new content
                        response: "keine neuen aufgaben"
                    })
                }
            } catch (error) {
                if (error.code == 405) {
                    console.log("Aufgabe not found")
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
                if (req.query.id != undefined) {
                    var user = await User.findById(req.query.id)
                } else if (req.query.klasse != undefined) {
                    var user = await User.findByKlasse(req.query.klasse)
                } else if (req.query.email != undefined) {
                    var user = await User.findByEmail(req.query.email)
                } else if (req.query.role != undefined) {
                    var user = await User.findByRole(req.query.role)
                } else {
                    var user = await User.findAll()
                }
                //console.log(user)
                var data = []
                for (i in user) {
                    data.push({
                        user_id: user[i].user_id,
                        name: user[i].name,
                        email: user[i].email,
                        klassen: user[i].klassen,
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

router.get('/api/v1/verify', limitApi, async(req, res) => {
    if (req.query != undefined) {
        if (req.query.apiKey == apiKey) {
            try {
                var user = await User.findByOneEmail(req.query.email)
                    //console.log(user)
                    /*if(user.botKey == undefined){
                        try{
                            var botKey = await User.generateBotKey(user.user_id)
                        }catch(error){
                            if (error.code == 405) {
                                console.log("User not found - botkey")
                                res.json({status: 404, response:"user nicht gefunden"})
                            } else {
                                console.log(error)
                                res.json({status: 500, response:"internal error, bitte kontaktiere support"})
                            }
                        }
                    }else{
                        var botKey = user.botKey
                    }*/
                try {
                    var botKey = await User.generateBotKey(user.user_id)
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
                        user_id: user.user_id
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

router.post('/api/v1/create/aufgabe', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey) {
            var uid = generate('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32)
            var query = {
                aufgaben_id: uid,
                user_id: req.body.user_id,
                text: req.body.text,
                fach: req.body.fach,
                abgabe: req.body.abgabe,
                files: { count: 0 },
                klasse: req.body.klasse,
                createdAt: CurrentDate(),
                downloads: 0
            }
            try {
                let aufgabe = new Aufgabe(query)
                aufgabe.save(async function(err, doc) {
                    if (err) {
                        console.log(err)
                        if (err.code == 11000) {
                            console.log("Aufgabe already in use")
                            console.log(err)
                            res.json({
                                status: '407',
                                response: "aufgabe already in use"
                            });
                        } else {
                            console.error(err)
                            res.json({
                                status: '400',
                                type: 'error'
                            });
                        }
                    } else {
                        //console.log(doc)
                        isNew = true;
                        middleware.resetCache(doc.klasse)
                        console.log("Aufgabe added as: " + uid)
                        res.json({
                            status: '200',
                            response: "success",
                            type: 'data',
                            data: {
                                aufgaben_id: uid,
                                text: doc.text,
                                fach: doc.fach,
                                abgabe: doc.abgabe,
                                klasse: doc.klasse,
                                user_id: doc.user_id,
                                files: doc.files,
                                createdAt: doc.createdAt,
                                downloads: doc.downloads
                            }
                        });
                    }
                })
            } catch (error) {
                console.log(error)
                res.json({
                    status: '400',
                    type: 'error'
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
                const aufgabe = await Aufgabe.findOne({ aufgaben_id: req.query.id })
                if (!aufgabe) {
                    throw ({ error: 'aufgabe not found', code: 405 })
                }
                await aufgabe.deleteOne({ aufgaben_id: aufgabe.aufgaben_id })
                    .then(doc => {
                        console.log("Aufgabe: " + aufgabe.aufgaben_id + " was deleted by API")
                        middleware.resetCache(doc.klasse)
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

router.get('/api/v1/migrate/klassen', async(req, res) => {
    return res.json({ status: 403 })
    try {
        var klasse = await Klasse.findOne({ name: "TG11I" })

        var users = await User.find({ klassen: "TG11I" })
        console.log("Parsing " + users.length + " users...")
        for (i in users) {
            klasse.users.push(users[i]._id)
        }

        var aufgaben = await Aufgabe.find({ klasse: "TG11I" })
        console.log("Parsing " + aufgaben.length + " aufgaben...")
        for (i in aufgaben) {
            klasse.aufgaben.push(aufgaben[i]._id)
        }

        klasse.save(function(err) {
            if (err) {
                console.error(err);
                res.json({ status: 400, response: "error" })
            }
            console.log("Klasse saved")
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

});

router.get('/api/v1/migrate/users/', async(req, res) => {
    /*await User.updateMany({}, { $set: { aufgaben: [], solutions: [] } })
    return res.json({ status: 200 })*/
    try {
        var users = await User.find({ klassen: "TG11I" })
        console.log("Parsing " + users.length + " users...")
        console.log("Aufgaben:")
        for (i in users) {
            console.log("User: " + users[i].name + " ID: " + users[i].user_id)

            var aufgaben = await Aufgabe.find({ user_id: users[i].user_id })
            console.log(aufgaben.length + " aufgaben")
            if (aufgaben.length >= 1) {
                for (i in aufgaben) {
                    users[i].aufgaben.push(aufgaben[i]._id)
                }
            } else {
                users[i].aufgaben = []
            }
        }
        console.log("Solutions:")
        for (i in users) {
            console.log("User: " + users[i].name + " ID: " + users[i].user_id)

            var solutions = await Solution.find({ user_id: users[i].user_id })
            console.log(solutions.length + " solutions")
            if (solutions.length >= 1) {
                for (i in solutions) {
                    users[i].solutions.push(solutions[i]._id)
                }
            } else {
                users[i].solutions = []
            }
        }
        await User.updateMany({ klasse: "TG11I" }, {
            $set: { 'size.uom': 'in', status: 'P' },
            $currentDate: { lastModified: true }
        });
        console.log("done")
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

});

router.get('/api/v1/test', limitApi, async(req, res) => {
    res.json({ status: 200, response: "Guten Tag" })
});

router.post('/api/v1/test', limitApi, async(req, res) => {
    console.log(req.body)
    res.json({ status: 200, response: "Guten Tag", data: req.body })
});

function CurrentDate() {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    var current_date = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    return current_date;
}

String.prototype.isLowerCase = function() {
    return this.valueOf().toLowerCase() === this.valueOf();
};

module.exports = router