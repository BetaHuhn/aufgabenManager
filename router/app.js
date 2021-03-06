const express = require('express')
const fileUpload = require('express-fileupload');
const request = require('request');
const _ = require('lodash');
const zipFolder = require('zip-folder');
const slowDown = require("express-slow-down");
const CurrentDate = require("../utils/currentDate");
const mongoose = require('mongoose');
const middleware = require("../middleware/middleware");
const statusCodes = require("../utils/status");
const log = require("../utils/log");
const router = express.Router();

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

const softLimit = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 100,
    delayMs: 200,
    maxDelayMs: 10 * 1000
});

router.get('/meetings', async(req, res) => {
    res.redirect("/dashboard?tab=meetings")
})

router.get('/aufgaben', async(req, res) => {
    res.redirect("/dashboard?tab=aufgaben")
})

router.get('/api/get/home', softLimit, middleware.auth(), async(req, res) => { //, middleware.cache(900)
    try {
        const classes = await Class.find({ '_id': { $in: req.session.classes } }).populate("exercises")
        let data = []
        for (i in classes) {
            for (j in classes[i].exercises) {
                data.push({
                    _id: classes[i].exercises[j]._id,
                    user_id: classes[i].exercises[j].user,
                    text: classes[i].exercises[j].text,
                    subject: classes[i].exercises[j].subject,
                    class: classes[i].name,
                    deadline: classes[i].exercises[j].deadline,
                    createdAt: classes[i].exercises[j].createdAt,
                    downloads: classes[i].exercises[j].downloads,
                    files: classes[i].exercises[j].files
                })
            }
        }
        log.info(req.session.name + " is getting home data -> Sending " + data.length + " exercises")
        res.json({
            status: 200,
            response: 'success',
            type: 'data',
            data: data,
            user: {
                user_id: req.session._id,
                name: req.session.name,
                role: req.session.role,
                klassen: req.session.classNames
            }
        })

    } catch (err) {
        if (err.code == 405) {
            log.warn("user not found")
            middleware.sendResult(res, "user not found", statusCodes.NOT_FOUND);
        } else {
            log.fatal(err);
            middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
        }
    }
});

