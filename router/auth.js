const express = require('express')
const fs = require('fs');
const session = require('express-session')
const crypto = require('crypto')
const md5 = require('md5');
const generate = require('nanoid/generate')
const bcrypt = require('bcryptjs')

const router = express.Router()
const middleware = require("../middleware/middleware")

let mongoose = require('mongoose')
const Exercise = require('../models/exercise')
const User = require('../models/user')
const Invite = require("../models/invite")
const Class = require("../models/class")
const School = require("../models/school")
const Solution = require("../models/solution")

var salt = require('../key.json').salt

router.use(session({
    secret: crypto.randomBytes(64).toString("base64"),
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 15 * 60 * 60 * 1000
    }
}));

router.post('/auth/login', async(req, res) => {
    try {
        var user = await User.checkLogin(req.body.email, req.body.password)
        console.log("Login: " + user.name + " success")
        //console.log(user.classes)
        var user = await User.findOne({_id: user._id}).populate("classes", "name")
        //console.log(user)
        req.session.role = user.role;
        req.session.name = user.name;
        req.session.user_id = user._id;
        req.session._id = user._id;
        req.session.classes = user.classes.map(({ _id }) => _id);
        req.session.classNames = user.classes.map(({ name }) => name);
        req.session.school = user.school;
        res.json({ status: 200, response: "success", data: { name: user.name, role: user.role, classes: user.classes.map(({ _id }) => _id) } })
    
    } catch (error) {
        if (error.code == 408) {
            console.log("Login: Wrong Password")
            res.json({
                status: '408',
                response: "Wrong password"
            });
        } else if (error.code == 405) {
            console.log("Login: User not found")
            res.json({
                status: '405',
                response: "User doesn't exist"
            });

        } else {
            console.log(error)
            res.json({
                status: '400',
                response: "Error"
            });
        }
    }
})

