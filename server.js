const connection = require("./db")
const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const midAuth = require("./auth-components/middleware-auth.js")
const cookieParser = require("cookie-parser")
const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsCommand, GetObjectCommand} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const readFineSync = require("fs")
const multer = require("multer")

dotenv.config()


const s3 = new S3Client({region:process.env.AWS_REGION})

const corsOptions = {
    origin: "http://localhost:5173",
    methods : ["GET", "PUT", "POST", "DELETE"],
    credentials: true //allow sending cookies 
}


//set up multer for storage
const storage = multer.memoryStorage()
const upload = multer({
    storage:storage,
})

//deepl api
const deepl = require("deepl-node")
const deepl_key = process.env.DEEPL_KEY 
const deepl_client = new deepl.DeepLClient(deepl_key)

const app = express();
app.use(cookieParser())

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
//helper function to upload img to s3
const uploadS3 = async(myPic) => {
    const key = `card-image/${myPic.originalname}`
    const cmd = new PutObjectCommand({
        Bucket: 'flash-app-bkt',
        Key: key,
        Body: myPic.buffer,
        ACL: "private", 
        ContentType: myPic.mimetype
    })
    try{
        await s3.send(cmd)
        return "Upload Successful"
    }
    catch(err){
        console.log(err)
    }
}

//get the image url to access...TODO: Deal with timeouts 
const getImageUrl = async(fileName) => {
    const cmd = new GetObjectCommand({
        Bucket: "flash-app-bkt",
        Key: `card-image/${fileName}`
    })
    //for now, have URL expire in 1 hr 
    const url = await getSignedUrl(s3, cmd, {expiresIn: 3600})
    return url
}

//upload image to bucket
app.post("/uploadImg", upload.single("flash_image"), async(req, res) => {
    if(!req.file){
        return res.send("No img uploaded")
    }
    try{
        const uploadStatus = await uploadS3(req.file)
        //try getting the url
        try{
            const url_res = await getImageUrl(req.file.originalname)
            return res.send(url_res)
        }
        catch{
            return res.send("error with url")
        }
        return res.send(`Successfully uploaded ${req.file.originalname}`)
    }
    catch(err){
        console.log(err)
    }
    
})

//upload image and get the url
//function version of /uploadImg
const full_image_upload = async (flash_image) => {
    if(flash_image){
        return res.send("No img uploaded")
    }
    try{
        const uploadStatus = await uploadS3(flash_image)
        //try getting the url
        try{
            const url_res = await getImageUrl(flash_image.originalname)
            return res.send(url_res)
        }
        catch{
            return res.send("error with url")
        }
        return res.send(`Successfully uploaded ${flash_image.originalname}`)
    }
    catch(err){
        console.log(err)
    }
} 

app.post("/translate", async (req, res) => {
    const { input_text, input_language, output_language, output_text, user_id, picture_url} = req.body;

    connection.query(
        "INSERT INTO translator (input_text, input_language, output_language, output_text, user_id, picture_url) VALUES (?, ?, ?, ?, ?, ?)",
        [input_text, input_language, output_language, output_text, user_id, picture_url],
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

//register a new user by adding them to db 
app.post("/register", async (req, res) => {
    const {username, password, email} = req.body
    //align with the UNIQUE attribute in tables for email and username 
    const sqlquery1 = "INSERT INTO all_logins (username, password, email) VALUES (?, ?, ?)"
    const hashed_password = await bcrypt.hash(password, 10)
    connection.query(sqlquery1, [username, hashed_password, email], (err, result) => {
        if(err){
            console.log(err)
            //check if error is for duplication
            if(err.errno == 1062){ //duplication
                if(err.sqlMessage.includes("username")){
                    return res.send("Username already in use")
                }
                else if (err.sqlMessage.includes("email")){
                    return res.send("Email already in use")
                }
                else{
                    return res.send("Internal login error")
                }
            }
            //different error
            else{
                console.log(err)
            }
        }
        //no error
        else{
            return res.send(result)
        }
    })

})

//log in a current user and issue a jwt
app.post("/dologin", async(req,res) => {
    const {username, password} = req.body
    //check if user exists based on email 
    //sql query to return that user 
    //check is password matches 
    //if matches, give jwt
    //else give an error 
    const sqlquery = "SELECT * from all_logins where username = ? LIMIT 1"
    connection.query(sqlquery, [username], async (err, response) => {
        if(err){ //general error 
            console.log(err)
        }
        else{ 
            //check for any matches 
            if(response.length == 0){
                return res.send("Username not Registered")
            }
            //check for password validity
            bcrypt.compare(password, response[0].password, (b_err, b_response) => {
                if(b_err){ //general bcrypt err
                    console.log(b_err)
                }
                else{
                    //check if password matches
                    if(b_response){
                    //return a jwt 
                    const payload = {
                        id : response[0].user_id,
                        username: response[0].username,
                        email: response[0].email
                    }
                    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn: "10d"})
                    //set a cookie with name of token and the value as the JWT
                    res.cookie("token",token, {
                        httpOnly:true, //no JS access
                        secure:false
                    }).send({success:true})
                    }
                    else{
                        //invalid credentials 
                        return res.send("Invalid Password")
                    }
                }
            })

        }
    })
})

//log out a logged-in user
app.post("/dologout", (req, res) => {
    //clear the cookie
    res.clearCookie("token", {
        httpOnly:true,
        secure:false
    }).send({success:true})
})

//test the protected routes
app.post("/testauth", midAuth, (req, res) => {

    res.json({
        message: "Success",
        addedBy: req.user.username
    })
    
})

//if the user is verified, when requested, send them the cookie contents 
app.get("/verifyUser", midAuth, (req, res) => {
    res.json({
        success: true,
        user:{user_id: req.user.id, username: req.user.username, email: req.user.email}
    })
});




app.listen(PORT, () => {
    console.log(`Server started at Port ${PORT}`)
})