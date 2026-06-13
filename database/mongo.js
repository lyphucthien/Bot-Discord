const mongoose = require("mongoose");
const { URI } = require("../config/mongoURI");

module.exports = async () => {
    try {
        await mongoose.connect(URI);
        console.log("✅ MongoDB Đã Kết Nối Thành Công");
    } catch (err) {
        console.error("❌ MongoDB Kết Nối Thất Bại:", err);
    }
};