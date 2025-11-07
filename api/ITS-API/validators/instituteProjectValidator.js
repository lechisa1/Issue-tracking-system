const { body, param, validationResult } = require('express-validator');

const validateInstituteProject = [
  body('institute_id')
    .isUUID()
    .withMessage('Institute ID must be a valid UUID'),
  body('project_id')
    .isUUID()
    .withMessage('Project ID must be a valid UUID'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
];

const validateInstituteProjectId = [
  param('id')
    .isUUID()
    .withMessage('Institute Project ID must be a valid UUID'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateInstituteProject,
  validateInstituteProjectId,
  handleValidationErrors,
};
