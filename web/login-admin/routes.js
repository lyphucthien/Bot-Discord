const express = require("express");
const router = express.Router();

const { login } = require("./auth");
const { isAdmin } = require("./middleware");

router.get("/login", (req, res) => {
    res.sendFile(__dirname + "/views/login.html");
});

router.post("/login", express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;

    if (login(username, password)) {
        req.session.admin = true;
        return res.redirect("/admin");
    }

    return res.send("❌ Sai Tên Tài Khoản Hoặc Mật Khẩu");
});

router.get("/admin", isAdmin, (req, res) => {
    res.sendFile(__dirname + "/views/dashboard.html");
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

module.exports = router;