router.post('/auth/register', async(req, res) => {
    var email = req.body.email
    var password = req.body.password;
    var name = req.body.name;
    try {
        var invite = await Invite.checkToken(req.body.token)
            //console.log(invite)
        if (!req.body.ref) {
            var ref = "/"
        } else {
            var ref = "/" + req.body.ref;
        }
        if (email.length < 5 || name.length <= 2) {
            console.log("Not every field filled out");
            res.json({
                status: '408'
            });
        } else if (/\s/.test(password)) {
            console.log("Password has whitespace");
            res.json({
                status: '404'
            });
        } else if (password.length > 20) {
            console.log("Password is too long");
            res.json({
                status: '405'
            });
        } else if (password.length < 8) {
            console.log("Password is too short");
            res.json({
                status: '406'
            });
        } else if (password.length >= 0) {
            if (/\s/.test(email)) {
                console.log(email + " not valid");
                res.json({
                    status: '407'
                });
            } else {
                var sendClass = await Class.findOne({_id: invite.class});
                if(!sendClass){
                    return res.json({status: 404, response: "class not found"})
                }
                console.log("Name: " + email + " is using Invite: " + invite._id + " with role: " + invite.role)
                var query = {
                    _id: new mongoose.Types.ObjectId(),
                    email: email,
                    name: name,
                    password: password,
                    invite: invite._id,
                    botKey: generate('1234567890abcdefghkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', 6),
                    classes: [invite.class],
                    school: invite.school,
                    role: invite.role,
                    registeredAt: CurrentDate(),
                }
                try {
                    let user = new User(query)
                    user.save(async function(err, doc) {
                        if (err) {
                            console.log(err)
                            if (err.code == 11000) {
                                console.log("Email already in use")
                                res.json({
                                    status: '407',
                                    response: "Email already in use"
                                });
                            } else {
                                console.error(err)
                                res.json({
                                    status: '400'
                                });
                            }
                        } else {
                            sendClass.users.push(doc._id)
                            sendClass.save(async function(err, doc) {
                                if (err) {
                                    console.error(err)
                                    res.json({
                                        status: '400'
                                    });
                                } else {
                                    console.log(user.name + " has been registered as " + user._id)
                                    var count = await Invite.increaseUsed(invite.invite_id)
                                    req.session.role = user.role;
                                    req.session.name = user.name;
                                    req.session.user_id = user._id;
                                    req.session._id = user._id;
                                    req.session.classes = sendClass._id;
                                    req.session.classNames = [sendClass.name];
                                    req.session.school = user.school;
                                    console.log("Invite: " + invite._id + " " + count + "/" + invite.used.max + " times used")
                                    res.json({
                                        status: '200',
                                        response: "user created",
                                        data: {
                                            _id: user._id,
                                            name: user.name,
                                            role: user.role,
                                            classes: user.classes
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
            }
        } else {
            console.log(password + " is not valid");
            res.json({
                status: '401'
            });
        }
    } catch (error) {
        if (error.code == 408) {
            console.log("invite already used")
            res.json({
                status: '401',
                response: "invite already used"
            });
        } else if (error.code == 405) {
            console.log(error.error)
            res.json({
                status: '401',
                response: "invite doesn't exist"
            });

        } else {
            console.log(error)
            res.json({
                status: '400',
                response: "Error"
            });
        }
    }
})

router.post('/api/auth/change/password', middleware.auth(), async(req, res) => {
    //console.log(req.session)
    if (req.body != undefined) {
        if (req.body.oldPassword != undefined && req.body.newPassword != undefined) {
            try {
                var user = await User.checkPassword(req.session.user_id, req.body.oldPassword)
                console.log(user.name + " is trying to change their password")
                if (/\s/.test(req.body.newPassword)) {
                    console.log("Password has whitespace");
                    res.json({
                        status: '402'
                    });
                } else if (req.body.newPassword.length > 20) {
                    console.log("Password is too long");
                    res.json({
                        status: '405'
                    });
                } else if (req.body.newPassword.length < 8) {
                    console.log("Password is too short");
                    res.json({
                        status: '406'
                    });
                } else if (req.body.newPassword.length >= 0) {
                    try {
                        var user = await User.changePassword(req.session.user_id, req.body.newPassword)
                        if (!user) {
                            console.log(user)
                            return res.json({
                                status: '400',
                                response: "Error"
                            });
                        }
                        console.log(user.name + " changed their password")
                        res.json({
                            status: 200,
                            response: "changed"
                        })
                    } catch (error) {
                        if (error.code == 405) {
                            console.log(error.error)
                            res.json({
                                status: '403',
                                response: "user doesn't exist"
                            });

                        } else {
                            console.log(error)
                            res.json({
                                status: '400',
                                response: "Error"
                            });
                        }
                    }
                } else {
                    console.log(password + " is not valid");
                    res.json({
                        status: '401'
                    });
                }
            } catch (error) {
                if (error.code == 405) {
                    console.log(error.error)
                    res.json({
                        status: '403',
                        response: "user doesn't exist"
                    });

                } else if (error.code == 406) {
                    console.log(error.error)
                    res.json({
                        status: '408',
                        response: "wrong password"
                    });
                } else {
                    console.log(error)
                    res.json({
                        status: '400',
                        response: "Error"
                    });
                }
            }
        } else {
            res.json({
                status: '407',
                response: "no password sent"
            });
        }
    } else {
        res.json({
            status: '407',
            response: "no password sent"
        });
    }
})

router.post('/auth/check/invite', async(req, res) => {
    try {
        var invite = await Invite.checkToken(req.body.token)
        res.json({
            status: 200,
            response: "success",
            data: {
                inviteUrl: invite.inviteUrl,
                token: invite.token,
                used: invite.used.count,
                max: invite.used.max,
                klasse: invite.klasse,
                klassen: [invite.klasse],
                name: invite.name,
                role: invite.role,
                type: invite.type
            }
        })
    } catch (error) {
        if (error.code == 408) {
            console.log("invite already used")
            res.json({
                status: '401',
                response: "invite already used"
            });
        } else if (error.code == 405) {
            console.log(error.error)
            res.json({
                status: '403',
                response: "invite doesn't exist"
            });

        } else {
            console.log(error)
            res.json({
                status: '400',
                response: "Error"
            });
        }
    }
})

router.get('/api/auth/', middleware.auth(), async(req, res) => {
    //console.log(req.session)
    res.json({
        status: 200,
        response: "authenticated",
        data: {
            name: req.session.name,
            role: req.session.role,
            classes: req.session.classNames
        }
    })
})

/*
router.get('/api/hash/emails', async(req, res) => {
    console.log("Starting hashing...")
    const users = await User.find()
    console.log(users)
    console.log("Starting hashing...")
    for(i in users){
        console.log("Hashing: " + users[i].email)
        var emailHash = hashEmailAddress(users[i].email, salt)
        console.log("Hash: " + emailHash)
        await User.findOneAndUpdate({_id: users[i]._id}, {$set: {email: emailHash}})
    }
    console.log("done")
    console.log(users)
    res.json({
        status: 200, 
        response: "success"
    })
})*/

router.get('/api/auth/new', middleware.auth({ lehrer: true }), async(req, res) => {
    console.log(req.session.name + " visited /new")
    res.json({
        status: 200,
        response: "authenticated",
        data: {
            name: req.session.name,
            role: req.session.role,
            classes: (req.session.role == 'admin') ? null : req.session.classNames
        }
    })
})

router.get('/api/auth/account', middleware.auth(), async(req, res) => {
    console.log(req.session.name + " visited /account")
    try {
        var user = await User.findOne({ _id: req.session._id })
        if (user.botKey == undefined) {
            var botKey = await User.generateBotKey(req.session._id);
        } else {
            var botKey = user.botKey;
        }
        res.json({
            status: 200,
            response: "authenticated",
            data: {
                name: req.session.name,
                role: req.session.role,
                botKey: botKey,
                classes: (req.session.role == 'admin') ? null : req.session.classNames
            }
        })
    } catch (error) {
        if (error.code == 405) {
            console.log("user not found")
            res.json({ status: 405, response: "user not found" })
        } else {
            console.log(error)
            res.json({ status: 404, response: "file not found" })
        }
    }
})

router.get('/api/auth/exercise', middleware.auth(), async(req, res) => {
    console.log(req.session.name + " visited /aufgabe")
    if (req.query != undefined) {
        if (req.query.id != undefined) {
            try {
                var exercise = await Exercise.findOne({ _id: req.query.id }).populate("class", "name")
                if(!exercise){
                    console.log("Fehler: Aufgabe existiert nicht")
                    return res.json({ status: 404, response: "aufgabe nicht gefunden" })
                }
                //console.log(exercise.class)
                //console.log(req.session.classes)
                if (req.session.classes.includes(String(exercise.class._id))) {
                    res.json({
                        status: 200,
                        response: "authenticated",
                        data: {
                            text: exercise.text,
                            subject: exercise.subject,
                            deadline: exercise.deadline,
                            _id: exercise._id,
                            fileUrl: exercise.files.fileUrl,
                            class: exercise.class.name
                        },
                        user: {
                            name: req.session.name,
                            role: req.session.role,
                            _id: req.session._id,
                        }
                    })
                } else {
                    console.log("Fehler: " + req.session.name + " ist gehört nicht der Klasse: " + exercise.class._id + " an")
                    res.json({ status: 403, response: "nicht autorisiert" })
                }
            } catch (error) {
                if (error.code == 405) {
                    console.log("exercise not found")
                    res.json({ status: 404, response: "aufgabe nicht gefunden" })
                } else if (error.name == "CastError") {
                    console.log("exercise not found")
                    res.json({ status: 404, response: "aufgabe nicht gefunden" })
                }else {
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

router.get('/logout', function(req, res) {
    console.log(req.session.name + " logged out")
    req.session.destroy();
    res.redirect('/');
});

function hashEmailAddress(email, salt) {
    var sum = crypto.createHash('sha256');
    sum.update(email + salt);
    return sum.digest('hex');
}

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

function validEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

module.exports = router