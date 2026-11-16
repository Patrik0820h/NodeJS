import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        let sql = "SELECT d.nev AS diakNev, s.nap, GROUP_CONCAT(s.nev) AS szakkorok FROM diakok d LEFT JOIN jelentkezesek j ON d.id = j.diak_id LEFT JOIN szakkorok s ON j.szakkor_id = s.id GROUP BY d.id, d.nev, s.nap HAVING COUNT(*) > 1";
        let [rows] = await pool.query(sql);
        let utkozesek = rows.map(row => ({
            diakNev: row.diakNev,
            szakkorok: row.szakkorok ? row.szakkorok.split(',') : [],
        }));
        return res.json(utkozesek);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Szerver hiba történt." });
    }
});

export default router;