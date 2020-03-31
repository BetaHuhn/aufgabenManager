let mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const generate = require('nanoid/generate')

var Schema = mongoose.Schema;
var salt = require('../key.json').salt

let userSchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    classes: [{ 
        type: Schema.Types.ObjectId, 
        ref:'Class' 
    }],
    exercises: [{ 
        type: Schema.Types.ObjectId, 
        ref:'Exercise' 
    }],
    solutions: [{ 
        type: Schema.Types.ObjectId, 
        ref:'Solution' 
    }],
    invite:{
        type:Schema.Types.ObjectId, ref:'Invite'
    },
    school:{
        type:Schema.Types.ObjectId, ref:'School'
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
    botKey: {
        type: String
    },
    role: {
        type: String,
        required: true
    }

})

/*
userSchema.pre('save', async function(next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    if (user.isModified('email')) {
        user.email = hashEmailAddress(user.email.toLowerCase(), salt)
    }
    next()
})*/

userSchema.pre('remove', async function(next) {
    // Remove all the docs that refers
    console.log("removing: " + this._id)
    await this.model("Class").updateOne( { }, { $pull: { users: this._id } } )
    await this.model("Exercises").deleteMany( { user: this._id} )
    next()
});

userSchema.statics.changePassword = async function(_id, password) {
    var user = await User.findOne({ _id })
    if (!user) {
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

userSchema.statics.generateBotKey = async function(_id) {
    var user = await User.findOne({ _id })
    if (!user) {
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

userSchema.statics.checkPassword = async(_id, password) => {
    const user = await User.findOne({ _id })
    if (!user) {
        throw ({ error: 'User not found', code: 405 })
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    if (!isPasswordMatch) {
        throw ({ error: 'Wrong password', code: 406 })
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
    var emailHash = hashEmailAddress(email.toLowerCase(), salt)
    var user = await User.find({ email: emailHash })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
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