var express = require("express");
var router = express.Router();

/* GET health page. */
router.get("/", function (req, res, next) {
  res.json({ ok: true });
});

module.exports = router;
