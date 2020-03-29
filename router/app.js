const express = require('express')
const generate = require('nanoid/generate')
const jwt = require('jsonwebtoken');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const request = require('request');
const _ = require('lodash');
var path = require('path');
const zipFolder = require('zip-folder');
const nodemailer = require('nodemailer');
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

router.get('/api/get/home', middleware.auth(), async(req, res) => { //, middleware.cache(900)
    console.log(req.session.name + " is getting home data")
    try {
        var user = await Klasse.findByOneUserId(req.session.user_id)
        console.log(user)
        Aufgabe.find({
            '_id': { $in: user.aufgaben }
        }, function(err, docs) {
            if (err) {
                console.log(err)
                res.json({ status: 500, response: "error" })
            }
            console.log(docs);
            var data = []
            for (i in docs) {
                data.push({
                    aufgaben_id: docs[i].aufgaben_id,
                    user_id: docs[i].user_id,
                    text: docs[i].text,
                    fach: docs[i].fach,
                    klasse: docs[i].klasse,
                    abgabe: docs[i].abgabe,
                    createdAt: docs[i].createdAt,
                    downloads: docs[i].downloads,
                    files: docs[i].files
                })
            }
            res.json({
                status: 200,
                response: 'success',
                type: 'data',
                data: data,
                user: {
                    user_id: req.session.user_id,
                    name: req.session.name,
                    role: req.session.role,
                    klassen: req.session.klassen
                }
            })
        });
    } catch (error) {
        if (error.code == 405) {
            console.log("user not found")
            res.json({ status: 404, response: "user not found" })
        } else {
            console.log(error)
            res.json({ status: 500, response: "error" })
        }
    }
});

router.post('/api/new/aufgabe', middleware.auth({ lehrer: true }), async(req, res) => {
    console.log(req.body)
    if (req.body != undefined) {
        if ((req.body.klasse != undefined || req.body.klasse != '' || req.body.klasse.length != 0) && req.body.fach != undefined && req.body.abgabe != undefined && req.body.text != undefined) {
            if (req.session.klassen.includes(req.body.klasse) || req.session.role == "admin") {
                var uid = generate('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32)
                if (!req.files || Object.keys(req.files).length === 0) {
                    var files = { count: 0 }
                } else if (req.files.data.length == undefined || req.files.data.length <= 1) {
                    console.log("One file uploaded")
                    let photo = req.files.data;
                    var type = photo.name.split('.').pop();
                    var file_id = uid + "." + type;
                    photo.mv('./files/' + file_id, function(err) {
                        if (err) throw err;
                        console.log("File " + file_id + " moved")
                    })
                    console.log(req.body.filename)
                    console.log((req.body.filename == undefined || req.body.filename === "" || req.body.filename.length == 0 || req.body.filename == null))
                    var files = {
                        count: 1,
                        type: type,
                        fileName: (req.body.filename == undefined || req.body.filename === "" || req.body.filename.length == 0 || req.body.filename == null) ? req.body.fach + "Aufgabe" : req.body.filename,
                        fileUrl: "https://zgk.mxis.ch/api/v1/download/" + file_id
                    }
                } else {
                    var count = req.files.data.length;
                    console.log(count + " files uploaded")
                    var files = [];
                    _.forEach(_.keysIn(req.files.data), (key) => {
                        let file = req.files.data[key];

                        //move photo to uploads directory
                        file.mv('./files/uploads/' + uid + "/" + file.name, function(err) {
                            if (err) throw err;
                            console.log("File " + file.name + " moved")
                        })
                    });
                    zipFolder('./files/uploads/' + uid + '/', './files/' + uid + ".zip", function(err) {
                        if (err) {
                            console.log('oh no!', err);
                        } else {
                            console.log('All files Zipped up: ' + uid + '.zip');
                        }
                    });
                    var files = {
                        count: count,
                        type: 'zip',
                        fileName: (req.body.filename == undefined || req.body.filename === "" || req.body.filename.length == 0 || req.body.filename == null) ? req.body.fach + "Aufgabe" : req.body.filename,
                        fileUrl: "https://zgk.mxis.ch/api/v1/download/" + uid + '.zip'
                    }
                }
                var query = {
                    aufgaben_id: uid,
                    user_id: req.session.user_id,
                    text: req.body.text,
                    fach: req.body.fach,
                    abgabe: req.body.abgabe,
                    files: files,
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
                            console.log(doc)
                            isNew = true;
                            middleware.resetCache(doc.klasse)
                            var user = await User.findOne({ user_id: req.session.user_id })
                            user.aufgaben.push(doc._id)
                            user.save(function(err) {
                                if (err) {
                                    console.error(err);
                                }
                            });
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
                                    files: doc.files,
                                    klasse: doc.klasse,
                                    createdAt: doc.createdAt,
                                    downloads: doc.downloads
                                }
                            });
                            sendPush(req.session.name, doc.klasse, doc.fach, doc.abgabe)
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
                console.log(req.session.name + " is not part of " + req.body.klasse)
                res.json({
                    status: '401',
                    type: 'du bist nicht teil der Klasse ' + req.body.klasse
                });
            }
        } else {
            res.json({
                status: '421',
                type: 'nicht alle Felder ausgefuellt'
            });
        }
    } else {
        res.json({
            status: '421',
            type: 'nicht alle Felder ausgefuellt'
        });
    }
})

