import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/fogyo', async (req,res) => {
    try {
        let min = req.query.min !== undefined ? Number(req.query.min) : 3

        if (!Number.isInteger(min) || min < 0) {
            return res.status(400).send("Az ertek csak nemnegativ egesz szam lehet.")
        }

        let sql = "SELECT a.* FROM alkatreszek a WHERE a.keszlet < ? ORDER BY a.keszlet ASC"
        let [rows] = await pool.query(sql, [min])
        return res.json(rows)

    } catch (err) {
        console.log(err)
        return res.status(500).send("Szerver oldali hiba.")
    }
})

export default router