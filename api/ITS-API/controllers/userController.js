const { User, UserType, Role, UserRoles } = require("../models");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const { generateRandomPassword } = require("../utils/password");
const { sendEmail } = require("../utils/sendEmail");
// Create a new user
const createUser = async (req, res) => {
  try {
    const { email, full_name, user_type_id, position, role_ids, assigned_by } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "User with this email already exists." });

    // Generate password
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user_id = uuidv4();

    // Create user
    const user = await User.create({
      user_id,
      full_name,
      email,
      password: hashedPassword,
      user_type_id,
      position,
      is_first_logged_in: true,
      is_active: true,
    });

    // Assign roles if provided
    if (Array.isArray(role_ids) && role_ids.length > 0) {
      const roles = await Role.findAll({ where: { role_id: role_ids } });
      if (roles.length !== role_ids.length)
        return res.status(400).json({ message: "Some role IDs are invalid or do not exist." });

      const roleAssignments = roles.map((role) =>
        UserRoles.create({
          user_role_id: uuidv4(),
          user_id: user.user_id,
          user_type: role.role_type,
          role_id: role.role_id,
          assigned_by: assigned_by || null,
          assigned_at: new Date(),
          is_active: true,
        })
      );
      await Promise.all(roleAssignments);
    }

    // Send email with password
    await sendEmail(
      email,
      `Welcome to ${process.env.APP_NAME}`,
      `Hello ${full_name},\n\nYour account has been created.\nTemporary password: ${password}\nPlease change it after first login.`
    );

    // Return user info with roles
    const userWithRoles = await User.findOne({
      where: { user_id: user.user_id },
      include: {
        model: Role,
        as: "roles",
        through: { attributes: ["assigned_at", "is_active", "assigned_by"] },
      },
    });

    res.status(201).json(userWithRoles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        { model: UserType, as: "userType" },
        { model: Role, as: "roles", through: { attributes: ["assigned_at", "assigned_by", "is_active"] } },
      ],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [
        { model: UserType, as: "userType" },
        { model: Role, as: "roles", through: { attributes: ["assigned_at", "assigned_by", "is_active"] } },
      ],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, user_type_id, position, is_active } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.full_name = full_name || user.full_name;
    user.email = email || user.email;
    user.user_type_id = user_type_id || user.user_type_id;
    user.position = position || user.position;
    if (is_active !== undefined) user.is_active = is_active;

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
