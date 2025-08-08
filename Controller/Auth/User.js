const User = require("../../Model/Auth/User");
const bcrypt = require("bcrypt");

class UserController {
  async UserSignup(req, res) {
    try {
      const { userName, phonenumber, password, email } = req.body;

      if (!userName || !phonenumber || !password || !email) {
        return res.status(400).json({ message: "All fields are required." });
      }

      const existingUser = await User.findOne({ phonenumber });

      if (existingUser) {
        return res.status(400).json({ message: "User already exists!" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        userName,
        phonenumber,
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

  async UserSignin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: false,
          error: "Phone number and password are required.",
        });
      }

      const existingUser = await User.findOne({ email });

      if (!existingUser) {
        return res
          .status(404)
          .json({ status: false, error: "User not found!" });
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
          userName: existingUser.userName,
          email: existingUser.email,
          phonenumber: existingUser.phonenumber,
        },
      });
    } catch (error) {
      console.error("Error signing in user:", error);
      return res
        .status(500)
        .json({ status: false, error: "Internal server error" });
    }
  }

  async getAlluser(req, res) {
    try {
      const alluser = await User.find();

      if (!alluser) {
        return res.status(400).json({ message: "No User found." });
      }

      return res.status(200).json({ message: "All User", data: alluser });
    } catch (e) {
      console.log("e", e);
      res.status(500).json({ message: "Failed to get all user - " + e });
    }
  }

  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { gender, professional, socialmedialink } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      if (gender) user.gender = gender;
      if (professional) user.professional = professional;
      if (socialmedialink) user.socialmedialink = socialmedialink;

      await user.save();

      return res.status(200).json({
        message: "User updated successfully!",
        data: {
          userName: user.userName,
          email: user.email,
          phonenumber: user.phonenumber,
          gender: user.gender,
          professional: user.professional,
          socialmedialink: user.socialmedialink,
        },
      });
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = new UserController();
