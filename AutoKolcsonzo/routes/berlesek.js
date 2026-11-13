import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.post('/', async (req,res) => {
    try {
        let {autoId, ugyfelId, kezdet, veg} = req.body
        autoId = Number(autoId)
        ugyfelId = Number(ugyfelId)

        if (!autoId || !ugyfelId || !kezdet || !veg) {
            return res.status(400).send("Hibas adatok.")
        }

        if (!Number.isInteger(autoId) || autoId <= 0 || !Number.isInteger(ugyfelId) || ugyfelId <= 0) {
            return res.status(400).send("Az ID-k csak pozitiv egesz szamok lehetnek.")
        }

        if (veg < kezdet) {
            return res.status(400).send("Hibas datum.")
        }

        let auto = "SELECT * FROM autok WHERE id = ?"
        let [rows] = await pool.query(auto, [autoId])
        if (rows.length === 0) {
            return res.status(404).send("Nem egyezik auto a megadot ID-val.")
        }
        let autoadat = rows[0]

        let ugyfel = "SELECT * FROM ugyfelek WHERE id = ?"
        let [rows2] = await pool.query(ugyfel, [ugyfelId])
        if (rows2.length === 0) {
            return res.status(404).send("Nem egyezik ugyfel a megadott ID-val.")
        }

        let ugyfeladat = rows2[0]
        if (ugyfeladat.jogositvany_ervenyes < veg) {
            return res.status(409).send(`${ugyfeladat.nev} jogositvanya ${ugyfeladat.jogositvany_ervenyes}-en lejar`)
        }

        let berles = "SELECT * FROM berlesek WHERE auto_id = ? AND kezdet <= ? AND veg >= ?"
        let [rows3] = await pool.query(berles, [autoId, veg, kezdet])
        if (rows3.length > 0) {
            return res.status(409).send(`Az ${autoadat.modell} ${rows3[0].kezdet}-tol ki van adva`)
        }

        let insert = "INSERT INTO berlesek (auto_id, ugyfel_id, kezdet, veg) VALUES (?, ?, ?, ?)"
        let [rows4] = await pool.query(insert, [autoId, ugyfelId, kezdet, veg])

        let nap = "SELECT DATEDIFF(?, ?) + 1 AS napok"
        let [rows5] = await pool.query(nap, [veg, kezdet])

        let napok = rows5[0].napok
        let dij = napok * autoadat.napidij

        return res.status(201).json({
            id: rows4.insertId,
            rendszam: autoadat.rendszam,
            ugyfel: ugyfeladat.nev,
            kezdet,
            veg,
            napok,
            dij
        })

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent a szerver oldalon")
    }
})

export default router