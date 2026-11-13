import mysql from 'mysql2/promise'

const dbconfig = {
    host: 'localhost',
    user: 'root',
    database: 'receptek',
    port: '3307',
    dateStrings: true
}

const pool = mysql.createPool(dbconfig)

export default pool