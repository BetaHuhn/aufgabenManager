const express = require('express')
const crypto = require('crypto')
const generate = require('nanoid/generate')
const nodemailer = require('nodemailer')
var ejs = require("ejs");

const router = express.Router()
const middleware = require("../middleware/middleware")

let mongoose = require('mongoose')
const Exercise = require('../models/exercise')
const User = require('../models/user')
const Invite = require("../models/invite")
const Class = require("../models/class")
const School = require("../models/school")
const Solution = require("../models/solution")

const { privateEmailUser, privateEmailPassword } = require('../key.json')
let transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
        user: privateEmailUser,
        pass: privateEmailPassword
    }
});

router.post('/auth/login', async(req, res) => {
    try {
        var user = await User.checkLogin(req.body.email, req.body.password)
        console.log("Login: " + user.name + " success")
            //console.log(user.classes)
        var user = await User.findOne({ _id: user._id }).populate("classes", "name")
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
    var email = req.body.email.toLowerCase()
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
        if (email.length < 1 || name.length < 1) {
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
            if (!validEmail(email)) {
                console.log(email + " not valid");
                res.json({
                    status: '407'
                });
            } else {
                var sendClass = await Class.findOne({ _id: invite.class });
                if (!sendClass) {
                    return res.json({ status: 404, response: "class not found" })
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
                            if (err.code == 11000) {
                                console.log("Email already in use")
                                res.json({
                                    status: '410',
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
                                    var count = await Invite.increaseUsed(invite._id)
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
                        var user = await User.changePassword(req.session._id, req.body.newPassword)
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

/* If token valid render reset page */
router.get('/reset', async(req, res) => {
    console.log(req.query.token)
    if (req.query != undefined) {
        if (req.query.token != undefined) {
            try {
                var user = await User.findOne({ resetPasswordToken: req.query.token })
                if (!user) {
                    console.log("user not found")
                    return res.sendStatus(404)
                }
                console.log("time: " + new Date().getTime())
                console.log("expires: " + user.resetPasswordExpires)
                if (user.resetPasswordExpires >= (new Date().getTime())) {
                    console.log(user.name + " is using token to reset their password")
                    res.render('resetPassword.ejs', { token: req.query.token })
                } else {
                    console.log("token expired")
                    return res.send("Der Link ist abgelaufen")
                }
            } catch (error) {
                console.log(error)
                res.json({
                    status: '400',
                    response: "Error"
                });
            }
        } else {
            res.sendStatus(404)
        }
    } else {
        res.sendStatus(404)
    }
})

/* Send Password reset email */
router.post('/api/auth/reset/password/request', async(req, res) => {
    if (req.body != undefined) {
        if (req.body.email != undefined) {
            try {
                var user = await User.findByOneEmail(req.body.email)
                console.log(user.name + " is requesting to reset their password")
                var token = await User.generateResetToken(user._id)
                var vorname = user.name.split(' ')[0]
                var data = await ejs.renderFile('./views/verifyMail.ejs', { name: vorname, token: token });
                const mailOptions = {
                    from: `"ZGK Mailer" zgk@mxis.ch`,
                    replyTo: 'zgk@mxis.ch',
                    to: req.body.email,
                    subject: 'Passwort zurücksetzen',
                    html: data,
                    text: `Moin, ${vorname}!\n Um dein Passwort zurückzusetzen musst du nur noch auf diesen Link klicken (nur 30 min gültig): \n https://zgk.mxis.ch/reset?token=${token}\n Falls du dein Passwort nicht zurückzusetzen willst, ignoriere diese Email einfach`
                };
                transporter.sendMail(mailOptions, function(err, info) {
                    if (err) {
                        console.log(err)
                        res.json({
                            status: 400,
                            error: err
                        })
                    } else {
                        console.log("Password Reset Mail sent to " + req.body.email)
                        res.json({
                            status: 200,
                            response: "email sent",
                            data: {
                                email: req.body.email
                            }
                        })
                    }
                });
            } catch (error) {
                if (error.code == 405) {
                    console.log(error.error)
                    res.json({
                        status: '404',
                        response: "user not found"
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
                response: "no email sent"
            });
        }
    } else {
        res.json({
            status: '407',
            response: "no email sent"
        });
    }
})

/* Create new Password with token */
router.post('/api/auth/reset/password', async(req, res) => {
    console.log(req.body)
    if (req.body != undefined) {
        if (req.body.token != undefined && req.body.password != undefined) {
            try {
                var user = await User.findOne({ resetPasswordToken: req.body.token })
                if (user.resetPasswordExpires < (new Date().getTime())) {
                    console.log("token expired")
                    return res.json({
                        status: 410,
                        response: "token expired"
                    })
                }
                console.log(user.name + " is trying to reset their password")
                if (/\s/.test(req.body.password)) {
                    console.log("Password has whitespace");
                    res.json({
                        status: '402'
                    });
                } else if (req.body.password.length > 20) {
                    console.log("Password is too long");
                    res.json({
                        status: '405'
                    });
                } else if (req.body.password.length < 8) {
                    console.log("Password is too short");
                    res.json({
                        status: '406'
                    });
                } else if (req.body.password.length >= 0) {
                    try {
                        var user = await User.changePassword(user._id, req.body.password)
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
                                status: '404',
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
                    console.log(req.body.password + " is not valid");
                    res.json({
                        status: '401'
                    });
                }
            } catch (error) {
                if (error.code == 405) {
                    console.log(error.error)
                    res.json({
                        status: '404',
                        response: "token not found"
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
        var user = await User.findOne({ _id: req.session._id }).populate('classes', 'name')
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
                classes: user.classes
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
                if (!exercise) {
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