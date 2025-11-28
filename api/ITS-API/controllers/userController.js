const {
  User,
  UserType,
  Institute,
  ProjectUserRole,
  Role,
  SubRole,
  RoleSubRole,
  RoleSubRolePermission,
  InternalProjectUserRole,
  Permission,
  InternalNode,

  Project,
  UserRoles,
  HierarchyNode,
  sequelize,
} = require("../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const { generateRandomPassword } = require("../utils/password");
const { sendEmail } = require("../utils/sendEmail");

const { getPagination, getPagingData } = require("../utils/pagination");

const getUserTypes = async (req, res) => {
  try {
    const userTypes = await UserType.findAll({
      attributes: [
        "user_type_id",
        "name",
        "description",
        "created_at",
        "updated_at",
      ],
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "User types fetched successfully",
      data: userTypes,
    });
  } catch (error) {
    console.error("Error fetching user types:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user types",
      error: error.message,
    });
  }
};
const createUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      full_name,
      email,
      user_type_id,
      institute_id,
      phone_number,
      hierarchy_node_id,
    } = req.body;

    // ====== Check existing email ======
    const existingUser = await User.findOne({
      where: { email },
      transaction: t,
    });
    if (existingUser) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "User already exists." });
    }
    // ====== Check existing phone number ======
    const existingPhone = await User.findOne({
      where: { phone_number },
      transaction: t,
    });

    if (existingPhone) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Phone number already exists.",
      });
    }
    // ====== Validate user type ======
    const userType = await UserType.findByPk(user_type_id, { transaction: t });
    if (!userType) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid user type." });
    }

    // ====== Enforce institute_id for external_user ======
    if (userType.name === "external_user") {
      if (!institute_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Institute ID is required for external users.",
        });
      }

      // Validate institute existence
      const institute = await Institute.findByPk(institute_id, {
        transaction: t,
      });
      if (!institute) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Invalid institute ID." });
      }
    } else {
      // internal_user or others must not have institute_id
      if (institute_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Institute ID should not be provided for internal users.",
        });
      }
    }

    // ====== Optional hierarchy validation ======
    if (hierarchy_node_id) {
      const node = await HierarchyNode.findByPk(hierarchy_node_id, {
        transaction: t,
      });
      if (!node) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Invalid hierarchy node ID." });
      }
    }

    // ====== Generate password ======
    // const password = generateRandomPassword();
    const password = "password";
    const hashedPassword = await bcrypt.hash(password, 10);

    // ====== Create User ======
    const user = await User.create(
      {
        user_id: uuidv4(),
        full_name,
        email,
        password: hashedPassword,
        phone_number,
        user_type_id,
        institute_id: userType.name === "external_user" ? institute_id : null,
        hierarchy_node_id: hierarchy_node_id ?? null,
        is_first_logged_in: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    // ====== Send welcome email ======
    await sendEmail(
      email,
      `Welcome to ${process.env.APP_NAME}!`,
      `
      Dear ${full_name},
      Your account has been successfully created.
      Email: ${email}
      Temporary Password: ${password}
      Please change your password after first login.
    `
    );

    return res.status(201).json({
      success: true,
      message: "User registered globally (no roles assigned yet)",
      data: user,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error creating user:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  const t = await sequelize.transaction();
  console.log("ccccccccccccccccccccccccccccccccccccc");
  try {
    const user_id = req.params.id;

    const {
      full_name,
      email,
      user_type_id,
      institute_id,
      phone_number,
      hierarchy_node_id,
      is_active,
      roles, // roles for BOTH user types
    } = req.body;

    // ======================= FIND USER WITH ASSOCIATIONS ==========================
    const user = await User.findOne({
      where: { user_id },
      include: [
        { model: UserType, as: "userType" },
        { model: Institute, as: "institute" },
        { model: Role, as: "roles", through: { attributes: [] } },
        {
          model: UserRoles,
          as: "userRoles",
          include: [{ model: Role, as: "role" }],
        },
        { model: HierarchyNode, as: "hierarchyNode" },
      ],
      transaction: t,
    });

    console.log("userrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr", user);
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    console.log("Found user:", user.user_id, user.full_name);
    console.log("User type:", user.userType?.name);
    console.log(
      "Current roles:",
      user.user_roles?.map((ur) => ur.role_id)
    );

    // ======================= EMAIL UNIQUE =======================
    if (email && email !== user.email) {
      const exists = await User.findOne({
        where: { email },
        transaction: t,
      });
      if (exists) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Email already exists.",
        });
      }
    }

    // ======================= PHONE UNIQUE =======================
    if (phone_number && phone_number !== user.phone_number) {
      const exists = await User.findOne({
        where: { phone_number },
        transaction: t,
      });
      if (exists) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Phone already exists.",
        });
      }
    }

    // ======================= USER TYPE LOGIC ====================
    let finalUserType = user.user_type_id;
    let finalUserTypeName = user.userType?.name;

    if (user_type_id) {
      const type = await UserType.findByPk(user_type_id, { transaction: t });
      if (!type) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid user type.",
        });
      }

      finalUserType = user_type_id;
      finalUserTypeName = type.name;

      // external_user MUST have institute
      if (type.name === "external_user" && !institute_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Institute is required for external users.",
        });
      }

      // internal_user MUST NOT have institute
      if (type.name === "internal_user" && institute_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Internal users cannot have an institute.",
        });
      }
    }

    // ======================= VALIDATE INSTITUTE ==================
    if (institute_id) {
      const inst = await Institute.findByPk(institute_id, { transaction: t });
      if (!inst) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid institute ID.",
        });
      }
    }

    // =================== VALIDATE HIERARCHY ======================
    if (hierarchy_node_id) {
      const node = await HierarchyNode.findByPk(hierarchy_node_id, {
        transaction: t,
      });
      if (!node) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid hierarchy node.",
        });
      }
    }

    // ======================= UPDATE USER =========================
    await user.update(
      {
        full_name: full_name ?? user.full_name,
        email: email ?? user.email,
        phone_number: phone_number ?? user.phone_number,
        user_type_id: finalUserType,
        institute_id:
          finalUserTypeName === "external_user" ? institute_id : null,
        hierarchy_node_id: hierarchy_node_id ?? user.hierarchy_node_id,
        is_active: is_active ?? user.is_active,
        updated_at: new Date(),
      },
      { transaction: t }
    );

    // =================== ROLE HANDLING FOR BOTH USER TYPES ===========================
    if (Array.isArray(roles)) {
      console.log("Updating roles:", roles);

      // Remove old roles
      await UserRoles.destroy({
        where: { user_id },
        transaction: t,
      });

      // Insert new roles if any are provided
      if (roles.length > 0) {
        const roleAssignments = roles.map((roleId) => ({
          user_id,
          role_id: roleId,
          assigned_by: req.user?.user_id || null,
          assigned_at: new Date(),
        }));

        await UserRoles.bulkCreate(roleAssignments, { transaction: t });
      }

      console.log(`Updated ${roles.length} roles for user ${user_id}`);
    }

    // ======================= COMMIT ==============================
    await t.commit();

    // ======================= FETCH UPDATED USER WITH ASSOCIATIONS ====================
    const updatedUser = await User.findOne({
      where: { user_id },
      include: [
        { model: UserType, as: "userType" },
        { model: Institute, as: "institute" },
        { model: Role, as: "roles", through: { attributes: [] } },
        {
          model: UserRoles,
          as: "userRoles",
          include: [{ model: Role, as: "role" }],
        },
        { model: HierarchyNode, as: "hierarchyNode" },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============Get all users=====================
const getUsers = async (req, res) => {
  try {
    const {
      institute_id,
      user_type_id,
      hierarchy_node_id,
      is_active,
      search, // optional: for name/email search
    } = req.query;

    // ====== Build filters dynamically ======
    const whereClause = {};

    if (institute_id) whereClause.institute_id = institute_id;
    if (user_type_id) whereClause.user_type_id = user_type_id;
    if (hierarchy_node_id) whereClause.hierarchy_node_id = hierarchy_node_id;
    if (is_active !== undefined) whereClause.is_active = is_active === "true";

    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone_number: { [Op.like]: `%${search}%` } },
      ];
    }

    // ====== Fetch users with associations ======
    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name"],
        },
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"],
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};

