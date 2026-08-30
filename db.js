const mysql = require("mysql2")
const dotenv = require("dotenv")
dotenv.config()

const credentials = {
    host: process.env.ENDPOINT,
    user : process.env.USER_VALUE,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
}

const pool = mysql.createPool({
    ...credentials,
    connectionLimit: 5,
    waitForConnections: true
})

module.exports = pool