const jwt = require("jsonwebtoken")


const authenticateToken = (req, res, next) => {
    //Grab token from req header
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]
    //ensure token has actually been provided
    if(!token){
        return res.send("Unauthorized - No token provided")
    }
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, response) => {
        if(err){
            if(err.name == "TokenExpiredError"){
                return res.send("Expired Token")
            }
            else{
                return res.send("Invalid Token")
            }
        }
        //no error
        else{
            req.user = response 
            next()
        }
    })
}

module.exports = authenticateToken