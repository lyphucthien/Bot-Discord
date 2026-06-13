const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    warns: {
        type: Number,
        default: 0
    },
    reasons: [String]
});

module.exports = mongoose.model('Warn', warnSchema);
