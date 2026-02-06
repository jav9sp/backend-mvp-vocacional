import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";

import User from "../models/User.model.js";
import Test from "../models/Test.model.js";
import InapQuestion from "../models/InapQuestion.model.js";
import Attempt from "../models/Attempt.model.js";
import InapAnswer from "../models/InapAnswer.model.js";
import InapResult from "../models/InapResult.model.js";
import Organization from "../models/Organization.model.js";
import Period from "../models/Period.model.js";
import Enrollment from "../models/Enrollment.model.js";
import StudentProfile from "../models/StudentProfile.model.js";
import NemConversion from "../models/NemConversion.model.js";
import PaesScoreRecord from "../models/PaesScoreRecord.model.js";
import OfferFlat from "../models/OfferFlat.model.js";
import AdmissionProcess from "../models/AdmissionProcess.model.js";
import ProgramOffer from "../models/ProgramOffer.model.js";
import StudentFavoriteOffer from "../models/StudentFavoriteOffer.model.js";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL not found");

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  define: {
    underscored: true,
    timestamps: true,
  },
  logging: false,
  models: [
    User,
    Test,
    InapQuestion,
    Attempt,
    InapAnswer,
    InapResult,
    Organization,
    Period,
    Enrollment,
    StudentProfile,
    NemConversion,
    PaesScoreRecord,
    OfferFlat,
    AdmissionProcess,
    ProgramOffer,
    StudentFavoriteOffer,
  ],
});

export async function connectDB() {
  try {
    await sequelize.authenticate();
    // No hacer Sync a menos que sea necesario
    // await sequelize.sync();
    console.log(`Conectado a la base de datos: ${databaseUrl}`);
  } catch (error) {
    console.log(error);
    console.log("Error al conectar a la base de datos");
  }
}
