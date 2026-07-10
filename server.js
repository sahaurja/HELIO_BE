const connection = require("./db")
const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")

const corsOptions = {
    origin: "http://localhost:5173",
    methods : ["GET", "PUT", "POST", "DELETE"]
}

dotenv.config()

//deepl api
const deepl = require("deepl-node")
const deepl_key = process.env.DEEPL_KEY 
const deepl_client = new deepl.DeepLClient(deepl_key)

const app = express()

app.use(express.json())

app.use(cors(corsOptions))

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
// app.get("/getcards" , (req, res) => {
//     const sqlquery = "SELECT * FROM flashcard_data"
//     connection.query(sqlquery, (err, response) => {
//         if (err) {
//             console.log(err)
//         }
//         else{
//             res.json(response)
//         }
//     })
// })

app.post("/generateflashcards", (req, res) => {
    const {id_val, ilang, olang} = req.body
    const sqlquery = "SELECT * FROM translator WHERE user_id=? AND input_language =? AND output_language=?"
    connection.query(sqlquery, [id_val, ilang, olang] , (err, response) => {
        if(err){
            console.log(err)
        }
        else{
            res.json(response)
        }
    })
})

// add flashcard rating to ongoing table 
app.post("/addrating", async (req, res) => {
    const {id, rating} = req.body;
    const sqlquery = "INSERT INTO ratings (translator_id, curr_rating) VALUES (?, ?)"
    connection.query(sqlquery, [id, rating], (err, result) => {
        if(err){
            console.log(err)
        }
        else{
            res.send(result)
        }
    })
})

app.listen(PORT, () => {
    console.log(`Server started at Port ${PORT}`)
})