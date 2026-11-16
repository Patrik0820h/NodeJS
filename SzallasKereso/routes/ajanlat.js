import express from 'express'
import pool from '../db.js'

const router = express.Router();

router.get('/', async (req, res) => {
    const { varos, ej, fo } = req.query;
    const hibak = [];

    if (!varos) {
        hibak.push('A város megadása kötelező!');
    }

    const ejszakak = Number(ej);
    if (!ej || !Number.isInteger(ejszakak) || ejszakak < 1) {
        hibak.push('Az éjszakák száma legalább 1 legyen!');
    }

    const letszam = Number(fo);
    if (!fo || !Number.isInteger(letszam) || letszam < 1) {
        hibak.push('A fő megadása kötelező!');
    }

    if (hibak.length > 0) {
        return res.status(400).json({ hibak });
    }

    let sql_varos = "SELECT id, nev FROM varosok WHERE nev = ?"
    const [varosok] = await pool.query(sql_varos, [varos]);

    if (varosok.length === 0) {
        return res.status(404).send('A keresett város nem található!');
    }

    let sql_szallas = "SELECT nev, csillag, ar FROM szallasok WHERE varos_id = ? ORDER BY ar ASC"
    const [szallasok] = await pool.query(sql_szallas, [varosok[0].id]);

    const ajanlatok = szallasok.map(s => ({
        szallas: s.nev,
        csillag: s.csillag,
        arFoEj: s.ar,
        osszesen: s.ar * ejszakak * letszam
    }));

    return res.json({
        varos: varosok[0].nev,
        ej: ejszakak,
        fo: letszam,
        ajanlatok
    });
});

export default router;