router.post('/api/new/exercise', softLimit, middleware.auth({ lehrer: true }), async(req, res) => {
    log.info(req.body);
    if (req.body != undefined) {
        if ((req.body.klasse != undefined || req.body.klasse != '' || req.body.klasse.length != 0) && req.body.fach != undefined && req.body.abgabe != undefined && req.body.text != undefined) {
            if (req.session.classNames.includes(req.body.klasse) || req.session.role == "admin") {
                const userID = req.session._id //'5e8356c961d55a53b0027fd1'
                const sendClass = await Class.findOne({ name: req.body.klasse });
                if (!sendClass) {
                    return res.json({ status: 404, response: "class not found" })
                }
                const uid = new mongoose.Types.ObjectId();
                let files;
                if (!req.files || Object.keys(req.files).length === 0) {
                    log.info("No files uploaded")
                    files = { count: 0 }
                } else if (req.files.data.length == undefined || req.files.data.length <= 1) {
                    log.info("One file uploaded")
                    let photo = req.files.data;
                    let type = photo.name.split('.').pop();
                    let file_id = uid + "." + type;
                    photo.mv('./files/' + file_id, function(err) {
                        if (err) throw err;
                        log.info("File " + file_id + " moved")
                    })
                    files = {
                        count: 1,
                        type: type,
                        fileName: (req.body.filename == undefined || req.body.filename === "" || req.body.filename.length == 0 || req.body.filename == null) ? req.body.fach + "Aufgabe" : req.body.filename,
                        fileUrl: "https://zgk.mxis.ch/api/v1/download/" + file_id
                    }
                } else {
                    let count = req.files.data.length;
                    log.info(count + " files uploaded")
                    _.forEach(_.keysIn(req.files.data), (key) => {
                        let file = req.files.data[key];
                        file.mv('./files/uploads/' + uid + "/" + file.name, function(err) {
                            if (err) throw err;
                            log.info("File " + file.name + " moved")
                        })
                    });
                    zipFolder('./files/uploads/' + uid + '/', './files/' + uid + ".zip", function(err) {
                        if (err) {
                            log.fatal(err);
                            return middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                        } else {
                            log.info('All files Zipped up: ' + uid + '.zip');
                        }
                    });
                    files = {
                        count: count,
                        type: 'zip',
                        fileName: (req.body.filename == undefined || req.body.filename === "" || req.body.filename.length == 0 || req.body.filename == null) ? req.body.fach + "Aufgabe" : req.body.filename,
                        fileUrl: "https://zgk.mxis.ch/api/v1/download/" + uid + '.zip'
                    }
                }
                const query = {
                    _id: uid,
                    user: userID,
                    text: req.body.text,
                    subject: req.body.fach,
                    deadline: req.body.abgabe,
                    files: files,
                    class: sendClass._id,
                    school: req.session.school,
                    createdAt: new Date(),
                    downloads: 0
                }
                try {
                    const exercise = new Exercise(query)
                    exercise.save(async function(err, doc) {
                        if (err) {
                            if (err.code == 11000) {
                                log.fatal(err);
                                middleware.sendResult(res, "exercise already exists", 407);
                            } else {
                                log.fatal(err);
                                middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                            }
                        } else {
                            log.info(doc);
                            middleware.setIsNew(true);
                            middleware.resetCache(doc.class);
                            const user = await User.findOne({ _id: userID });
                            if (user.exercises == undefined || user.exercises == null) {
                                user.exercises = [doc._id]
                            } else {
                                user.exercises.push(doc._id)
                            }
                            user.save(function(err) {
                                if (err) {
                                    log.fatal(err);
                                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                                }
                            });
                            if (sendClass.exercises == undefined || sendClass.exercises == null) {
                                sendClass.exercises = [doc._id]
                            } else {
                                sendClass.exercises.push(doc._id)
                            }
                            sendClass.save(function(err) {
                                if (err) {
                                    log.fatal(err);
                                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                                }
                            });
                            log.info("Exercise added as: " + uid);
                            middleware.sendResult(res, {
                                _id: doc._id,
                                text: doc.text,
                                fach: doc.subject,
                                abgabe: doc.deadline,
                                files: doc.files,
                                klasse: doc.class,
                                school: doc.school,
                                createdAt: doc.createdAt,
                                downloads: doc.downloads
                            }, statusCodes.OK);
                        }
                    })
                } catch (err) {
                    log.fatal(err)
                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                }
            } else {
                log.info(req.session.name + " is not part of " + req.body.klasse)
                middleware.sendResult(res, "not authorized to perform action", statusCodes.FORBIDDEN);
            }
        } else {
            log.warn("not all fields filled out");
            middleware.sendResult(res, "nicht alle Felder ausgefuellt", 421);
        }
    } else {
        log.warn("not all fields filled out")
        middleware.sendResult(res, "nicht alle Felder ausgefuellt", 421);
    }
})

router.get('/api/delete/exercise', softLimit, middleware.auth({ lehrer: true }), async(req, res) => {
    try {
        const exercise = await Exercise.findOne({ _id: req.query.id })
        if (!exercise) {
            log.warn("exercise not found");
            return middleware.sendResult(res, "exercise not found", statusCodes.NOT_FOUND);
        }
        if (req.session._id == exercise.user || req.session.role == 'admin') {
            await exercise.remove(async function(err, doc) {
                if (err) {
                    log.fatal(err);
                    return middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                }
                log.info(doc);
                middleware.resetCache(doc.class);
                log.info("Exercise: " + exercise._id + " deleted by " + req.session.name);
                middleware.sendResult(res, "success", statusCodes.OK);
            })
        } else {
            middleware.sendResult(res, "not authorized to perform action", statusCodes.UNAUTHORIZED);
        }
    } catch (err) {
        log.fatal(err);
        middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
    }
});

