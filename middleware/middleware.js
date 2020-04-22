const md5 = require('md5');
const cache = require('../cache');
const { getClientIp } = require('request-ip')


var routerCache = new cache.Cache();

module.exports = {
    auth: (role) => {
        return async(req, res, next) => {
            //console.log(req.session)
            if (req.session && req.session.role) {
                if (role != undefined) {
                    if (role.lehrer) {
                        if (req.session.role == 'teacher' || req.session.role == 'admin') {
                            next();
                        } else {
                            console.log("not authorized")
                            return res.json({ status: 405, response: "not authorized" })
                        }
                    } else if (role.user) {
                        if (req.session.role == 'user' || req.session.role == 'admin') {
                            next();
                        } else {
                            console.log("not authorized")
                            return res.json({ status: 405, response: "not authorized" })
                        }
                    } else {
                        next();
                    }
                } else {
                    next();
                }
            } else {
                if (RegExp(/^\/api/).test(req.path)) {
                    console.log("not authenticated: no session found")
                    return res.json({ status: 405, response: "not authorized" })
                }
                console.log("not authenticated: no session found")
                return res.redirect("/login");
            }
        }
    },
    cache: (duration) => {
        return (req, res, next) => {
            console.log("Klasse: " + req.session.klasse)
            let key = md5(req.url + "__" + JSON.stringify(req.body))
            let cacheContent = routerCache.get(req.session.klasse, key);
            if (cacheContent) {
                console.log("request: " + key + " from Klasse: " + req.session.klasse + " already in cache, sending last saved data")
                res.set('Cached', true);
                res.set('Cached-At', cacheContent.time);
                //var response = { status: 200, cached: true, last_updated: cacheContent.time, spots: cacheContent.data }
                res.send(JSON.parse(cacheContent.data));
                return
            } else {
                console.log("request: " + key + " from Klasse: " + req.session.klasse + " not in cache, querying database")
                res.sendResponse = res.send
                res.set('Cached', false);
                res.send = (body) => {
                    //console.log(body)
                    routerCache.put(req.session.klasse, key, { data: body, time: CurrentDate() }, duration * 1000);
                    //console.log(data)
                    res.sendResponse(body)
                }
                next()
            }
        }
    },
    resetCache: (klasse) => {
        console.log("Resetting Cache for Klasse: " + klasse)
        routerCache.clear(klasse)
    },
    getIsNew: (value) => {
        return routerCache.getIsNew()
    },
    setIsNew: (value) => {
        return routerCache.setIsNew(value)
    },
    log: (duration) => {
        return (req, res, next) => {
            const ip = getClientIp(req)
            let date_ob = new Date();
            let date = ("0" + date_ob.getDate()).slice(-2);
            let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
            let year = date_ob.getFullYear();
            let hours = date_ob.getHours();
            let minutes = date_ob.getMinutes();
            let seconds = date_ob.getSeconds();
            let milli = date_ob.getMilliseconds();
            var time = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds + "." + milli;
            console.log(time + " " + req.method + " " + req.originalUrl + ' request from: ' + ip);
            next()
        }
    }
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