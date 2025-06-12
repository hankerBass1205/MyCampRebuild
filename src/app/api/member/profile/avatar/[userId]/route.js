import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import db from "@/lib/db";

const ALLOWED_AVATARS = [
  "avatar1.png",
  "avatar2.png",
  "avatar3.png",
  "avatar4.png",
  "avatar5.png",
  "default-avatar.png",
];

export async function PATCH(req, context) {
  try {
    // const { params } = context;
    // const userId = params.userId;
    // const session = await getServerSession({ req, ...authOptions });
    // const { searchParams } = new URL(req.url);
    // const userId = searchParams.get("userId");
    // const session = await getServerSession({ req, ...authOptions });
    // const userId = context.params.userId;
    // const session = await getServerSession({ req, ...authOptions });
    const url = new URL(req.url);
    const userId = url.pathname.split("/").pop();
    const session = await getServerSession({ req, ...authOptions });

    // console.log("Session:", session);
    // console.log("Params:", params);

    if (!userId) {
      // console.error("缺少 userId 參數");
      return NextResponse.json({ error: "缺少用戶ID" }, { status: 400 });
    }

    if (!session?.user?.id) {
      // console.error("未授權訪問，用戶未登入");
      return NextResponse.json({ error: "需要登入才能操作" }, { status: 401 });
    }

    if (session.user.id.toString() !== userId) {
      // console.error(
      //   `權限不符，請求用戶: ${userId}，當前用戶: ${session.user.id}`
      // );
      return NextResponse.json({ error: "無權限操作此用戶" }, { status: 403 });
    }

    const { avatar } = await req.json();
    // console.log("接收頭像參數:", avatar);

    // 確保接收的頭像參數不包含路徑，只包含文件名
    const avatarFileName = avatar.split("/").pop();

    if (!ALLOWED_AVATARS.includes(avatarFileName)) {
      // console.error("無效頭像:", avatarFileName);
      return NextResponse.json({ error: "無效的頭像選擇" }, { status: 400 });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const avatarPath = `${avatarFileName}`;
      // console.log("更新頭像路徑:", avatarPath);

      const [result] = await conn.query(
        `UPDATE users 
         SET avatar = ?, updated_at = NOW()
         WHERE id = ?`,
        [avatarPath, userId]
      );

      if (result.affectedRows === 0) {
        // console.error("用戶不存在:", userId);
        await conn.rollback();
        return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
      }

      await conn.commit();
      // console.log("資料庫更新成功");

      return NextResponse.json({
        success: true,
        avatar: avatarPath,
      });
    } catch (error) {
      await conn.rollback();
      // console.error("資料庫錯誤:", error);
      return NextResponse.json({ error: "資料庫操作失敗" }, { status: 500 });
    } finally {
      conn.release();
    }
  } catch (error) {
    // console.error("全局錯誤:", error);
    return NextResponse.json({ error: "伺服器內部錯誤" }, { status: 500 });
  }
}
