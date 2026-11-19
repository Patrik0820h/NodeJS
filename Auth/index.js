import express from 'express';
import 'dotenv/config';
import apiRoute from './routes/api.js';

const app = express();
const port = Number(process.env.APP_PORT) ?? 3000;
app.use(express.json());

app.use('/api', apiRoute);

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
})