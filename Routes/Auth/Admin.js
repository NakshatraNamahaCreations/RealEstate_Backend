const { Router } = require("express");
const router = Router();
const UserController = require("../../Controller/Auth/Admin");

router.post("/signup", UserController.AdminUserSignup);
router.post("/signin", UserController.AdminUserSignin);
router.get("/alluser", UserController.AdmingetAlluser);

// Push notification broadcast to all users.
router.post("/broadcast", UserController.broadcast);

module.exports = router;
