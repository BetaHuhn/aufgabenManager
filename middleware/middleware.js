const statusCodes = require("../utils/status");
const log = require("../utils/log");
const md5 = require('md5');
const cacheUtil = require('../cache');
const { getClientIp } = require('request-ip')

const routerCache = new cacheUtil.Cache();

const sendResult = function(res, data, code) {
    res.json({
        status: code,
        time: new Date(),
        data: data,
    });
}

const routeLog = function() {
    return (req, res, next) => {
        if (req.path === '/api/v1/get/aufgabe' && req.method === 'GET') {
            next()
        } else {
            const date_ob = new Date();
            const date = ('0' + date_ob.getDate()).slice(-2);
            const month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
            const year = date_ob.getFullYear();
            const hours = date_ob.getHours();
            const minutes = date_ob.getMinutes();
            const seconds = date_ob.getSeconds();
            const user = 'by ' + req.session.name || '';
            const time = year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds;
            log.request(`${time} ${req.method} ${req.originalUrl} ${user} from ${getClientIp(req)}`)
            next()
        }
    };
}

const auth = function(role) {
    return async(req, res, next) => {
        if (req.session && req.session.role) {
            if (role != undefined) {
                if (role.admin) {
                    if (req.session.role == 'admin') {
                        next();
                    } else {
                        log.warn("not permitted")
                        return sendResult(res, "not permitted", statusCodes.NOT_ALLOWED);
                    }
                } else if (role.lehrer) {
                    if (req.session.role == 'teacher' || req.session.role == 'admin') {
                        next();
                    } else {
                        log.warn("not permitted")
                        return sendResult(res, "not permitted", statusCodes.NOT_ALLOWED);
                    }
                } else if (role.user) {
                    if (req.session.role == 'user' || req.session.role == 'admin') {
                        next();
                    } else {
                        log.warn("not permitted")
                        return sendResult(res, "not permitted", statusCodes.NOT_ALLOWED);
                    }
                } else {
                    next();
                }
            } else {
                next();
            }
        } else {
            if (req.originalUrl.includes("/api/v1/download") && req.method === 'GET') {
                return res.redirect('/login?ref=' + req.path)
            } else if (RegExp(/^\/api/).test(req.path)) {
                log.warn("not authenticated: no session found")
                return sendResult(res, "not authorized", statusCodes.NOT_ALLOWED);
            } else {
                log.warn("not authenticated: no session found")
                return res.redirect("/login");
            }
        }
    }
}

const cache = function() {
    return (req, res, next) => {
        log.info("Klasse: " + req.session.klasse)
        let key = md5(req.url + "__" + JSON.stringify(req.body))
        let cacheContent = routerCache.get(req.session.klasse, key);
        if (cacheContent) {
            log.info("request: " + key + " from Klasse: " + req.session.klasse + " already in cache, sending last saved data")
            res.set('Cached', true);
            res.set('Cached-At', cacheContent.time);
            res.send(JSON.parse(cacheContent.data));
            return
        } else {
            log.info("request: " + key + " from Klasse: " + req.session.klasse + " not in cache, querying database")
            res.sendResponse = res.send
            res.set('Cached', false);
            res.send = (body) => {
                routerCache.put(req.session.klasse, key, { data: body, time: new Date() }, duration * 1000);
                res.sendResponse(body)
            }
            next()
        }
    }
}

const resetCache = function(klasse) {
    log.info("Resetting Cache for Klasse: " + klasse)
    routerCache.clear(klasse)
}

const getIsNew = function() {
    return routerCache.getIsNew()
}

const setIsNew = function(value) {
    return routerCache.setIsNew(value)
}

module.exports = {
    sendResult: sendResult,
    routeLog: routeLog,
    auth: auth,
    cache: cache,
    resetCache: resetCache,
    getIsNew: getIsNew,
    setIsNew: setIsNew
}