router.get('/register', softLimit, async(req, res) => {
    log.info(req.query.token + " was accessed")
    if (req.query == undefined) {
        res.render('inviteError.ejs', { message: 'Um einen Account zu erstellen, brauchst du zur Zeit einen Invite Link. Sende uns eine Mail für weitere Infos: zgk@mxis.ch' })
    } else if (req.query.token != undefined) {
        try {
            const invite = await Invite.checkToken(req.query.token)
            let roleString
            switch (invite.role) {
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
            res.render('register.ejs', { inviteUrl: invite.inviteUrl, token: invite.token, used: invite.used.count, max: invite.used.max, klasse: invite.class.name, name: invite.name, role: invite.role, roleString: roleString, type: invite.type })
        } catch (error) {
            if (error.code == 408) {
                log.warn("invite already used");
                res.render('inviteError.ejs', { message: 'Der Invite Link ist abgelaufen oder wurde zu oft benutzt' })
            } else if (error.code == 405) {
                log.warn("invite doesn't exist")
                res.render('inviteError.ejs', { message: 'Der Invite Link existiert nicht' })

            } else {
                log.fatal(error);
                res.render('inviteError.ejs', { message: 'Es ist ein Fehler aufgetreten, bitte lade die Seite neu' })
            }
        }
    } else {
        res.render('inviteError.ejs', { message: 'Um einen Account zu erstellen, brauchst du zur Zeit einen Invite Link. Sende uns eine Mail für weitere Infos: zgk@mxis.ch' })
    }
})

router.get('/api/get/solutions', softLimit, middleware.auth(), async(req, res) => { //{ user: true }
    if (req.query != undefined) {
        if (req.query.id != undefined) {
            try {
                const exercise = await Exercise.findOne({ _id: req.query.id })
                if (req.session.classes.includes(String(exercise.class))) {
                    try {
                        let solutions;
                        if (req.session.role == "teacher" || req.session.role == "admin") {
                            if (exercise.user == req.session._id || req.session.role == "admin") {
                                solutions = await Solution.find({ exercise: exercise._id }).populate("user", "name")
                            } else {
                                log.warn("Fehler: Die Aufgabe gehört " + req.session.name + " nicht");
                                middleware.sendResult(res, "keine lösungen gefunden", statusCodes.NOT_FOUND);
                            }
                        } else {
                            solutions = await Solution.findOne({ user: req.session._id, exercise: exercise._id })
                        }
                        if (solutions) {
                            let data = []
                            for (i in solutions.versions) {
                                data.push(solutions.versions[i])
                            }
                            res.json({
                                status: statusCodes.OK,
                                data: data,
                                user: {
                                    name: req.session.name,
                                    role: req.session.role,
                                    _id: req.session._id,
                                }
                            })
                        } else {
                            log.warn("Fehler: Keine Lösungen gefunden")
                            middleware.sendResult(res, "keine lösungen gefunden", statusCodes.NOT_FOUND);
                        }
                    } catch (err) {
                        if (err.code == 405) {
                            log.warn("Fehler: Keine Lösungen gefunden");
                            middleware.sendResult(res, "keine lösungen gefunden", statusCodes.NOT_FOUND);
                        } else {
                            log.fatal(err);
                            middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                        }
                    }
                } else {
                    log.warn("Fehler: " + req.session.name + " ist gehört nicht der Klasse: " + exercise.klasse + " an")
                    middleware.sendResult(res, "not authorized to perform action", statusCodes.FORBIDDEN);
                }
            } catch (err) {
                if (err.code == 405) {
                    log.warn("exercise not found");
                    middleware.sendResult(res, "exercise not found", statusCodes.NOT_FOUND);
                } else {
                    log.fatal(err);
                    middleware.sendResult(res, "error", statusCodes.SERVER_ERROR);
                }
            }
        } else {
            log.warn("Fehler: keine aufgaben id gesendet")
            middleware.sendResult(res, "exercise not found", statusCodes.NOT_FOUND);
        }
    } else {
        log.warn("Fehler: keine aufgaben id gesendet")
        middleware.sendResult(res, "parameters missing", statusCodes.BAD_REQUEST);
    }
})

/* Here xxxxxxxxxxxxxxxxxxxxxxxx*/
router.get('/api/get/table', softLimit, middleware.auth({ lehrer: true }), async(req, res) => { //{ user: true }
    log.info(req.session.name + " is getting table data")
    if (req.query != undefined) {
        if (req.query.id != undefined) {
            try {
                const exercise = await Exercise.findOne({ _id: req.query.id })
                if (req.session.classes.includes(String(exercise.class))) {
                    try {
                        if (exercise.user == req.session._id || req.session.role == "admin") {
                            const klasse = await Class.find({ _id: exercise.class }).populate({
                                path: 'users',
                                select: 'name role solutions',
                                populate: {
                                    path: 'solutions',
                                    match: { exercise: exercise._id },
                                    select: 'exercise createdAt',
                                }
                            })
                            let data = []
                            for (i in klasse) {
                                for (j in klasse[i].users) {
                                    if (klasse[i].users[j].role == "user") {
                                        if (klasse[i].users[j].solutions.length >= 1) {
                                            data.push({
                                                _id: klasse[i].users[j]._id,
                                                name: klasse[i].users[j].name,
                                                solutions: klasse[i].users[j].solutions,
                                                fileUrl: "https://zgk.mxis.ch/api/v1/solution/download?id=" + klasse[i].users[j].solutions[0]._id,
                                                status: true,
                                                createdAt: klasse[i].users[j].solutions[klasse[i].users[j].solutions.length - 1].createdAt
                                            })
                                        } else {
                                            data.push({
                                                _id: klasse[i].users[j]._id,
                                                name: klasse[i].users[j].name,
                                                solutions: [],
                                                fileUrl: null,
                                                status: false,
                                                createdAt: null
                                            })
                                        }
                                    }
                                }
                            }
                            res.json({
                                status: 200,
                                response: "success",
                                data: data,
                                exercise: exercise._id,
                                user: {
                                    name: req.session.name,
                                    role: req.session.role,
                                    _id: req.session._id,
                                }
                            })
                        } else {
                            log.info("Fehler: Die Aufgabe gehört " + req.session.name + " nicht")
                            res.json({ status: 404, response: "keine lösungen gefunden" })
                        }

                    } catch (error) {
                        if (error.code == 405) {
                            log.info("Fehler: Keine Lösungen gefunden")
                            res.json({ status: 404, response: "keine lösungen gefunden" })
                        } else {
                            log.fatal(error)
                            res.json({ status: 400, response: "error" })
                        }
                    }
                } else {
                    log.info("Fehler: " + req.session.name + " ist gehört nicht der Klasse: " + exercise.klasse + " an")
                    res.json({ status: 403, response: "nicht autorisiert" })
                }
            } catch (error) {
                if (error.code == 405) {
                    log.info("exercise not found")
                    res.json({ status: 404, response: "exercise nicht gefunden" })
                } else {
                    log.fatal(error)
                    res.json({ status: 400, response: "error" })
                }
            }
        } else {
            log.info("Fehler: keine aufgaben id gesendet")
            res.json({ status: 404, response: "exercise nicht gefunden" })
        }
    } else {
        log.info("Fehler: keine aufgaben id gesendet")
        res.json({ status: 405, response: "exercise nicht gefunden" })
    }
})

router.post('/api/new/solution', softLimit, middleware.auth({ user: true }), async(req, res) => {
    log.info(req.session.name + " lädt eine Lösung hoch")
    if (req.body != undefined) {
        if (req.body.id != undefined) {
            try {
                const exercise = await Exercise.findOne({ _id: req.body.id }).populate("solutions");
                if (req.session.classes.includes(String(exercise.class))) {
                    const solution = await Solution.findOne({ exercise: exercise._id, user: req.session._id })
                    if (solution) {
                        let uid = new mongoose.Types.ObjectId();
                        let today = new Date();
                        let date = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2) + "_" + ("0" + today.getHours()).slice(-2) + "-" + ("0" + today.getMinutes()).slice(-2) + "-" + ("0" + today.getSeconds()).slice(-2);
                        let files;
                        if (!req.files || Object.keys(req.files).length === 0) {
                            log.info("Fehler: Keine Datei hochgeladen")
                            res.json({
                                status: 400,
                                response: "keine Datei hochgeladen"
                            })
                        } else if (req.files.data.length == undefined || req.files.data.length <= 1) {
                            log.info("One file uploaded")
                            let photo = req.files.data;
                            let type = photo.name.split('.').pop();
                            let file_id = uid + "." + type;
                            files = {
                                count: 1,
                                type: type,
                                fileName: req.session.name.replace(/\s/g, "") + "-" + date
                            }
                            photo.mv('./files/solutions/' + solution._id + "/" + files.fileName + "." + type, function(err) {
                                    if (err) throw err;
                                    log.info("File " + file_id + " moved")
                                })
                                //log.info(req.body.filename)
                        } else {
                            let count = req.files.data.length;
                            log.info(count + " files uploaded")
                            _.forEach(_.keysIn(req.files.data), (key) => {
                                let file = req.files.data[key];

                                //move photo to uploads directory
                                file.mv('./files/uploads/' + uid + "/" + file.name, function(err) {
                                    if (err) throw err;
                                    log.info("File " + file.name + " moved")
                                })
                            });
                            files = {
                                count: count,
                                type: 'zip',
                                fileName: req.session.name.replace(/\s/g, "") + "-" + date
                            }
                            zipFolder('./files/uploads/' + uid + '/', './files/solutions/' + solution._id + "/" + files.fileName + ".zip", function(err) {
                                if (err) {
                                    log.info('oh no!', err);
                                } else {
                                    log.info('All files Zipped up: ' + uid + '.zip');
                                }
                            });
                        }
                        zipFolder('./files/solutions/' + solution._id + '/', './files/solutions/' + solution._id + ".zip", function(err) {
                            if (err) {
                                log.info('oh no!', err);
                            } else {
                                log.info('All files Zipped up: ' + uid + '.zip');
                                solution.file.multiple = true;
                                solution.file.type = "zip"
                                solution.versions.push({
                                    _id: uid,
                                    createdAt: CurrentDate(),
                                    files: files
                                })
                                solution.save(function(err, doc) {
                                    if (err) {
                                        log.fatal(err);
                                    }
                                    log.info("Lösung hinzugefügt als: " + doc._id)
                                    res.json({
                                        status: '200',
                                        response: "success",
                                        type: 'data',
                                        data: {
                                            _id: solution._id,
                                            user: solution.user,
                                            exercise: solution.exercise,
                                            subject: solution.subject,
                                            class: solution.class,
                                            school: solution.school,
                                            file: solution.file,
                                            versions: solution.versions,
                                            access: solution.access,
                                            createdAt: solution.createdAt
                                        }
                                    });
                                });
                            }
                        });

                    } else {
                        let uid = new mongoose.Types.ObjectId();
                        let today = new Date();
                        let date = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2) + "_" + ("0" + today.getHours()).slice(-2) + "-" + ("0" + today.getMinutes()).slice(-2) + "-" + ("0" + today.getSeconds()).slice(-2);
                        let files;
                        if (!req.files || Object.keys(req.files).length === 0) {
                            log.info("Fehler: Keine Datei hochgeladen")
                            res.json({
                                status: 400,
                                response: "keine Datei hochgeladen"
                            })
                        } else if (req.files.data.length == undefined || req.files.data.length <= 1) {
                            log.info("One file uploaded")
                            let photo = req.files.data;
                            let type = photo.name.split('.').pop();
                            let file_id = uid + "." + type;
                            files = {
                                count: 1,
                                type: type,
                                fileName: req.session.name.replace(/\s/g, "") + "-" + date
                            }
                            photo.mv('./files/solutions/' + uid + "/" + files.fileName + "." + type, function(err) {
                                    if (err) throw err;
                                    log.info("File " + file_id + " moved")
                                })
                                //log.info(req.body.filename)
                        } else {
                            let count = req.files.data.length;
                            log.info(count + " files uploaded")
                            _.forEach(_.keysIn(req.files.data), (key) => {
                                let file = req.files.data[key];

                                //move photo to uploads directory
                                file.mv('./files/uploads/' + uid + "/" + file.name, function(err) {
                                    if (err) throw err;
                                    log.info("File " + file.name + " moved")
                                })
                            });
                            files = {
                                count: count,
                                type: 'zip',
                                fileName: req.session.name.replace(/\s/g, "") + "-" + date
                            }
                            zipFolder('./files/uploads/' + uid + '/', './files/solutions/' + uid + "/" + files.fileName + ".zip", function(err) {
                                if (err) {
                                    log.info('oh no!', err);
                                } else {
                                    log.info('All files Zipped up: ' + uid + '.zip');
                                }
                            });
                        }
                        const query = {
                            _id: uid,
                            user: req.session._id,
                            exercise: exercise._id,
                            subject: exercise.subject,
                            class: exercise.class,
                            school: exercise.school,
                            file: {
                                type: files.type,
                                multiple: false
                            },
                            versions: [{
                                _id: new mongoose.Types.ObjectId(),
                                createdAt: CurrentDate(),
                                files: files
                            }],
                            access: [exercise.user, req.session._id],
                            createdAt: CurrentDate()
                        }
                        try {
                            const solution = new Solution(query)
                            solution.save(async function(err, doc) {
                                if (err) {
                                    log.info(err)
                                    res.json({
                                        status: '400',
                                        type: 'error'
                                    });

                                } else {
                                    const user = await User.findOne({ _id: req.session._id })
                                    if (user.solutions == undefined || user.solutions == null) {
                                        user.solutions = [doc._id]
                                    } else {
                                        user.solutions.push(doc._id)
                                    }
                                    user.save(function(err) {
                                        if (err) {
                                            log.fatal(err);
                                        }
                                    });
                                    if (exercise.solutions == undefined || exercise.solutions == null) {
                                        exercise.solutions = [doc._id]
                                    } else {
                                        exercise.solutions.push(doc._id)
                                    }
                                    exercise.save(function(err) {
                                        if (err) {
                                            log.fatal(err);
                                        }
                                    });
                                    log.info("Lösung hinzugefügt als: " + doc._id)
                                    res.json({
                                        status: '200',
                                        response: "success",
                                        type: 'data',
                                        data: {
                                            _id: doc._id,
                                            user: doc.user,
                                            exercise: doc.exercise,
                                            subject: doc.subject,
                                            class: doc.class,
                                            school: doc.school,
                                            file: doc.file,
                                            versions: doc.versions,
                                            access: doc.access,
                                            createdAt: doc.createdAt
                                        }
                                    });
                                }
                            })
                        } catch (error) {
                            log.fatal(error)
                            res.json({
                                status: '400',
                                type: 'error'
                            });
                        }
                    }
                } else {
                    log.info("Fehler: " + req.session.name + " gehört nicht der Klasse: " + exercise.class + " an")
                    res.json({
                        status: '400',
                        type: 'error'
                    });
                }
            } catch (error) {
                if (error.code == 405) {
                    log.info("Fehler: Exercise not found")
                    res.json({ status: 404, response: "exercise nicht gefunden" })
                } else {
                    log.fatal(error)
                    res.json({ status: 500, response: "es ist ein fehler aufgetreten" })
                }
            }
        } else {
            log.info("Fehler: Keine Aufgaben ID gesendet")
            res.json({
                status: '400',
                type: 'keine exercise angegeben'
            });
        }
    } else {
        log.info("Fehler: Keine Aufgaben ID gesendet")
        res.json({
            status: '400',
            type: 'keine exercise angegeben'
        });
    }
})

