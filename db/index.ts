import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
const globalForDb = globalThis as unknown as { pool?: Pool };
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Falta DATABASE_URL");
const ssl =
  process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false };
export const pool =
  globalForDb.pool ?? new Pool({ connectionString, ssl, max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;
export const db = drizzle(pool, { schema });
let schemaReady: Promise<void> | undefined;
export function ensureSchema() {
  schemaReady ??= (async () => {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS questions (id SERIAL PRIMARY KEY,text TEXT NOT NULL,options_json JSONB NOT NULL,correct_index INTEGER NOT NULL,position INTEGER NOT NULL DEFAULT 0,image_url TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
    );
    await pool.query(
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT ''`,
    );
    await pool.query(
      `DELETE FROM questions a USING questions b WHERE a.text=b.text AND a.id>b.id`,
    );
    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS questions_unique_text ON questions(text)`,
    );
    await pool.query(
      `CREATE TABLE IF NOT EXISTS submissions (id SERIAL PRIMARY KEY,student_name TEXT NOT NULL,score INTEGER NOT NULL,total INTEGER NOT NULL,answers_json JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
    );
    await pool.query(
      `CREATE TABLE IF NOT EXISTS teacher_accounts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free',
        subscription_id TEXT,
        subscription_status TEXT NOT NULL DEFAULT 'inactive',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    );
    await pool.query(
      `CREATE TABLE IF NOT EXISTS teacher_sessions (
        token_hash TEXT PRIMARY KEY,
        teacher_id INTEGER NOT NULL REFERENCES teacher_accounts(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    );
    await pool.query(`CREATE INDEX IF NOT EXISTS teacher_sessions_expiry ON teacher_sessions(expires_at)`);
    const previousQuestions = [
      ["¿Quién fue uno de los principales representantes del condicionamiento operante?", ["Sigmund Freud", "Jean Piaget", "B. F. Skinner", "Iván Pávlov"], 2],
      ["¿Cuál es el objetivo principal del condicionamiento operante?", ["Analizar las emociones", "Modificar conductas mediante sus consecuencias", "Desarrollar la memoria", "Eliminar todas las emociones"], 1],
      ["El reforzamiento negativo es lo mismo que un castigo", ["Verdadero", "Falso"], 1],
      ["¿Qué proceso nos impulsa a alcanzar nuestras metas?", ["Motivación", "Aprendizaje", "Memoria", "Percepción"], 0],
      ["Existen emociones malas que no cumplen ninguna función", ["Verdadero", "Falso"], 1],
      ["¿Qué son las emociones?", ["Sentimientos que experimentamos únicamente cuando estamos felices", "Reacciones ante diferentes situaciones", "Estados de ánimo que permanecen iguales durante todo el día", "Pensamientos que nunca producen cambios físicos"], 1],
      ["En el condicionamiento clásico, un estímulo inicialmente neutro puede convertirse en un estímulo condicionado al asociarse con un estímulo incondicionado.", ["Verdadero", "Falso"], 0],
      ["¿Qué ocurre durante la extinción en el condicionamiento clásico?", ["La respuesta condicionada se fortalece.", "Se genera una respuesta nueva sin aprendizaje previo", "La respuesta condicionada disminuye cuando deja de asociarse con el estímulo incondicionado.", "El estímulo incondicionado se convierte en neutro inmediatamente"], 2],
    ] as const;
    for (const [text, options, correctIndex] of previousQuestions) {
      await pool.query(
        `INSERT INTO questions(text,options_json,correct_index,position,image_url)
         VALUES($1,$2,$3,(SELECT COUNT(*) FROM questions),'')
         ON CONFLICT(text) DO UPDATE SET options_json=EXCLUDED.options_json,correct_index=EXCLUDED.correct_index`,
        [text, JSON.stringify(options), correctIndex],
      );
    }
  })();
  return schemaReady;
}

