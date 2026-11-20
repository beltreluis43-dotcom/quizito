import {createHash,randomBytes,scryptSync,timingSafeEqual} from "node:crypto";
import {cookies} from "next/headers";
import {ensureSchema,pool} from "../db";

const COOKIE="quizito_teacher_session";
const DAYS=30;
export function normalizeEmail(value:string){return value.trim().toLowerCase().slice(0,254)}
export function passwordParts(password:string,salt=randomBytes(16).toString("hex")){return{salt,hash:scryptSync(password,salt,64).toString("hex")}}
export function validPassword(password:string,salt:string,expected:string){const actual=scryptSync(password,salt,64),saved=Buffer.from(expected,"hex");return actual.length===saved.length&&timingSafeEqual(actual,saved)}
const tokenHash=(token:string)=>createHash("sha256").update(token).digest("hex");
export async function createSession(teacherId:number){await ensureSchema();const token=randomBytes(32).toString("hex"),expires=new Date(Date.now()+DAYS*86400000);await pool.query(`DELETE FROM teacher_sessions WHERE expires_at<NOW()`);await pool.query(`INSERT INTO teacher_sessions(token_hash,teacher_id,expires_at) VALUES($1,$2,$3)`,[tokenHash(token),teacherId,expires]);(await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires})}
export async function currentTeacher(){await ensureSchema();const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;const {rows}=await pool.query(`SELECT a.id,a.name,a.email,a.plan,a.subscription_status AS "subscriptionStatus" FROM teacher_sessions s JOIN teacher_accounts a ON a.id=s.teacher_id WHERE s.token_hash=$1 AND s.expires_at>NOW()`,[tokenHash(token)]);return rows[0]||null}
export async function clearSession(){const jar=await cookies(),token=jar.get(COOKIE)?.value;if(token){await ensureSchema();await pool.query(`DELETE FROM teacher_sessions WHERE token_hash=$1`,[tokenHash(token)])}jar.set(COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires:new Date(0)})}

