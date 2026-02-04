import Attempt from "../models/Attempt.model.ts";
import Period from "../models/Period.model.js";
import User from "../models/User.model.js";
import { SafeUser } from "./dtos.js";

declare global {
  namespace Express {
    interface Request {
      me?: SafeUser;
      admin?: SafeUser;
      student?: SafeUser;
      userModel?: User;
      studentModel?: User;
      period?: Period;
      attempt?: Attempt;
    }
  }
}
