const connection = require("./db")
const express = require("express")
const {translate} = require("@vitalets/google-translate-api")

const app = express()

app.use(express.json())

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

//try using translation api
app.post("/translate", async (req, res) => {
    const {text, target_lang} = req.body
    try{
      const result = await translate(text, {to: target_lang})  
        res.json(result)
    }
    catch (err){
        console.log(err)
    }
})

app.listen(PORT, () => {
    console.log(`Server started at Port ${PORT}`)
})