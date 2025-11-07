const multer = require("multer");
const path = require("path");
const fs = require("fs");

const allowedTypes = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { issue_id } = req.body;
    if (!issue_id) return cb(new Error("Issue ID is required"));

    const issueDir = path.join(
      __dirname,
      `../public/uploads/issues/${issue_id}`
    );
    if (!fs.existsSync(issueDir)) fs.mkdirSync(issueDir, { recursive: true });

    cb(null, issueDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "");
    cb(null, `${uniqueSuffix}_${baseName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Unsupported file format: ${file.originalname}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

module.exports = upload;
