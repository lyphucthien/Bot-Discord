const mongoose = require("mongoose");

const giveawaySchema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    messageId: String,

    prize: String,
    winnerCount: Number,

    endsAt: Date,
    ended: { type: Boolean, default: false }
});

module.exports = mongoose.model("Giveaway", giveawaySchema);