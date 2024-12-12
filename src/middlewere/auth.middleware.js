import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { User } from "../model/user.model.js";

const verifyJwtToken = async (req, res, next) => {
    try {
        let token =
            req.cookies?.accesstoken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(400).json(new ApiError(400, "", "Token Not Found!"));
        }
        const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!verified) {
            return res.status(409).json(new ApiError(409, "", "Invalid Token"));
        }
        // Find user by id
        let user = await User.findById(verified.userId).select(
            "-password -refreshToken"
        );
        if (!user) {
            return res
                .status(422)
                .json(new ApiError(422, "", "User does not exist!"));
        }
        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json(new ApiError(401, "", "Unauthorized"));
    }
};

export default verifyJwtToken;
