const express = require("express");
const router = express.Router();

const {
  getInternalHierarchies,
  getInternalHierarchyById,
  createInternalHierarchy,
  updateInternalHierarchy,
  deleteInternalHierarchy,
  getInternalHierarchiesWithUsers,
} = require("../controllers/internalHierarchyController");

const {
  validateCreateHierarchy,
  validateUpdateHierarchy,
} = require("../validators/internalHierarchyValidator");

const { authenticateToken } = require("../middlewares/authMiddleware");


router.get("/", authenticateToken, getInternalHierarchies);
router.get("/with-users", authenticateToken, getInternalHierarchiesWithUsers);
router.get("/:id", authenticateToken, getInternalHierarchyById);

router.post(
  "/",
  authenticateToken,
  validateCreateHierarchy,
  createInternalHierarchy
);



router.put(
  "//:id",
  authenticateToken,
  validateUpdateHierarchy,
  updateInternalHierarchy
);

router.delete("/:id", authenticateToken, deleteInternalHierarchy);

module.exports = router;
