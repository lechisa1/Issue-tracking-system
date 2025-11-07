
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
  sequelize,
} = require("../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const { generateRandomPassword } = require("../utils/password");
const { sendEmail } = require("../utils/sendEmail");

const { getPagination, getPagingData } = require("../utils/pagination");

// controllers/userController.js
const createUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      full_name,
      email,
      user_type_id,
      institute_id,
      position,
      phone_number
    } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ where: { email }, transaction: t });
    if (existingUser) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "User with this email already exists."
      });
    }

    // Validate user type
    const userType = await UserType.findByPk(user_type_id, { transaction: t });
    if (!userType) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid user type."
      });
    }

    // Validate institute for institute users
    if (userType.name === 'external_user' && !institute_id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Institute ID is required for institute users."
      });
    }

    if (institute_id) {
      const institute = await Institute.findByPk(institute_id, { transaction: t });
      if (!institute) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid institute ID."
        });
      }
    }

    // Generate password and create user
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      user_id: uuidv4(),
      full_name,
      email,
      password: hashedPassword,
      phone_number,
      user_type_id,
      institute_id: userType.name === 'external_user' ? institute_id : null,
      position,
      is_first_logged_in: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction: t });

    await t.commit();

    // =============Send email ==========
    await sendEmail(email, `Welcome to ${process.env.APP_NAME}!`, `
      Dear ${full_name},
      Your account has been successfully created.
      Email: ${email}
      Temporary Password: ${password}
      Please change your password after first login.
    `);

    const newUser = await User.findByPk(user.user_id, {
      include: [
        {
          model: UserType,
          as: 'userType',
          attributes: ['name', 'description']
        },
        {
          model: Institute,
          as: 'institute',
          attributes: ['name', 'contact_email']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message
    });
  }
};

// =============== Update user ===============
const updateUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      user_type_id,
      institute_id,
      position,
      phone_number,
      is_active
    } = req.body;

    // ====== Find user ======
    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // ====== Check if email already used by another user ======
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        where: { email },
        transaction: t
      });
      if (existingEmail) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Another user with this email already exists."
        });
      }
    }

    // ====== Validate user type ======
    let userType = null;
    if (user_type_id) {
      userType = await UserType.findByPk(user_type_id, { transaction: t });
      if (!userType) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid user type."
        });
      }
    } else {
      // Keep existing user type if not changed
      userType = await UserType.findByPk(user.user_type_id, { transaction: t });
    }

    // ====== Validate institute ======
    if (userType.name === 'institute_user') {
      if (!institute_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Institute ID is required for institute users."
        });
      }

      const institute = await Institute.findByPk(institute_id, { transaction: t });
      if (!institute) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid institute ID."
        });
      }
    }

    // ====== Update user ======
    await user.update({
      full_name: full_name ?? user.full_name,
      email: email ?? user.email,
      phone_number: phone_number ?? user.phone_number,
      position: position ?? user.position,
      user_type_id: user_type_id ?? user.user_type_id,
      institute_id: userType.name === 'institute_user' ? institute_id : null,
      is_active: is_active ?? user.is_active,
      updated_at: new Date(),
    }, { transaction: t });

    await t.commit();

    // ====== Fetch updated user with relations ======
    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: UserType,
          as: 'userType',
          attributes: ['name', 'description']
        },
        {
          model: Institute,
          as: 'institute',
          attributes: ['name', 'contact_email']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message
    });
  }
};



// ============Get all users=====================
const getUsers = async (req, res) => {
  try {
    const { search, user_type_id, is_active, page = 1, limit = 10 } = req.query;
    const { limit: pageLimit, offset } = getPagination(page, limit);

    const where = {};

    // ===== Search filter =====
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { position: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // ===== User type filter =====
    if (user_type_id) where.user_type_id = user_type_id;

    // ===== Active/inactive filter =====
    if (typeof is_active !== "undefined") {
      where.is_active = is_active === "true" || is_active === true;
    }

    // ===== Fetch users =====
    const data = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name", "description"],
        },
        // {
        //   model: Role,
        //   as: "roles",
        //   attributes: ["role_id", "name", "description", "level"],
        //   through: {
        //     attributes: ["assigned_at", "assigned_by", "is_active"],
        //     where: { is_active: true },
        //     required: false,
        //   },
        // },
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name", "address"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: pageLimit,
      offset,
      distinct: true, // required when including associations
    });

    const response = getPagingData(data, page, pageLimit);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: response,
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving users",
      error: error.message,
    });
  }
};


const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // ===== Validate UUID =====
    if (!isUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // ===== Fetch user with associations =====
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name", "description"],
        },
        // {
        //   model: Role,
        //   as: "roles",
        //   attributes: ["role_id", "name", "description", "level"],
        //   through: {
        //     attributes: ["assigned_at", "assigned_by", "is_active"],
        //     where: { is_active: true },
        //     required: false,
        //   },
        // },
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name", "address", "contact_email"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving user details",
      error: error.message,
    });
  }
};



const deleteUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format."
      });
    }

    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // Soft delete (deactivate)
    await user.update({ is_active: false, updated_at: new Date() }, { transaction: t });
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully."
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Error deactivating user",
      error: error.message
    });
  }
};
const toggleUserActiveStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { is_active } = req.body; // expect boolean true/false

    if (!isUuid(id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format."
      });
    }

    if (typeof is_active !== "boolean") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "is_active must be a boolean value."
      });
    }

    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    await user.update({ is_active, updated_at: new Date() }, { transaction: t });
    await t.commit();

    return res.status(200).json({
      success: true,
      message: `User ${is_active ? "activated" : "deactivated"} successfully.`,
      data: { user_id: id, is_active }
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Error toggling user status",
      error: error.message
    });
  }
};

const resetUserPassword = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format."
      });
    }

    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // Generate and hash new password
    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      is_first_logged_in: true,
      updated_at: new Date()
    }, { transaction: t });

    await t.commit();

    // Send email notification
    await sendEmail(
      user.email,
      `Password Reset - ${process.env.APP_NAME}`,
      `
      Dear ${user.full_name},
      Your password has been reset successfully.
      Email: ${user.email}
      New Temporary Password: ${newPassword}
      Please change your password after logging in.
      `
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. The new password has been sent via email."
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Error resetting user password",
      error: error.message
    });
  }
};


const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findOne({
      where: { user_id: userId },
      attributes: [
        "user_id",
        "full_name",
        "email",
        "phone_number",
        "position",
        "profile_image",
        "is_first_logged_in",
        "last_login_at",
        "password_changed_at",
        "is_active",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name", "description"],
        },
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name", "description", "is_active"],
        },
        {
          model: ProjectUserRole,
          as: "projectRoles",
          attributes: [
            "project_user_role_id",
            "project_id",
            "role_id",
            "sub_role_id",
          ],
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["role_id", "name", "description"],
              include: [
                {
                  model: RoleSubRole,
                  as: "roleSubRoles",
                  attributes: ["roles_sub_roles_id", "sub_role_id"],
                  include: [
                    {
                      model: SubRole,
                      as: "subRole",
                      attributes: ["sub_role_id", "name", "description"],
                    },
                    {
                      model: RoleSubRolePermission,
                      as: "permissions",
                      attributes: [
                        "role_sub_roles_permission_id",
                        "permission_id",
                      ],
                      include: [
                        {
                          model: Permission,
                          as: "permission",
                          attributes: ["permission_id", "resource", "action"],
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
              attributes: ["sub_role_id", "name", "description"],
            },
          ],
        },
      ],
    });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
};


module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserActiveStatus,
  resetUserPassword
};