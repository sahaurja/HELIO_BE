const connection = require("./db")
const express = require("express")

const app = express()

const PORT = 8081

// endpoints

app.get("/", (req, res) => {
    res.send("Home")
})

// try getting data from db 
app.get("/login_info", (req, res) => {
    const sqlquery = "SELECT * FROM login_info"
    connection.query(sqlquery, (err, response)=> {
        if(err){
            console.log(err)
        }
        else{
            res.json(response)
        }
    })
})

app.listen(PORT, () => {
    console.log(`Server started at Port ${PORT}`)
})