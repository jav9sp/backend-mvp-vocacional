import dotenv from "dotenv";

const env = process.env.NODE_ENV || "development";

// Carga .env.development / .env.production
dotenv.config({ path: `.env.${env}` });

// opcional: fallback a ".env" si existe
dotenv.config();

export const ENV = env;
