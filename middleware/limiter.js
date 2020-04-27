"use strict";
const defaults = require("defaults");
const MemoryStore = require("./memory-store");

function RateLimit(options) {
  options = defaults(options, {
    // window, delay, and max apply per-key unless global is set to true
    windowMs: 60 * 1000, // milliseconds - how long to keep records of requests in memory
    delayAfter: 1, // how many requests to allow through before starting to delay responses
    delayMs: 1000, // milliseconds - base delay applied to the response - multiplied by number of recent hits for the same key.
    fib: false,
    sequence: [5, 10, 15, 25, 40, 65, 105, 170, 275, 445, 720, 1165, 1885, 3050, 4935, 7985, 12920, 20905, 33825],
    headers: true, //Send custom rate limit header with limit and remaining
    draft_polli_ratelimit_headers: false, //Support for the new RateLimit standardization headers
    maxDelayMs: Infinity, // milliseconds - maximum delay to be applied to the response, regardless the request count. Infinity means that the delay will grow continuously and unboundedly
    skipFailedRequests: false, // Do not count failed requests (status >= 400)
    skipSuccessfulRequests: false, // Do not count successful requests (status < 400)
    // allows to create custom keys (by default user IP is used)
    keyGenerator: function(req /*, res*/) {
      return req.ip;
    },
    skip: function(/*req, res*/) {
      return false;
    },
    handler: function(req, res /*, next*/) {
      res.status(options.statusCode).send(options.message);
    },
    onLimitReached: function(/*req, res, optionsUsed*/) {}
  });

  // store to use for persisting rate limit data
  options.store = options.store || new MemoryStore(options.windowMs);

  // ensure that the store has the incr method
  if (
    typeof options.store.incr !== "function" ||
    typeof options.store.resetKey !== "function" ||
    (options.skipFailedRequests &&
      typeof options.store.decrement !== "function")
  ) {
    throw new Error("The store is not valid.");
  }

  function rateLimit(req, res, next) {
    if (options.skip(req, res)) {
      return next();
    }

    const key = options.keyGenerator(req, res);

    options.store.incr(key, function(err, current, last, resetTime) {
      if (err) {
        return next(err);
      }

      let delay = 0;

      const delayAfter =
        typeof options.delayAfter === "function"
          ? options.delayAfter(req, res)
          : options.delayAfter;

      if (current > delayAfter) {
        if(options.fib){
          let count = (current - delayAfter)
          delay = options.sequence[count] * 1000
        }else{
          let unboundedDelay = (current - delayAfter) * options.delayMs;
          delay = Math.min(unboundedDelay, options.maxDelayMs);
        }
      }

      req.rateLimit = {
        limit: delayAfter,
        current: current,
        remaining: Math.max(delayAfter - current, 0),
        resetTime: resetTime,
        delay: delay
      };

      console.log(req.rateLimit)

      if (options.headers && !res.headersSent) {
        res.setHeader("X-RateLimit-Limit", req.rateLimit.limit);
        res.setHeader("X-RateLimit-Remaining", req.rateLimit.remaining);
        res.setHeader("X-RateLimit-Delay", req.rateLimit.delay);
        if (resetTime instanceof Date) {
          // if we have a resetTime, also provide the current date to help avoid issues with incorrect clocks
          res.setHeader("Date", new Date().toGMTString());
          res.setHeader(
            "X-RateLimit-Reset",
            Math.ceil(resetTime.getTime() / 1000)
          );
        }
      }
      if (options.draft_polli_ratelimit_headers && !res.headersSent) {
        res.setHeader("RateLimit-Limit", req.rateLimit.limit);
        res.setHeader("RateLimit-Remaining", req.rateLimit.remaining);
        res.setHeader("RateLimit-Delay", req.rateLimit.delay);
        if (resetTime) {
          const deltaSeconds = Math.ceil(
            (resetTime.getTime() - Date.now()) / 1000
          );
          res.setHeader("RateLimit-Reset", Math.max(0, deltaSeconds));
        }
      }

      if (options.skipFailedRequests || options.skipSuccessfulRequests) {
        if (options.skipFailedRequests) {
          let decremented = false;
          const decrementKey = () => {
            if (!decremented) {
              options.store.decrement(key);
              decremented = true;
            }
          };
          res.on("finish", function() {
            if (res.statusCode >= 400) {
              decrementKey();
            }
          });

          res.on("close", () => {
            if (!res.finished) {
              decrementKey();
            }
          });

          res.on("error", () => decrementKey());
        }

        if (options.skipSuccessfulRequests) {
          res.on("finish", function() {
            if (res.statusCode < 400) {
              options.store.resetKey(key);
            }
          });
        }
      }

      if (current - 1 === delayAfter) {
        options.onLimitReached(req, res, options, next);
      }

      let prevDelay = ( delay - options.delayMs != 0) ? delay - options.delayMs : options.delayMs;
      let d = new Date();
      console.log("current: " + d.getTime() + " last: " + last.getTime() + " delay: " + delay + " prevDelay: " + prevDelay)
      console.log("diff: " +  Math.abs(d.getTime() - last.getTime()))
      if (delay !== 0 && Math.abs(d.getTime() - last.getTime()) <= prevDelay) {
        console.log("true")
        options.store.decrement(key);
        if (options.headers && !res.headersSent) {
          res.setHeader("Retry-After", Math.ceil(delay));
        }
        return options.handler(req, res, next);
      }

      next();
    });
  }

  rateLimit.resetKey = options.store.resetKey.bind(options.store);

  return rateLimit;
}

module.exports = RateLimit;
