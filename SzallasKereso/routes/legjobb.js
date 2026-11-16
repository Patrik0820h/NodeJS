import express from 'express'
import pool from '../db.js'

const router = express.Router();

router.get('/', async (req,res) => {
    let sql = "SELECT nev FROM szallasok ORDER BY ertekeles DESC LIMIT 3"
    let [rows] = await pool.query(sql)
    return res.json(rows)
})

export default router;