import express from "express"
import pool from "../db.js"

const router = express.Router()

router.get("/filmek", async (req, res) => {
    try { 
        let sql = "SELECT fi.cim, COALESCE(SUM(a.eladottJegy), 0) AS eladottJegy, COALESCE(SUM(a.bevetel), 0) AS bevetel, ROUND(SUM(a.eladottJegy) * 100.0 / NULLIF(SUM(a.ferohely), 0), 1) AS telitettseg FROM filmek fi LEFT JOIN (SELECT v.id, v.film_id, COUNT(f.id) AS eladottJegy, COUNT(f.id) * v.jegyar AS bevetel, t.sorok * t.szekek AS ferohely FROM vetitesek v LEFT JOIN foglalasok f ON v.id = f.vetites_id LEFT JOIN termek t ON v.terem_id = t.id GROUP BY v.id, v.film_id, v.jegyar, t.sorok, t.szekek) a ON fi.id = a.film_id GROUP BY fi.id, fi.cim ORDER BY bevetel DESC, fi.cim ASC"
        let [rows] = await pool.query(sql)
        return res.json(rows)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent szerver oldalon.")
    }
})

export default router
