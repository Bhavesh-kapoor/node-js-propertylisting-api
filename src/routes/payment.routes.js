import { Router } from "express";
import { createOrder } from "../controller/order.controller.js";

const paymentRoute =Router();

paymentRoute.post("/create-order", createOrder); 

export default paymentRoute