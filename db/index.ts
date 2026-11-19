import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
const globalForDb=globalThis as unknown as{pool?:Pool};
const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error("Falta DATABASE_URL");
const ssl=process.env.DATABASE_SSL==="false"?false:{rejectUnauthorized:false};
export const pool=globalForDb.pool??new Pool({connectionString,ssl,max:10});
if(process.env.NODE_ENV!=="production")globalForDb.pool=pool;
export const db=drizzle(pool,{schema});
let schemaReady:Promise<void>|undefined;
export function ensureSchema(){schemaReady??=(async()=>{await pool.query(`CREATE TABLE IF NOT EXISTS questions (id SERIAL PRIMARY KEY,text TEXT NOT NULL,options_json JSONB NOT NULL,correct_index INTEGER NOT NULL,position INTEGER NOT NULL DEFAULT 0,image_url TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);await pool.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT ''`);await pool.query(`CREATE TABLE IF NOT EXISTS submissions (id SERIAL PRIMARY KEY,student_name TEXT NOT NULL,score INTEGER NOT NULL,total INTEGER NOT NULL,answers_json JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)})();return schemaReady}
