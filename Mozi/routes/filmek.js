import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req,res) => {
    let sql = "SELECT fi.id, fi.cim, fi.hossz, fi.korhatar, COUNT(DISTINCT v.id) AS vetitesDB, COUNT(DISTINCT fo.id) AS foglalasDB FROM filmek fi LEFT JOIN vetitesek v ON fi.id = v.film_id LEFT JOIN foglalasok fo ON v.id = fo.vetites_id GROUP BY fi.cim ORDER BY fi.cim"

    let [rows] = await pool.query(sql)
    return res.json(rows)
})

router.get('/:id', async (req,res) => {
    let id = Number(req.params.id)

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).send("Az ID csak pozitiv egesz szam lehet.")
    }

    let sql = "SELECT fi.id, fi.cim, fi.hossz, fi.korhatar, v.id AS vetitesID, t.nev AS terem, DATE_FORMAT(v.kezdes, '%Y-%m-%d %H:%i') AS kezdes, v.jegyar, (t.sorok * t.szekek) - (SELECT COUNT(*) FROM foglalasok fo WHERE fo.vetites_id = v.id) AS szabadHely FROM filmek fi LEFT JOIN vetitesek v ON fi.id = v.film_id LEFT JOIN termek t ON v.terem_id = t.id WHERE fi.id = ?"

    let [rows] = await pool.query(sql, [id])

    if (rows.length === 0) {
        return res.status(404).send("Nincs ilyen film.")
    }

    let film = {
        id: rows[0].id,
        cim: rows[0].cim,
        hossz: rows[0].hossz,
        korhatar: rows[0].korhatar,
        vetitesek: rows.filter(f => f.vetitesID).map(x => ({id: x.vetitesID, terem: x.terem, kezdes: x.kezdes, jegyar: x.jegyar, szabadHely: x.szabadHely}))
    }

    return res.json(film)
})

export default router