import db from "@/lib/db";

export async function GET() {
    try{
        const query = `
        SELECT 
    p.id, 
    p.name, 
    p.price, 
    p.description, 
    c.name AS category_name, 
    s.name AS subcategory_name,
    pi.image_path AS main_image
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN subcategories s ON p.subcategory_id = s.id
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = 1`;
        const [rows] = await db.query(query);
        return Response.json(rows);
    }catch(err){
        console.log(err);
        return Response.json({message: "Error"},{status: 500});
    }
}