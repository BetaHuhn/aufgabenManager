let mongoose = require('mongoose')
var Schema = mongoose.Schema;

let schoolSchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
    },
    classes: [{ 
        type: Schema.Types.ObjectId, 
        ref:'Class' 
    }],
    admins: [{ 
        type: Schema.Types.ObjectId, 
        ref:'User' 
    }],
    createdAt: {
        type: Date
    }
})

const School = mongoose.model('School', schoolSchema)
module.exports = School