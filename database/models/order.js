const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    guildId: String,
    userId: String,

    product: String,
    price: Number,

    status: {
        type: String,
        default: "pending" // pending | done | cancelled
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);