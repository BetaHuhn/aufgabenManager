const express = require('express')
const fs = require('fs');
const session = require('express-session')
const crypto = require('crypto')
const md5 = require('md5');
const generate = require('nanoid/generate')

const router = express.Router()
const middleware = require("../middleware/middleware")
var User = require("../models/user")
var Invite = require("../models/invite")
router.use(middleware.log())

router.use(session({
    secret: crypto.randomBytes(64).toString("base64"),
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: true,
        maxAge: 15 * 60 * 60 * 1000
    }
}));
//Start1232020!!
var apiKey = "RwU17qiCZTBihTy7KSgFLjFzg5NDO-YXcL1I8pU2Tco4HrcgBQvXQ3kzoAe2MA5ZnplQ7ZY1dFIG_9bAGSJSQg"

router.post('/auth/login', async(req, res) => {
    try{
        var user = await User.checkLogin(req.body.email, req.body.password)
        console.log(user.name + " login success")
        req.session.role = user.role;
        req.session.email = user.email;
        req.session.name = user.name;
        req.session.user_id = user.user_id;
        req.session.klasse = user.klasse;
        req.session.klassen = user.klassen;
        res.json({status:200, response: "success", data: {email: user.email, name: user.name, role: user.role, klassen: user.klassen}})
    }catch(error){
        if (error.code == 408) {
            console.log("Wrong password")
            res.json({
                status: '408',
                response: "Wrong password"
            });
        } else if (error.code == 405) {
            console.log(error.error)
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
    try{
        var invite = await Invite.checkToken(req.body.token)
        console.log(invite)
        if (!req.body.ref) {
            var ref = "/"
        } else {
            var ref = "/" + req.body.ref;
        }
        console.log("Name: " + name + " Email: " + email)
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
        } else if (password.match("^[-_!?a-zA-Z0-9]*$")) {
            if (validEmail(email) == false) {
                console.log(email + " not valid");
                res.json({
                    status: '407'
                });
            } else {
                var query = {
                    user_id: generate('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 7),
                    email: email,
                    name: name,
                    password: password,
                    token: invite.token,
                    invite_id: invite.invite_id,
                    klasse: invite.klasse,
                    klassen: [invite.klasse],
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
                            console.log(doc)
                            var count = await Invite.increaseUsed(invite.invite_id)
                            req.session.role = doc.role;
                            req.session.email = doc.email;
                            req.session.name = doc.name;
                            req.session.user_id = doc.user_id;
                            req.session.klasse = user.klasse;
                            req.session.klassen = user.klassen;
                            console.log("Invite: " + invite.invite_id + " " + count + "/" + invite.used.max + " times used")
                            res.json({
                                status: '200',
                                response: "user created",
                                data: {
                                    name: doc.name,
                                    email: doc.email,
                                    role: doc.role,
                                    klassen: doc.klassen
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
            }
        } else {
            console.log(password + " is not valid");
            res.json({
                status: '401'
            });
        }
    }catch(error){
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

router.post('/auth/check/invite', async(req, res) => {
    try{
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
    }catch(error){
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
    console.log(req.session)
    res.json({
        status: 200, 
        response: "authenticated", 
        data: {
            name: req.session.name, 
            email: req.session.email, 
            role: req.session.role,
            klassen: req.session.klassen
        }
    })
})

router.get('/api/auth/new', middleware.auth({lehrer: true}), async(req, res) => {
    console.log(req.session)
    res.json({
        status: 200, 
        response: "authenticated", 
        data: {
            name: req.session.name, 
            email: req.session.email, 
            role: req.session.role,
            klassen: (req.session.role == 'admin') ? null : req.session.klassen
        }
    })
})

router.get('/logout', function (req, res) {
    console.log("User logged out")
    req.session.destroy();
    res.redirect('/');
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

function validEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

module.exports = router