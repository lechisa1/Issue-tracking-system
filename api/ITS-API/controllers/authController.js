const {
  User,
  UserType,
  Institute,
  ProjectUserRole,
  Role,
  SubRole,
  RoleSubRole,
  RoleSubRolePermission,
  Permission,
} = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name"],
        },
      ],
    });

    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });
    if (!user.is_active)
      return res.status(403).json({ message: "User is inactive" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_TIME || "12h" }
    );

    // Fetch active roles, subroles, and permissions
    const projectRoles = await ProjectUserRole.findAll({
      where: { user_id: user.user_id, is_active: true },
      include: [
        {
          model: Role,
          as: "role",
          where: { is_active: true },
          include: [
            {
              model: RoleSubRole,
              as: "roleSubRoles",
              where: { is_active: true },
              required: false, // allow roles without subroles
              include: [
                {
                  model: SubRole,
                  as: "subRole",
                  where: { is_active: true },
                  required: false,
                },
                {
                  model: RoleSubRolePermission,
                  as: "permissions",
                  include: [
                    {
                      model: Permission,
                      as: "permission",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: SubRole,
          as: "subRole",
          where: { is_active: true },
          required: false,
        },
      ],
    });

    // Format roles & permissions
    const roles = projectRoles.map((pr) => ({
      project_user_role_id: pr.project_user_role_id,
      role: pr.role
        ? {
            role_id: pr.role.role_id,
            name: pr.role.name,
            subRoles: pr.role.roleSubRoles.map((rs) => ({
              subRole: rs.subRole,
              permissions: rs.permissions.map((p) => p.permission),
            })),
          }
        : null,
      subRole: pr.subRole,
    }));

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        UserType: user.UserType,
        email: user.email,
        phone_number: user.phone_number,
        position: user.position,
        profile_image: user.profile_image,
        institute: user.institute
          ? {
              institute_id: user.institute.institute_id,
              name: user.institute.name,
            }
          : null,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Logout (token invalidation example using a blacklist)
const logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { login, logout };
