const { body, param, validationResult } = require('express-validator');

const validateHierarchyNode = [
  body('hierarchy_id')
    .isUUID()
    .withMessage('Hierarchy ID must be a valid UUID'),
  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Parent ID must be a valid UUID'),
  body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters')
    .isString()
    .withMessage('Name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
];

const validateHierarchyNodeId = [
  param('id')
    .isUUID()
    .withMessage('Hierarchy Node ID must be a valid UUID'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateHierarchyNode,
  validateHierarchyNodeId,
  handleValidationErrors,
};
