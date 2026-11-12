import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.post('/', async (req, res) => {
    let { vetitesId, nev, sor, szek } = req.body

    try {

        if (!Number.isInteger(Number(vetitesId)) || Number(vetitesId) < 1 || !nev || !Number.isInteger(Number(sor)) || !Number.isInteger(Number(szek)) || Number(sor) < 1 || Number(szek) < 1) {
            return res.status(400).send('Hibas adatok.')
        }

        const [vetitesRows] = await pool.query("SELECT v.*, fi.cim, t.nev AS terem, t.sorok, t.szekek FROM vetitesek v JOIN filmek fi ON v.film_id = fi.id JOIN termek t ON v.terem_id = t.id WHERE v.id = ?", [vetitesId])

        if (vetitesRows.length === 0) {
            return res.status(404).send('A megadott vetites nem talalhato.')
        }

        const vetites = vetitesRows[0]

        if (sor > vetites.sorok || szek > vetites.szekek) {
            return res.status(400).send('Ervenytelen sor vagy szek.')
        }

        const [foglalasRows] = await pool.query("SELECT * FROM foglalasok WHERE vetites_id = ? AND sor = ? AND szek = ?", [vetitesId, sor, szek])

        if (foglalasRows.length > 0) {
            return res.status(409).send('A hely mar foglalt.')
        }

        const [osszesFoglalas] = await pool.query("SELECT COUNT(*) AS db FROM foglalasok WHERE vetites_id = ?", [vetitesId])

        if (osszesFoglalas[0].db >= vetites.sorok * vetites.szekek) {
            return res.status(409).send(`Telt haz: a ${vetites.terem} mind a ${vetites.sorok * vetites.szekek} helye foglalt.`)
        }

        const [eredmeny] = await pool.query("INSERT INTO foglalasok (vetites_id, nev, sor, szek) VALUES (?, ?, ?, ?)", [vetitesId, nev, sor, szek])

        return res.status(201).json({
            id: eredmeny.insertId,
            film: vetites.cim,
            terem: vetites.terem,
            kezdes: vetites.kezdes,
            nev,
            sor: Number(sor),
            szek: Number(szek),
            jegyar: vetites.jegyar
        })

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).send('A hely mar foglalt.')
        }

        console.log(err.message)
        return res.status(500).send('Hiba tortent a szerver oldalon.')
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).send("Az ID csak pozitiv egesz szam lehet.")
        }

        const [rows] = await pool.query("DELETE FROM foglalasok WHERE id = ?", [id])

        if (rows.affectedRows === 0) {
            return res.status(404).send('A megadott foglalas nem talalhato.')
        }

        return res.status(200).send('Foglalas torolve.')

    } catch (err) {
        console.log(err.message)
        return res.status(500).send('Hiba tortent a szerver oldalon.')
    }
})

export default router