"use client";
import { ToastContainerComponent } from "@/utils/toast";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";

// ✅ 讓 `ProductCard` 依序進場
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // ✅ 控制子元素依序進場
      delayChildren: 0.5, // ✅ `ProductList` 先顯示，然後 `ProductCard` 依序進場
    },
  },
};

// ✅ 單個 `ProductCard` 動畫
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

export default function ProductList({ products }) {
  return (
    <div className="col-lg-9">
      <motion.div
        className="row row-cols-1 row-cols-md-3 g-3"
        variants={listVariants} // ✅ 整個 `ProductList` 先顯示
        initial="hidden"
        animate="visible"
      >
        {products.map((product) => (
          <motion.div key={product.id} variants={itemVariants}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
      <ToastContainerComponent />
    </div>
  );
}
