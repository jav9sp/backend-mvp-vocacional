import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import colors from "colors";
import User from "../models/User.model.js";
import Test from "../models/Test.model.js";
import Question from "../models/Question.model.js";
import Attempt from "../models/Attempt.model.js";
import Answer from "../models/Answer.model.js";
import Result from "../models/Result.model.js";
import Organization from "../models/Organization.model.js";
import Period from "../models/Period.model.js";
import Enrollment from "../models/Enrollment.model.js";

dotenv.config();

export const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: "postgres",
  models: [
    User,
    Test,
    Question,
    Attempt,
    Answer,
    Result,
    Organization,
    Period,
    Enrollment,
  ],
  logging: false,
});

export async function connectDB() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Conectado a la base de datos");
  } catch (error) {
    console.log(error);
    console.log(colors.bgRed("Error al conectar a la base de datos"));
  }
}
