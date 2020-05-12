const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const classSchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
    },
    school: {
        type:Schema.Types.ObjectId, ref:'School'
    },
    users: [{ 
        type: Schema.Types.ObjectId, 
        ref:'User' 
    }],
    invites: [{ 
        type: Schema.Types.ObjectId, 
        ref:'Invite' 
    }],
    exercises: [{ 
        type: Schema.Types.ObjectId, 
        ref:'Exercise' 
    }],
    createdAt: {
        type: Date
    }
})

classSchema.pre('remove', async function(next) {
    // Remove all the docs that refers
    console.log("removing: " + this._id)
    await this.model("School").updateOne( { }, { $pull: { classes: this._id } } )
    await this.model("User").deleteMany( { classes: this._id} )
    await this.model("Exercises").deleteMany( { class: this._id} )
    next()
});

const Class = mongoose.model('Class', classSchema)
module.exports = Class