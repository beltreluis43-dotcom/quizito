import {createSession,normalizeEmail,validPassword} from "../../../../lib/teacher-auth";
import {ensureSchema,pool} from "../../../../db";
export async function POST(r:Request){try{const b=await r.json() as{email?:string;password?:string};await ensureSchema();const {rows}=await pool.query(`SELECT id,password_hash,password_salt FROM teacher_accounts WHERE email=$1`,[normalizeEmail(b.email||"")]);const a=rows[0];if(!a||!validPassword(b.password||"",a.password_salt,a.password_hash))return Response.json({error:"Correo o contraseña incorrectos."},{status:401});await createSession(a.id);return Response.json({ok:true})}catch{return Response.json({error:"No se pudo iniciar sesión."},{status:500})}}

