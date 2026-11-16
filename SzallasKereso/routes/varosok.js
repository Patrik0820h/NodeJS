import express from 'express'
import pool from '../db.js'

const router = express.Router();

router.get('/', async (req,res) => {
    let minSzallas = req.query.minSzallas
    if (minSzallas) {
        let sql = "SELECT v.id, v.nev, v.orszag, COUNT(sz.id) AS szallasDb, MIN(sz.ar) AS legolcsobb, ROUND(AVG(sz.ar)) AS atlagAr FROM varosok v LEFT JOIN szallasok sz ON sz.varos_id = v.id GROUP BY v.id, v.nev, v.orszag HAVING COUNT(sz.id) >= ? ORDER BY v.nev;"
        let [rows] = await pool.query(sql, [minSzallas])
        return res.json(rows)
    }


    let sql = "SELECT v.id, v.nev, v.orszag, COUNT(sz.id) AS szallasDb, MIN(sz.ar) AS legolcsobb, ROUND(AVG(sz.ar)) AS atlagAr FROM varosok v LEFT JOIN szallasok sz ON sz.varos_id = v.id GROUP BY v.id, v.nev, v.orszag ORDER BY v.nev;"
    let [rows] = await pool.query(sql)
    return res.json(rows) 
})

router.get('/:id/szallasok', async (req,res) => {
    let id = req.params.id

    let varos = "SELECT id FROM varosok WHERE id = ?;"
    let szallas = "SELECT id, varos_id AS varosId, nev, csillag, ar, medence, ertekeles FROM szallasok WHERE varos_id = ? ORDER BY nev;"

    let [varosok] = await pool.query(varos, [id])
    if (varosok.length === 0) {
        return res.status(404).json({ error: "A város nem található." });
    }

    let [szallasok] = await pool.query(szallas, [id]);

    return res.json(szallasok);
})

export default router;