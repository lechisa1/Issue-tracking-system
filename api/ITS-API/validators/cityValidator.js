const Joi = require("joi");

// Create City validation
const createCitySchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),
  region_id: Joi.string().uuid().required().messages({
    "string.guid": "Region ID must be a valid UUID",
    "any.required": "Region ID is required",
  }),
  description: Joi.string().max(1000).optional().messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
});

// Update City validation
const updateCitySchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  region_id: Joi.string().uuid().optional(),
  description: Joi.string().max(1000).optional(),
});

exports.validateCreateCity = (req, res, next) => {
  const { error } = createCitySchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateCity = (req, res, next) => {
  const { error } = updateCitySchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};
