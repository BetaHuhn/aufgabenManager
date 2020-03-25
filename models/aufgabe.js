let mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const generate = require('nanoid/generate')

let aufgabeSchema = new mongoose.Schema({
    aufgaben_id: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: String,
        required: true
    },
    text: {
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
    abgabe: {
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
    createdAt: {
        type: Date,
        required: true
    },

})

aufgabeSchema.statics.findByUserId = async(user_id) => {
    var aufgabe = await Aufgabe.find({ user_id })
    if (!aufgabe) {
        throw ({ error: 'No aufgabe found', code: 405 })
    }
    return aufgabe
}

aufgabeSchema.statics.findBySession = async(session) => {
    if (session.role == 'admin') {
        var aufgabe = await Aufgabe.find({})
    } else {
        var aufgabe = await Aufgabe.find( { klasse: { $in: session.klassen } } )
    }
    if (!aufgabe) {
        throw ({ error: 'No aufgabe found', code: 405 })
    }
    return aufgabe
}

aufgabeSchema.statics.findAll = async() => {
    var aufgabe = await Aufgabe.find({})
    if (!aufgabe) {
        throw ({ error: 'No aufgabe found', code: 405 })
    }
    return aufgabe
}

aufgabeSchema.statics.findById = async(aufgaben_id) => {
    var aufgabe = await Aufgabe.find({ aufgaben_id })
    if (!aufgabe) {
        throw ({ error: 'No aufgabe found', code: 405 })
    }
    return aufgabe
}

aufgabeSchema.statics.findByKlasse = async(klasse) => {
    var aufgabe = await Aufgabe.find({ klasse })
    if (!aufgabe) {
        throw ({ error: 'No aufgabe found', code: 405 })
    }
    return aufgabe
}

aufgabeSchema.statics.findByAbgabe = async(abgabe) => {
    var aufgabe = await Aufgabe.find({ abgabe })
    if (!aufgabe) {
        throw ({ error: 'No aufgabe found', code: 405 })
    }
    return aufgabe
}

aufgabeSchema.statics.increaseDownloads = async function(aufgaben_id) {
    var aufgabe = await Aufgabe.findOne({ aufgaben_id })
    aufgabe.downloads = aufgabe.downloads + 1;
    aufgabe.save(function(err) {
        if (err) {
            console.error(err);
        }
    });
    return aufgabe.downloads;
}

aufgabeSchema.statics.removeAufgabe = async(aufgaben_id) => {
    const aufgabe = await Aufgabe.findOne({ aufgaben_id })
    if (!aufgabe) {
        throw ({ error: 'aufgabe not found', code: 405 })
    }
    await aufgabe.deleteOne({ aufgaben_id: aufgaben_id })
        .then(doc => {
            console.log(doc)
            return doc
        })
        .catch(err => {
            console.error(err)
            throw ({ error: err, code: 400 })
        })
}


const Aufgabe = mongoose.model('Aufgabe', aufgabeSchema)
module.exports = Aufgabe