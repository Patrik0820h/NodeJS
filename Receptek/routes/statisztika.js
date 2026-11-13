import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/kategoriak', async (req,res) => {
    try {
        const sql = "SELECT r.kategoria, COUNT(DISTINCT r.id) AS receptDb, ROUND(AVG(r.ido)) AS atlagIdo, ROUND(AVG(k.receptKoltseg)) AS atlagKoltseg FROM receptek r JOIN (SELECT rh.recept_id, SUM(rh.mennyiseg * h.egysegar) AS receptKoltseg FROM recept_hozzavalok rh JOIN hozzavalok h ON rh.hozzavalo_id = h.id GROUP BY rh.recept_id) k ON k.recept_id = r.id GROUP BY r.kategoria ORDER BY r.kategoria"

        let [rows] = await pool.query(sql)
        return res.json(rows)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent a szerver oldalon")
    }
})

export default router