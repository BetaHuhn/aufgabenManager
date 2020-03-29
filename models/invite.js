let mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const generate = require('nanoid/generate')

let inviteSchema = new mongoose.Schema({
    invite_id: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: false
    },
    klasse: {
        id: {
            type: String
        },
        name: {
            type: String
        }

    },
    schule: {
        type: String
    },
    role: {
        type: String,
        required: true
    },
    used: {
        active: {
            type: Boolean
        },
        count: {
            type: Number
        },
        max: {
            type: Number
        }
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    inviteUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        required: true
    },

})

inviteSchema.statics.findById = async(invite_id) => {
    var invite = await Invite.find({ invite_id })
    if (!invite) {
        throw ({ error: 'No invite found', code: 405 })
    }
    return invite
}

inviteSchema.statics.findByUserId = async(user_id) => {
    var invite = await Invite.find({ user_id })
    if (!invite) {
        throw ({ error: 'No invite found', code: 405 })
    }
    return invite
}

inviteSchema.statics.checkToken = async(token) => {
    var invite = await Invite.findOne({ token })
    if (!invite) {
        throw ({ error: 'No invite found', code: 405 })
    }
    if (invite.used.active == true) {
        if (invite.used.count >= invite.used.max) {
            invite.used.active = false;
            invite.save(function(err) {
                if (err) {
                    console.error(err);
                }
            });
            throw ({ error: 'invite not active', code: 408 })
        } else {
            return invite
        }
    } else {
        throw ({ error: 'invite not active', code: 408 })
    }
}

inviteSchema.statics.findByToken = async(token) => {
    var invite = await Invite.find({ token })
    if (!invite) {
        throw ({ error: 'No invite found', code: 405 })
    }
    return invite
}

inviteSchema.statics.findByKlasse = async(klasse) => {
    var invite = await Invite.find({ klasse })
    if (!invite) {
        throw ({ error: 'No invite found', code: 405 })
    }
    return invite
}

inviteSchema.statics.findByRole = async(role) => {
    var invite = await Invite.find({ role })
    if (!invite) {
        throw ({ error: 'No invite found', code: 405 })
    }
    return invite
}

inviteSchema.statics.findByType = async(type) => {
    var invite = await Invite.find({ type })
    if (!invite) {
        throw ({ error: 'No invite found', code: 405 })
    }
    return invite
}

inviteSchema.statics.findAll = async() => {
    var invite = await Invite.find({})
    if (!invite) {
        throw ({ error: 'No invite found', code: 405 })
    }
    return invite
}

inviteSchema.statics.increaseUsed = async function(invite_id) {
    var invite = await Invite.findOne({ invite_id })
    invite.used.count = invite.used.count + 1;
    invite.save(function(err) {
        if (err) {
            console.error(err);
        }
    });
    return invite.used.count;
}

const Invite = mongoose.model('Invite', inviteSchema)
module.exports = Invite