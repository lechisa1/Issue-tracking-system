const Joi = require("joi");

// Ethiopian phone number validation (more flexible)
const ethiopianPhoneSchema = Joi.string()
  .custom((value, helpers) => {
    // Remove formatting dashes and spaces
    const cleanPhone = value.replace(/[-\s]/g, "");

    // Check if it matches Ethiopian phone patterns
    const phoneRegex = /^(?:\+251|251|0)?9\d{8}$/;
    if (phoneRegex.test(cleanPhone)) {
      return cleanPhone; // Return cleaned version
    }

    return helpers.error("string.pattern.base", {
      message:
        "Must be a valid Ethiopian phone number (e.g., 912345678, 0912345678)",
    });
  })
  .messages({
    "string.pattern.base": "{{#message}}",
  });

const loginSchema = Joi.object({
  email: Joi.string().email().optional().empty("").messages({
    "string.email": "Must be a valid email",
  }),
  phoneNumber: ethiopianPhoneSchema.optional().empty(""),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
})
  .custom((value, helpers) => {
    const { email, phoneNumber } = value;

    // Check if neither email nor phoneNumber is provided
    if ((!email || email === "") && (!phoneNumber || phoneNumber === "")) {
      return helpers.error("any.custom", {
        message: "Please provide either email or phone number",
      });
    }

    // Check if both email and phoneNumber are provided
    if (email && email !== "" && phoneNumber && phoneNumber !== "") {
      return helpers.error("any.custom", {
        message: "Please provide either email or phone number, not both",
      });
    }

    return value;
  })
  .messages({
    "any.custom": "{{#error.message}}",
  });

exports.validateLogin = (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((err) => err.message),
    });
  }

  // Replace req.body with validated and cleaned data
  req.body = value;
  next();
};
