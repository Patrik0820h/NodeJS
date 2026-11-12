import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req,res) => {
    let tol = req.query.tol
    let ig = req.query.ig
    let faj = req.query.faj

    if (tol && isNaN(Date.parse(tol))) {
        return res.status(400).send("Hibas kezdo datum.")
    }

    if (ig && isNaN(Date.parse(ig))) {
        return res.status(400).send("Hibas zaro datum.")
    }

    let sql = "SELECT k.id, k.datum, a.nev AS allat, a.faj, g.nev AS gazda, k.leiras, k.dij FROM kezelesek k LEFT JOIN allatok a ON k.allat_id = a.id LEFT JOIN gazdak g ON a.gazda_id = g.id WHERE 1=1"

    let params = []

    if (tol) {
        sql += " AND k.datum >= ?"
        params.push(tol)
    }

    if (ig) {
        sql += " AND k.datum <= ?"
        params.push(ig)
    }

    if (faj) {
        sql += " AND a.faj = ?"
        params.push(faj)
    }

    sql += " ORDER BY k.datum ASC"

    let [rows] = await pool.query(sql, params)
    
    return res.json(rows)
})

// POST
router.post('/', async (req,res) => {
    try {
        let { allatID, leiras, dij, datum } = req.body

        if (!allatID || !leiras || !leiras.trim() || dij == null || dij < 0) {
            return res.status(400).send("Hibas vagy hianyzo adatok!")
        }

        if (!datum) {
            datum = new Date().toISOString().slice(0, 10)
        } 
        else if (isNaN(Date.parse(datum))) {
            return res.status(400).send("Hibas datum formatum.")
        }

        let sql = "SELECT * FROM allatok WHERE id = ?"
        let [rows] = await pool.query(sql, [allatID])

        if (rows.length === 0){
            return res.status(404).send("Nincs ilyen allat.")
        }

        let [beszur] = await pool.query(
            "INSERT INTO kezelesek (allat_id, datum, leiras, dij) VALUES (?, ?, ?, ?)",
            [allatID, datum, leiras, dij]
        )

        let [kiker] = await pool.query("SELECT k.id, k.datum, a.nev AS allat, a.faj, g.nev AS gazda, k.leiras, k.dij FROM kezelesek k LEFT JOIN allatok a ON k.allat_id = a.id LEFT JOIN gazdak g ON a.gazda_id = g.id WHERE k.id = ?", [beszur.insertId])

        return res.status(201).json(kiker[0])
        
    } catch (err) {
        console.error(err)
        return res.status(500).send("Szerverhiba!")
    }
})

export default router