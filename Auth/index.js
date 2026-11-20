import express from 'express';
import 'dotenv/config';
import apiRoute from './routes/api.js';
import cors from 'cors'

const app = express();
const port = Number(process.env.APP_PORT) ?? 3000;

app.use(cors({
    origin: 'http://127.0.0.1:5500'
}));

app.use(express.json());

app.use('/api', apiRoute);

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
})