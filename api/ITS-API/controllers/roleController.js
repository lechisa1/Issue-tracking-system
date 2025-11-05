const { Role,Permission, RolePermission  } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create Role
const createRole = async (req, res) => {
  const t = await Role.sequelize.transaction();
  try {
    const { name, description, role_type, permission_ids } = req.body;

    // Check if role exists
    const existingRole = await Role.findOne({ where: { name }, transaction: t });
    if (existingRole) {
      await t.rollback();
      return res.status(400).json({ message: "Role with this name already exists." });
    }

    // Create Role
    const role = await Role.create(
      {
        role_id: uuidv4(),
        name,
        description,
        role_type,
      },
      { transaction: t }
    );

    // Assign Permissions
    if (Array.isArray(permission_ids) && permission_ids.length > 0) {
      const validPermissions = await Permission.findAll({
        where: { permission_id: permission_ids },
        transaction: t,
      });

      if (validPermissions.length !== permission_ids.length) {
        await t.rollback();
        return res.status(400).json({
          message: "Some permissions are invalid or not found.",
        });
      }

      const rolePermissions = permission_ids.map((pid) => ({
        role_permission_id: uuidv4(),
        role_id: role.role_id,
        permission_id: pid,
        assigned_at: new Date(),
      }));

      await RolePermission.bulkCreate(rolePermissions, { transaction: t });
    }

    // ✅ Commit before fetching the created role
    await t.commit();

    // Fetch created role with permissions (outside transaction)
    const createdRole = await Role.findOne({
      where: { role_id: role.role_id },
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
    });

    return res.status(201).json({
      message: "Role created successfully.",
      data: createdRole,
    });
  } catch (error) {
    // ✅ Only rollback if transaction is still active
    if (!t.finished) await t.rollback();

    console.error("Error creating role:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


const getRoles = async (req, res) => {
  console.log("getRoles called");
  try {
    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
          attributes: ["permission_id", "name", "description"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    console.log("roles fetched:", roles);

    return res.status(200).json({
      success: true,
      count: Array.isArray(roles) ? roles.length : 0,
      data: roles || [],
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
};



// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          attributes: ["permission_id", "name", "description"],
          through: { attributes: [] }, // Hide join table fields
        },

      ],
    });

    if (!role)
      return res.status(404).json({ message: "Role not found." });

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =============Update Role===============
const updateRole = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, description, role_type, permission_ids, assigned_by } = req.body;

    //=========Find the role==========
    const role = await Role.findByPk(id, { transaction: t });
    if (!role) {
      await t.rollback();
      return res.status(404).json({ message: "Role not found." });
    }

    // ==========Update basic role info=========
    await role.update(
      {
        name: name || role.name,
        description: description || role.description,
        role_type: role_type || role.role_type,
      },
      { transaction: t }
    );

    // ============Update permissions if provided==========
    if (Array.isArray(permission_ids)) {
      // Check if all permission IDs are valid
      const validPermissions = await Permission.findAll({
        where: { permission_id: permission_ids },
        transaction: t,
      });

      if (validPermissions.length !== permission_ids.length) {
        await t.rollback();
        return res.status(400).json({ message: "One or more permission IDs are invalid." });
      }

      // ========Remove old permissions===========
      await RolePermission.destroy({
        where: { role_id: id },
        transaction: t,
      });

      // =================Assign new permissions============
      const now = new Date();
      const rolePermissions = permission_ids.map((permId) => ({
        role_permission_id: uuidv4(),
        role_id: id,
        permission_id: permId,
        assigned_by: assigned_by || null,
        assigned_at: now,
        created_at: now,
        updated_at: now,
      }));

      await RolePermission.bulkCreate(rolePermissions, { transaction: t });
    }

    await t.commit();

    // ==========Return updated role with permissions=========
    const updatedRole = await Role.findOne({
      where: { role_id: id },
      include: [
        {
          model: Permission,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
    });

    return res.status(200).json({
      message: "Role updated successfully.",
      data: updatedRole,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error updating role:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) return res.status(404).json({ message: "Role not found." });

    await role.destroy();
    return res.status(200).json({ message: "Role deleted successfully." });
  } catch (error) {
    console.error("Error deleting role:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
};