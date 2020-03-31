let mongoose = require('mongoose')
var Schema = mongoose.Schema;

let inviteSchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    class:{
        type:Schema.Types.ObjectId, ref:'Class'
    }, 
    school:{
        type:Schema.Types.ObjectId, ref:'School'
    },
    type: { // Not used (I think)
        type: String,
    },
    name: {
        type: String,
        required: false
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

inviteSchema.statics.checkToken = async(token) => {
    var invite = await Invite.findOne({ token }).populate('class', 'name')
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