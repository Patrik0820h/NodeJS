import express from 'express';
import szakkorokRoute from './routes/szakkorok.js';
import diakokRoute from './routes/diakok.js';
import utkozesekRoute from './routes/utkozesek.js';
import jelentkezesekRoute from './routes/jelentkezesek.js';

const app = express();
const port = 3000;
app.use(express.json());

app.use('/szakkorok', szakkorokRoute);
app.use('/diakok', diakokRoute);
app.use('/utkozesek', utkozesekRoute);
app.use('/jelentkezesek', jelentkezesekRoute);

app.listen(port, () => {
  console.log("http://localhost:3000");
});