"use client";
import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Container,
  Row,
  Col,
  Pagination,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { showCartAlert } from "@/utils/sweetalert";

export default function ProductDashboard() {
  // 產品列表的狀態
  const [products, setProducts] = useState([]);

  // 分頁相關 state
  const [currentPage, setCurrentPage] = useState(1); // 目前頁數
  const itemsPerPage = 20; // 每頁顯示的產品數量

  // Modal 及產品編輯相關 state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 目前被編輯或新增的產品資料
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category_id: "",
    subcategory_id: "",
    status: 1,
  });

  // 分類及子分類列表
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // 初次載入時執行，取得產品、分類和子分類列表
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubcategories();
  }, []);

  // 從後端 API 取得所有產品
  const fetchProducts = async () => {
    const res = await fetch("/api/products/dashboard");
    const data = await res.json();
    if (data.success) setProducts(data.products);
  };

  // 從後端 API 取得所有分類
  const fetchCategories = async () => {
    const res = await fetch("/api/products/dashboard/categories");
    const data = await res.json();
    if (data.success) setCategories(data.categories);
  };

  // 從後端 API 取得所有子分類
  const fetchSubcategories = async () => {
    const res = await fetch("/api/products/dashboard/categories/sub");
    const data = await res.json();
    if (data.success) {
      setSubcategories(data.subcategories || []);
    }
  };

  // 新增或更新產品
  const handleCreateOrUpdate = async () => {
    // 編輯模式：PUT 更新
    if (isEditing) {
      const res = await fetch(`/api/products/dashboard/${currentProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentProduct,
          price: parseFloat(currentProduct.price), // 確保為數字
          stock: parseInt(currentProduct.stock), // 確保為整數
          status: parseInt(currentProduct.status), // 確保為整數
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts(); // 更新後重新取得產品列表
        setShowModal(false);
        resetCurrentProduct();
        setIsEditing(false);
        showCartAlert.success("產品更新成功");
      }
    } else {
      // 新增模式：POST
      const res = await fetch("/api/products/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentProduct,
          price: parseFloat(currentProduct.price),
          stock: parseInt(currentProduct.stock),
          status: parseInt(currentProduct.status),
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts(); // 新增後重新取得產品列表
        setShowModal(false);
        resetCurrentProduct();
        showCartAlert.success("產品新增成功");
      }
    }
  };

  // 編輯按鈕：設定要編輯的產品並打開 Modal
  const handleEdit = (product) => {
    setCurrentProduct({
      ...product,
      category_id: product.category_id.toString(),
      subcategory_id: product.subcategory_id.toString(),
      price: product.price.toString(),
      stock: product.stock.toString(),
      status: product.status.toString(),
      description: product.description || "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // 刪除按鈕：請求後端刪除指定產品
  const handleDelete = async (id) => {
    const result = await showCartAlert.confirm(
      "確定要移除此商品？",
      "移除後將無法復原"
    );
    if (!result.isConfirmed) return; // 若使用者取消則不執行

    const res = await fetch(`/api/products/dashboard/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      fetchProducts(); // 刪除後重新取得產品列表
      showCartAlert.success("產品已刪除");
    }
  };

  // 重置 Modal 中的產品資料
  const resetCurrentProduct = () => {
    setCurrentProduct({
      id: null,
      name: "",
      description: "",
      price: "",
      stock: "",
      category_id: "",
      subcategory_id: "",
      status: "1",
    });
  };

  // 根據當前頁數計算要顯示的產品
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageProducts = products.slice(startIndex, endIndex);

  // 計算總頁數
  const totalPages = Math.ceil(products.length / itemsPerPage);

  // 切換頁數
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>產品管理後台</h1>
          {/* 新增產品按鈕 */}
          <Button
            variant="primary"
            onClick={() => {
              resetCurrentProduct();
              setIsEditing(false);
              setShowModal(true);
            }}
          >
            新增產品
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          {/* 產品列表表格 */}
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>名稱</th>
                <th>價格</th>
                <th>庫存</th>
                <th>分類</th>
                <th>子分類</th>
                <th>狀態</th>
                <th>主圖片</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {currentPageProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.price}</td>
                  <td>{product.stock}</td>
                  <td>{product.category_name}</td>
                  <td>{product.subcategory_name}</td>
                  <td>{product.status === 1 ? "啟用" : "停用"}</td>
                  <td>
                    <img
                      src={
                        product.main_image
                          ? `/images/products/${product.main_image}`
                          : "/images/default-product.jpg"
                      }
                      alt={product.name}
                      style={{ width: "50px" }}
                    />
                  </td>
                  <td>
                    <Button
                      variant="warning"
                      onClick={() => handleEdit(product)}
                      className="me-2"
                    >
                      編輯
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(product.id)}
                    >
                      刪除
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* 分頁按鈕區塊 */}
          <Pagination>
            {/* 上一頁 */}
            <Pagination.Prev
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {/* 依總頁數生成分頁按鈕 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Pagination.Item
                key={page}
                active={page === currentPage}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Pagination.Item>
            ))}
            {/* 下一頁 */}
            <Pagination.Next
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </Col>
      </Row>

      {/* 新增 / 編輯 Modal */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          resetCurrentProduct();
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "編輯產品" : "新增產品"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* 產品名稱 */}
            <Form.Group controlId="formName" className="mb-3">
              <Form.Label>產品名稱</Form.Label>
              <Form.Control
                type="text"
                value={currentProduct.name}
                onChange={(e) =>
                  setCurrentProduct({ ...currentProduct, name: e.target.value })
                }
              />
            </Form.Group>
            {/* 產品描述 */}
            <Form.Group controlId="formDescription" className="mb-3">
              <Form.Label>描述</Form.Label>
              <Form.Control
                as="textarea"
                value={currentProduct.description}
                onChange={(e) =>
                  setCurrentProduct({
                    ...currentProduct,
                    description: e.target.value,
                  })
                }
              />
            </Form.Group>
            {/* 價格 */}
            <Form.Group controlId="formPrice" className="mb-3">
              <Form.Label>價格</Form.Label>
              <Form.Control
                type="number"
                value={currentProduct.price}
                onChange={(e) =>
                  setCurrentProduct({
                    ...currentProduct,
                    price: e.target.value,
                  })
                }
              />
            </Form.Group>
            {/* 庫存 */}
            <Form.Group controlId="formStock" className="mb-3">
              <Form.Label>庫存</Form.Label>
              <Form.Control
                type="number"
                value={currentProduct.stock}
                onChange={(e) =>
                  setCurrentProduct({
                    ...currentProduct,
                    stock: e.target.value,
                  })
                }
              />
            </Form.Group>
            {/* 主分類 */}
            <Form.Group controlId="formCategory" className="mb-3">
              <Form.Label>分類</Form.Label>
              <Form.Select
                value={currentProduct.category_id}
                onChange={(e) => {
                  setCurrentProduct({
                    ...currentProduct,
                    category_id: e.target.value,
                    subcategory_id: "", // 改變主類別時重置子類別
                  });
                }}
              >
                <option value="">選擇分類</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {/* 子分類 */}
            <Form.Group controlId="formSubcategory" className="mb-3">
              <Form.Label>子分類</Form.Label>
              <Form.Select
                value={currentProduct.subcategory_id}
                onChange={(e) =>
                  setCurrentProduct({
                    ...currentProduct,
                    subcategory_id: e.target.value,
                  })
                }
              >
                <option value="">選擇子分類</option>
                {subcategories
                  .filter(
                    (sub) =>
                      sub.category_id.toString() ===
                      currentProduct.category_id.toString()
                  )
                  .map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
            {/* 產品狀態 */}
            <Form.Group controlId="formStatus" className="mb-3">
              <Form.Label>狀態</Form.Label>
              <Form.Select
                value={currentProduct.status}
                onChange={(e) =>
                  setCurrentProduct({
                    ...currentProduct,
                    status: e.target.value,
                  })
                }
              >
                <option value={1}>啟用</option>
                <option value={0}>停用</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          {/* 取消按鈕 */}
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
              resetCurrentProduct();
            }}
          >
            取消
          </Button>
          {/* 確認送出 (新增 / 更新) */}
          <Button variant="primary" onClick={handleCreateOrUpdate}>
            {isEditing ? "更新" : "新增"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
