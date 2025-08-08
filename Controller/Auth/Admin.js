const adminUser = require("../../Model/Auth/Admin");
const bcrypt = require("bcrypt");

class UserController {
  async AdminUserSignup(req, res) {
    try {
      const { password, email } = req.body;

      if (!password || !email) {
        return res.status(400).json({ message: "All fields are required." });
      }

      const existingUser = await adminUser.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ message: "User already exists!" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await adminUser.create({
        email,
        password: hashedPassword,
      });

      return res.status(200).json({
        message: "User created successfully!",
        user: newUser,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async AdminUserSignin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: false,
          error: "Email and password are required.",
        });
      }

      const existingUser = await adminUser.findOne({ email });

      if (!existingUser) {
        return res
          .status(404)
          .json({ status: false, error: "Admin not found!" });
      }

      const isMatch = await bcrypt.compare(password, existingUser.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ status: false, error: "Invalid password!" });
      }

      return res.status(200).json({
        status: true,
        message: "User signed in successfully!",
        data: {
          id: existingUser._id,
          email: existingUser.email,
        },
      });
    } catch (error) {
      console.error("Error signing in user:", error);
      return res
        .status(500)
        .json({ status: false, error: "Internal server error" });
    }
  }

  async AdmingetAlluser(req, res) {
    try {
      const alluser = await email.find({});

      if (!alluser) {
        return res.status(400).json({ message: "No User found." });
      }

      res.status(200).json({ message: "All User", data: alluser });
    } catch (e) {
      res
        .status(500)
        .json({ message: "Failed to get all user - " + e.message });
    }
  }
}

module.exports = new UserController();
