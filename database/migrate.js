require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function runMigrations() {
  try {
    const migrationsPath = path.join(__dirname, "migrations");

    const files = fs
      .readdirSync(migrationsPath)
      .filter(file => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      console.log(`Executando migration: ${file}`);

      const sql = fs.readFileSync(
        path.join(migrationsPath, file),
        "utf8"
      );

      await pool.query(sql);

      console.log(`Migration ${file} executada com sucesso`);
    }

    console.log("Todas migrations executadas");

    process.exit(0);

  } catch (error) {
    console.error("Erro ao executar migrations:");
    console.error(error);

    process.exit(1);
  }
}

runMigrations();