import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req,res) => { 
    try {
        let sql = "SELECT h.id, h.nev, h.mertekegyseg, h.egysegar, COUNT(DISTINCT r.id) AS receptDB FROM hozzavalok h LEFT JOIN recept_hozzavalok rh ON h.id = rh.hozzavalo_id LEFT JOIN receptek r ON rh.recept_id = r.id GROUP BY h.nev ORDER BY receptDB DESC, h.nev ASC"

        let [rows] = await pool.query(sql)
        return res.json(rows)
    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent a szerver oldalon")
    }
})

router.get('/nem-hasznalt', async (req,res) => {
    try {
        let sql = "SELECT h.id, h.nev FROM hozzavalok h LEFT JOIN recept_hozzavalok rh ON h.id = rh.hozzavalo_id WHERE rh.hozzavalo_id IS NULL"

        let [rows] = await pool.query(sql)
        return res.json(rows)
    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent a szerver oldalon")
    }
})

export default router