const userMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'user') {
        return res.status(403).json({error: "Csak felhasznalok ferhetnek hozza."});
    }

    next();
}

export default userMiddleware;