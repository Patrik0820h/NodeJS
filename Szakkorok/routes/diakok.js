import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        let osztaly = req.query.osztaly;

        if (osztaly) {

            let sql = "SELECT d.id, d.nev, d.osztaly, COUNT(j.szakkor_id) as szakkorDB FROM diakok d LEFT JOIN jelentkezesek j ON d.id = j.diak_id WHERE d.osztaly = ? GROUP BY d.id, d.nev, d.osztaly"
            const [rows] = await pool.query(sql, [osztaly]);
            return res.json(rows);
        } 

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Szerver hiba történt." });
    }
});

router.get("/szakkor-nelkul", async (req, res) => {
    try {
        let sql = "SELECT d.nev FROM diakok d LEFT JOIN jelentkezesek j ON d.id = j.diak_id WHERE j.szakkor_id IS NULL"; 
        const [rows] = await pool.query(sql);

        let diakok = rows.map(row => row.nev).join(", ");

        return res.send(diakok);


    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Szerver hiba történt." });
    }
});

router.get("/:id", async (req, res) => {
    try {
        let id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Az ID csak pozitív egész szám lehet." });
        }

        let sql = "SELECT d.*, sz.id AS szakkorId, sz.nev AS szakkorNev, sz.tanar AS szakkorTanar, sz.nap AS szakkorNap, sz.max_letszam AS max_letszam FROM diakok d LEFT JOIN jelentkezesek j ON d.id = j.diak_id LEFT JOIN szakkorok sz ON j.szakkor_id = sz.id WHERE d.id = ?";
        const [rows] = await pool.query(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "A megadott ID-hoz nem tartozik diák." });
        }

        let diak = {
            id: rows[0].id,
            nev: rows[0].nev,
            osztaly: rows[0].osztaly,
            szakkorok: rows.filter(row => row.szakkorId !== null).map(row => ({
                id: row.szakkorId,
                nev: row.szakkorNev,
                tanar: row.szakkorTanar,
                nap: row.szakkorNap,
                max_letszam: row.max_letszam
            }))
        };

        return res.json(diak);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Szerver hiba történt." });
    }
});

export default router;