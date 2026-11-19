const adminMiddleware = (req, res, next) => {

    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({error: 'Nincs jogosultsagod ehhez a muvelethez.'});
    }

    next();
};

export default adminMiddleware;