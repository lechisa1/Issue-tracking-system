const { Role,Permission, RolePermission  } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create Role
const createRole = async (req, res) => {
  const t = await Role.sequelize.transaction();
  try {
    const { name, description, role_type, permission_ids } = req.body; 
    // permission_ids → array of permission UUIDs

   
    // =========Check if role name exists==========
    
    const existingRole = await Role.findOne({ where: { name }, transaction: t });
    if (existingRole) {
      await t.rollback();
      return res.status(400).json({ message: "Role with this name already exists." });
    }

    
    // ==========Create the Role===========
    
    const role = await Role.create(
      {
        role_id: uuidv4(),
        name,
        description,
        role_type,
      },
      { transaction: t }
    );
    // ============Assign Permissions=========
  
    if (Array.isArray(permission_ids) && permission_ids.length > 0) {
      // Validate permissions exist
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

    await t.commit();

    
    //=========Return role with permissions=========
 
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
    await t.rollback();
    console.error("Error creating role:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    return res.status(200).json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) return res.status(404).json({ message: "Role not found." });
    return res.status(200).json(role);
  } catch (error) {
    console.error("Error fetching role:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update Role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, role_type } = req.body;

    const role = await Role.findByPk(id);
    if (!role) return res.status(404).json({ message: "Role not found." });

    await role.update({
      name: name || role.name,
      description: description || role.description,
      role_type: role_type || role.role_type,
    });

    return res.status(200).json({
      message: "Role updated successfully.",
      data: role,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
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
