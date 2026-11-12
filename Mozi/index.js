import express from 'express'
import filmekRoute from './routes/filmek.js'
import vetitesekRoute from './routes/vetitesek.js'
import statisztikaRoute from './routes/statisztika.js'
import foglalasokRoute from './routes/foglalasok.js'

const app = express()
const port = 3000
app.use(express.json())

app.use('/filmek', filmekRoute)
app.use('/vetitesek', vetitesekRoute)
app.use('/statisztika', statisztikaRoute)
app.use('/foglalasok', foglalasokRoute)

app.listen(port, () => {
    console.log("http://localhost:3000")
})