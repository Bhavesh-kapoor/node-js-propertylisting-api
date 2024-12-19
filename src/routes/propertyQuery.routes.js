import { Router } from "express";
import {
  raisePropertyQuery,
  getQueryById,
  updateQueryStatus,
  getQueries,
  deleteQuery,
} from "../controller/proprtyQuery.controller.js";
const propertyQueryRoutes = Router();

// propertyQueryRoutes.post("/raise-property-query", raisePropertyQuery);
propertyQueryRoutes.get("/get/:queryId", getQueryById);
propertyQueryRoutes.put("/update-query/:queryId", updateQueryStatus);
propertyQueryRoutes.get("/get-queries", getQueries);
propertyQueryRoutes.delete("/delete/:queryId", deleteQuery);
export default propertyQueryRoutes;
