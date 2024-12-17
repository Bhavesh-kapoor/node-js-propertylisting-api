import express from "express";
import { userValidations } from "../controller/admin.controller";

const dealerRoutes = express.Router();

dealerRoutes.post("signup", userValidations);

export default dealerRoutes;