router.get('/api/get/meetings', softLimit, middleware.auth(), async(req, res) => {
    log.info(req.session.name + " is getting meetings")
    try {
        let meetings = [];
        if (req.query.date != undefined) {
            log.info(req.query.date)
            let date = new Date(req.query.date)
            date.setHours(0, 0, 0, 0)
            let endDate = new Date(date)
            endDate.setHours(23, 59, 59, 59)
            meetings = await Meeting.find({ class: { $in: req.session.classes }, date: { "$lt": endDate, "$gte": date } }).sort({ date: 'asc' })
                //log.info(meetings)
            var data = [];
            for (i in meetings) {
                data.push({
                    _id: meetings[i]._id,
                    user: meetings[i].user,
                    class: meetings[i].class,
                    school: meetings[i].school,
                    subject: meetings[i].subject,
                    date: meetings[i].date,
                    createdAt: meetings[i].createdAt
                })
            }
        } else if (req.query.week != undefined) {
            /* week needs to be a ISO date of the first day of the given week */
            log.info(req.query.week)
            let date = new Date(req.query.week)
            date.setHours(0, 0, 0, 0)
            let endDate = new Date(date)
            endDate.setTime(endDate.getTime() + 5 * 86400000)
            endDate.setHours(23, 59, 59, 59)
            meetings = await Meeting.find({ class: { $in: req.session.classes }, date: { "$lt": endDate, "$gte": date } }).sort({ date: 'asc' })
                //log.info(meetings)
                /* Returns 2d Array that contains an array of meetings for each day of the week starting with sunday */
            var data = [
                [],
                [],
                [],
                [],
                []
            ]
            for (i in meetings) {
                let date = new Date(meetings[i].date)
                let day = date.getDay() - 1;
                if (day < 0) {
                    day = 6;
                }
                if (data[day] != undefined) {
                    if (data[day].length < 1) {
                        data[day] = [{
                            _id: meetings[i]._id,
                            user: meetings[i].user,
                            class: meetings[i].class,
                            school: meetings[i].school,
                            subject: meetings[i].subject,
                            date: meetings[i].date,
                            createdAt: meetings[i].createdAt
                        }]
                    } else {
                        data[day].push({
                            _id: meetings[i]._id,
                            user: meetings[i].user,
                            class: meetings[i].class,
                            school: meetings[i].school,
                            subject: meetings[i].subject,
                            date: meetings[i].date,
                            createdAt: meetings[i].createdAt
                        })
                    }
                }
            }
        }
        res.json({
            status: 200,
            response: "success",
            type: "data",
            data: data
        })
    } catch (error) {
        log.fatal(error)
        res.json({ status: 400, response: "error", type: "error" })
    }
})

