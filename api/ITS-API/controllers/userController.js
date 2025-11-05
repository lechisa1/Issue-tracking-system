
const { User, Role, Project,Institute,UserType,SubRole, UserRoles,ProjectUser, sequelize } = require("../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const { generateRandomPassword } = require("../utils/password");
const { sendEmail } = require("../utils/sendEmail");

const { getPagination, getPagingData } = require("../utils/pagination");

const createUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      email,
      full_name,
      user_type_id,
      position,
      role_ids,       // global roles
      institute_id,
      assigned_by,
      phone_number,
      projects        // array: [{ project_id, main_role, sub_role, role_id, sub_role_id }]
    } = req.body;

    // ======== Check if email exists========
    const existingUser = await User.findOne({ where: { email }, transaction: t });
    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "User with this email already exists." });
    }

    // ============ Validate institute if provided===========
    if (institute_id) {
      const instituteExists = await Institute.findByPk(institute_id, { transaction: t });
      if (!instituteExists) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Invalid institute ID." });
      }
    }

    // =============Create user===================
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      user_id: uuidv4(),
      full_name,
      email,
      phone_number,
      password: hashedPassword,
      user_type_id,
      institute_id: institute_id || null,
      position,
      is_first_logged_in: true,
      is_active: true,
    }, { transaction: t });

    // ============== Assign global roles===============
    if (Array.isArray(role_ids) && role_ids.length > 0) {
      const roles = await Role.findAll({ where: { role_id: role_ids }, transaction: t });
      if (roles.length !== role_ids.length) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Some global role IDs are invalid." });
      }

      await Promise.all(
        roles.map(role =>
          UserRoles.create({
            user_role_id: uuidv4(),
            user_id: user.user_id,
            role_id: role.role_id,
            assigned_by: assigned_by || null,
            user_type: "internal",
            assigned_at: new Date(),
            is_active: true,
          }, { transaction: t })
        )
      );
    }

    // ====================Assign projects===============
    if (Array.isArray(projects) && projects.length > 0) {
      for (const proj of projects) {
        const { project_id, main_role, sub_role, role_id, sub_role_id } = proj;

        const projectExists = await Project.findByPk(project_id, { transaction: t });
        if (!projectExists) {
          await t.rollback();
          return res.status(400).json({ success: false, message: `Invalid project ID: ${project_id}` });
        }

        let finalMainRole = main_role;
        let finalSubRole = sub_role;

        if (role_id) {
          const role = await Role.findByPk(role_id, { transaction: t });
          if (!role) {
            await t.rollback();
            return res.status(400).json({ success: false, message: `Invalid role ID for project: ${role_id}` });
          }
          finalMainRole = role.name;
        }

        if ((finalMainRole === "Developer" || finalMainRole === "QA") && sub_role_id) {
          const subRole = await SubRole.findByPk(sub_role_id, { transaction: t });
          if (!subRole) {
            await t.rollback();
            return res.status(400).json({ success: false, message: `Invalid sub-role ID for project: ${sub_role_id}` });
          }
          finalSubRole = subRole.name;
        }

        await ProjectUser.create({
          project_user_id: uuidv4(),
          project_id,
          user_id: user.user_id,
          main_role: finalMainRole,
          sub_role: finalSubRole || null,
          assigned_by: assigned_by || null,
          assigned_at: new Date(),
          is_active: true,
        }, { transaction: t });
      }
    }

    // =============== Commit transaction first================
    await t.commit();

    // =============Send email ==========
    await sendEmail(email, `Welcome to ${process.env.APP_NAME}!`, `
      Dear ${full_name},
      Your account has been successfully created.
      Email: ${email}
      Temporary Password: ${password}
      Please change your password after first login.
    `);

    // ==============Fetch  created user with roles and projects========
    const userWithRelations = await User.findOne({
      where: { user_id: user.user_id },
      include: [
        { model: Role, as: "roles", through: { attributes: ["assigned_at", "is_active"] } },
        { model: ProjectUser, as: "projects", attributes: ["project_id", "main_role", "sub_role"] },
        { model: Institute, as: "institute", attributes: ["name", "address"] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userWithRelations
    });

  } catch (error) {
    console.error("Error creating user:", error);
    if (!t.finished) await t.rollback();
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// =============== Update user ===============
const updateUser = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { id } = req.params;

    // Validate user ID
    if (!isUuid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const value = req.body;

    
    const user = await User.findByPk(id, { transaction });
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Validate institute if provided
    if (value.institute_id) {
      if (!isUuid(value.institute_id)) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "Invalid institute ID format" });
      }
      const instituteExists = await Institute.findByPk(value.institute_id, { transaction });
      if (!instituteExists) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "Institute not found" });
      }
    }

    // Check email uniqueness
    if (value.email && value.email !== user.email) {
      const emailExists = await User.findOne({ 
        where: { 
          email: value.email,
          user_id: { [Op.ne]: id }
        }, 
        transaction 
      });
      if (emailExists) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
    }

   
    const updateData = {
      full_name: value.full_name ?? user.full_name,
      email: value.email ?? user.email,
      phone_number: value.phone_number ?? user.phone_number,
      user_type_id: value.user_type_id ?? user.user_type_id,
      position: value.position ?? user.position,
      is_active: value.is_active ?? user.is_active,
      updated_at: new Date(),
    };

    if (value.institute_id !== undefined) {
      updateData.institute_id = value.institute_id;
    }

    await user.update(updateData, { transaction });

    // Handle roles reassignment
    if (Array.isArray(value.role_ids)) {
      await UserRoles.destroy({ 
        where: { user_id: id }, 
        transaction 
      });

      if (value.role_ids.length > 0) {
        const invalidRoles = value.role_ids.filter((r) => !isUuid(r));
        if (invalidRoles.length > 0) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: "Some role IDs are invalid UUIDs" });
        }

        const roles = await Role.findAll({
          where: { role_id: { [Op.in]: value.role_ids } },
          transaction
        });

        if (roles.length !== value.role_ids.length) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: "Some roles not found" });
        }

        await Promise.all(
          roles.map((role) =>
            UserRoles.create({
              user_role_id: uuidv4(),
              user_id: id,
              role_id: role.role_id,
              assigned_by: value.assigned_by || id,
              assigned_at: new Date(),
              is_active: true,
            }, { transaction })
          )
        );
      }
    }

    await transaction.commit();

    
    const userBasic = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { 
          model: Institute, 
          as: "institute", 
          attributes: ["institute_id", "name", "address"] 
        },
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"]
        }
      ],
    });

    // Fetch roles with correct alias 
    const userRoles = await UserRoles.findAll({
      where: { user_id: id, is_active: true },
      include: [
        {
          model: Role,
          as: "role", 
          attributes: ['role_id', 'name', 'description', 'level']
        }
      ]
    });

    // Combine the data
    const updatedUser = {
      ...userBasic.toJSON(),
      roles: userRoles.map(ur => ({
        ...ur.role.toJSON(), 
        UserRoles: {
          assigned_at: ur.assigned_at,
          is_active: ur.is_active
        }
      }))
    };

    res.status(200).json({ 
      success: true, 
      message: "User updated successfully", 
      user: updatedUser 
    });

  } catch (error) {
    console.error("Error updating user:", error);
    
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
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
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { position: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (user_type_id) where.user_type_id = user_type_id;
    if (is_active !== undefined) where.is_active = is_active === "true";

    const data = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"]
        },
        {
          model: Role,
          as: "roles",
          attributes: ["role_id", "name", "description", "level"],
          through: {
            attributes: ["assigned_at", "assigned_by", "is_active"],
            where: { is_active: true },
            required: false
          }
        },
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name", "address"]
        }
      ],
      order: [["created_at", "DESC"]],
      limit: pageLimit,
      offset,
      distinct: true
    });

    const response = getPagingData(data, page, pageLimit);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: response
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isUuid(id)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid user ID format" 
      });
    }

    const user = await User.findByPk(id, {
      attributes: { 
        exclude: ['password'] // Always exclude password
      },
      include: [
        { 
          model: UserType, 
          as: "userType",
          attributes: ['user_type_id', 'name']
        },
        { 
          model: Role, 
          as: "roles", 
          attributes: ['role_id', 'name', 'description', 'level'],
          through: { 
            attributes: ["assigned_at", "assigned_by", "is_active"],
            where: { is_active: true }
          }
        },
        {
          model: Institute,
          as: "institute",
          attributes: ['institute_id', 'name', 'address']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error", 
      error: error.message 
    });
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