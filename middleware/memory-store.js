"use strict";

function calculateNextResetTime(windowMs) {
  const d = new Date();
  d.setMilliseconds(d.getMilliseconds() + windowMs);
  return d;
}

function MemoryStore(windowMs) {
  let hits = {};
  let resetTime = calculateNextResetTime(windowMs);

  this.incr = function(key, cb) {
    let d = new Date();
    let last = 0;
    if (hits[key]) {
      hits[key].count++;
      last = hits[key].time
      hits[key].time = d
    } else {
      last = d
      hits[key] = {
        count: 1,
        time: last
      }
    }

    cb(null, hits[key].count, last, resetTime);
  };

  this.decrement = function(key) {
    let d = new Date();
    if (hits[key]) {
      hits[key].count--;
      hits[key].time = d
    }
  };

  // export an API to allow hits all IPs to be reset
  this.resetAll = function() {
    hits = {};
    resetTime = calculateNextResetTime(windowMs);
  };

  // export an API to allow hits from one IP to be reset
  this.resetKey = function(key) {
    delete hits[key];
    delete resetTime[key];
  };

  // simply reset ALL hits every windowMs
  const interval = setInterval(this.resetAll, windowMs);
  if (interval.unref) {
    interval.unref();
  }
}

module.exports = MemoryStore;
