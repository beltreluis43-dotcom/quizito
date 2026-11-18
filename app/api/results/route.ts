import { desc } from "drizzle-orm";
import { db } from "../../../db";
import { submissions } from "../../../db/schema";
export async function GET(r:Request){if(!process.env.QUIZ_TEACHER_PIN||r.headers.get("x-teacher-pin")!==process.env.QUIZ_TEACHER_PIN)return Response.json({error:"No autorizado"},{status:401});const rows=await db.select().from(submissions).orderBy(desc(submissions.createdAt),desc(submissions.id)).limit(500);return Response.json({results:rows.map(x=>({id:x.id,studentName:x.studentName,score:x.score,total:x.total,answers:x.answersJson,createdAt:x.createdAt.toISOString()}))})}
export async function DELETE(r:Request){if(!process.env.QUIZ_TEACHER_PIN||r.headers.get("x-teacher-pin")!==process.env.QUIZ_TEACHER_PIN)return Response.json({error:"No autorizado"},{status:401});await db.delete(submissions);return Response.json({ok:true})}
