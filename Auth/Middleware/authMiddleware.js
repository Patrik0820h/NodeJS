import jwt from 'jsonwebtoken';
import pool from '../db.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Nincs ervenyes token.'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Felhasználó lekérése az adatbázisból
        const [rows] = await pool.query(
            `SELECT u.Id AS id, u.username, r.name AS role
             FROM users u
             INNER JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                error: 'A felhasznalo nem talalhato.'
            });
        }

        req.user = rows[0];

        next();

    } catch (err) {
        if (err.name === 'JsonWebTokenError' ||
            err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Ervenytelen vagy lejart token.'
            });
        }

        console.error(err);

        return res.status(500).json({
            error: 'Szerver oldali hiba.'
        });
    }
};

export default authMiddleware;