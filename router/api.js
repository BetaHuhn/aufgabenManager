const express = require('express')
const generate = require('nanoid/generate')
const fs = require('fs');
const fileUpload = require('express-fileupload');
const request = require('request');
const _ = require('lodash');
var path = require('path');
const zipFolder = require('zip-folder');
var ejs = require("ejs");
let pdf = require("html-pdf");
const rateLimit = require("express-rate-limit");
var mv = require('mv');
const middleware = require("../middleware/middleware")
const router = express.Router()

let mongoose = require('mongoose')
const Exercise = require('../models/exercise')
const User = require('../models/user')
const Invite = require("../models/invite")
const Class = require("../models/class")
const School = require("../models/school")
const Solution = require("../models/solution")

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

router.post('/api/v1/create/school', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == 'Start$') {
            var name = req.body.name;
            var query = {
                _id: new mongoose.Types.ObjectId(),
                name: name,
                createdAt: CurrentDate(),
            }
            try {
                let school = new School(query)
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
            var name = req.body.name;
            var school = await School.findOne({_id: req.body.school});
            if(!school){
                return res.json({status: 404, response: "school not found"})
            }
            var query = {
                _id: new mongoose.Types.ObjectId(),
                name: name,
                school: school._id,
                createdAt: CurrentDate(),
            }
            try {
                let newClass = new Class(query)
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
            var user = await User.findOne({_id: req.body.user});
            if(!user){
                return res.json({status: 404, response: "user not found"})
            }
            var school = await School.findOne({_id: req.body.school});
            if(!school){
                return res.json({status: 404, response: "school not found"})
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
            var sendClass = await Class.findOne({_id: req.body.class});
            if(!sendClass){
                return res.json({status: 404, response: "class not found"})
            }
            var role = req.body.role;
            switch(role){
                case 'admin':
                    var roleString = 'Admin';
                    break;
                case 'teacher':
                case 'lehrer':
                    var roleString = 'Lehrer';
                    break;
                default:
                    var roleString = 'Schüler';                
            }
            //var type = req.body.type;
            var name = (req.body.name != undefined) ? req.body.name : (sendClass.name + " " + roleString + " Invite Link");
            console.log(name)
            let token = generate('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 32);
            var inviteUrl = 'https://zgk.mxis.ch/register?token=' + token;
            var used = {
                active: true,
                count: 0,
                max: req.body.max
            }
            var query = {
                _id: new mongoose.Types.ObjectId(),
                //type: type,
                name: name,
                used: used,
                class: sendClass._id,
                school: sendClass.school, //OR sendClass.school._id dunno yet
                role: role,
                roleString: roleString,
                token: token,
                inviteUrl: inviteUrl,
                createdAt: CurrentDate(),
            }
            try {
                let invite = new Invite(query)
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
                if (req.query.id != undefined) {
                    var invite = await Invite.find({_id: req.query.id})
                } else if (req.query.token != undefined) {
                    var invite = await Invite.find({token: req.query.token})
                } else if (req.query.klasse != undefined) {
                    var invite = await Invite.find({class: req.query.class})
                } else if (req.query.role != undefined) {
                    var invite = await Invite.find({role: req.query.role})
                } else if (req.query.type != undefined) {
                    var invite = await Invite.find({type: req.query.type})
                } else if (req.query.name != undefined) {
                    var invite = await Invite.find({name: req.query.name})
                } else {
                    var invite = await Invite.find()
                }
                //console.log(invite)
                var data = []
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

router.get('/api/v1/download/:code', limitApi, async(req, res) => {
    try {
        var code = req.params.code.split(".")[0];
        //console.log(code)
        var aufgabe = await Exercise.findOne({ _id: code })
        var count = await Exercise.increaseDownloads(aufgabe._id)
            //console.log(aufgabe)
        console.log("Sending file: " + aufgabe.files.fileName + '.' + aufgabe.files.type + " - downloaded " + count + " times so far")
        res.download(path.join(__dirname, '../files/', aufgabe._id + '.' + aufgabe.files.type), aufgabe.files.fileName + '.' + aufgabe.files.type);
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

router.get('/api/v1/solution/download', limitApi, middleware.auth(), async(req, res) => {
    try {

        console.log(req.session.name + " is getting solutions: " + req.query.id)
        var solution = await Solution.findOne({_id: req.query.id}).populate('user', 'name')
        if(!solution){
            console.log("Fehler: Solution existiert nicht")
            return res.sendStatus(404);
        }
        if( solution.access.includes(req.session._id) || req.session.role == "admin"){
            console.log("Sending file: " + solution._id)
            if(solution.file.multiple){
                res.download(path.join(__dirname, '../files/solutions/' + solution._id + ".zip"), solution.user.name.replace(/\s+/g, '') + '.zip');
            }else{
                res.download(path.join(__dirname, '../files/solutions/' + solution._id + "/" + solution.versions[0].files.fileName + "." + solution.file.type), solution.user.name.replace(/\s+/g, '') + '.' + solution.file.type);
            }
        }else{
            console.log("Fehler: " + req.session.name + " nicht der Inhaber von: " + exercise._id)
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
    //res.sendFile(path.join(__dirname, '../files/', req.params.code));
});

router.post('/api/v1/change/user', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey) {
            try {
                if (req.body.user_id != undefined) {
                    var user = await User.findOne({ _id: req.body.user_id })
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
                        var exercises = await Exercise.find({ _id: req.query.id })
                    } else if (req.query.user != undefined) {
                        var exercises = await Exercise.find({ user: req.query.user })
                    } else if (req.query.klasse != undefined) {
                        var exercises = await Exercise.find({ class: req.query.class })
                    } else if (req.query.abgabe != undefined) {
                        var exercises = await Exercise.find({ deadline: req.query.deadline })
                    } else {
                        var exercises = await Exercise.find()
                    }
                    console.log("API is getting data")
                    console.log(req.query)
                    var data = []
                    for (i in exercises) {
                        data.push({
                            aufgaben_id: exercises[i]._id, //Update Bot API to use new key names
                            user_id: exercises[i].user,
                            text: exercises[i].text,
                            fach: exercises[i].subject,
                            klasse: exercises[i].class,
                            abgabe: exercises[i].deadline,
                            createdAt: exercises[i].createdAt,
                            downloads: exercises[i].downloads,
                            files: exercises[i].files
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
                if (req.query.id != undefined) {
                    var user = await User.find({ _id: req.query.id })
                } else if (req.query.klasse != undefined) {
                    var user = await User.find({ class: req.query.class })
                } else if (req.query.email != undefined) {
                    var user = await User.findByEmail(req.query.email)
                } else if (req.query.role != undefined) {
                    var user = await User.find({ role: req.query.role })
                } else {
                    var user = await User.find()
                }
                //console.log(user)
                var data = []
                for (i in user) {
                    data.push({
                        _id: user[i]._id,
                        name: user[i].name,
                        email: user[i].email,
                        classes: user[i].classes,
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

router.post('/api/v1/create/exercise', limitApi, async(req, res) => {
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey) {
            var uClass = await Class.findOne({_id: req.body.class})
            var user = await User.findOne({_id: req.body.user})
            //console.log(user)
            if(uClass == undefined || user == undefined){
                console.log("Fehler: User oder Class nicht gefunden")
                return res.json({status: 404})
            }
            return res.json({status: 400, response: "currently in developement"})
            console.log(req)
            console.log(req.files)
            var uid = new mongoose.Types.ObjectId();
            if (!req.files || Object.keys(req.files).length === 0) {
                console.log("No files uploaded")
                var files = { count: 0 }
                return
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
                    fileName: (req.body.filename == undefined || req.body.filename === "" || req.body.filename.length == 0 || req.body.filename == null) ? req.body.fach + "Exercise" : req.body.filename,
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
                    fileName: (req.body.filename == undefined || req.body.filename === "" || req.body.filename.length == 0 || req.body.filename == null) ? req.body.fach + "Exercise" : req.body.filename,
                    fileUrl: "https://zgk.mxis.ch/api/v1/download/" + uid + '.zip'
                }
            }
            return
            var query = {
                _id: uid,
                user: user._id,
                text: req.body.text,
                subject: req.body.subject,
                deadline: new Date(req.body.deadline),
                files: files,
                class: uClass._id,
                school: uClass.school,
                createdAt: CurrentDate(),
                downloads: 0
            }
            try {
                let exercise = new Exercise(query)
                exercise.save(async function(err, doc) {
                    if (err) {
                        console.log(err)
                        if (err.code == 11000) {
                            console.log("Exercise already in use")
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
                        console.log("Exercise added as: " + uid)
                        if(user.exercises == undefined || user.exercises == null){
                            user.exercises = [doc._id]
                        }else{
                            user.exercises.push(doc._id)
                        }
                        user.save(function(err) {
                            if (err) {
                                console.error(err);
                            }
                        });
                        if(uClass.exercises == undefined || uClass.exercises == null){
                            uClass.exercises = [doc._id]
                        }else{
                            uClass.exercises.push(doc._id)
                        }
                        uClass.save(function(err) {
                            if (err) {
                                console.error(err);
                            }
                        });
                        console.log("Exercise added to class: " + uClass._id + " and user: " + user._id)
                        res.json({
                            status: '200',
                            response: "success",
                            type: 'data',
                            data: {
                                _id: doc._id,
                                text: doc.text,
                                subject: doc.subject,
                                deadline: doc.deadline,
                                class: doc.class,
                                school: doc.school,
                                user: doc.user,
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

router.get("/api/v1/generate/pdf", middleware.auth({ lehrer: true }), async(req, res) => {
    var id = req.query.id;
    console.log("Generating PDF for Exercise: " + req.query.id)
    var exercise = await Exercise.findOne({ _id: id }).populate({
        path : 'class',
        select: 'name users',
        populate : {
          path : 'users',
          select: 'name solutions',
          populate:{
              path: 'solutions',
              select: 'file createdAt'
          }
        }
    })
    console.log(exercise.class)
    var students = []
    for(i in exercise.class.users){
        if(exercise.class.users[i].solutions.length >= 1){
            var datum = new Date(exercise.class.users[i].solutions[0].createdAt)
            datum = ("0" + datum.getDate()).slice(-2) + "." + ("0" + (datum.getMonth() + 1)).slice(-2) + "." +  datum.getFullYear() + ", " + ("0" + datum.getHours()).slice(-2) + ":" + ("0" + datum.getMinutes()).slice(-2) ;
            students.push({
                name: exercise.class.users[i].name,
                datum: datum,
                link: "https://dev1.mxis.ch/api/v1/solution/download?id=" + exercise.class.users[i].solutions[0]._id,
                status: "ja"
            })
        }else{
            students.push({
                name: exercise.class.users[i].name,
                datum: "-",
                link: 0,
                status: "nein"
            })
        }
    }
    var abgabe = new Date(exercise.deadline)
    abgabe = ("0" + abgabe.getDate()).slice(-2) + "." + ("0" + (abgabe.getMonth() + 1)).slice(-2) + "." + abgabe.getFullYear();
    var today = new Date()
    today = ("0" + today.getDate()).slice(-2) + "." + ("0" + (today.getMonth() + 1)).slice(-2) + "." +  today.getFullYear() + ", " + ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2) ;
            
    ejs.renderFile(path.join(__dirname, '../views/', "pdfTemplate.ejs"), { link: "https://dev1.mxis.ch/aufgabe?id=" + exercise._id, createdAt: today, fach: exercise.subject, text: exercise.text, abgabe: abgabe, klasse: String(exercise.class.name), students: students}, (err, data) => {
    if (err) {
          console.log(err);
          res.send("error")
    } else {
        let options = {
            "height": "11.25in",
            "width": "8.5in",
            "header": {
                "height": "20mm"
            },
            "footer": {
                "height": "20mm",
            },
        };
        pdf.create(data, options).toFile("report.pdf", function (err, data) {
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

router.post('/api/v1/add/users/', async(req, res) => {
    /*await User.updateMany({}, { $set: { exercises: [], solutions: [] } })
    return res.json({ status: 200 })*/
    if (req.body != undefined) {
        if (req.body.apiKey == apiKey && req.body.password == "Start$") {
            console.log("Parsing users...")
            try {
                var uClass = await Class.findOne({ _id: req.body.class })
                var users = []
                var ids = []
                for(i in req.body.data){
                    var user = req.body.data[i];
                    console.log("Creating user: user.name")
                    var nUser ={
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
                    //console.log(nUser)
                    users.push(nUser);
                    ids.push(nUser._id)
                }
                console.log("Saving...")
                User.insertMany(users)
                    .then(function (docs) {
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
                    .catch(function (err) {
                        console.log(err)
                        res.json({status: 500})
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