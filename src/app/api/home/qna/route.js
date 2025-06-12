import db from "@/lib/db";
import { message } from "antd";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log(body);
    const { name, email, telephone, address, message } = body;
    if (!name || !email || !telephone || !address || !message) {
      return new Response(
        JSON.stringify({message: "Please fill all the fields"}),{
          status: 400
        }
      );
    }
    await db.query(
      `INSERT INTO qna (name, email, telephone, address, message,  created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, email, telephone, address, message]
    );
    return new Response(JSON.stringify({ message: "已傳送訊息" }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: "請填寫所有欄位" }), {
      status: 500,
    })
  }
}
