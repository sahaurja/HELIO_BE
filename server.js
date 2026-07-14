const connection = require("./db")
const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors");
dotenv.config()

//deepl api
const deepl = require("deepl-node")
const deepl_key = process.env.DEEPL_KEY 
const deepl_client = new deepl.DeepLClient(deepl_key)

const app = express();

app.use(cors());
app.use(express.json())

const PORT = 8081

app.listen(8081, () => {
    console.log("Server running on port 8081");
});

// endpoints

app.get("/", (req, res) => {
    res.send("Home")
})

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

app.post("/translate", async (req, res) => {
    const { input_text, input_language, output_language, output_text, user_id} = req.body;

    connection.query(
        "INSERT INTO translator (input_text, input_language, output_language, output_text, user_id) VALUES (?, ?, ?, ?, ?)",
        [input_text, input_language, output_language, output_text, user_id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }

            console.log(result);

            res.json({
                message: "Translation saved",
                id: result.insertId
            });
        }
    );
});