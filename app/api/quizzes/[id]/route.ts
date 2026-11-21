import {currentTeacher} from "../../../../lib/teacher-auth";
import {ensureSchema,pool} from "../../../../db";

async function owned(id:number,teacher:number){
 const {rows}=await pool.query(`SELECT id,title,join_code AS "joinCode",time_seconds AS "timeSeconds",question_limit AS "questionLimit" FROM teacher_quizzes WHERE id=$1 AND teacher_id=$2`,[id,teacher]);
 return rows[0];
}
export async function GET(_:Request,c:{params:Promise<{id:string}>}){
 const t=await currentTeacher();if(!t)return Response.json({error:"No autorizado"},{status:401});
 await ensureSchema();const id=Number((await c.params).id),quiz=await owned(id,t.id);
 if(!quiz)return Response.json({error:"Quiz no encontrado"},{status:404});
 const {rows:questions}=await pool.query(`SELECT id,text,options_json AS options,correct_index AS "correctIndex",image_url AS "imageUrl",position FROM teacher_quiz_questions WHERE quiz_id=$1 ORDER BY position,id`,[id]);
 const {rows:attempts}=await pool.query(`SELECT id,student_name AS "studentName",score,total,answers_json AS answers,created_at AS "createdAt" FROM teacher_quiz_attempts WHERE quiz_id=$1 ORDER BY created_at DESC LIMIT 500`,[id]);
 return Response.json({quiz,questions,attempts,plan:t.plan});
}
export async function PUT(r:Request,c:{params:Promise<{id:string}>}){
 const t=await currentTeacher();if(!t)return Response.json({error:"No autorizado"},{status:401});
 const id=Number((await c.params).id),b=await r.json() as{title?:string;timeSeconds?:number;questionLimit?:number};
 const current=await owned(id,t.id);if(!current)return Response.json({error:"Quiz no encontrado"},{status:404});
 const title=b.title?.trim().slice(0,100)||current.title;
 const premium=t.plan==="premium";
 const time=premium?Math.max(5,Math.min(180,Number(b.timeSeconds)||25)):25;
 const limit=premium?Math.max(0,Math.min(200,Number(b.questionLimit)||0)):0;
 const {rows}=await pool.query(`UPDATE teacher_quizzes SET title=$1,time_seconds=$2,question_limit=$3 WHERE id=$4 AND teacher_id=$5 RETURNING id,title,join_code AS "joinCode",time_seconds AS "timeSeconds",question_limit AS "questionLimit"`,[title,time,limit,id,t.id]);
 return Response.json({quiz:rows[0]});
}
export async function DELETE(_:Request,c:{params:Promise<{id:string}>}){
 const t=await currentTeacher();if(!t)return Response.json({error:"No autorizado"},{status:401});
 const id=Number((await c.params).id);await pool.query(`DELETE FROM teacher_quizzes WHERE id=$1 AND teacher_id=$2`,[id,t.id]);return Response.json({ok:true});
}

