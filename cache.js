'use strict';

function Cache () {
  var _cache = Object.create(null);
  var _hitCount = 0;
  var _missCount = 0;
  var _size = 0;
  var _debug = false;

  /* 
    cache:{
        TG11I: {
            value: value,
            expire: expire
        }
    }
  */

  this.put = function(klasse, key, value, time, timeoutCallback) {
    if (_debug) {
      console.log('caching: %s = %j (@%s)', key, value, time);
    }

    if (typeof time !== 'undefined' && (typeof time !== 'number' || isNaN(time) || time <= 0)) {
      throw new Error('Cache timeout must be a positive number');
    } else if (typeof timeoutCallback !== 'undefined' && typeof timeoutCallback !== 'function') {
      throw new Error('Cache timeout callback must be a function');
    }

    var oldKlasse = _cache[klasse];
    if (oldKlasse) {
        var oldRecord = oldKlasse[key]
        if(oldKlasse){
            clearTimeout(oldRecord[klasse][key].timeout);
        } else {
            _size++;
        }

    }else{
        _size++;
    }

    var record = {
      value: value,
      expire: time + Date.now()
    };

    if (!isNaN(record.expire)) {
      record.timeout = setTimeout(function() {
        _del(key);
        if (timeoutCallback) {
          timeoutCallback(key, value);
        }
      }.bind(this), time);
    }

    var data = {};
    data[key] = record
    _cache[klasse] = data;

    return value;
  };

  this.del = function(klasse, key) {
    var canDelete = true;

    var oldRecord = _cache[klasse][key];
    if (oldRecord) {
      clearTimeout(oldRecord.timeout);
      if (!isNaN(oldRecord.expire) && oldRecord.expire < Date.now()) {
        canDelete = false;
      }
    } else {
      canDelete = false;
    }

    if (canDelete) {
      _del(klasse, key);
    }

    return canDelete;
  };

  function _del(klasse, key){
    _size--;
    delete _cache[klasse][key];
  }

  this.clear = function(klasse) {
    for (var key in _cache[klasse]) {
      clearTimeout(_cache[klasse][key].timeout);
    }
    _size = 0;
    _cache = Object.create(null);
    if (_debug) {
      _hitCount = 0;
      _missCount = 0;
    }
  };

  this.get = function(klasse, key) {
    var klasse = _cache[klasse];
    if (typeof klasse != "undefined") {
        var data = klasse[key]
        if (isNaN(data.expire) || data.expire >= Date.now()) {
            if (_debug) _hitCount++;
            return data.value;
        } else {
            // free some space
            if (_debug) _missCount++;
            _size--;
            delete _cache[klasse][key];
        }
    } else if (_debug) {
      _missCount++;
    }
    return null;
  };

  this.size = function() {
    return _size;
  };

  this.memsize = function(klasse) {
    var size = 0,
      key;
    for (key in _cache[klasse]) {
      size++;
    }
    return size;
  };

  this.debug = function(bool) {
    _debug = bool;
  };

  this.hits = function() {
    return _hitCount;
  };

  this.misses = function() {
    return _missCount;
  };

  this.keys = function(klasse) {
    return Object.keys(_cache[klasse]);
  };

}

module.exports = new Cache();
module.exports.Cache = Cache;
