import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req,res) => {
    try {
        let kategoria = req.query.kategoria
        let maxIdo = Number(req.query.maxIdo)

        if (!Number.isInteger(maxIdo) || maxIdo <= 0) {
            return res.status(400).send("Az ido csak pozitiv egesz szam lehet")
        }

        let sql = "SELECT r.id, r.nev, r.kategoria, r.adag, r.ido, COUNT(DISTINCT rh.hozzavalo_id) AS hozzavaloDB, ROUND(SUM(rh.mennyiseg * h.egysegar), 0) AS koltseg FROM receptek r LEFT JOIN recept_hozzavalok rh ON r.id = rh.recept_id LEFT JOIN hozzavalok h ON rh.hozzavalo_id = h.id WHERE 1=1"
        let params = []

        if (kategoria) {
            sql += " AND r.kategoria = ?"
            params.push(kategoria)
        }

        if (maxIdo) {
            sql += " AND r.ido <= ?"
            params.push(maxIdo)
        }

        sql += " GROUP BY r.nev ORDER BY r.nev ASC"

        let [rows] = await pool.query(sql, params)

        if (rows.length === 0) {
            return res.status(404).send("Nem talalhato ilyen recept.")
        }

        return res.json(rows)
    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent a szerver oldalon")
    }
})

router.get('/kereses', async (req,res) => {
    try {
        let van = req.query.van

        if (!van) {
            return res.status(400).send("A kereses parameter nelkul nem lehetseges.")
        }

        let hozzavalok = van.split(',')

        let sql = "SELECT r.id, r.nev, r.kategoria FROM receptek r LEFT JOIN recept_hozzavalok rh ON r.id = rh.recept_id LEFT JOIN hozzavalok h ON rh.hozzavalo_id = h.id WHERE h.nev IN (?) GROUP BY r.nev HAVING COUNT(DISTINCT h.id) = ?"

        let [rows] = await pool.query(sql, [hozzavalok, hozzavalok.length])

        return res.json(rows)
    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent a szerver oldalon")
    }
})

router.get('/:id', async (req,res) => {
    try {
        let id = Number(req.params.id)
        let adag = Number(req.query.adag)
        let kulonbseg;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).send("Az ID csak pozitiv egesz szam lehet.")
        }

        let sql = "SELECT r.id, r.nev, r.kategoria, r.adag, r.ido, h.id AS hozzavaloID, h.nev AS hozzavaloNev, rh.mennyiseg AS mennyiseg, h.mertekegyseg AS mertekegyseg, rh.mennyiseg*h.egysegar AS koltseg, (SELECT ROUND(SUM(rh2.mennyiseg*h2.egysegar), 0) FROM hozzavalok h2 LEFT JOIN recept_hozzavalok rh2 ON h2.id = rh2.hozzavalo_id WHERE rh2.recept_id = r.id) AS osszKoltseg FROM receptek r LEFT JOIN recept_hozzavalok rh ON r.id = rh.recept_id LEFT JOIN hozzavalok h ON rh.hozzavalo_id = h.id WHERE r.id = ? ORDER BY h.nev ASC"
        let [rows] = await pool.query(sql, [id])

        if (rows.length === 0) {
            return res.status(404).send("A recept nem talalhato.")
        }

        let recept = {
            id: rows[0].id,
            nev: rows[0].nev,
            kategoria: rows[0].kategoria,
            adag: rows[0].adag,
            ido: rows[0].ido,
            hozzavalok: rows.filter(f => f.hozzavaloID).map(x => ({id: x.hozzavaloID, nev: x.hozzavaloNev, mennyiseg: x.mennyiseg, mertekegyseg: x.mertekegyseg, koltseg: x.koltseg})),
            osszKoltseg: rows[0].osszKoltseg,
            adagonkent: (rows[0].osszKoltseg / rows[0].adag).toFixed(0)
        }

        if (adag) {
            if (!Number.isInteger(adag) || adag <= 0) {
                return res.status(400).send("Az adag csak pozitiv egesz szam lehet.")
            }

            kulonbseg = adag / rows[0].adag

            recept.adag = adag

            recept.hozzavalok = recept.hozzavalok.map(x => ({...x, mennyiseg: x.mennyiseg * kulonbseg, koltseg: x.koltseg * kulonbseg}))

            recept.osszKoltseg = (recept.osszKoltseg * kulonbseg).toFixed(0)
            recept.adagonkent = (recept.osszKoltseg / adag).toFixed(0)
        }

        return res.json(recept)
    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent a szerver oldalon")
    }
})

