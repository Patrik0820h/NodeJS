import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { diak_id, szakkor_id } = req.body;

        if (!Number.isInteger(Number(diak_id)) || Number(diak_id) <= 0 || !Number.isInteger(Number(szakkor_id)) || Number(szakkor_id) <= 0) {
            return res.status(400).json({hibak: "Érvénytelen vagy hiányzó azonosítók."});
        }

        let sql2 = "SELECT * FROM szakkorok WHERE id = ?";
        const [szakkor] = await pool.query(sql2, [szakkor_id]);
        if (szakkor.length === 0) {
            return res.status(404).json({hibak: "A szakkör nem található."});
        }

        let sql3 = "SELECT * FROM diakok WHERE id = ?";
        const [diak] = await pool.query(sql3, [diak_id]);
        if (diak.length === 0) {
            return res.status(404).json({hibak: "A diák nem található."});
        }
        
        let sql = "SELECT * FROM jelentkezesek WHERE diak_id = ? AND szakkor_id = ?";
        const [existing] = await pool.query(sql, [diak_id, szakkor_id]);
        if (existing.length > 0) {
            return res.status(409).json({hibak: "A diák már jelentkezett erre a szakkörre."});
        }

        let sql4 = "SELECT COUNT(*) AS letszam FROM jelentkezesek WHERE szakkor_id = ?"
        const [letszam] = await pool.query(sql4, [szakkor_id]);
        if (letszam[0].letszam >= szakkor[0].max_letszam) {
            return res.status(409).json({hibak: "A szakkör betelt."});
        }

        let sql5 = "SELECT sz.nev FROM jelentkezesek j JOIN szakkorok sz ON j.szakkor_id = sz.id WHERE j.diak_id = ? AND sz.nap = ?";
        const [utkozes] = await pool.query(sql5, [diak_id, szakkor[0].nap]);
        if (utkozes.length > 0) {
            return res.status(409).json({hibak: `${diak[0].nev} ezen a napon már jár szakkörre: ${utkozes[0].nev}.`});
        }

        const datum = new Date().toISOString().slice(0, 10);
        let insert = "INSERT INTO jelentkezesek (diak_id, szakkor_id, datum) VALUES (?, ?, ?)";
        await pool.query(insert, [diak_id, szakkor_id, datum]);

        return res.status(201).json({
            uzenet: "Sikeres jelentkezés!",
            diak: diak[0].nev,
            szakkor: szakkor[0].nev,
            nap: szakkor[0].nap,
            datum: datum
        });


    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Szerver hiba történt." });
    }
});

router.delete("/:diak_id/:szakkor_id", async (req, res) => {
    try {
        const { diak_id, szakkor_id } = req.params;

        if (!Number.isInteger(Number(diak_id)) || Number(diak_id) <= 0 || !Number.isInteger(Number(szakkor_id)) || Number(szakkor_id) <= 0) {
            return res.status(400).json({hibak: "Érvénytelen vagy hiányzó azonosítók."});
        }

        let sql = "SELECT * FROM jelentkezesek WHERE diak_id = ? AND szakkor_id = ?";
        const [existing] = await pool.query(sql, [diak_id, szakkor_id]);
        if (existing.length === 0) {
            return res.status(404).json({hibak: "A jelentkezés nem található."});
        }

        let deleteSql = "DELETE FROM jelentkezesek WHERE diak_id = ? AND szakkor_id = ?";
        await pool.query(deleteSql, [diak_id, szakkor_id]);

        return res.status(204).json({ uzenet: "Sikeres törlés!" });


    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Szerver hiba történt." });
    }
});

export default router;
