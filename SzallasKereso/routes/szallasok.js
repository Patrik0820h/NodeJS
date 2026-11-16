import express from 'express'
import pool from '../db.js'

const router = express.Router();

router.get('/', async (req,res) => {
    let sql = "SELECT * FROM szallasok ORDER BY ar ASC"
    let [rows] = await pool.query(sql)
    return res.json(rows)

    // Egy feladat kimaradt
})

router.get('/:id', async (req,res) => {
    let id = req.params.id

    let sql = "SELECT * FROM szallasok WHERE id = ?"
    let [rows] = await pool.query(sql, [id])
    if (rows.length == 0) {
        return res.status(400).send("Nincs ilyen adat.")
    }
    return res.json(rows)
})

export default router;