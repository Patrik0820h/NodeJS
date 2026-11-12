import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
    let faj = req.query.faj

    if (faj) {
        let sql = "SELECT a.id, a.nev, a.faj, a.szuletes, g.nev AS gazda FROM allatok a LEFT JOIN gazdak g ON a.gazda_id = g.id WHERE a.faj = ?"

        let [rows] = await pool.query(sql, [faj])
        return res.json(rows)
    }
})

router.get('/kezeles-nelkul', async (req, res) => {
    let sql = "SELECT a.id, a.nev, a.faj, g.nev AS gazda FROM allatok a LEFT JOIN gazdak g ON a.gazda_id = g.id LEFT JOIN kezelesek k ON a.id = k.allat_id WHERE k.allat_id IS NULL GROUP BY a.nev"

    let [rows] = await pool.query(sql)
    return res.json(rows)
})

router.get('/:id', async (req,res) => {
    let id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).send("Az ID csak pozitiv egesz szam lehet!")
    }

    let sql = "SELECT a.id, a.nev, a.faj, a.szuletes, g.id AS gazdaID, g.nev AS gazdaNev, g.telefon AS gazdaTelefon, k.id AS kezelesID, k.datum, k.leiras, k.dij, (SELECT SUM(dij) FROM kezelesek WHERE allat_id = a.id) AS osszesDij FROM allatok a LEFT JOIN gazdak g ON a.gazda_id = g.id LEFT JOIN kezelesek k ON a.id = k.allat_id WHERE a.id = ? ORDER BY k.datum ASC"
    let [rows] = await pool.query(sql, [id])

    if (rows.length === 0) {
        return res.status(404).send("Nincs ilyen allat.")
    }

    let allat = {
        id: rows[0].id,
        nev: rows[0].nev,
        faj: rows[0].faj,
        szuletes: rows[0].szuletes,
        gazda: rows[0].gazdaID ? { id: rows[0].gazdaID, nev: rows[0].gazdaNev, telefon: rows[0].gazdaTelefon } : null,
        kezelesek: rows.filter(f => f.kezelesID).map(x => ({id: x.kezelesID, datum: x.datum, leiras: x.leiras, dij: x.dij})),
        osszesDij: rows[0].osszesDij
    }
    if ((rows[0].osszesDij) == null) {
        allat.osszesDij = 0
    }

    return res.json(allat)
})

export default router