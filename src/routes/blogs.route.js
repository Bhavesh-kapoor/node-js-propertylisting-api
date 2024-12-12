import { Router } from "express";
import { createBlog, findBlogById, updateBlog, getAllBlogs, deleteBlog } from "../controller/BlogsController.js";
import { multerUpload } from "../middlewere/multer.middlewere.js";

const router = Router();

router.get("/all", getAllBlogs);

router.delete("/delete/:_id", deleteBlog);

router.get("/get-blog/:_id", findBlogById);

router.post("/create", multerUpload.single("blogImage"), createBlog);

router.put("/update/:_id", multerUpload.single("blogImage"), updateBlog);

export default router;
