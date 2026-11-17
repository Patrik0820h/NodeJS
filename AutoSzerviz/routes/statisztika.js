import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/statuszok', async (req,res) => {
    try {

        let sql = "SELECT m.statusz, COUNT(m.id) AS db FROM munkalapok m GROUP BY m.statusz ORDER BY m.statusz"
        let [rows] = await pool.query(sql)
        return res.json(rows)

    } catch (err) {
        console.log(err)
        return res.status(500).send("Szerver oldali hiba.")
    }
})

router.get('/alkatreszek', async (req,res) => {
    try {

        let sql = "SELECT a.nev, SUM(f.db) AS felhasznaltDB, SUM(f.db*a.ar) AS bevetel FROM alkatreszek a LEFT JOIN felhasznalasok f ON a.id = f.alkatresz_id WHERE f.alkatresz_id IS NOT NULL GROUP BY a.nev ORDER BY bevetel DESC"
        let [rows] = await pool.query(sql)
        return res.json(rows)

    } catch (err) {
        console.log(err)
        return res.status(500).send("Szerver oldali hiba.")
    }
})

export default router