import db from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      user_id,
      name,
      email,
      telephone,
      address,
      notes,
      price,
      appointment_starts,
      appointment_end,
      product_id,
      order_id
    } = body;

    // ✅ 驗證必要欄位
    if (
      !user_id ||
      !name ||
      !email ||
      !telephone ||
      !address ||
      !appointment_starts ||
      !appointment_end ||
      !product_id ||
      !order_id
    ) {
      return new Response(JSON.stringify({ message: "缺少必要欄位" }), {
        status: 400,
      });
    }

    // ✅ 插入資料
    const result = await db.query(
      `INSERT INTO products_lease (user_id, name, email, telephone, address, notes, price, appointment_starts, appointment_end, product_id, order_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        user_id,
        name,
        email,
        telephone,
        address,
        notes,
        price,
        appointment_starts,
        appointment_end,
        product_id,
        order_id
      ]
    );

    return new Response(
      JSON.stringify({
        message: "Order created successfully",
        order_id,
      }),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ message: "Error" }), { status: 500 });
  }
}
