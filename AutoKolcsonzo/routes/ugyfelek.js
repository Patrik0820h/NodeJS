import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req,res) => {
    try {
        let sql = "SELECT u.id, u.nev, COUNT(DISTINCT b.id) AS berlesDB, COALESCE(SUM(DATEDIFF(b.veg, b.kezdet) + 1), 0) AS osszNap, COALESCE(SUM((DATEDIFF(b.veg, b.kezdet) + 1)*a.napidij), 0) AS osszKoltes FROM ugyfelek u LEFT JOIN berlesek b ON u.id = b.ugyfel_id LEFT JOIN autok a ON b.auto_id = a.id GROUP BY u.nev ORDER BY osszKoltes DESC"
        let [rows] = await pool.query(sql)
        return res.json(rows)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent a szerver oldalon")
    }
})

export default router