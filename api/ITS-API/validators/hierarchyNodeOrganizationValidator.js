const { body, param, validationResult } = require("express-validator");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Validation for creating a hierarchy node organization association
const validateHierarchyNodeOrganization = [
  body("hierarchy_node_id")
    .isUUID()
    .withMessage("Hierarchy node ID must be a valid UUID"),
  body("institute_id")
    .isUUID()
    .withMessage("Institute ID must be a valid UUID"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean value"),
];

// Validation for hierarchy node organization ID parameter
const validateHierarchyNodeOrganizationId = [
  param("id")
    .isUUID()
    .withMessage("Hierarchy node organization ID must be a valid UUID"),
];

module.exports = {
  validateHierarchyNodeOrganization,
  validateHierarchyNodeOrganizationId,
  handleValidationErrors,
};
