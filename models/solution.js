const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const solutionSchema = new mongoose.Schema({
    _id: Schema.Types.ObjectId,
    class:{
        type:Schema.Types.ObjectId, ref:'Class'
    },
    school:{
        type:Schema.Types.ObjectId, ref:'School'
    }, 
    access: [{ 
        type: Schema.Types.ObjectId, 
        ref:'User' 
    }],
    user:{
        type:Schema.Types.ObjectId, ref:'User'
    }, 
    exercise:{
        type:Schema.Types.ObjectId, ref:'Exercise'
    },
    subject: {
        type: String,
        required: true
    },
    file: {
        type: {
            type: String
        },
        multiple: {
            type: Boolean
        }
    },
    versions: [{
        _id: Schema.Types.ObjectId,
        createdAt: {
            type: Date
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
            }
        },
    }],
    createdAt: {
        type: Date,
        required: true
    },
})

const Solution = mongoose.model('Solution', solutionSchema)
module.exports = Solution