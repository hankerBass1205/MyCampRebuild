import { redirect } from "next/navigation";

export default async function MypPage() {
  // 導向商品列表頁
  redirect("/products-lease/list");
  // 不會執行到這裡
  return null;
}

// 幹 好了喔！
