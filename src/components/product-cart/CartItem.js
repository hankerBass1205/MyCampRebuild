import Link from "next/link";
import { showCartAlert } from "@/utils/sweetalert"; // ✅ 老大做好的 SweetAlert
import { formatPrice } from "@/utils/formatPrice";

export default function CartItem({
  product_id,
  product_name,
  product_image,
  product_price,
  product_stock,
  quantity,
  onQuantityChange,
  onDelete,
}) {
  // ✅ 計算小計 (商品價格 * 數量)
  const subtotal = product_price * quantity;
  // console.log(`庫存量為: ${product_stock}`);

  function dOrD(quantity) {
    if (quantity > 1) {
      return onQuantityChange(-1);
    }
    return onDelete();
  }

  function addOrOver() {
    if (quantity < product_stock) {
      onQuantityChange(1);
    } else {
      showCartAlert.error("你已經買光庫存"); // ✅ 修正語法
    }
  }

  return (
    <div className="item mb-3">
      {/* 商品圖片 */}
      <div className="name-pic item-style">
        <div className="image">
          <img src={`/images/products/${product_image}`} alt={product_name} />
        </div>
        <Link href={`/products/${product_id}`}>
          <p className="name">{product_name}</p>
        </Link>
      </div>

      {/* 單價 */}
      <div className="price item-style">
        <p className="text-center">NT${formatPrice(product_price)}</p>
      </div>

      {/* 數量增減按鈕 */}
      <div className="quantity item-style d-flex">
        <button onClick={() => dOrD(quantity)}>-</button>
        <input
          className="w-100 text-center"
          type="text"
          value={quantity}
          readOnly
        />
        <button onClick={addOrOver} disabled={quantity > product_stock}>
          +
        </button>
      </div>

      {/* 小計 */}
      <div className="subtotal item-style">
        <p className="text-center">NT${formatPrice(subtotal)}</p>
      </div>

      {/* 刪除按鈕 */}
      <div className="delete item-style">
        <button onClick={onDelete}>
          <img
            width={26}
            height={26}
            src="/images/product-cart/delete-icon.png"
            alt="刪除商品"
          />
        </button>
      </div>
    </div>
  );
}
