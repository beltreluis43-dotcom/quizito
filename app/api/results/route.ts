import {ensureSchema,pool} from "../../../db";
const auth=(r:Request)=>Boolean(process.env.QUIZ_TEACHER_PIN)&&r.headers.get("x-teacher-pin")===process.env.QUIZ_TEACHER_PIN;
export async function GET(r:Request){if(!auth(r))return Response.json({error:"No autorizado"},{status:401});await ensureSchema();const {rows}=await pool.query(`SELECT id,student_name AS "studentName",score,total,answers_json AS answers,created_at AS "createdAt" FROM submissions ORDER BY created_at DESC,id DESC LIMIT 500`);return Response.json({results:rows})}
export async function DELETE(r:Request){if(!auth(r))return Response.json({error:"No autorizado"},{status:401});await ensureSchema();await pool.query(`DELETE FROM submissions`);return Response.json({ok:true})}
