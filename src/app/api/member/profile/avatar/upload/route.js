// app/api/member/profile/avatar/upload/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  try {
    // 创建上传目录
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const session = await getServerSession({ req: request, ...authOptions });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "需要登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小超过5MB限制" },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const ext = path.extname(file.name);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const relativePath = filename;

    // 转换ArrayBuffer为Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 写入文件
    await fs.writeFile(filePath, buffer);

    // 更新数据库
    const [result] = await db.query(
      "UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?",
      [relativePath, session.user.id]
    );

    if (result.affectedRows === 0) {
      await fs.unlink(filePath).catch(console.error);
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatar: relativePath,
    });
  } catch (error) {
    console.error("上传错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
