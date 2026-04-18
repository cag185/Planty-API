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

// require("dotenv").config();
// const mysql = require("mysql2");

// const db = {
//   connection: null,
// };

// function connectToDB() {
//   console.log("Attempting DB connection...");

//   db.connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     port: Number(process.env.DB_PORT || 3306),
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     ssl: {
//       rejectUnauthorized: false,
//     },
//   });

//   db.connection.connect((error) => {
//     if (error) {
//       console.error("DB connection error:", error);
//       setTimeout(connectToDB, 5000);
//       return;
//     }

//     console.log(`DB connected with stats:
//         Host: ${db.connection.config.host}
//         User: ${db.connection.config.user}
//         Database: ${db.connection.config.database}
//         Port: ${db.connection.config.port}
//     `);
//   });

//   db.connection.on("error", (err) => {
//     console.error("MySQL runtime error:", err);

//     if (
//       err.code === "PROTOCOL_CONNECTION_LOST" ||
//       err.code === "ECONNRESET" ||
//       err.code === "ETIMEDOUT"
//     ) {
//       console.log("Reconnecting to DB...");
//       connectToDB();
//     } else {
//       console.error("Non-recoverable DB error:", err);
//     }
//   });
// }

// module.exports = db;
