require("dotenv").config();
const mysql = require("mysql2");

const db = {
  connection: null,
};

function connectToDB() {
  db.connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: Number(process.env.DB_PORT),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  db.connection.connect((err) => {
    if (err) {
      console.error("DB connection error:", err);
      setTimeout(connectToDB, 5000);
    } else {
      console.log("DB connected");
    }
  });

  db.connection.on("error", (err) => {
    console.error("MySQL runtime error:", err);
    if (
      err.code === "PROTOCOL_CONNECTION_LOST" ||
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT"
    ) {
      console.log("Reconnecting to DB...");
      connectToDB();
    } else {
      throw err;
    }
  });
}

connectToDB();

module.exports = db;
