import express from 'express'
import routerSzallasok from './routes/szallasok.js'
import routerVarosok from './routes/varosok.js'
import routerOrszagok from './routes/orszagok.js'
import routerAjanlat from './routes/ajanlat.js'
import routerLegjobb from './routes/legjobb.js'

const app = express();
const port = 3000;
app.use(express.json());

app.use('/szallasok', routerSzallasok);
app.use('/varosok', routerVarosok)
app.use('/orszagok', routerOrszagok)
app.use('/ajanlat', routerAjanlat)
app.use('/legjobb', routerLegjobb)

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});