router.get('/api/delete/aufgabe', middleware.auth({ lehrer: true }), async(req, res) => {
    try {
        const aufgabe = await Aufgabe.findOne({ aufgaben_id: req.query.id })
        if (!aufgabe) {
            throw ({ error: 'aufgabe not found', code: 405 })
        }
        if (req.session.user_id == aufgabe.user_id || req.session.role == 'admin') {
            await aufgabe.deleteOne({ aufgaben_id: aufgabe.aufgaben_id })
                .then(doc => {
                    console.log(doc)
                    middleware.resetCache(doc.klasse)
                    console.log("Aufgabe: " + aufgabe.aufgaben_id + " deleted by " + req.session.name)
                    res.json({
                        status: 200,
                        response: 'success'
                    })
                })
                .catch(err => {
                    console.error(err)
                    res.json({ status: 500, response: "es ist ein fehler aufgetreten" })
                })
        } else {
            res.json({
                status: '401',
                type: 'dir gehört die Aufgabe nicht'
            });
        }
    } catch (error) {
        if (error.code == 405) {
            console.log("aufgabe not found")
            res.json({ status: 404, response: "aufgabe nicht gefunden" })
        } else {
            console.log(error)
            res.json({ status: 500, response: "es ist ein fehler aufgetreten" })
        }
    }
});

router.get('/register', async(req, res) => {
    console.log(req.query.token + " was accessed")
    if (req.query == undefined) {
        res.render('inviteError.ejs', { message: 'Um einen Account zu erstellen, brauchst du zur Zeit einen Invite Link. Sende uns eine Mail für weitere Infos: zgk@mxis.ch' })
    } else if (req.query.token != undefined) {
        try {
            var invite = await Invite.checkToken(req.query.token)
            res.render('register.ejs', { inviteUrl: invite.inviteUrl, token: invite.token, used: invite.used.count, max: invite.used.max, klasse: invite.klasse, name: invite.name, role: invite.role, roleString: invite.roleString, type: invite.type })
        } catch (error) {
            if (error.code == 408) {
                console.log("invite already used")
                res.render('inviteError.ejs', { message: 'Der Invite Link ist abgelaufen oder wurde zu oft benutzt' })
            } else if (error.code == 405) {
                console.log("invite doesn't exist")
                res.render('inviteError.ejs', { message: 'Der Invite Link existiert nicht' })

            } else {
                console.log(error)
                res.render('inviteError.ejs', { message: 'Es ist ein Fehler aufgetreten, bitte lade die Seite neu' })
            }
        }
    } else {
        res.render('inviteError.ejs', { message: 'Um einen Account zu erstellen, brauchst du zur Zeit einen Invite Link. Sende uns eine Mail für weitere Infos: zgk@mxis.ch' })
    }
})

router.get('/api/get/solutions', middleware.auth(), async(req, res) => { //{ user: true }
    console.log(req.session.name + " is getting solutions")
    if (req.query != undefined) {
        if (req.query.id != undefined) {
            try {
                var aufgabe = await Aufgabe.findOneById(req.query.id)
                if (req.session.klassen.includes(aufgabe.klasse)) {
                    try {
                        var solutions = await Solution.findByUserAndAufgabe(req.session.user_id, aufgabe.aufgaben_id)
                        if (solutions.length >= 1) {
                            var data = []
                            for (i in solutions) {
                                data.push({
                                    solution_id: solutions[i].solution_id,
                                    aufgaben_id: solutions[i].aufgaben_id,
                                    fach: solutions[i].fach,
                                    klasse: solutions[i].klasse,
                                    access: solutions[i].access,
                                    files: solutions[i].files,
                                    createdAt: solutions[i].createdAt
                                })
                            }
                            res.json({
                                status: 200,
                                response: "success",
                                data: data,
                                user: {
                                    name: req.session.name,
                                    role: req.session.role,
                                    user_id: req.session.user_id,
                                }
                            })
                        } else {
                            console.log("Fehler: Keine Lösungen gefunden")
                            res.json({ status: 404, response: "keine lösungen gefunden" })
                        }
                    } catch (error) {
                        if (error.code == 405) {
                            console.log("Fehler: Keine Lösungen gefunden")
                            res.json({ status: 404, response: "keine lösungen gefunden" })
                        } else {
                            console.log(error)
                            res.json({ status: 400, response: "error" })
                        }
                    }
                } else {
                    console.log("Fehler: " + req.session.name + " ist gehört nicht der Klasse: " + aufgabe.klasse + " an")
                    res.json({ status: 403, response: "nicht autorisiert" })
                }
            } catch (error) {
                if (error.code == 405) {
                    console.log("aufgabe not found")
                    res.json({ status: 404, response: "aufgabe nicht gefunden" })
                } else {
                    console.log(error)
                    res.json({ status: 400, response: "error" })
                }
            }
        } else {
            console.log("Fehler: keine aufgaben id gesendet")
            res.json({ status: 404, response: "aufgabe nicht gefunden" })
        }
    } else {
        console.log("Fehler: keine aufgaben id gesendet")
        res.json({ status: 405, response: "aufgabe nicht gefunden" })
    }
})

