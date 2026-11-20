import PlayClient from "./play-client";
export default async function PlayPage({params}:{params:Promise<{code:string}>}){return <PlayClient code={(await params).code}/>}

