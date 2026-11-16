import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        let nap = req.query.nap;
        let vanHely = req.query.vanHely;

        if (nap) {
            let sql = "SELECT sz.nev AS nev, sz.max_letszam - COUNT(j.diak_id) AS szabadHely FROM szakkorok sz LEFT JOIN jelentkezesek j ON sz.id = j.szakkor_id WHERE sz.nap = ? GROUP BY sz.id ORDER BY sz.nap ASC, sz.nev ASC";
            const [rows] = await pool.query(sql, [nap]);
            let szakkor = rows.map(row => row.nev + " (" + row.szabadHely + " szabad hely)").join(", ");
            return res.send(szakkor);
        }

        if (vanHely) {
            let sql = "SELECT sz.nev AS nev, sz.max_letszam - COUNT(j.diak_id) AS szabadHely FROM szakkorok sz LEFT JOIN jelentkezesek j ON sz.id = j.szakkor_id GROUP BY sz.id HAVING szabadHely > 0 ORDER BY sz.nap ASC, sz.nev ASC";
            const [rows] = await pool.query(sql);
            let szakkor = rows.map(row => row.nev + " (" + row.szabadHely + " szabad hely)").join(", ");
            return res.send(szakkor);
        }

        let sql = "SELECT sz.*, COUNT(j.diak_id) AS jelentkezett, sz.max_letszam - COUNT(j.diak_id) AS szabadHely FROM szakkorok sz LEFT JOIN jelentkezesek j ON sz.id = j.szakkor_id GROUP BY sz.id ORDER BY sz.nap ASC, sz.nev ASC";

        const [rows] = await pool.query(sql);
        return res.json(rows);


    } catch (err) {
        console.error(err);
        return res.status(500).json({error: "Szerver hiba történt."});
    }
})

router.get("/:id", async (req, res) => {
    try {
        let id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({error: "Az ID csak pozitív egész szám lehet."});
        }

        const sql = "SELECT sz.*, d.id AS diakID, d.nev AS diakNev, d.osztaly AS diakOsztaly, DATE_FORMAT(j.datum, '%Y-%m-%d') AS jelentkezesDatum FROM szakkorok sz LEFT JOIN jelentkezesek j ON sz.id = j.szakkor_id LEFT JOIN diakok d ON j.diak_id = d.id WHERE sz.id = ? ORDER BY d.nev ASC";
        const [rows] = await pool.query(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({error: "A megadott ID-hoz nem tartozik szakkör."});
        }

        let szakkor = {
            id: rows[0].id,
            nev: rows[0].nev,
            tanar: rows[0].tanar,
            nap: rows[0].nap,
            max_letszam: rows[0].max_letszam,
            diakok: rows.filter(row => row.diakID !== null).map(row => ({
                id: row.diakID,
                nev: row.diakNev,
                osztaly: row.diakOsztaly,
                jelentkezesDatum: row.jelentkezesDatum
            }))
        };

        return res.json(szakkor);


    } catch (err) {
        console.error(err);
        return res.status(500).json({error: "Szerver hiba történt."});
    }
})

export default router;