const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const meetingSchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    user:{
        type:Schema.Types.ObjectId, ref:'User'
    }, 
    class:{
        type:Schema.Types.ObjectId, ref:'Class'
    }, 
    school:{
        type:Schema.Types.ObjectId, ref:'School'
    },
    subject: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },

})

meetingSchema.pre('remove', async function(next) {
    // Remove all the docs that refers
    console.log("removing: " + this._id)
    await this.model("Class").updateMany( { }, { $pull: { meetings: this._id } } )
    await this.model("User").updateMany( { }, { $pull: { meetings: this._id } } )
    next()
});

meetingSchema.pre('deleteOne', async function(next) {
    // Remove all the docs that refers
    console.log("removing: " + this._id)
    await this.model("Class").updateMany( { }, { $pull: { meetings: this._id } } )
    await this.model("User").updateMany( { }, { $pull: { meetings: this._id } } )
    next()
});

meetingSchema.statics.removeMeeting = async(_id) => {
    const meeting = await Meeting.findOne({ _id })
    if (!meeting) {
        throw ({ error: 'meeting not found', code: 405 })
    }
    await meeting.deleteOne({ _id: _id })
        .then(doc => {
            console.log(doc)
            return doc
        })
        .catch(err => {
            console.error(err)
            throw ({ error: err, code: 400 })
        })
}

const Meeting = mongoose.model('Meeting', meetingSchema)
module.exports = Meeting