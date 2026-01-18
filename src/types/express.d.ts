import Period from "../models/Period.model.js";
import User from "../models/User.model.js";
import { SafeUser } from "./dtos.js";

declare global {
  namespace Express {
    interface Request {
      period?: Period;
      admin?: SafeUser;
      student?: SafeUser;
      studentModel?: User;
    }
  }
}
