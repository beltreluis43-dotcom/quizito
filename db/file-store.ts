import { promises as fs } from "node:fs";
import path from "node:path";

export type Question={id:number;text:string;options:string[];correctIndex:number;position:number};
export type Submission={id:number;studentName:string;score:number;total:number;answers:{questionId:number;answer:number;correct:boolean}[];createdAt:string};
type Store={questions:Question[];submissions:Submission[]};
const file=process.env.QUIZ_DATA_FILE||path.join(process.cwd(),"data","quizito.json");
let queue=Promise.resolve();

async function read():Promise<Store>{
  try{return JSON.parse(await fs.readFile(file,"utf8")) as Store}
  catch{return{questions:[],submissions:[]}}
}
async function write(data:Store){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(data,null,2),"utf8")}
export async function view(){return read()}
export function update<T>(fn:(data:Store)=>T|Promise<T>):Promise<T>{
  const task=queue.then(async()=>{const data=await read();const result=await fn(data);await write(data);return result});
  queue=task.then(()=>undefined,()=>undefined);return task;
}
