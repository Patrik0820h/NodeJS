import express from 'express'
import pool from '../db.js'

const router = express.Router();

router.get('/', async (req,res) => {
    let sql = "SELECT v.orszag, COUNT(DISTINCT v.id) AS varosDb, COUNT(s.id) AS szallasDb, ROUND(AVG(s.ertekeles), 2) AS atlagErtekeles FROM varosok v LEFT JOIN szallasok s ON s.varos_id = v.id GROUP BY v.orszag ORDER BY v.orszag;"
    let [rows] = await pool.query(sql)
    return res.json(rows)
})

export default router;