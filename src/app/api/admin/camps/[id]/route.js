import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(request, context) {
  try {
    const id = context.params.id;
    const body = await request.json();
    
    let updateFields = [];
    let updateValues = [];

    if (body.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(body.status);
    }

    if (body.status_reason !== undefined) {
      updateFields.push('status_reason = ?');
      updateValues.push(body.status_reason);
    }

    if (body.operation_status !== undefined) {
      updateFields.push('operation_status = ?');
      updateValues.push(body.operation_status);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "沒有提供要更新的欄位" },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    const [result] = await db.query(
      `UPDATE camp_applications 
       SET ${updateFields.join(', ')}
       WHERE application_id = ?`,
      [...updateValues, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "找不到該筆申請" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "更新成功" });
  } catch (error) {
    console.error("Error updating camp application:", error);
    return NextResponse.json(
      { error: "更新失敗", details: error.message },
      { status: 500 }
    );
  }
} 