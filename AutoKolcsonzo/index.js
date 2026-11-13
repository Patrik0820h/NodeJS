import express from 'express'
import autokRoute from './routes/autok.js'
import ugyfelekRoute from './routes/ugyfelek.js'
import statisztikaRoute from './routes/statisztika.js'
import berlesekRoute from './routes/berlesek.js'

const app = express()
const port = 3000
app.use(express.json())

app.use('/autok', autokRoute)
app.use('/ugyfelek', ugyfelekRoute)
app.use('/statisztika', statisztikaRoute)
app.use('/berlesek', berlesekRoute)

app.listen(port, () => {
    console.log("http://localhost:3000")
})