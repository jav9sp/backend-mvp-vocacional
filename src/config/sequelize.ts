import colors from "colors";

import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";

import User from "../models/User.model.js";
import Test from "../models/Test.model.js";
import Question from "../models/Question.model.js";
import Attempt from "../models/Attempt.model.js";
import Answer from "../models/Answer.model.js";
import InapResult from "../models/InapResult.model.js";
import Organization from "../models/Organization.model.js";
import Period from "../models/Period.model.js";
import Enrollment from "../models/Enrollment.model.js";
import StudentProfile from "../models/StudentProfile.model.js";
import NemConversion from "../models/NemConversion.model.js";
import PaesScoreRecord from "../models/PaesScoreRecord.model.js";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL not found");
const isProd = process.env.NODE_ENV === "production";

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: isProd
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : undefined,
  models: [
    User,
    Test,
    Question,
    Attempt,
    Answer,
    InapResult,
    Organization,
    Period,
    Enrollment,
    StudentProfile,
    NemConversion,
    PaesScoreRecord,
  ],
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
