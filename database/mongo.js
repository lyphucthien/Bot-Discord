const mongoose = require('mongoose');

module.exports = async () => {
    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log('🟢 MongoDB Đã Kết Nối Thành Công!');
    } catch (err) {
        console.error('🔴 MongoDB Kết Nối Lỗi:', err);
    }
};
