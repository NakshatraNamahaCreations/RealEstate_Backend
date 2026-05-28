const User = require("../../Model/Auth/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../../Utils/mailer");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

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

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      const user = await User.findOne({ email });

      // Always respond the same way to avoid leaking which emails exist.
      const genericResponse = {
        message:
          "If an account with that email exists, a reset link has been sent.",
      };

      if (!user) {
        return res.status(200).json(genericResponse);
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      await User.updateOne(
        { _id: user._id },
        {
          resetPasswordToken: hashToken(resetToken),
          resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        }
      );

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (mailError) {
        console.error("Error sending reset email:", mailError);
        await User.updateOne(
          { _id: user._id },
          { $unset: { resetPasswordToken: "", resetPasswordExpires: "" } }
        );
        return res
          .status(500)
          .json({ message: "Failed to send reset email. Try again later." });
      }

      return res.status(200).json(genericResponse);
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res
          .status(400)
          .json({ message: "Token and new password are required." });
      }

      const user = await User.findOne({
        resetPasswordToken: hashToken(token),
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ message: "Reset token is invalid or has expired." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await User.updateOne(
        { _id: user._id },
        {
          password: hashedPassword,
          $unset: { resetPasswordToken: "", resetPasswordExpires: "" },
        }
      );

      return res
        .status(200)
        .json({ message: "Password has been reset successfully." });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = new UserController();
