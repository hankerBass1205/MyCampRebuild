import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.id AS category_id,
        c.name AS category_name,
        s.id AS subcategory_id,
        s.name AS subcategory_name
      FROM categories c
      LEFT JOIN subcategories s ON c.id = s.category_id
      ORDER BY c.id, s.id
    `);

    const data = rows.reduce((acc, row) => {
      const category = acc.find((cat) => cat.id === row.category_id);
      if (category) {
        category.subcategories.push({
          id: row.subcategory_id,
          name: row.subcategory_name,
        });
      } else {
        acc.push({
          id: row.category_id,
          name: row.category_name,
          subcategories: row.subcategory_id
            ? [{ id: row.subcategory_id, name: row.subcategory_name }]
            : [],
        });
      }
      return acc;
    }, []);

    return Response.json(data);
  } catch (error) {
    console.error("Database Error:", error);
    return new Response("Failed to fetch categories", { status: 500 });
  }
}