router.post('/api/new/meeting', softLimit, middleware.auth({ lehrer: true }), async(req, res) => {
    log.info(req.session.name + " will ein meeting erstellen")
    if (req.body != undefined) {
        if ((req.body.klasse != undefined || req.body.klasse != '' || req.body.klasse.length != 0) && req.body.date != undefined) {
            if (req.session.classNames.includes(req.body.klasse) || req.session.role == "admin") {
                const sendClass = await Class.findOne({ name: req.body.klasse });
                if (!sendClass) {
                    return res.json({ status: 404, type: "error", response: "class not found" })
                }
                const uid = new mongoose.Types.ObjectId();
                const query = {
                    _id: uid,
                    user: req.session._id,
                    subject: req.body.subject,
                    date: new Date(req.body.date),
                    class: sendClass._id,
                    school: sendClass.school,
                    createdAt: new Date()
                }
                try {
                    const meeting = new Meeting(query)
                    meeting.save(async function(err, doc) {
                        if (err) {
                            log.info(err)
                            res.json({
                                status: '400',
                                type: 'error'
                            });

                        } else {
                            const user = await User.findOne({ _id: req.session._id })
                            if (user.meetings == undefined || user.meetings == null) {
                                user.meetings = [doc._id]
                            } else {
                                user.meetings.push(doc._id)
                            }
                            user.save(function(err) {
                                if (err) {
                                    log.fatal(err);
                                }
                            });
                            if (sendClass.meetings == undefined || sendClass.meetings == null) {
                                sendClass.meetings = [doc._id]
                            } else {
                                sendClass.meetings.push(doc._id)
                            }
                            sendClass.save(function(err) {
                                if (err) {
                                    log.fatal(err);
                                }
                            });
                            log.info("Meeting hinzugefügt als: " + doc._id)
                            res.json({
                                status: '200',
                                response: "success",
                                type: 'data',
                                data: doc
                            });
                        }
                    })
                } catch (error) {
                    log.fatal(error)
                    res.json({
                        status: '400',
                        type: 'error'
                    });
                }
            } else {
                log.info(req.session.name + " is not part of " + req.body.klasse)
                res.json({
                    status: '401',
                    type: "error",
                    response: 'nicht teil der Klasse ' + req.body.klasse
                });
            }
        } else {
            log.info("not all fields filled out")
            log.info(req.body)
            res.json({
                status: '421',
                type: "error",
                response: 'nicht alle Felder ausgefuellt'
            });
        }
    } else {
        log.info("not all fields filled out")
        log.info(req.body)
        res.json({
            status: '421',
            type: "error",
            response: 'nicht alle Felder ausgefuellt'
        });
    }
})

router.post('/api/admin/', softLimit, middleware.auth({ admin: true }), async(req, res) => {
    if (req.body != undefined) {
        const options = {
            url: 'http://' + process.env.BOT_IP + ':' + process.env.BOT_PORT + '/api',
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            json: req.body
        };
        request(options, function(err, response, body) {
            if (err) {
                log.info(err)
                return res.json({
                    status: '500',
                    response: "error"
                });
            }
            log.info(body)
            res.json({
                status: 200,
                response: "success",
                data: body
            })
        });
    }
});

String.prototype.isLowerCase = function() {
    return this.valueOf().toLowerCase() === this.valueOf();
};

module.exports = router