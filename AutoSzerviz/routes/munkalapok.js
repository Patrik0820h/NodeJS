import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req,res) => {
    try {
        let statusz = req.query.statusz
        let rendszam = req.query.rendszam
        const STATUSZOK = ['felvéve', 'javítás alatt', 'kész', 'átadva']

        if (statusz) {
            if (!STATUSZOK.includes(statusz)) {
                return res.status(400).send("Nem megfelelo statusz.")
            }

            let sql = "SELECT * FROM munkalapok m WHERE m.statusz = ?"
            let [rows] = await pool.query(sql, [statusz])
            if (rows.length === 0) {
                return res.status(404).send("Nem talalhato ilyen munkalap.")
            }
            return res.json(rows)
        }

        if (rendszam) {
            let sql = "SELECT * FROM munkalapok m WHERE m.rendszam = ?"
            let [rows] = await pool.query(sql, [rendszam])
            if (rows.length === 0) {
                return res.status(404).send("Nem talalhato ilyen munkalap.")
            }
            return res.json(rows)
        }

        let sql = `SELECT m.id, m.rendszam, u.nev AS ugyfel, m.felvetel, m.leiras, m.statusz, m.munkaora,
                m.munkaora*12000 AS munkadij, 
                (SELECT COALESCE(SUM(f.db * a.ar), 0) FROM felhasznalasok f JOIN alkatreszek a ON a.id = f.alkatresz_id WHERE f.munkalap_id = m.id) AS alkatreszdij,
                (m.munkaora*12000)+(SELECT COALESCE(SUM(f.db * a.ar), 0) FROM felhasznalasok f JOIN alkatreszek a ON a.id = f.alkatresz_id WHERE f.munkalap_id = m.id) AS vegosszeg
                FROM munkalapok m LEFT JOIN ugyfelek u ON m.ugyfel_id = u.id
                ORDER BY m.felvetel ASC`

        let [rows] = await pool.query(sql)
        return res.json(rows)

    } catch (err) {
        console.log(err)
        return res.status(500).send("Szerver oldali hiba.")
    }
})

router.get('/:id', async (req,res) => {
    try {
        let id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).send("Az ID csak pozitiv egesz szam lehet.")
        }

        let sql = `SELECT m.*, u.id AS ugyfelID, u.nev AS ugyfelNev, u.telefon AS ugyfeltelefon,
                    a.id AS alkatreszID, a.nev AS alkatreszNev, f.db AS db, a.ar AS alkatreszAr, a.ar*f.db AS osszeg,
                    (SELECT COALESCE(SUM(f.db * a.ar), 0) FROM felhasznalasok f JOIN alkatreszek a ON a.id = f.alkatresz_id WHERE f.munkalap_id = m.id) AS alkatreszdij,
                    m.munkaora*12000 AS munkadij,
                    (m.munkaora*12000)+(SELECT COALESCE(SUM(f.db * a.ar), 0) FROM felhasznalasok f JOIN alkatreszek a ON a.id = f.alkatresz_id WHERE f.munkalap_id = m.id) AS vegosszeg
                    FROM munkalapok m LEFT JOIN ugyfelek u ON m.ugyfel_id = u.id
                    LEFT JOIN felhasznalasok f ON m.id = f.munkalap_id
                    LEFT JOIN alkatreszek a ON f.alkatresz_id = a.id 
                    WHERE m.id = ? ORDER BY a.nev ASC`

        let [rows] = await pool.query(sql, [id])

        if (rows.length === 0) {
            return res.status(404).send("Nincs munkalap ezzel az ID-val.")
        }

        let munkalap = {
            id: rows[0].id,
            rendszam: rows[0].rendszam,
            felvetel: rows[0].felvetel,
            leiras: rows[0].leiras,
            statusz: rows[0].statusz,
            ugyfel: {
                id: rows[0].ugyfelID,
                nev: rows[0].ugyfelNev,
                telefon: rows[0].ugyfeltelefon
            },
            munkaora: rows[0].munkaora,
            alkatreszek: rows.filter(f => f.alkatreszID !== null).map(x => ({id: x.alkatreszID, nev: x.alkatreszNev, db: x.db, ar: x.alkatreszAr, osszeg: x.osszeg})),
            munkadij: rows[0].munkadij,
            alkatreszdij: rows[0].alkatreszdij,
            vegosszeg: rows[0].vegosszeg
        }

        return res.json(munkalap)

    } catch (err) {
        console.log(err)
        return res.status(500).send("Szerver oldali hiba.")
    }
})

