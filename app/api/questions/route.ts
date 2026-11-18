import { asc,eq } from "drizzle-orm";
import { db } from "../../../db";
import { questions } from "../../../db/schema";
function authorized(r:Request){return Boolean(process.env.QUIZ_TEACHER_PIN)&&r.headers.get("x-teacher-pin")===process.env.QUIZ_TEACHER_PIN}
function publicQuestion(q:typeof questions.$inferSelect){return{id:q.id,text:q.text,options:q.optionsJson,image:q.imageData}}
type Body={id?:number;text?:string;options?:string[];correctIndex?:number;image?:string|null};
function parse(b:Body){
 const text=b.text?.trim().slice(0,300)||"",options=Array.isArray(b.options)?b.options.map(x=>String(x).trim().slice(0,120)):[],correctIndex=Number(b.correctIndex);
 if(!text||options.length<2||options.length>4||options.some(o=>!o)||!Number.isInteger(correctIndex)||correctIndex<0||correctIndex>=options.length)return{error:"Completa la pregunta, todas las opciones y la respuesta correcta."};
 const image=typeof b.image==="string"&&b.image?b.image:null;
 if(image&&(image.length>700000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)))return{error:"La imagen no es válida o es demasiado grande."};
 return{text,options,correctIndex,image}
}
export async function GET(r:Request){const rows=await db.select().from(questions).orderBy(asc(questions.position),asc(questions.id));return Response.json({questions:rows.map(q=>authorized(r)?{...publicQuestion(q),correctIndex:q.correctIndex}:publicQuestion(q))})}
export async function POST(r:Request){if(!authorized(r))return Response.json({error:"No autorizado"},{status:401});const p=parse(await r.json() as Body);if("error" in p)return Response.json({error:p.error},{status:400});const existing=await db.select({id:questions.id}).from(questions);const[created]=await db.insert(questions).values({text:p.text,optionsJson:p.options,correctIndex:p.correctIndex,imageData:p.image,position:existing.length}).returning();return Response.json({question:{...publicQuestion(created),correctIndex:created.correctIndex}},{status:201})}
export async function PUT(r:Request){if(!authorized(r))return Response.json({error:"No autorizado"},{status:401});const b=await r.json() as Body,id=Number(b.id);if(!Number.isInteger(id))return Response.json({error:"Pregunta inválida"},{status:400});const p=parse(b);if("error" in p)return Response.json({error:p.error},{status:400});const[updated]=await db.update(questions).set({text:p.text,optionsJson:p.options,correctIndex:p.correctIndex,imageData:p.image}).where(eq(questions.id,id)).returning();if(!updated)return Response.json({error:"La pregunta ya no existe."},{status:404});return Response.json({question:{...publicQuestion(updated),correctIndex:updated.correctIndex}})}
export async function DELETE(r:Request){if(!authorized(r))return Response.json({error:"No autorizado"},{status:401});const id=Number(new URL(r.url).searchParams.get("id"));if(!Number.isInteger(id))return Response.json({error:"Pregunta inválida"},{status:400});await db.delete(questions).where(eq(questions.id,id));return Response.json({ok:true})}
