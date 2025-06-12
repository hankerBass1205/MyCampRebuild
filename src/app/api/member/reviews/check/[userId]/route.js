import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const productIds = searchParams.get("productIds");

    if (!orderId || !productIds) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    const productIdArray = productIds.split(",");

    // 檢查查詢參數是否有效
    console.log("檢查訂單評論：", {
      orderId,
      userId,
      productIds: productIdArray,
    });

    // 1. 先檢查訂單內評論 - 移除 type = 'product' 限制
    const [orderReviews] = await db.query(
      `SELECT item_id, type FROM user_discussions 
       WHERE user_id = ? AND item_meta = ?`,
      [userId, `order_id:${orderId}`]
    );

    console.log("訂單評論查詢結果:", orderReviews);

    // 2. 再檢查這些商品是否有評論（不限於該訂單）- 移除 type = 'product' 限制
    let productReviews = [];
    if (productIdArray.length > 0) {
      [productReviews] = await db.query(
        `SELECT DISTINCT item_id, type FROM user_discussions
         WHERE user_id = ? AND item_id IN (?)
         AND ((content IS NOT NULL AND content != '') OR (rating IS NOT NULL))`,
        [userId, productIdArray]
      );
      console.log("商品評論查詢結果:", productReviews);
    }

    // 收集已評論商品的ID (包含兩種途徑的評論)
    const orderReviewedIds = orderReviews.map((review) =>
      review.item_id.toString()
    );
    const productReviewedIds = productReviews.map((review) =>
      review.item_id.toString()
    );

    // 合併已評論商品ID並去重
    const reviewedProductIds = [
      ...new Set([...orderReviewedIds, ...productReviewedIds]),
    ];
    console.log("已評論商品ID:", reviewedProductIds);

    // 找出未評論的商品ID
    const unreviewedProductIds = productIdArray.filter(
      (id) => !reviewedProductIds.includes(id)
    );
    console.log("未評論商品ID:", unreviewedProductIds);

    return NextResponse.json({
      allReviewed:
        unreviewedProductIds.length === 0 && productIdArray.length > 0,
      reviewedProductIds,
      unreviewedProductIds,
      totalReviewed: reviewedProductIds.length,
    });
  } catch (error) {
    console.error("檢查評論失敗:", error);
    return NextResponse.json(
      { error: "檢查評論失敗", details: error.message },
      { status: 500 }
    );
  }
}
