import express from 'express'
import gazdakRoute from './routes/gazdak.js'
import allatokRoute from './routes/allatok.js'
import kezelesRoute from './routes/kezelesek.js'
import statisztikaRoute from './routes/statisztika.js'

const app = express()
const port = 3000
app.use(express.json())

app.use('/gazdak', gazdakRoute)
app.use('/allatok', allatokRoute)
app.use('/kezelesek', kezelesRoute)
app.use('/statisztika', statisztikaRoute)

app.use('/', (req, res) => {
    return res.status(404).send("Nem letezo vegpont!")
})

app.listen(port, () => {
    console.log("http://localhost:3000")
})