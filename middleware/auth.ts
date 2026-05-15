require("dotenv").config();
const jwt = require("jsonwebtoken");

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expects: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, function (err: any, decoded: any) {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = decoded; // { id, email, iat, exp }
    next();
  });
};

module.exports = authenticateToken;
