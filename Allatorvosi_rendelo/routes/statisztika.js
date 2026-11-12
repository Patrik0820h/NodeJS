import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/fajok', async (req,res) => {
    let sql = "SELECT a.faj, COUNT(DISTINCT a.id) AS allatDB, COUNT(DISTINCT k.id) AS kezelesDB, SUM(k.dij) AS bevetel FROM allatok a LEFT JOIN kezelesek k ON a.id = k.allat_id GROUP BY a.faj"

    let [rows] = await pool.query(sql)
    return res.json(rows)
})

router.get('/havi', async (req,res) => {
    let sql = "SELECT DATE_FORMAT(k.datum, '%Y-%m') AS datum, COUNT(k.id) AS kezelesDB, SUM(k.dij) AS bevetel FROM kezelesek k GROUP BY DATE_FORMAT(k.datum, '%Y-%m') ORDER BY datum ASC"

    let [rows] = await pool.query(sql)
    return res.json(rows)
})

router.get('/gazdak', async (req,res) => {
    let sql = "SELECT g.nev, COUNT(DISTINCT a.id) AS allatDB, COALESCE(SUM(k.dij), 0) AS osszKoltes FROM gazdak g LEFT JOIN allatok a ON g.id = a.gazda_id LEFT JOIN kezelesek k ON a.id = k.allat_id GROUP BY g.nev ORDER BY osszKoltes DESC"

    let [rows] = await pool.query(sql)
    return res.json(rows)
})

export default router