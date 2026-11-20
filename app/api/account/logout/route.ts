import {clearSession} from "../../../../lib/teacher-auth";
export async function POST(){await clearSession();return Response.json({ok:true})}

