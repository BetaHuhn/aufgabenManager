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
var Invite = require("../models/invite")
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

const privateemailKey = require('../key.json').privateEmail
let transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'schiller@mxis.ch',
        pass: privateemailKey
    }
});

var isNew = true;
var apiKey = require('../key.json').key

async function sendPush(name, klasse, fach, abgabe){
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
}

router.get('/api/get/home', middleware.auth(), async(req, res) => { //, middleware.cache(900)
    console.log(req.session.name + " is getting home data")
    try{
        var aufgaben = await Aufgabe.findBySession(req.session)
        console.log(aufgaben)
        var data = []
        for(i in aufgaben){
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
        res.json({
            status: 200,
            response: 'success',
            type: 'data',
            data: data,
            user:{
                user_id: req.session.user_id,
                name: req.session.name,
                email: req.session.email,
                role: req.session.role,
                klassen: req.session.klassen
            }
        })
    }catch(error){
       if (error.code == 405) {
            console.log("File not found")
            res.json({status: 404, response:"file not found"})
        } else {
            console.log(error)
            res.json({status: 404, response:"file not found"})
        }
    }
});

router.post('/api/new/aufgabe', middleware.auth({lehrer: true}), async (req, res) => {
    console.log(req.body)
    if(req.body != undefined){
        if((req.body.klasse != undefined || req.body.klasse != '' || req.body.klasse.length != 0) && req.body.fach != undefined && req.body.abgabe != undefined && req.body.text != undefined){
            if(req.session.klassen.includes(req.body.klasse) || req.session.role == "admin"){
                var uid = generate('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16)
                if (!req.files || Object.keys(req.files).length === 0) {
                    var files = {count: 0}
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
                            console.log("Aufgabe added as: " + uid)
                            res.json({
                                status: '200',
                                response: "success",
                                type: 'data',
                                data:{
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
            }else{
                console.log(req.session.name + " is not part of " + req.body.klasse)
                res.json({
                    status: '401',
                    type: 'du bist nicht teil der Klasse ' + req.body.klasse
                });
            }
        }else{
            res.json({
                status: '421',
                type: 'nicht alle Felder ausgefuellt'
            });
        }
    }else{
        res.json({
            status: '421',
            type: 'nicht alle Felder ausgefuellt'
        });
    }
    
})

router.get('/api/delete/aufgabe', middleware.auth({lehrer: true}), async(req, res) => {
    try{
        const aufgabe = await Aufgabe.findOne({ aufgaben_id: req.query.id })
        if (!aufgabe) {
            throw ({ error: 'aufgabe not found', code: 405 })
        }
        if(req.session.user_id == aufgabe.user_id || req.session.role == 'admin'){
            await aufgabe.deleteOne({ aufgaben_id: aufgabe.aufgaben_id })
            .then(doc => {
                console.log(doc)
                middleware.resetCache(doc.klasse)
                res.json({
                    status: 200,
                    response: 'success'
                })
            })
            .catch(err => {
                console.error(err)
                res.json({status: 500, response:"es ist ein fehler aufgetreten"})
            })
        }else{
            res.json({
                status: '401',
                type: 'dir gehört die Aufgabe nicht'
            });
        }
    }catch(error){
       if (error.code == 405) {
            console.log("aufgabe not found")
            res.json({status: 404, response:"aufgabe nicht gefunden"})
        } else {
            console.log(error)
            res.json({status: 500, response:"es ist ein fehler aufgetreten"})
        }
    }
});

router.get('/register', async(req, res) => {
    console.log("/register")
    console.log(req.query.token)
    if(req.query == undefined){
        res.render('inviteError.ejs', {message: 'Um einen Account zu erstellen, brauchst du zur Zeit einen Invite Link. Sende uns eine Mail für weitere Infos: zgk@mxis.ch'})
    }else if(req.query.token != undefined){
        try{
            var invite = await Invite.checkToken(req.query.token)
            res.render('register.ejs', {inviteUrl: invite.inviteUrl, token: invite.token, used: invite.used.count, max: invite.used.max, klasse: invite.klasse, name: invite.name, role: invite.role, roleString: invite.roleString, type: invite.type})
        }catch(error){
            if (error.code == 408) {
                console.log("invite already used")
                res.render('inviteError.ejs', {message: 'Der Invite Link ist abgelaufen oder wurde zu oft benutzt'})
            } else if (error.code == 405) {
                console.log("invite doesn't exist")
                res.render('inviteError.ejs', {message: 'Der Invite Link existiert nicht'})
    
            } else {
                console.log(error)
                res.render('inviteError.ejs', {message: 'Es ist ein Fehler aufgetreten, bitte lade die Seite neu'})
            }
        }
    }else{
        res.render('inviteError.ejs', {message: 'Um einen Account zu erstellen, brauchst du zur Zeit einen Invite Link. Sende uns eine Mail für weitere Infos: zgk@mxis.ch'})
    }
})

router.post('/api/v1/create/invite', limitApi, async(req, res) => {
    if(req.body != undefined){
        if(req.body.apiKey == apiKey && req.body.password == 'Start$'){
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
                        console.log(doc)
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
        }else{
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    }else{
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
})

router.get('/api/v1/get/invites', limitApi, async(req, res) => {
    console.log("/register")
    console.log(req.query.apiKey)
    if(req.query != undefined){
        if(req.query.apiKey == apiKey){
            try{
                if(req.query.id != undefined){
                    var invite = await Invite.findById(req.query.id)
                }else if(req.query.token != undefined){
                    var invite = await Invite.findByToken(req.query.token)
                }else if(req.query.klasse != undefined){
                    var invite = await Invite.findByKlasse(req.query.klasse)
                }else if(req.query.role != undefined){
                    var invite = await Invite.findByRole(req.query.role)
                }else if(req.query.type != undefined){
                    var invite = await Invite.findByType(req.query.type)
                }else if(req.query.name != undefined){
                    var invite = await Invite.findByName(req.query.name)
                }else{
                    var invite = await Invite.findAll()
                }
                console.log(invite)
                var data = []
                for(i in invite){
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
            }catch(error){
                if (error.code == 405) {
                    console.log("Aufgabe not found")
                    res.json({status: 404, response:"aufgabe nicht gefunden"})
                } else {
                    console.log(error)
                    res.json({status: 500, response:"internal error bitte kontaktiere den support"})
                }
            }
        }else{
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    }else{
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
})

router.get('/api/v1/download/:code', limitApi, async(req, res) => {
    try{
        var code = req.params.code.split(".")[0];
        //console.log(code)
        var aufgabe = await Aufgabe.findById(code)
        aufgabe = aufgabe[0]
        var count = await Aufgabe.increaseDownloads(aufgabe.aufgaben_id)
        //console.log(aufgabe)
        console.log("Sending file: " + aufgabe.files.fileName + '.' + aufgabe.files.type + " - downloaded " + count + " times so far")
        res.download(path.join(__dirname, '../files/', aufgabe.aufgaben_id + '.' + aufgabe.files.type), aufgabe.files.fileName + '.' + aufgabe.files.type);
    }catch(error){
       if (error.code == 405) {
            console.log("File not found")
            res.json({status: 404, response:"file not found"})
        } else {
            console.log(error)
            res.json({status: 404, response:"file not found"})
        }
    }
    //res.sendFile(path.join(__dirname, '../files/', req.params.code));
});

router.post('/api/v1/change/user', limitApi, async(req, res) => {
    if(req.body != undefined){
        if(req.body.apiKey == apiKey){
            try{
                if(req.body.user_id != undefined){
                    var user = await User.findByOneUserId(req.body.user_id)
                }else if(req.body.email != undefined){
                    var user = await User.findByOneEmail(req.body.email)
                }else{
                    return res.json({status: 400, response:"error"})
                }
                console.log(user)
                if(req.body.role != undefined){
                    user.role = req.body.role
                }
                if(req.body.klassen != undefined){
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
            }catch(error){
            if (error.code == 405) {
                    console.log("user not found")
                    res.json({status: 404, response:"user not found"})
                } else {
                    console.log(error)
                    res.json({status: 400, response:"error"})
                }
            }
        }else{
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    }else{
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.get('/api/v1/get/aufgabe', limitApi, async(req, res) => {
    if(req.query != undefined){
        if(req.query.apiKey == apiKey){
            try{
                if(req.query.new != undefined){
                    //console.log(req.query.new)
                    if(req.query.new == 'true'){
                        console.log("is new: " + isNew)
                        if(isNew == true){
                            var run = true;
                        }else{
                            var run = false;
                        }
                    }else{
                        var run = true;
                    }
                }else{
                    var run = true;
                }
                if(run){
                    if(req.query.id != undefined){
                        var aufgaben = await Aufgabe.findById(req.query.id)
                    }else if(req.query.user != undefined){
                        var aufgaben = await Aufgabe.findByUserId(req.query.user)
                    }else if(req.query.klasse != undefined){
                        var aufgaben = await Aufgabe.findByKlasse(req.query.klasse)
                    }else if(req.query.abgabe != undefined){
                        var aufgaben = await Aufgabe.findByAbgabe(req.query.abgabe)
                    }else{
                        var aufgaben = await Aufgabe.findAll()
                    }
                    console.log(aufgaben)
                    var data = []
                    for(i in aufgaben){
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
                }else{
                    res.json({
                        status: 204, //No new content
                        response: "keine neuen aufgaben"
                    })
                }
            }catch(error){
            if (error.code == 405) {
                    console.log("Aufgabe not found")
                    res.json({status: 404, response:"aufgabe nicht gefunden"})
                } else {
                    console.log(error)
                    res.json({status: 500, response:"internal error bitte kontaktiere den support"})
                }
            }
        }else{
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    }else{
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.get('/api/v1/get/user', limitApi, async(req, res) => {
    if(req.query != undefined){
        if(req.query.apiKey == apiKey){
            try{
                if(req.query.id != undefined){
                    var user = await User.findById(req.query.id)
                }else if(req.query.klasse != undefined){
                    var user = await User.findByKlasse(req.query.klasse)
                }else if(req.query.email != undefined){
                    var user = await User.findByEmail(req.query.email)
                }else if(req.query.role != undefined){
                    var user = await User.findByRole(req.query.role)
                }else{
                    var user = await User.findAll()
                }
                console.log(user)
                var data = []
                for(i in user){
                    data.push({
                        user_id: user[i].user_id,
                        name: user[i].name,
                        email: user[i].email,
                        klassen: user[i].klassen,
                        role: user[i].role,
                        registeredAt: user[i].registeredAt
                    })
                }
                res.json({
                    status: 200,
                    response: 'success',
                    type: 'data',
                    data: data
                })
            }catch(error){
            if (error.code == 405) {
                    console.log("User not found")
                    res.json({status: 404, response:"user nicht gefunden"})
                } else {
                    console.log(error)
                    res.json({status: 500, response:"internal error, bitte kontaktiere support"})
                }
            }
        }else{
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    }else{
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.get('/api/v1/verify', limitApi, async(req, res) => {
    if(req.query != undefined){
        if(req.query.apiKey == apiKey){
            try{
                var user = await User.findByOneEmail(req.query.email)
                console.log(user)
                var code = generate('123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz', 6)
                var email = user.email
                var vorname = user.name.split(' ')[0]
                var data = await ejs.renderFile('./views/verifyMail.ejs', { name: vorname, code: code });
                const mailOptions = {
                    from: `"ZGK Mailer" zgk@mxis.ch`,
                    replyTo: 'zgk@mxis.ch',
                    to: email,
                    subject: 'Email Verifizierung',
                    html: data,
                    text: `Moin, ${vorname}!\n Du willst den Bot nutzen? Dann musst du nur noch schnell deine Email Verifizieren. Gib dazu einfach folgenden Code bei dem Bot ein: \n ${code}\n Falls du keinen Bot erstellt hast, ignoriere diese Email einfach`
                };
                //console.log(mailOptions)
                transporter.sendMail(mailOptions, function(err, info) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(info.messageTime + " ms");
                        console.log("Verify email send to: " + email + " with code: " + code)
                        //console.log(info)
                    }
                });
                res.json({
                    status: 200,
                    response: 'success',
                    type: 'data',
                    data: {
                        code: code,
                        email: email
                    }
                })
                  
            }catch(error){
            if (error.code == 405) {
                    console.log("User not found")
                    res.json({status: 404, response:"user nicht gefunden"})
                } else {
                    console.log(error)
                    res.json({status: 500, response:"internal error, bitte kontaktiere support"})
                }
            }
        }else{
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    }else{
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.post('/api/v1/create/aufgabe', limitApi, async(req, res) => {
    if(req.body != undefined){
        if(req.body.apiKey == apiKey){
            var uid = generate('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16)
            var query = {   
                aufgaben_id: uid,
                user_id: req.body.user_id,
                text: req.body.text,
                fach: req.body.fach,
                abgabe: req.body.abgabe,
                files: {count: 0},
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
                        console.log("Aufgabe added as: " + uid)
                        res.json({
                            status: '200',
                            response: "success",
                            type: 'data',
                            data:{
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
        }else{
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    }else{
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});

router.post('/api/v1/delete/aufgabe', limitApi, middleware.auth(), async(req, res) => {
    if(req.query != undefined){
        if(req.query.apiKey == apiKey){
            try{
                const aufgabe = await Aufgabe.findOne({ aufgaben_id: req.query.id })
                if (!aufgabe) {
                    throw ({ error: 'aufgabe not found', code: 405 })
                }
                await aufgabe.deleteOne({ aufgaben_id: aufgabe.aufgaben_id })
                    .then(doc => {
                        console.log(doc)
                        middleware.resetCache(doc.klasse)
                        res.json({
                            status: 200,
                            response: 'success'
                        })
                    })
                    .catch(err => {
                        console.error(err)
                        res.json({status: 500, response:"es ist ein fehler aufgetreten"})
                    })
            }catch(error){
                if (error.code == 405) {
                    console.log("aufgabe not found")
                    res.json({status: 404, response:"aufgabe nicht gefunden"})
                } else {
                    console.log(error)
                    res.json({status: 500, response:"es ist ein fehler aufgetreten"})
                }
            }
        }else{
            res.json({
                status: '401',
                response: "nicht autorisiert"
            });
        }
    }else{
        res.json({
            status: '400',
            response: 'kein api key gesendet'
        });
    }
});


router.get('/api/v1/test', limitApi, async(req, res) => {
    res.json({status: 200, response: "Guten Tag"})
});

router.post('/api/v1/test', limitApi, async(req, res) => {
    console.log(req.body)
    res.json({status: 200, response: "Guten Tag", data: req.body})
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