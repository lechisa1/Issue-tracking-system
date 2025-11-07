const { body, param, validationResult } = require('express-validator');

const validateHierarchy = [
  body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters')
    .isString()
    .withMessage('Name must be a string'),
  body('project_id')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Parent ID must be a valid UUID'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('levels')
    .optional()
    .isObject()
    .withMessage('Levels must be a valid JSON object'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
];

const validateHierarchyId = [
  param('id')
    .isUUID()
    .withMessage('Hierarchy ID must be a valid UUID'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateHierarchy,
  validateHierarchyId,
  handleValidationErrors,
};
