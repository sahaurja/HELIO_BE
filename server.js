const connection = require("./db")
const express = require("express")
const dotenv = require("dotenv")
dotenv.config()

//deepl api
const deepl = require("deepl-node")
const deepl_key = process.env.DEEPL_KEY 
const deepl_client = new deepl.DeepLClient(deepl_key)

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

app.post("/translate", async(req, res) => {
    try{
        const result = await deepl_client.translateText("Hello","en" ,"fr");
        res.json(result)
    }
    catch(err){
        console.log(err)
    }
})

//get translation data from db
app.get("/getcards" , (req, res) => {
    const sqlquery = "SELECT * FROM flashcard_data"
    connection.query(sqlquery, (err, response) => {
        if (err) {
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