import Link from "next/link";

export default function ProductCard({ product }) {
  return (
    <div className="col">
      <div className="card border-0">
        <img
          src={`/images/products/${product.main_image}`}
          className="card-img-top"
          alt={product.name}
        />
        <div className="card-body">
          <Link href={`/products-lease/${product.id}`}>
            <h5 className="card-title mb-3">{product.name}</h5>
          </Link>
          <div className="d-flex justify-content-between">
            <p className="card-text">${Math.round(product.price / 10)} / 1 天</p>
            {/* <a href="#" className="mt-2">
              <i className="fa-regular fa-heart heart"></i>
            </a> */}
          </div>
        </div>
      </div>
    </div>
  );
}
