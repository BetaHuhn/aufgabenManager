let mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const generate = require('nanoid/generate')

let solutionSchema = new mongoose.Schema({
    solution_id: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: String,
        required: true
    },
    aufgaben_id: {
        type: String,
        required: true
    },
    fach: {
        type: String,
        required: true
    },
    klasse: {
        type: String,
        required: true
    },
    access: [{
        type: String
    }],
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
    createdAt: {
        type: Date,
        required: true
    },
})

solutionSchema.statics.findByUserId = async(user_id) => {
    var solution = await Solution.find({ user_id })
    if (!solution) {
        throw ({ error: 'No solution found', code: 405 })
    }
    return solution
}

solutionSchema.statics.findByAufgabenId = async(aufgaben_id) => {
    var solution = await Solution.find({ aufgaben_id })
    if (!solution) {
        throw ({ error: 'No solution found', code: 405 })
    }
    return solution
}

solutionSchema.statics.findOneBySolutionId = async(solution_id) => {
    var solution = await Solution.findOne({ solution_id })
    if (!solution) {
        throw ({ error: 'No solution found', code: 405 })
    }
    return solution
}

solutionSchema.statics.findByUserAndAufgabe = async(user_id, aufgaben_id) => {
    var solution = await Solution.find({ user_id: user_id, aufgaben_id: aufgaben_id })
    if (!solution) {
        throw ({ error: 'No solution found', code: 405 })
    }
    return solution
}

solutionSchema.statics.findByKlasse = async(klasse) => {
    var solution = await Solution.find({ klasse })
    if (!solution) {
        throw ({ error: 'No solution found', code: 405 })
    }
    return solution
}

solutionSchema.statics.findByFach = async(fach) => {
    var solution = await Solution.find({ fach })
    if (!solution) {
        throw ({ error: 'No solution found', code: 405 })
    }
    return solution
}

solutionSchema.statics.findByAccess = async(user_id) => {
    var solution = await Solution.find({ access: user_id })
    if (!solution) {
        throw ({ error: 'No solution found', code: 405 })
    }
    return solution
}

solutionSchema.statics.findAll = async() => {
    var solution = await Solution.find({})
    if (!solution) {
        throw ({ error: 'No solution found', code: 405 })
    }
    return solution
}

const Solution = mongoose.model('Solution', solutionSchema)
module.exports = Solution