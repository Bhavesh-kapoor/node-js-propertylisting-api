import multer from "multer";
import path from "path";
import ApiError from "../utils/ApiError.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|webp|png|pdf|mp4|mov|avi|mkv/;
  const isValid =
    allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
    allowedTypes.test(file.mimetype);

  if (isValid) cb(null, true);
  else cb(new ApiError(400, "Invalid file type", "Only JPG, WEBP, PNG, PDF, MP4, MOV, AVI, MKV are allowed"));
};


export const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).send({ error: "Multer error: Field doesn't exist or invalid input" });
  } else if (err instanceof ApiError) {
    return next(err);
  }
  next();
};

export const multerUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

