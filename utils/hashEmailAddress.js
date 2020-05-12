const crypto = require('crypto');

module.exports = function (email, salt) {
    let sum = crypto.createHash('sha256');
    sum.update(email.toLowerCase() + salt);
    return sum.digest('hex');
}