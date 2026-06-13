const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({

    guildId: String,
    userId: String,

    warns: {
        type: Number,
        default: 0
    }

});

module.exports = mongoose.model('Warn', warnSchema);