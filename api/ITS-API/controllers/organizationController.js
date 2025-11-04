const { Organization } = require("../models");
const { v4: uuidv4 } = require("uuid");

// Create a new organization
const createOrganization = async (req, res) => {
  try {
    const { name, has_branch, description } = req.body;

    // Check if organization exists
    const existingOrganization = await Organization.findOne({ where: { name } });
    if (existingOrganization)
      return res.status(400).json({ message: "Organization with this name already exists." });

    const organization_id = uuidv4();

    // Create organization
    const organization = await Organization.create({
      organization_id,
      name,
      has_branch,
      description,
    });

    res.status(201).json(organization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all organizations
const getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.findAll();
    res.status(200).json(organizations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get organization by ID
const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await Organization.findByPk(id);
    if (!organization) return res.status(404).json({ message: "Organization not found" });
    res.status(200).json(organization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Update organization
const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, has_branch, description } = req.body;

    const organization = await Organization.findByPk(id);
    if (!organization) return res.status(404).json({ message: "Organization not found" });

    organization.name = name || organization.name;
    organization.has_branch = has_branch !== undefined ? has_branch : organization.has_branch;
    organization.description = description !== undefined ? description : organization.description;

    await organization.save();
    res.status(200).json(organization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Delete organization
const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await Organization.findByPk(id);
    if (!organization) return res.status(404).json({ message: "Organization not found" });

    await organization.destroy();
    res.status(200).json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
};