// Get users by institute ID
const getUsersByInstituteId = async (req, res) => {
  try {
    const { institute_id } = req.params;

    if (!institute_id) {
      return res.status(400).json({
        success: false,
        message: "Institute ID is required",
      });
    }

    // Fetch users with associations
    const users = await User.findAll({
      where: { institute_id },
      include: [
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name"],
        },
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"],
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully for the institute.",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users by institute:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users by institute.",
      error: error.message,
    });
  }
};

const getUsersAssignedToNode = async (req, res) => {
  try {
    const { project_id, hierarchy_node_id } = req.params;

    // Validate project
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with id '${project_id}' not found.`,
      });
    }

    // Validate hierarchy node
    const hierarchyNode = await HierarchyNode.findOne({
      where: { hierarchy_node_id, project_id },
    });

    if (!hierarchyNode) {
      return res.status(404).json({
        success: false,
        message: `Hierarchy node '${hierarchy_node_id}' not found in project '${project_id}'.`,
      });
    }

    // Fetch assignments from junction table
    const userAssignments = await ProjectUserRole.findAll({
      where: {
        project_id,
        hierarchy_node_id,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "full_name", "email"],
          include: [
            {
              model: Institute,
              as: "institute",
              attributes: ["institute_id", "name"],
            },
            {
              model: UserType,
              as: "userType",
              attributes: ["user_type_id", "name"],
            },
          ],
        },
        {
          model: Role,
          as: "role",
          attributes: ["role_id", "name"],
        },
        {
          model: SubRole,
          as: "subRole",
          attributes: ["sub_role_id", "name"],
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Transform and return
    const users = userAssignments.map((assignment) => ({
      project_user_role_id: assignment.project_user_role_id,
      project_id: assignment.project_id,
      user_id: assignment.user_id,
      role_id: assignment.role_id,
      sub_role_id: assignment.sub_role_id,
      hierarchy_node_id: assignment.hierarchy_node_id,

      user: assignment.user,
      role: assignment.role,
      sub_role: assignment.subRole,
      hierarchyNode: assignment.hierarchyNode,

      is_active: assignment.is_active,
      assigned_at: assignment.created_at,
    }));

    return res.status(200).json({
      success: true,
      message: "Users assigned to hierarchy node fetched successfully.",
      project_id,
      hierarchy_node_id,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users assigned to node:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const getUsersAssignedToProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required.",
      });
    }

    const assignments = await ProjectUserRole.findAll({
      where: { project_id },
      include: [
        {
          model: User,
          as: "user",
          include: [
            {
              model: Institute,
              as: "institute",
              attributes: ["institute_id", "name"],
            },
            {
              model: UserType,
              as: "userType",
              attributes: ["user_type_id", "name"],
            },
          ],
        },
        {
          model: Role,
          as: "role",
          attributes: ["role_id", "name"],
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name", "level", "parent_id"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Users assigned to project fetched successfully.",
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assigned users.",
      error: error.message,
    });
  }
};

const getInternalUsersAssignedToProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required.",
      });
    }

    const assignments = await InternalProjectUserRole.findAll({
      where: { project_id },
      include: [
        {
          model: User,
          as: "user",
          include: [
            {
              model: UserType,
              as: "userType",
              attributes: ["user_type_id", "name"],
            },
          ],
        },
        {
          model: Role,
          as: "role",
          attributes: ["role_id", "name"],
        },
        {
          model: InternalNode,
          as: "internalNode",
          attributes: ["internal_node_id", "name", "level", "parent_id"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Users assigned to project fetched successfully.",
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch assigned users.",
      error: error.message,
    });
  }
};

// const getUsersNotAssignedToProject = async (req, res) => {
//   console.log("Fetching unassigned users...");
//   try {
//     const { institute_id, project_id } = req.params;

//     if (!institute_id || !project_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Institute ID and Project ID are required.",
//       });
//     }

//     // 1. Get all assigned users for this project
//     const assignments = await ProjectUserRole.findAll({
//       where: { project_id },
//       attributes: ["user_id"],
//     });

//     const assignedUserIds = assignments.map((a) => a.user_id);
//     console.log("Assigned User IDs:", assignedUserIds);

//     // Build where clause
//     let whereClause = {
//       institute_id,
//     };

//     // If users have been assigned → exclude them
//     // If none assigned → do NOT add Op.notIn (it returns empty result)
//     if (assignedUserIds.length > 0) {
//       whereClause.user_id = {
//         [Op.notIn]: assignedUserIds,
//       };
//     }

//     // 2. Fetch users NOT assigned to the project
//     const users = await User.findAll({
//       where: whereClause,
//       include: [
//         {
//           model: Institute,
//           as: "institute",
//           attributes: ["institute_id", "name"],
//         },
//         {
//           model: UserType,
//           as: "userType",
//           attributes: ["user_type_id", "name"],
//         },
//         {
//           model: HierarchyNode,
//           as: "hierarchyNode",
//           attributes: ["hierarchy_node_id", "name"],
//         },
//       ],
//       order: [["created_at", "DESC"]],
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Unassigned users fetched successfully.",
//       data: users,
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch users.",
//       error: error.message,
//     });
//   }
// };

const getUsersNotAssignedToProject = async (req, res) => {
  console.log("Fetching unassigned users...");
  try {
    const { institute_id, project_id } = req.params;

    if (!institute_id || !project_id) {
      return res.status(400).json({
        success: false,
        message: "Institute ID and Project ID are required.",
      });
    }

    // Get assigned user-role pairs for this project
    const assignments = await ProjectUserRole.findAll({
      where: { project_id },
      attributes: ["user_id", "role_id"],
    });

    // Create a map to quickly check assigned roles per user
    const assignedRolesMap = {};
    assignments.forEach((a) => {
      if (!assignedRolesMap[a.user_id]) assignedRolesMap[a.user_id] = new Set();
      assignedRolesMap[a.user_id].add(a.role_id);
    });

    // Fetch all users of the institute with their roles
    const users = await User.findAll({
      where: { institute_id },
      include: [
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name"],
        },
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"],
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name"],
        },
        {
          model: UserRoles,
          as: "userRoles",
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["role_id", "name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Filter users: keep only users with at least one unassigned role
    const unassignedUsers = users.filter((user) => {
      const assignedRoles = assignedRolesMap[user.user_id] || new Set();
      // Check if user has any role not assigned yet
      return user.userRoles.some((ur) => !assignedRoles.has(ur.role_id));
    });

    return res.status(200).json({
      success: true,
      message: "Unassigned users fetched successfully.",
      data: unassignedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};

const getInternalUsersNotAssignedToProject = async (req, res) => {
  console.log("not assigned called");
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required.",
      });
    }

    // 1. Find already assigned internal users for this project
    const assignments = await InternalProjectUserRole.findAll({
      where: { project_id },
      attributes: ["user_id"],
    });

    const assignedUserIds = assignments.map((a) => a.user_id);

    console.log("assignedUserIds: ", assignedUserIds);
    // 2. Get users where:
    //    institute_id IS NULL
    //    AND user_id NOT IN assignedUserIds
    const users = await User.findAll({
      where: {
        institute_id: { [Op.is]: null }, // users with NULL institute_id
        user_id: {
          [Op.notIn]: assignedUserIds.length > 0 ? assignedUserIds : [], // avoid SQL error
        },
      },
      include: [
        {
          model: InternalNode,
          as: "internalNode",
          attributes: ["internal_node_id", "name"],
        },
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    console.log("users: ", users);

    return res.status(200).json({
      success: true,
      message: "Unassigned internal users fetched successfully.",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};

const getProjectSubNodeUsers = async (req, res) => {
  try {
    const { project_id, Internal_node_id } = req.params;

    if (!project_id || !Internal_node_id) {
      return res.status(400).json({
        success: false,
        message: "Project ID and Internal Node ID are required.",
      });
    }

    // 1️⃣ Get direct children of this node
    const children = await InternalNode.findAll({
      where: { parent_id: Internal_node_id },
      attributes: ["internal_node_id"],
    });

    const childNodeIds = children.map((c) => c.internal_node_id);
    // Include the parent node itself
    // childNodeIds.push(Internal_node_id);

    // 2️⃣ Fetch assignments for users under these nodes
    const assignments = await InternalProjectUserRole.findAll({
      where: {
        project_id,
        internal_node_id: { [Op.in]: childNodeIds },
      },
      include: [
        {
          model: User,
          as: "user", // ✅ must match association alias
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: Role,
          as: "role", // ✅ must match association alias
          attributes: ["role_id", "name"],
        },
        {
          model: InternalNode,
          as: "internalNode", // ✅ must match association alias
          attributes: ["internal_node_id", "name", "level", "parent_id"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Users under child nodes fetched successfully.",
      assignments,
      count: assignments.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id: user_id } = req.params;

    console.log("user_id: ", user_id);

    // ====== Find user with relations ======
    const user = await User.findByPk(user_id, {
      include: [
        {
          model: Institute,
          as: "institute",
          attributes: ["institute_id", "name"],
        },
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"],
        },
        {
          model: HierarchyNode,
          as: "hierarchyNode",
          attributes: ["hierarchy_node_id", "name"],
        },
        {
          model: UserRoles,
          as: "userRoles", // <-- corrected here
          attributes: ["user_role_id", "role_id", "assigned_by", "assigned_at"],
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["role_id", "name", "description"],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Transform the data to include roles in a more accessible format
    const userData = user.toJSON();

    // Extract roles from userRoles association
    userData.roles = userData.userRoles?.map((userRole) => userRole.role) || [];

    return res.status(200).json({
      success: true,
      message: "User fetched successfully.",
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user.",
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
        message: "Invalid user ID format.",
      });
    }

    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Soft delete (deactivate)
    await user.update(
      { is_active: false, updated_at: new Date() },
      { transaction: t }
    );
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully.",
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Error deactivating user",
      error: error.message,
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
        message: "Invalid user ID format.",
      });
    }

    if (typeof is_active !== "boolean") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "is_active must be a boolean value.",
      });
    }

    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await user.update(
      { is_active, updated_at: new Date() },
      { transaction: t }
    );
    await t.commit();

    return res.status(200).json({
      success: true,
      message: `User ${is_active ? "activated" : "deactivated"} successfully.`,
      data: { user_id: id, is_active },
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Error toggling user status",
      error: error.message,
    });
  }
};

// Add this route to find user by email first
const findUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      where: { email },
      attributes: ["id"], // Only return the ID
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    return res.status(200).json({
      success: true,
      user_id: user.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error finding user",
      error: error.message,
    });
  }
};

const crypto = require("crypto");

const resetUserPasswordByEmail = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { email } = req.body;

    if (!email) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ where: { email }, transaction: t });

    const successMessage =
      "If your email exists in our system, you will receive password reset instructions shortly.";

    if (!user) {
      await t.rollback();
      return res.status(200).json({
        success: true,
        message: successMessage,
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to user using the new fields
    await user.update(
      {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
        updated_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      user.email
    )}`;

    console.log("Reset link generated:", resetLink); // Debug log

    // Send email with reset link
    try {
      await sendEmail(
        user.email,
        `Password Reset Request - ${process.env.APP_NAME}`,
        `
        Dear ${user.full_name},
        
        You requested to reset your password. Click the link below to create a new password:
        
        🔗 Reset Your Password: ${resetLink}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this reset, please ignore this email.
        
        Best regards,
        ${process.env.APP_NAME} Team
        `
      );
    } catch (emailErr) {
      console.error("Error sending email:", emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    if (t.finished !== "commit") await t.rollback();
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing password reset request",
      error: error.message,
    });
  }
};

