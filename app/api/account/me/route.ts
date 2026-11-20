import {currentTeacher} from "../../../../lib/teacher-auth";
export async function GET(){return Response.json({teacher:await currentTeacher(),paypalReady:Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID&&process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID)})}

