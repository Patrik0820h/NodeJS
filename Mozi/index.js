import express from 'express'
import filmekRoute from './routes/filmek.js'

const app = express()
const port = 3000
app.use(express.json())

app.use('/filmek', filmekRoute)

app.listen(port, (req,res) => {
    console.log("http://localhost:3000")
})