import mysql from 'mysql2/promise'

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'szerviz',
    port: '3307',
    dateStrings: true
})

export default pool