import { body, param, query, validationResult } from "express-validator";

// Middleware to handle validation errors
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validation rules
export const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["student", "organizer", "admin"]).withMessage("Invalid role"),
  validate
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required"),
  validate
];

export const refreshTokenValidation = [
  body("refreshToken")
    .notEmpty().withMessage("Refresh token is required"),
  validate
];

// Event validation rules
export const createEventValidation = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 100 }).withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .trim()
    .notEmpty().withMessage("Description is required")
    .isLength({ min: 10, max: 1000 }).withMessage("Description must be between 10 and 1000 characters"),
  body("date")
    .notEmpty().withMessage("Date is required")
    .isISO8601().withMessage("Invalid date format"),
  body("location")
    .trim()
    .notEmpty().withMessage("Location is required"),
  body("category")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Category must be less than 50 characters"),
  body("tags")
    .optional()
    .isArray().withMessage("Tags must be an array"),
  body("imageUrl")
    .optional()
    .trim(),
  body("image")
    .optional()
    .trim(),
  validate
];

export const updateEventValidation = [
  param("id")
    .notEmpty().withMessage("Event ID is required")
    .isMongoId().withMessage("Invalid event ID"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage("Title must be between 3 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage("Description must be between 10 and 1000 characters"),
  body("date")
    .optional()
    .isISO8601().withMessage("Invalid date format"),
  body("location")
    .optional()
    .trim(),
  body("category")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Category must be less than 50 characters"),
  body("tags")
    .optional()
    .isArray().withMessage("Tags must be an array"),
  body("imageUrl")
    .optional()
    .trim(),
  body("image")
    .optional()
    .trim(),
  validate
];


export const eventIdValidation = [
  param("id")
    .notEmpty().withMessage("Event ID is required")
    .isMongoId().withMessage("Invalid event ID"),
  validate
];

// Chat/Message validation rules
export const sendMessageValidation = [
  body("eventId")
    .notEmpty().withMessage("Event or Channel ID is required")
    .isString().withMessage("Invalid Event or Channel ID")
    .isLength({ min: 1, max: 100 }).withMessage("Channel ID too long"),
  body("text")
    .trim()
    .notEmpty().withMessage("Message text is required")
    .isLength({ min: 1, max: 1000 }).withMessage("Message must be between 1 and 1000 characters"),
  validate
];

export const getMessagesValidation = [
  param("eventId")
    .notEmpty().withMessage("Event or Channel ID is required")
    .isString().withMessage("Invalid Event or Channel ID")
    .isLength({ min: 1, max: 100 }).withMessage("Channel ID too long"),
  validate
];


// Preferences validation rules
export const updatePreferencesValidation = [
  body("preferences")
    .optional()
    .isArray().withMessage("Preferences must be an array"),
  body("skills")
    .optional()
    .isArray().withMessage("Skills must be an array"),
  body("alerts")
    .optional()
    .isArray().withMessage("Alerts must be an array"),
  validate
];

// Query validation for pagination and filtering
export const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage("Limit must be between 1 and 1000"),
  query("sort")
    .optional()
    .isIn(["date", "-date", "title", "-title", "createdAt", "-createdAt"]).withMessage("Invalid sort field"),
  validate
];

export const searchValidation = [
  query("q")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage("Search query must be between 1 and 100 characters"),
  query("category")
    .optional()
    .trim(),
  validate
];
