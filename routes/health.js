var express = require("express");
var router = express.Router();

/* GET health page. */
router.get("/", function (req, res, next) {
  res.render("health", { title: "Health check passed" });
});

module.exports = router;
