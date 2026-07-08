const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "flash-app.cj2i0eqk8pfw.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "flash_hackers123",
    database: "flash_app_db"
}).promise()

async function testDatabase() {
    try {
        const [rows] = await pool.query("SELECT * FROM login_info");
        console.log(rows);
    } catch (err) {
        console.error(err);
    }
}

a