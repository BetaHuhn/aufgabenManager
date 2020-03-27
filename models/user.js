let mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const generate = require('nanoid/generate')

var salt = require('../key.json').salt

let userSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    klasse: {
        type: String
    },
    klassen:  [{
        type: String
    }],
    password: {
        type: String,
        required: true,
        minLength: 8,
        maxLength: 64
    },
    registeredAt: {
        type: Date,
        required: true
    },
    token:{
        type: String
    },
    botKey:{
        type: String
    },
    invite_id:{
        type: String
    },
    role: {
        type: String,
        required: true
    }

})

userSchema.pre('save', async function(next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    if (user.isModified('email')) {
        user.email = hashEmailAddress(user.email.toLowerCase(), salt)
    }
    next()
})

userSchema.statics.changePassword = async function(user_id, password) {
    var user = await User.findOne({ user_id })
    if(!user){
        throw ({ error: 'No user found', code: 405 })
    }
    user.password = password;
    user.save(function(err) {
        if (err) {
            console.error(err);
        }
    });
    return user;
}

userSchema.statics.generateBotKey = async function(user_id) {
    var user = await User.findOne({ user_id })
    if(!user){
        throw ({ error: 'No user found', code: 405 })
    }
    var botKey = generate('123456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', 8)
    user.botKey = botKey;
    user.save(function(err) {
        if (err) {
            console.error(err);
        }
    });
    return botKey;
}

userSchema.statics.checkLogin = async(email, password) => {
    var emailHash = hashEmailAddress(email.toLowerCase(), salt)
    console.log("Hash: " + emailHash)
    const user = await User.findOne({ email: emailHash })
    if (!user) {
        throw ({ error: 'User not found', code: 405 })
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    if (!isPasswordMatch) {
        throw ({ error: 'Wrong password', code: 408 })
    }
    return user
}

userSchema.statics.checkPassword = async(user_id, password) => {
    const user = await User.findOne({ user_id })
    if (!user) {
        throw ({ error: 'User not found', code: 405 })
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    if (!isPasswordMatch) {
        throw ({ error: 'Wrong password', code: 406 })
    }
    return user
}

userSchema.statics.findById = async(user_id) => {
    var user = await User.find({ user_id })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    return user
}

userSchema.statics.findByUserId = async(user_id) => {
    var user = await User.find({ user_id })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    return user
}

userSchema.statics.findByOneUserId = async(user_id) => {
    var user = await User.findOne({ user_id })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    return user
}

userSchema.statics.findByOneEmail = async(email) => {
    console.log("Email: " + email)
    var emailHash = hashEmailAddress(email.toLowerCase(), salt)
    console.log(emailHash)
    var user = await User.findOne({ email: emailHash })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    return user
}

userSchema.statics.findByEmail = async(email) => {
    var emailHash =  hashEmailAddress(email.toLowerCase(), salt)
    var user = await User.find({ email: emailHash })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    return user
}

userSchema.statics.findByKlasse = async(klasse) => {
    console.log("By Klasse")
    var user = await User.find({ klasse })
    if (user == undefined || user.length < 1) {
        console.log("By Klassen")
        var user = await User.find({ klassen: klasse } )
        if (user == undefined || user.length < 1) {
            throw ({ error: 'No user found', code: 405 })
        }
        return user
    }
    return user
}

userSchema.statics.findByRole = async(role) => {
    var user = await User.find({ role })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    return user
}

userSchema.statics.findAll = async() => {
    var user = await User.find({})
    if (!user) {
        throw ({ error: 'No aufgabe found', code: 405 })
    }
    return user
}

function hashEmailAddress(email, salt) {
    var sum = crypto.createHash('sha256');
    sum.update(email.toLowerCase() + salt);
    return sum.digest('hex');
  }

const User = mongoose.model('User', userSchema)
module.exports = User