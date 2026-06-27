function isAdmin(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    }
    return res.redirect("/login");
}

module.exports = { isAdmin };