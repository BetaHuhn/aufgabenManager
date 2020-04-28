let mongoose = require('mongoose')
var Schema = mongoose.Schema;

let exerciseSchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    user:{
        type:Schema.Types.ObjectId, ref:'User'
    }, 
    class:{
        type:Schema.Types.ObjectId, ref:'Class'
    }, 
    solutions: [{ 
        type: Schema.Types.ObjectId, 
        ref:'Solution' 
    }],
    school:{
        type:Schema.Types.ObjectId, ref:'School'
    },
    text: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    files: {
        count: {
            type: Number
        },
        type: {
            type: String
        },
        fileName: {
            type: String
        },
        fileUrl: {
            type: String
        }
    },
    downloads: {
        type: Number
    },
    downloadedBy:[{
        _id: false,
        user:{
            type:Schema.Types.ObjectId, ref:'User'
        }, 
        date: {
            type: Date
        }
    }],
    createdAt: {
        type: Date,
        required: true
    },

})

exerciseSchema.pre('remove', async function(next) {
    // Remove all the docs that refers
    console.log("removing: " + this._id)
    await this.model("Class").updateMany( { }, { $pull: { exercises: this._id } } )
    await this.model("User").updateMany( { }, { $pull: { exercises: this._id } } )
    await this.model("Solution").deleteMany({ exercise: this._id });
    next()
});

exerciseSchema.pre('deleteOne', async function(next) {
    // Remove all the docs that refers
    console.log("removing: " + this._id)
    await this.model("Class").updateMany( { }, { $pull: { exercises: this._id } } )
    await this.model("User").updateMany( { }, { $pull: { exercises: this._id } } )
    await this.model("Solution").deleteMany({ exercise: this._id });
    next()
});

exerciseSchema.statics.increaseDownloads = async function(_id, user) {
    var exercise = await Exercise.findOne({ _id })
    exercise.downloads = exercise.downloads + 1;
    console.log(user)
    exercise.downloadedBy.push({user: user, date: CurrentDate()})
    exercise.save(function(err) {
        if (err) {
            console.error(err);
        }
    });
    return exercise.downloads;
}

exerciseSchema.statics.removeExercise = async(_id) => {
    const exercise = await Exercise.findOne({ _id })
    if (!exercise) {
        throw ({ error: 'exercise not found', code: 405 })
    }
    await exercise.deleteOne({ _id: _id })
        .then(doc => {
            console.log(doc)
            return doc
        })
        .catch(err => {
            console.error(err)
            throw ({ error: err, code: 400 })
        })
}

function CurrentDate() {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    var current_date = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    return current_date;
}

const Exercise = mongoose.model('Exercise', exerciseSchema)
module.exports = Exercise