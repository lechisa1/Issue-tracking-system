const { InternalHierarchy, sequelize , User } = require("../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");

// ============ Get All Hierarchy Nodes ============
const getInternalHierarchies = async (req, res) => {
  try {
    const hierarchies = await InternalHierarchy.findAll({
      include: [
        {
          model: InternalHierarchy,
          as: "parent",
          attributes: ["internal_hierarchy_id", "name", "code"],
        },
        {
          model: InternalHierarchy,
          as: "children",
          attributes: ["internal_hierarchy_id", "name", "code"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Hierarchy nodes fetched successfully",
      data: hierarchies,
    });
  } catch (error) {
    console.error("Error fetching hierarchy nodes:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Get Hierarchy Node by ID ============
const getInternalHierarchyById = async (req, res) => {
  try {
    const { internal_hierarchy_id } = req.params;

    if (!isUuid(internal_hierarchy_id))
      return res.status(400).json({ success: false, message: "Invalid ID format" });

    const node = await InternalHierarchy.findByPk(internal_hierarchy_id, {
      include: [
        {
          model: InternalHierarchy,
          as: "parent",
          attributes: ["internal_hierarchy_id", "name", "code"],
        },
        {
          model: InternalHierarchy,
          as: "children",
          attributes: ["internal_hierarchy_id", "name", "code"],
        },
      ],
    });

    if (!node)
      return res.status(404).json({ success: false, message: "Hierarchy node not found" });

    return res.status(200).json({ success: true, data: node });
  } catch (error) {
    console.error("Error fetching hierarchy node:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Create Hierarchy Node ============
const createInternalHierarchy = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, code, parent_id, is_active } = req.body;

    if (parent_id) {
      const parent = await InternalHierarchy.findByPk(parent_id, { transaction: t });
      if (!parent) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Invalid parent_id" });
      }
    }

    const node = await InternalHierarchy.create(
      {
        internal_hierarchy_id: uuidv4(),
        name,
        code: code || null,
        parent_id: parent_id || null,
        is_active: is_active ?? true,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({ success: true, data: node });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error creating hierarchy node:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Update Hierarchy Node ============
const updateInternalHierarchy = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { internal_hierarchy_id } = req.params;
    const { name, code, parent_id, is_active } = req.body;

    if (!isUuid(internal_hierarchy_id))
      return res.status(400).json({ success: false, message: "Invalid ID format" });

    const node = await InternalHierarchy.findByPk(internal_hierarchy_id, { transaction: t });
    if (!node) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Hierarchy node not found" });
    }

    if (parent_id) {
      const parent = await InternalHierarchy.findByPk(parent_id, { transaction: t });
      if (!parent) {
        await t.rollback();
        return res.status(400).json({ success: false, message: "Invalid parent_id" });
      }
    }

    await node.update(
      {
        name: name ?? node.name,
        code: code ?? node.code,
        parent_id: parent_id ?? node.parent_id,
        is_active: is_active ?? node.is_active,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(200).json({ success: true, data: node });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error updating hierarchy node:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ============ Get All Hierarchy Nodes WITH Assigned Users ============

const getInternalHierarchiesWithUsers = async (req, res) => {
  try {
    const hierarchies = await InternalHierarchy.findAll({
      include: [
        {
          model: InternalHierarchy,
          as: "parent",
          attributes: ["internal_hierarchy_id", "name", "code"],
        },
        {
          model: InternalHierarchy,
          as: "children",
          attributes: ["internal_hierarchy_id", "name", "code"],
        },
        {
          model: User,
          as: "users",
          attributes: [
            "user_id",
            "full_name",
            "email",
            "phone_number",
            "position",
            "profile_image"
          ]
        }
      ],
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Hierarchy with assigned users fetched successfully",
      data: hierarchies,
    });
  } catch (error) {
    console.error("Error fetching hierarchy with users:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ============ Soft Delete Hierarchy Node ============
const deleteInternalHierarchy = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { internal_hierarchy_id } = req.params;

    if (!isUuid(internal_hierarchy_id))
      return res.status(400).json({ success: false, message: "Invalid ID format" });

    const node = await InternalHierarchy.findByPk(internal_hierarchy_id, { transaction: t });
    if (!node) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Hierarchy node not found" });
    }

    await node.update({ is_active: false }, { transaction: t });
    await t.commit();

    return res
      .status(200)
      .json({ success: true, message: "Hierarchy node deactivated successfully" });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error deleting hierarchy node:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInternalHierarchies,
  getInternalHierarchyById,
  createInternalHierarchy,
  updateInternalHierarchy,
  deleteInternalHierarchy,
  getInternalHierarchiesWithUsers,
};
