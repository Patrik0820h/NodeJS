import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/kategoriak', async (req, res) => {
    try {
        let sql = "SELECT a.kategoria, COUNT(DISTINCT a.id) AS autoDB, COUNT(DISTINCT b.id) AS berlesDB, COALESCE(SUM(DATEDIFF(b.veg, b.kezdet) +1), 0) AS napDB, COALESCE(SUM((DATEDIFF(b.veg, b.kezdet) + 1) * a.napidij), 0) AS bevetel FROM autok a LEFT JOIN berlesek b ON a.id = b.auto_id GROUP BY a.kategoria ORDER BY bevetel DESC"
        let [rows] = await pool.query(sql)
        return res.json(rows)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent szerver oldalon.")
    }
})

router.get('/havi', async (req,res) => {
    try {
        let sql = "SELECT DATE_FORMAT(b.kezdet, '%Y-%m') AS honap, COUNT(DISTINCT b.id) AS berlesDB, COALESCE(SUM((DATEDIFF(b.veg, b.kezdet) +1)*a.napidij), 0) AS bevetel FROM berlesek b LEFT JOIN autok a ON b.auto_id = a.id GROUP BY DATE_FORMAT(b.kezdet, '%Y-%m') ORDER BY DATE_FORMAT(b.kezdet, '%Y-%m') DESC"
        let [rows] = await pool.query(sql)
        return res.json(rows)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent szerver oldalon.")
    }
})

export default router