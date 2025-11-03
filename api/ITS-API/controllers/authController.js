const { User, Role ,Institute} = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      where: { email },
      include:[ {
        model: Role,
        as: "roles",
        through: { attributes: ["role_id"] },
        
      }
    ,        {
          model: Institute,
          as: "institute",
          attributes: ['institute_id', 'name', 'address']
        }],
      
    });

    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (!user.is_active) return res.status(403).json({ message: "User is inactive" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, roles: user.roles.map(r => r.name) },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_TIME || "3h" }
    );

res.status(200).json({
  message: "Login successful",
  token,
  user: {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    phone_number: user.phone_number,
    position: user.position,
    roles: user.roles.map(r => r.name), // roles is an array
    institute: user.institute ? {   // check if it exists for only institute
      institute_id: user.institute.institute_id,
      name: user.institute.name,
      address: user.institute.address
    } : null,
  },
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Logout (token invalidation example using a blacklist)
const logout = async (req, res) => {
  try {

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { login, logout };