// Add this new function to handle the actual password reset
const confirmPasswordReset = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Token, email, and new password are required",
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      where: {
        email: email,
        reset_token: token,
        reset_token_expiry: {
          [Op.gt]: new Date(),
        },
      },
      transaction: t,
    });

    if (!user) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password and clear reset token
    await user.update(
      {
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
        is_first_logged_in: false,
        updated_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    // Send confirmation email
    sendEmail(
      user.email,
      `Password Reset Successful - ${process.env.APP_NAME}`,
      `
      Dear ${user.full_name},
      
      Your password has been successfully reset.
      
      If you did not make this change, please contact support immediately.
      
      Best regards,
      ${process.env.APP_NAME} Team
      `
    ).catch((err) => console.error("Confirmation email error:", err));

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    if (t.finished !== "commit") await t.rollback();
    console.error("Confirm password reset error:", error);
    return res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};
const validateResetToken = async (req, res) => {
  try {
    const { token, email } = req.query;

    console.log("🔍 Backend - Validating token:", {
      token: token ? "present" : "missing",
      email: email ? "present" : "missing",
    });

    if (!token || !email) {
      console.log("❌ Missing token or email");
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Token and email are required",
      });
    }

    // Decode the email (it's URL encoded)
    const decodedEmail = decodeURIComponent(email);
    console.log("📧 Decoded email:", decodedEmail);

    const user = await User.findOne({
      where: {
        email: decodedEmail,
        reset_token: token,
        reset_token_expiry: {
          [Op.gt]: new Date(), // Check if token hasn't expired
        },
      },
    });

    console.log("👤 User found:", user ? "Yes" : "No");
    if (user) {
      console.log("⏰ Token expiry:", user.reset_token_expiry);
      console.log("⏰ Current time:", new Date());
      console.log(
        "✅ Token is still valid:",
        user.reset_token_expiry > new Date()
      );
    }

    if (!user) {
      return res.status(200).json({
        success: false,
        valid: false,
        message: "Invalid or expired reset token",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: "Token is valid",
    });
  } catch (error) {
    console.error("🚨 Token validation error:", error);
    return res.status(500).json({
      success: false,
      valid: false,
      message: "Error validating token",
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
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUsersByInstituteId,
  getUsersAssignedToNode,
  getUsersAssignedToProject,
  getInternalUsersAssignedToProject,
  getUsersNotAssignedToProject,
  getInternalUsersNotAssignedToProject,
  getProjectSubNodeUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserActiveStatus,
  resetUserPasswordByEmail,
  getProfile,
  getUserTypes,
  findUserByEmail,
  confirmPasswordReset,
  validateResetToken,
};
