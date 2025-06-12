// components/cart/CartSummary.js
export default function CartSummary({ total }) {
  return (
    <article className="total">
      <p>總計 :</p>
      <p>NT${total}</p>
    </article>
  );
}
