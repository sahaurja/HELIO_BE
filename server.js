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

const app = express();

app.use(cors());
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

app.post("/translate3", async(req, res) => {
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

app.post("/translateinto", async (req, res) => {
    console.log(req.body);
    try {
        const { input_text, input_language, output_language } = req.body;

        const result = await deepl_client.translateText(
            input_text,
            input_language,
            output_language
        );

        res.json({
            output_text: result.text,
        });
    } catch (err) {
        console.error(err.message);
        console.error(err);
        res.status(500).json({
            error: "Translation failed"
        });
    }
});

app.post("/translate", async(req,res) => {
    const { input_text, input_language, output_language } = req.body;
        connection.query("INSERT INTO translator (input_text, input_language, output_language) VALUES (?, ?, ?)", 
            [input_text, input_language, output_language],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: err.message });
                }

                console.log(result);
            })
})
app.listen(PORT, () => {
    console.log(`Server started at Port ${PORT}`)
})