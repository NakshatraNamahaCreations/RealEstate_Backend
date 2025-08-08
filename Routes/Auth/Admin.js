const { Router } = require("express");
const router = Router();
const UserController = require("../../Controller/Auth/Admin");

router.post("/signup", UserController.AdminUserSignup);
router.post("/signin", UserController.AdminUserSignin);
router.get("/alluser", UserController.AdmingetAlluser);

module.exports = router;
