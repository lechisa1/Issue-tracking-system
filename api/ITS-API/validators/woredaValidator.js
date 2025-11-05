const Joi = require("joi");

// Create Woreda validation
const createWoredaSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),
  sub_city_id: Joi.string().uuid().allow(null).optional().messages({
    "string.guid": "Sub City ID must be a valid UUID",
  }),
  zone_id: Joi.string().uuid().allow(null).optional().messages({
    "string.guid": "Zone ID must be a valid UUID",
  }),
  description: Joi.string().max(1000).optional().messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
}).custom((value, helpers) => {
  if (!value.sub_city_id && !value.zone_id) {
    return helpers.error('any.required', { message: 'Either sub_city_id or zone_id must be provided' });
  }
  return value;
});

// Update Woreda validation
const updateWoredaSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  sub_city_id: Joi.string().uuid().allow(null).optional(),
  zone_id: Joi.string().uuid().allow(null).optional(),
  description: Joi.string().max(1000).optional(),
});

exports.validateCreateWoreda = (req, res, next) => {
  const { error } = createWoredaSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};

exports.validateUpdateWoreda = (req, res, next) => {
  const { error } = updateWoredaSchema.validate(req.body);
  if (error)
    return res.status(400).json({ error: error.details[0].message });
  next();
};
