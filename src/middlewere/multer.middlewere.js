import multer from "multer";
import path from "path";
import ApiError from "../utils/ApiError.js";

// Use memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|webp|png|pdf/;
  const isValid =
    allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
    allowedTypes.test(file.mimetype);

  if (isValid) cb(null, true);
  else cb(new ApiError(400, "Invalid file type", "Only JPG, WEBP, PNG are allowed"));
};

// Error handling middleware for Multer
export const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).send({ error: "Multer error: Field doesn't exist or invalid input" });
  } else if (err instanceof ApiError) {
    return next(err);
  }
  next();
};

// Multer configuration with memory storage
export const multerUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
});
