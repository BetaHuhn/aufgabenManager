let mongoose = require('mongoose')
const crypto = require('crypto');
const generate = require('nanoid/generate')

let klasseSchema = new mongoose.Schema({
    klasse_id: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    schule: {
        type: String
    },
    users: [{
        type: String
    }],
    aufgaben: [{
        type: String
    }]

})

klasseSchema.statics.findById = async(klasse_id) => {
    var klasse = await Klasse.find({ klasse_id })
    if (!klasse) {
        throw ({ error: 'No klasse found', code: 405 })
    }
    return klasse
}

const Klasse = mongoose.model('Klasse', klasseSchema)
module.exports = Klasse