router.patch('/:id/statusz', async (req,res) => {
    try {
        let id = Number(req.params.id)
        let statusz = req.body.statusz
        const STATUSZOK = ['felvéve', 'javítás alatt', 'kész', 'átadva']

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).send("Az ID csak pozitiv egesz szam lehet.")
        }

        if (!STATUSZOK.includes(statusz)) {
            return res.status(400).send("Nem megfelelo statusz.")
        }

        let sql = "SELECT * FROM munkalapok WHERE id = ?"
        let [rows] = await pool.query(sql, [id])

        if (rows.length === 0) {
            return res.status(404).send("Nincs ilyen munkalap.")
        }

        let aktualisStatusz = rows[0].statusz

        let regiIndex = STATUSZOK.indexOf(aktualisStatusz)
        let ujIndex = STATUSZOK.indexOf(statusz)

        if (ujIndex !== regiIndex + 1) {
            return res.status(409).send("Csak a kovetkezo statusz engedelyezett.")
        }

        let sql2 = "UPDATE munkalapok SET statusz = ? WHERE id = ?"
        await pool.query(sql2, [statusz, id])

        let sql3 = "SELECT * FROM munkalapok WHERE id = ?"
        let [rows2] = await pool.query(sql3, [id])

        return res.status(200).json(rows2[0])

    } catch (err) {
        console.log(err)
        return res.status(500).send("Szerver oldali hiba.")
    }
})

router.post('/:id/alkatreszek', async (req,res) => {
    let conn
    try {
        conn = await pool.getConnection()
        await conn.beginTransaction()

        const id = Number(req.params.id)
        const alkatreszID = Number(req.body.alkatreszId)
        const db = Number(req.body.db)

        if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(alkatreszID) || alkatreszID <= 0 || !Number.isInteger(db) || db <= 0) {
            await conn.rollback()
            return res.status(400).json({error: "hibas bemeneti adatok."})
        }
        
        let munkalap = "SELECT * FROM munkalapok WHERE id = ? FOR UPDATE"
        let [rows] = await conn.query(munkalap, [id])
        if (rows.length === 0) {
            await conn.rollback()
            return res.status(404).json({error: "A munkalap nem talalhato."})
        }

        let alkatresz = "SELECT * FROM alkatreszek WHERE id = ? FOR UPDATE"
        let [rows2] = await conn.query(alkatresz, [alkatreszID])
        if (rows2.length === 0) {
            await conn.rollback()
            return res.status(404).json({error: "Az alkatresz nem talalhato."})
        } 

        if (rows2[0].keszlet < db) {
            await conn.rollback()
            return res.status(409).json({error: "Nincs elegendo keszlet."})
        }

        let van_e_alkatresz = "SELECT * FROM felhasznalasok WHERE munkalap_id = ? AND alkatresz_id = ?"
        let [rows3] = await conn.query(van_e_alkatresz, [id, alkatreszID])
        if (rows3.length > 0) {
            let sql = "UPDATE felhasznalasok SET db = db + ? WHERE munkalap_id = ? AND alkatresz_id = ?"
            await conn.query(sql, [db, id, alkatreszID])
        } else {
            let sql = "INSERT INTO felhasznalasok (munkalap_id, alkatresz_id, db) VALUES (?, ?, ?)"
            await conn.query(sql, [id, alkatreszID, db]) 
        } 

        await conn.query("UPDATE alkatreszek SET keszlet = keszlet - ? WHERE id = ?", [db, alkatreszID])
        await conn.commit()

        let sql = `
            SELECT m.*, u.nev, u.telefon
            FROM munkalapok m
            JOIN ugyfelek u ON m.ugyfel_id = u.id
            WHERE m.id = ?
        `

        let [munkalap_vissza] = await conn.query(sql, [id])

        let sql2 = `
            SELECT a.id, a.nev, a.ar, f.db
            FROM felhasznalasok f
            JOIN alkatreszek a ON f.alkatresz_id = a.id
            WHERE f.munkalap_id = ?
        `

        let [alkatreszek] = await conn.query(sql2, [id])

        let alkatrészDij = 0

        for (let alkatrész of alkatreszek) {
            alkatrészDij += alkatrész.ar * alkatrész.db
        }

        let munkadij = munkalap_vissza[0].munkaora * 12000

        let vegosszeg = alkatrészDij + munkadij

        let teljesMunkalap = {
            ...munkalap_vissza[0],
            alkatreszek,
            alkatrészDij,
            munkadij,
            vegosszeg
        }

        return res.status(201).json(teljesMunkalap)

    } catch (err) {
        if (conn) {
            await conn.rollback()
        }
        console.log(err)
        return res.status(500).send("Szerver oldali hiba.")
    } finally {
        if (conn) {
            conn.release()
        }
    }

})

export default router