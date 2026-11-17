import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req,res) => {
    try {

        let sql = "SELECT u.*, COUNT(DISTINCT m.id) AS munkalapDB, COALESCE(SUM(m.munkaora * 12000), 0) + COALESCE(SUM(f.db * a.ar), 0) AS osszKoltes FROM ugyfelek u LEFT JOIN munkalapok m ON u.id = m.ugyfel_id LEFT JOIN felhasznalasok f ON m.id = f.munkalap_id LEFT JOIN alkatreszek a ON f.alkatresz_id = a.id GROUP BY u.nev ORDER BY osszKoltes DESC"
        let [rows] = await pool.query(sql)
        return res.json(rows)

    } catch (err) {
        console.log(err)
        return res.status(500).send("Szerver oldali hiba.")
    }
})

export default router