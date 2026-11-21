import {ensureSchema,pool} from "../../../../db";
async function quiz(code:string){await ensureSchema();const {rows}=await pool.query(`SELECT id,title,time_seconds AS "timeSeconds",question_limit AS "questionLimit",status,started_at AS "startedAt" FROM teacher_quizzes WHERE join_code=$1`,[code]);return rows[0]}
export async function GET(_:Request,c:{params:Promise<{code:string}>}){
 const q=await quiz((await c.params).code);if(!q)return Response.json({error:"Código de quiz inválido."},{status:404});
 if(q.status!=="live")return Response.json({quiz:{title:q.title,timeSeconds:q.timeSeconds,status:q.status,startedAt:q.startedAt},questions:[]});
 const limit=q.questionLimit>0?`LIMIT ${Math.min(200,Number(q.questionLimit))}`:"";
 const {rows}=await pool.query(`SELECT id,text,options_json AS options,image_url AS "imageUrl" FROM teacher_quiz_questions WHERE quiz_id=$1 ORDER BY RANDOM() ${limit}`,[q.id]);
 return Response.json({quiz:{title:q.title,timeSeconds:q.timeSeconds,status:q.status,startedAt:q.startedAt},questions:rows});
}
export async function POST(r:Request,c:{params:Promise<{code:string}>}){
 try{const q=await quiz((await c.params).code);if(!q)return Response.json({error:"Código inválido."},{status:404});if(q.status!=="live")return Response.json({error:"El quiz no está activo."},{status:409});
 const b=await r.json() as{studentName?:string;questionIds?:number[];answers?:number[]},name=b.studentName?.trim().slice(0,80)||"",ids=b.questionIds||[];
 if(!name||!ids.length||!Array.isArray(b.answers)||ids.length!==b.answers.length)return Response.json({error:"Quiz incompleto."},{status:400});
 const {rows}=await pool.query(`SELECT id,correct_index AS "correctIndex" FROM teacher_quiz_questions WHERE quiz_id=$1 AND id=ANY($2::int[])`,[q.id,ids]);const map=new Map(rows.map(x=>[x.id,x]));
 if(map.size!==ids.length)return Response.json({error:"El quiz cambió; vuelve a comenzar."},{status:409});
 const detail=ids.map((id,i)=>({questionId:id,answer:b.answers![i],correct:b.answers![i]===map.get(id).correctIndex})),score=detail.filter(x=>x.correct).length;
 await pool.query(`INSERT INTO teacher_quiz_attempts(quiz_id,student_name,score,total,answers_json) VALUES($1,$2,$3,$4,$5)`,[q.id,name,score,ids.length,JSON.stringify(detail)]);
 return Response.json({score,total:ids.length},{status:201})}catch{return Response.json({error:"No se pudo guardar el resultado."},{status:500})}
}

