import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import authMiddleware from '../Middleware/authMiddleware.js';
import adminMiddleware from '../Middleware/adminMiddleware.js';
import userMiddleware from '../Middleware/userMiddleware.js';

const router = express.Router();

router.get('/', (req,res) => {
    return res.send("Ezt az oldalt barki megtekintheti.")
})

router.post('/register', async (req,res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({error: "A felhasznalo nev es jelszo kotelezo."});
        }

        if (password.length < 8) {
            return res.status(400).json({error: "A jelszonak legalabb 8 karakteresnek kell lennie."});
        }

        let selectuser = "SELECT username FROM users WHERE username = ?";
        let [rows] = await pool.query(selectuser, [username]);
        if (rows.length > 0) {
            return res.status(409).json({error: "Ez a felhasznalo mar letezik."});
        }

        const hashedpassword = await bcrypt.hash(password, 10)

        let insertuser = "INSERT INTO users (username, password) VALUES (?,?)";
        let [rows2] = await pool.query(insertuser, [username, hashedpassword]);
        if (rows2.affectedRows === 0) {
            return res.status(500).json({ error: "Sikertelen regisztráció." });
        }

        return res.status(201).json({message: "Sikeres hozzaadas."});

        
    } catch (err) {
        console.log(err)
        return res.status(500).json({err: "Szerver oldali hiba."});
    }
})

router.post('/login', async (req,res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({error: "A felhasznalo nev es jelszo kotelezo."});
        }

        const selectuser = "SELECT u.*, r.name AS role from users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.username = ?";
        let [rows] = await pool.query(selectuser, [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: "Hibas felhasznalonev vagy jelszo." });
        }

        const isPasswordValid = await bcrypt.compare(password, rows[0].password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Hibas felhasznalonev vagy jelszo." });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({error: 'JWT_SECRET nincs beallitva!'});
        }
        const token = jwt.sign({ id: rows[0].id, username: rows[0].username, role: rows[0].role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({message: "Sikeres bejelentkezes.", token});

    } catch (err) {
        console.log(err)
        return res.status(500).json({err: "Szerver oldali hiba."});
    }
})

router.get('/profile', authMiddleware, userMiddleware, async (req,res) => {
    try {
        let sql = "SELECT u.id, u.username, r.name AS role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?"
        let [rows] = await pool.query(sql, [req.user.id])

        if (rows.length === 0) {
            return res.status(404).json({error: "Felhasznalo nem talalhato."})
        }

        return res.status(200).json({user: rows[0]})

    } catch (err) {
        console.log(err)
        return res.status(500).json({err: "Szerver oldali hiba."});
    }
})

router.delete('/user/:id', authMiddleware, adminMiddleware, async (req,res) => {
    try {
        let Id = Number(req.params.id);

        if (!Number.isInteger(Id) || Id <= 0) {
            return res.status(400).json({error: "Az ID csak pozitiv egesz szam lehet."});
        }

        let deleteuser = "DELETE FROM users WHERE Id = ?";
        let [rows2] = await pool.query(deleteuser, [Id]);
        if (rows2.affectedRows === 0) {
            return res.status(404).json({message: "Nem talalhato felhasznalo ezzel az id-val."});
        }

        return res.status(200).json({message: "Sikeres torles."});

    } catch (err) {
        console.log(err)
        return res.status(500).json({err: "Szerver oldali hiba."});
    }
})

router.get('/users', authMiddleware, adminMiddleware, async (req,res) => {
    try {
        let sql = "SELECT u.id, u.username, r.name AS role from users u LEFT JOIN roles r ON u.role_id = r.id";
        let [rows] = await pool.query(sql);
        if (rows.length > 0) {
            return res.json(rows);
        }
        return res.status(404).json({message: "A users tabla ures."});


    } catch (err) {
        console.log(err)
        return res.status(500).json({err: "Szerver oldali hiba."});
    }
})

export default router;