const mysql = require("mysql2")
const dotenv = require("dotenv")
dotenv.config()

const credentials = {
    host: process.env.ENDPOINT,
    user : process.env.USER_VALUE,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
}

const connection = mysql.createConnection(credentials)

connection.connect( (err) => {
    if(err){
        console.log("Error connecting")
    }
    else{
        console.log("Successfully connected to db")
    }
})


module.exports = connection