const Joi = require("joi");

// Create Region validation
const createRegionSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),
  description: Joi.string().max(1000).optional().messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
});

// Update Region validation
const updateRegionSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(1000).optional(),
});

exports.validateCreateRegion = (req, res, next) => {
  const { error } = createRegionSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateRegion = (req, res, next) => {
  const { error } = updateRegionSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};
