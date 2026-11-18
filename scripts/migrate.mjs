import fs from "node:fs/promises";
import pg from "pg";
const {Client}=pg;
if(!process.env.DATABASE_URL)throw new Error("Falta DATABASE_URL");
const client=new Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==="false"?false:{rejectUnauthorized:false}});
await client.connect();
try{await client.query(await fs.readFile(new URL("../migrations/001_init.sql",import.meta.url),"utf8"));console.log("Base de datos preparada")}finally{await client.end()}
