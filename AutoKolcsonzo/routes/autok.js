import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req,res) => {
    try {
        let kategoria = req.query.kategoria

        if (kategoria) {
            let letezes = "SELECT a.modell FROM autok a WHERE kategoria = ?"
            let [rows] = await pool.query(letezes, [kategoria])
            if (rows.length === 0) {
                return res.status(400).send("Hibas kategoria.")
            }
            let szoveg = rows.map(row => row.modell).join(',')
            return res.send(szoveg)
        }

        let sql = "SELECT a.*, COUNT(DISTINCT b.id) AS berlesDB FROM autok a LEFT JOIN berlesek b ON a.id = b.auto_id GROUP BY a.rendszam ORDER BY a.rendszam"

        let [rows] = await pool.query(sql)
        return res.json(rows)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent szerver oldalon.")
    }
})

router.get('/szabad', async (req,res) => {
    try {
        let tol = req.query.tol
        let ig = req.query.ig

        if (!tol || !ig) {
            return res.status(400).send("A datum megadasa kotelezo.")
        }

        if (isNaN(Date.parse(tol)) || isNaN(Date.parse(ig))) {
            return res.status(400).send("Hibas datum formatum.")
        }

        if (tol > ig) {
            return res.status(400).send("Hibas idoszak.")
        }

        let sql = "SELECT a.modell, a.napidij FROM autok a WHERE NOT EXISTS (SELECT 1 FROM berlesek b WHERE b.auto_id = a.id AND b.kezdet <= ? AND b.veg >= ?) ORDER BY a.napidij ASC";
        let [rows] = await pool.query(sql, [ig, tol])

        return res.json(rows)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent szerver oldalon.")
    }
})

router.get('/:id', async (req,res) => {
    try {
        let id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).send("Az ID csak pozitiv egesz szam lehet.")
        }

        let sql = "SELECT a.id, a.rendszam, a.marka, a.modell, a.kategoria, a.napidij, b.id As berlesID, u.nev AS ugyfelNev, b.kezdet AS kezdet, b.veg AS veg, DATEDIFF(b.veg, b.kezdet) + 1 AS napok, (DATEDIFF(b.veg, b.kezdet) + 1) * a.napidij AS dij, COALESCE((SELECT SUM((DATEDIFF(b2.veg, b2.kezdet) + 1) * a.napidij) FROM berlesek b2 WHERE b2.auto_id = a.id), 0) AS osszDij FROM autok a LEFT JOIN berlesek b ON a.id = b.auto_id LEFT JOIN ugyfelek u ON b.ugyfel_id = u.id WHERE a.id = ?"
        let [rows] = await pool.query(sql, [id])

        if (rows.length === 0) {
            return res.status(404).send("Nem talalhato ilyen auto.")
        }

        let auto = {
            id: rows[0].id,
            rendszam: rows[0].rendszam,
            marka: rows[0].marka,
            modell: rows[0].modell,
            kategoria: rows[0].kategoria,
            napidij: rows[0].napidij,
            berlesek: rows.filter(f => f.berlesID).map(x => ({id: x.berlesID, nev: x.ugyfelNev, kezdet: x.kezdet, veg: x.veg, napok: x.napok, dij: x.dij})),
            osszDij: rows[0].osszDij
        }

        return res.json(auto)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent szerver oldalon.")
    }
})

export default router