router.post('/api/new/solution', middleware.auth({ user: true }), async(req, res) => {
    console.log(req.session.name + " lädt eine Lösung hoch")
    console.log(req.body)
    if (req.body != undefined) {
        if (req.body.id != undefined) {
            try {
                var aufgabe = await Aufgabe.findOneById(req.body.id);
                if (req.session.klassen.includes(aufgabe.klasse)) {
                    var uid = generate('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32)
                    var today = new Date();
                    var date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate()
                    if (!req.files || Object.keys(req.files).length === 0) {
                        console.log("Fehler: Keine Datei hochgeladen")
                        res.json({
                            status: 400,
                            response: "keine Datei hochgeladen"
                        })
                    } else if (req.files.data.length == undefined || req.files.data.length <= 1) {
                        console.log("One file uploaded")
                        let photo = req.files.data;
                        var type = photo.name.split('.').pop();
                        var file_id = uid + "." + type;
                        photo.mv('./files/' + file_id, function(err) {
                            if (err) throw err;
                            console.log("File " + file_id + " moved")
                        })
                        console.log(req.body.filename)
                        var files = {
                            count: 1,
                            type: type,
                            fileName: (req.body.filename == undefined || req.body.filename === "" || req.body.filename.length == 0 || req.body.filename == null) ? aufgabe.fach + "-" + req.session.name.replace(/\s/g, "") + "-" + date : req.body.filename,
                            fileUrl: "https://zgk.mxis.ch/api/v1/solution/download/" + file_id
                        }
                    } else {
                        var count = req.files.data.length;
                        console.log(count + " files uploaded")
                        var files = [];
                        _.forEach(_.keysIn(req.files.data), (key) => {
                            let file = req.files.data[key];

                            //move photo to uploads directory
                            file.mv('./files/uploads/' + uid + "/" + file.name, function(err) {
                                if (err) throw err;
                                console.log("File " + file.name + " moved")
                            })
                        });
                        zipFolder('./files/uploads/' + uid + '/', './files/' + uid + ".zip", function(err) {
                            if (err) {
                                console.log('oh no!', err);
                            } else {
                                console.log('All files Zipped up: ' + uid + '.zip');
                            }
                        });
                        var files = {
                            count: count,
                            type: 'zip',
                            fileName: (req.body.filename == undefined || req.body.filename === "" || req.body.filename.length == 0 || req.body.filename == null) ? aufgabe.fach + "-" + req.session.name.replace(/\s/g, "") + "-" + date : req.body.filename,
                            fileUrl: "https://zgk.mxis.ch/api/v1/solution/download/" + uid + '.zip'
                        }
                    }
                    var query = {
                        solution_id: uid,
                        user_id: req.session.user_id,
                        aufgaben_id: aufgabe.aufgaben_id,
                        fach: aufgabe.fach,
                        klasse: aufgabe.klasse,
                        files: files,
                        access: [aufgabe.user_id, req.session.user_id],
                        createdAt: CurrentDate()
                    }
                    try {
                        let solution = new Solution(query)
                        solution.save(async function(err, doc) {
                            if (err) {
                                console.log(err)
                                res.json({
                                    status: '400',
                                    type: 'error'
                                });

                            } else {
                                console.log(doc)
                                console.log("Lösung hinzugefügt als: " + uid)
                                res.json({
                                    status: '200',
                                    response: "success",
                                    type: 'data',
                                    data: {
                                        solution_id: doc.aufgaben_id,
                                        user_id: doc.user_id,
                                        aufgaben_id: doc.aufgaben_id,
                                        fach: doc.fach,
                                        klasse: doc.klasse,
                                        files: doc.files,
                                        access: doc.access,
                                        createdAt: doc.createdAt
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
                    console.log("Fehler: " + req.session.name + " gehört nicht der Klasse: " + aufgabe.klasse + " an")
                    res.json({
                        status: '400',
                        type: 'error'
                    });
                }
            } catch (error) {
                if (error.code == 405) {
                    console.log("Fehler: Aufgabe not found")
                    res.json({ status: 404, response: "aufgabe nicht gefunden" })
                } else {
                    console.log(error)
                    res.json({ status: 500, response: "es ist ein fehler aufgetreten" })
                }
            }
        } else {
            console.log("Fehler: Keine Aufgaben ID gesendet")
            res.json({
                status: '400',
                type: 'keine aufgabe angegeben'
            });
        }
    } else {
        console.log("Fehler: Keine Aufgaben ID gesendet")
        res.json({
            status: '400',
            type: 'keine aufgabe angegeben'
        });
    }
})


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