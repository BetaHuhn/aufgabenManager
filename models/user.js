const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const generate = require('nanoid/generate')
const CurrentDate = require("../utils/currentDate")
const hashEmailAddress = require("../utils/hashEmailAddress")
const Schema = mongoose.Schema;
const salt = process.env.SALT

const userSchema = new mongoose.Schema({
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
    meetings: [{ 
        type: Schema.Types.ObjectId, 
        ref:'Meeting' 
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
    lastLogin:{
        type: Date
    },
    botKey: {
        type: String
    },
    role: {
        type: String,
        required: true
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Number
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

userSchema.pre('remove', async function(next) {
    // Remove all the docs that refers
    console.log("removing: " + this._id)
    await this.model("Class").updateOne( { }, { $pull: { users: this._id } } )
    await this.model("Exercises").deleteMany( { user: this._id} )
    next()
});

userSchema.statics.changePassword = async function(_id, password) {
    const user = await User.findOne({ _id })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.save(function(err) {
        if (err) {
            console.error(err);
        }
    });
    return user;
}

userSchema.statics.logLogin = async function(_id) {
    const user = await User.findOne({ _id })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    user.lastLogin = CurrentDate()
    user.save(function(err) {
        if (err) {
            console.error(err);
        }
    });
    return user;
}

userSchema.statics.generateBotKey = async function(_id) {
    const user = await User.findOne({ _id })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    const botKey = generate('123456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', 8)
    user.botKey = botKey;
    user.save(function(err) {
        if (err) {
            console.error(err);
        }
    });
    return botKey;
}

userSchema.statics.generateResetToken = async function(_id) {
    const user = await User.findOne({ _id })
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    const token = generate('123456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', 16)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date().getTime() + (30 * 60 * 1000)
    console.log(user.resetPasswordExpires)
    user.save(function(err) {
        if (err) {
            console.error(err);
            throw ({ error: err, code: 400 })
        }
    });
    return token;
}

userSchema.statics.checkLogin = async(email, password) => {
    const emailHash = hashEmailAddress(email.toLowerCase(), salt)
    console.log("Email: " + email + " Hash: " + emailHash)
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
    const emailHash = hashEmailAddress(email.toLowerCase(), salt)
    console.log(emailHash)
    const user = await User.findOne({ email: emailHash }).populate('classes school', 'name')
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    return user
}

userSchema.statics.findByEmail = async(email) => {
    const emailHash = hashEmailAddress(email.toLowerCase(), salt)
    const user = await User.find({ email: emailHash }).populate('classes school', 'name')
    if (!user) {
        throw ({ error: 'No user found', code: 405 })
    }
    return user
}

const User = mongoose.model('User', userSchema)
module.exports = User