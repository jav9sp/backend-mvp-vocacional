import Period from "../models/Period.model.ts";
import User from "../models/User.model.ts";
import { SafeUser } from "./dtos.ts";

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
