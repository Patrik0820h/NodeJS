import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
    let varos = req.query.varos

    if (varos) {
        let sql = "SELECT g.nev FROM gazdak g WHERE g.varos = ?"

        let [rows] = await pool.query(sql, [varos])
        let nevek = rows.map(x => x.nev).join(', ')

        return res.send(nevek)
    }

    let sql = "SELECT g.id, g.nev, g.varos, COUNT(DISTINCT a.id) as allatDB FROM gazdak g LEFT JOIN allatok a ON g.id = a.gazda_id GROUP BY g.nev"

    let [rows] = await pool.query(sql)
    return res.json(rows)
})

router.get('/:id', async (req, res) => {
    let id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).send("Az ID csak pozitiv egesz szam lehet!")
    }

    let sql = "SELECT g.*, a.id AS allat_id , a.nev AS allat_nev, a.faj, a.szuletes FROM gazdak g LEFT JOIN allatok a ON g.id = a.gazda_id WHERE g.id = ?"

    let [rows] = await pool.query(sql, [id])

    if (rows.length == 0) {
        return res.status(404).send("Nincs ilyen gazda.")
    }

    let gazda = {
        id: rows[0].id,
        nev: rows[0].nev,
        telefon: rows[0].telefon,
        varos: rows[0].varos,
        allatok: rows.filter(f => f.allat_id !== null).map(a => ({id: a.allat_id, nev: a.allat_nev, faj: a.faj, szuletes: a.szuletes}))
    }

    return res.json(gazda)
})

export default router