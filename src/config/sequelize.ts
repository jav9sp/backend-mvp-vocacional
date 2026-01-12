import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import colors from "colors";
import User from "../models/User.model.ts";
import Test from "../models/Test.model.ts";
import Question from "../models/Question.model.ts";
import Attempt from "../models/Attempt.model.ts";
import Answer from "../models/Answer.model.ts";
import Result from "../models/Result.model.ts";
import Organization from "../models/Organization.model.ts";
import Period from "../models/Period.model.ts";
import Enrollment from "../models/Enrollment.model.ts";

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
