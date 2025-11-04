const Joi = require("joi");

// Create Zone validation
const createZoneSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),
  woreda_id: Joi.string().uuid().required().messages({
    "string.guid": "Woreda ID must be a valid UUID",
    "any.required": "Woreda ID is required",
  }),
  description: Joi.string().max(1000).optional().messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
});

// Update Zone validation
const updateZoneSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  woreda_id: Joi.string().uuid().optional(),
  description: Joi.string().max(1000).optional(),
});

exports.validateCreateZone = (req, res, next) => {
  const { error } = createZoneSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateZone = (req, res, next) => {
  const { error } = updateZoneSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};
