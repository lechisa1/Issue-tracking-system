const { body, param, validationResult } = require('express-validator');

const validateInstitute = [
  body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters')
    .isString()
    .withMessage('Name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('has_branch')
    .optional()
    .isBoolean()
    .withMessage('Has branch must be a boolean'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
];

const validateInstituteId = [
  param('id')
    .isUUID()
    .withMessage('Institute ID must be a valid UUID'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateInstitute,
  validateInstituteId,
  handleValidationErrors,
};