router.post('/:id/hozzavalok', async (req,res) => {
    try {
        let id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).send("Az ID csak pozitiv egesz szam lehet.")
        }

        let { hozzavaloId, mennyiseg } = req.body

        if (!Number.isInteger(Number(hozzavaloId)) || Number(hozzavaloId) <= 0) {
            return res.status(400).send("Az ID csak pozitiv egesz szam lehet.")
        }
        if (!Number.isInteger(Number(mennyiseg)) || Number(mennyiseg) <= 0) {
            return res.status(400).send("A mennyiseg csak pozitiv egesz szam lehet.")
        }

        let recept = "SELECT * FROM receptek WHERE id = ?"
        let [rows] = await pool.query(recept, [id])
        if (rows.length === 0) {
            return res.status(404).send("Nem talalhato ilyen recept.")
        }

        let hozzavalo = "SELECT * FROM hozzavalok WHERE id = ?"
        let [rows2] = await pool.query(hozzavalo, [hozzavaloId])
        if (rows2.length === 0) {
            return res.status(404).send("Nem talalhato hozzavalo.")
        }

        let recept_hozzavalo = "SELECT * FROM recept_hozzavalok WHERE recept_id = ? AND hozzavalo_id = ?"
        const [rows3] = await pool.query(recept_hozzavalo, [id, hozzavaloId])
        if (rows3.length > 0) {
            return res.status(409).send("Ez a hozzavalo mar szerepel a receptben.")
        }

        let hozzaad = "INSERT INTO recept_hozzavalok (recept_id, hozzavalo_id, mennyiseg) VALUES (?,?,?)"
        await pool.query(hozzaad, [id,hozzavaloId,mennyiseg])

        const [visszatero] = await pool.query('SELECT r.id, r.nev, r.kategoria, r.adag, r.ido, COALESCE(SUM(rh.mennyiseg * h.egysegar), 0) AS koltseg, ROUND(COALESCE(SUM(rh.mennyiseg * h.egysegar), 0) / r.adag) AS adagonkent, JSON_ARRAYAGG(JSON_OBJECT("id", h.id, "nev", h.nev, "mennyiseg", rh.mennyiseg, "mertekegyseg", h.mertekegyseg, "ar", rh.mennyiseg * h.egysegar)) AS hozzavalok FROM receptek r LEFT JOIN recept_hozzavalok rh ON r.id = rh.recept_id LEFT JOIN hozzavalok h ON rh.hozzavalo_id = h.id WHERE r.id = ? GROUP BY r.id', [id])
        return res.status(201).json(visszatero[0])

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent a szerver oldalon")
    }

})

router.delete('/:id/hozzavalok/:id2', async (req,res) => {
    try {
        let receptID = Number(req.params.id)
        let hozzavaloID = Number(req.params.id2)

        if (!Number.isInteger(receptID) || !Number.isInteger(hozzavaloID) || receptID <= 0 || hozzavaloID <= 0) {
            return res.status(400).send("Az ID-k csak pozitiv egesz szamok lehetnek.")
        }

        let recept = "SELECT * FROM receptek WHERE id = ?"
        let [rows] = await pool.query(recept, [receptID])
        if (rows.length === 0) {
            return res.status(404).send("Nem talalhato ilyen recept.")
        }

        let hozzavalo = "SELECT * FROM hozzavalok WHERE id = ?"
        let [rows2] = await pool.query(hozzavalo, [hozzavaloID])
        if (rows2.length === 0) {
            return res.status(404).send("Nem talalhato ilyen hozzavalo.")
        }

        let torles = "DELETE FROM recept_hozzavalok WHERE recept_id = ? AND hozzavalo_id = ?"
        let [rows3] = await pool.query(torles, [receptID, hozzavaloID])
        if (rows3.affectedRows === 0) {
            return res.status(404).send("Nem talalhato a megadott hozzavalo a megadott receptben")
        }

        return res.sendStatus(204)

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("Hiba tortent a szerver oldalon")
    }
})

export default router