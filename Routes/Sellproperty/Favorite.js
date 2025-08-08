const express = require("express");
const router = express.Router();
const {
  toggleFavorite,
  getFavoritesWithProperty,
} = require("../../Controller/Sellproperty/Favorite");

router.post("/toggle", toggleFavorite);
router.get("/:customerId", getFavoritesWithProperty);

module.exports = router;
