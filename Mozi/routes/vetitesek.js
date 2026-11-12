import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        let datum = req.query.datum

        if (isNaN(Date.parse(datum))) {
            return res.status(400).send("Hibas datum formatum")
        }

        let sql = "SELECT v.id, fi.cim, t.nev, DATE_FORMAT(v.kezdes, '%Y-%m-%d %H:%i') AS kezdes, DATE_FORMAT(v.kezdes + INTERVAL fi.hossz MINUTE, '%H:%i') AS veg, v.jegyar, t.sorok * t.szekek - (SELECT COUNT(*) FROM foglalasok f WHERE f.vetites_id = v.id) AS szabadHely FROM vetitesek v LEFT JOIN filmek fi ON v.film_id = fi.id LEFT JOIN termek t ON v.terem_id = t.id WHERE DATE(v.kezdes) = ? ORDER BY v.kezdes ASC"
        let [rows] = await pool.query(sql, [datum])

        if (rows.length === 0) {
            return res.status(404).send("Nincs vetites a megadott datumon.")
        }

        return res.json(rows)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent szerver oldalon.")
    } 

})

router.get('/:id', async (req, res) => {
    try {
        let id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).send("Az ID csak pozitiv egesz szam lehet.")
        }

        let sql = "SELECT v.id, fi.cim, t.nev, DATE_FORMAT(v.kezdes, '%Y-%m-%d %H:%i') AS kezdes, v.jegyar, t.sorok, t.szekek, (SELECT COUNT(*) FROM foglalasok f WHERE f.vetites_id = v.id) AS foglaltDB, t.sorok * t.szekek - (SELECT COUNT(*) FROM foglalasok f WHERE f.vetites_id = v.id) AS szabadHely FROM vetitesek v LEFT JOIN filmek fi ON v.film_id = fi.id LEFT JOIN termek t ON v.terem_id = t.id WHERE v.id = ?"
        let [rows] = await pool.query(sql, [id])

        if (rows.length === 0) {
            return res.status(404).send("Nincs vetites a megadott id-vel.")
        }

        let [foglaltHelyek] = await pool.query("SELECT sor, szek FROM foglalasok WHERE vetites_id = ? ORDER BY sor, szek", [id])

        let vetites = {
            id: rows[0].id,
            film: rows[0].cim,
            terem: rows[0].nev,
            kezdes: rows[0].kezdes,
            jegyar: rows[0].jegyar,
            sorok: rows[0].sorok,
            szekek: rows[0].szekek,
            foglaltDB: rows[0].foglaltDB,
            szabadHely: rows[0].szabadHely,
            vetitesek: foglaltHelyek.map(x => ({sor: x.sor,szek: x.szek}))
        }

        return res.json(vetites)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent szerver oldalon.")
    }
})

export default router