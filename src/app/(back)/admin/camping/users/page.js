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
  Badge,
  InputGroup,
} from "react-bootstrap";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { showCartAlert } from "@/utils/sweetalert";

// 添加CSS樣式解決欄位寬度忽大忽小的問題
const tableStyles = {
  tableContainer: {
    overflowX: "auto", // 確保在小螢幕上可以水平捲動
  },
  table: {
    tableLayout: "fixed", // 最重要的屬性：使表格使用固定的列寬算法
    width: "100%",
  },
  thId: { width: "6%" },
  thEmail: { width: "20%" },
  thName: { width: "12%" },
  thPhone: { width: "12%" },
  thBirthday: { width: "10%" },
  thGender: { width: "8%" },
  thStatus: { width: "8%" },
  thDate: { width: "12%" },
  thActions: { width: "12%" },
  cell: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

export default function UserDashboard() {
  // 會員列表的狀態
  const [users, setUsers] = useState([]);
  const [statusZeroCount, setStatusZeroCount] = useState(0);

  // 分頁相關 state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  // 排序與篩選
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [searchTerm, setSearchTerm] = useState("");
  const [hideStatusZero, setHideStatusZero] = useState(false);

  // Modal 相關 state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // view, edit, add
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 目前操作的會員資料
  const [currentUser, setCurrentUser] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
    phone: "",
    birthday: "",
    gender: "",
    address: "",
    status: 1,
  });

  // 初次載入及參數變更時，重新取得資料
  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortField, sortOrder, hideStatusZero, perPage]);

  // 搜尋功能需額外處理
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // 重設頁數
    fetchUsers();
  };

  // 從 API 取得會員資料
  const fetchUsers = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        perPage,
        sort: sortField,
        order: sortOrder,
        hideStatusZero: hideStatusZero ? "1" : "0",
      });

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const res = await fetch(`/api/member/admin/users?${queryParams}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setStatusZeroCount(data.statusZeroCount || 0);
      } else {
        showCartAlert.error("獲取會員資料失敗");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showCartAlert.error("系統錯誤，無法獲取會員資料");
    }
  };

  // 獲取單一會員資料
  const fetchUserDetail = async (userId) => {
    try {
      // console.log(`正在獲取會員 ID ${userId} 的詳細資料`);
      const res = await fetch(`/api/member/admin/users?id=${userId}`);
      const data = await res.json();

      if (data.success && data.data) {
        // console.log("成功獲取會員資料:", data.data);

        // 確保資料中各項屬性都有預設值，避免未定義錯誤
        const safeUserData = {
          id: data.data.id || null,
          email: data.data.email || `用戶${userId}`,
          name: data.data.name || `用戶${userId}`,
          phone: data.data.phone || "",
          birthday: data.data.birthday || null,
          gender: data.data.gender || "other",
          address: data.data.address || "",
          avatar: data.data.avatar || "",
          last_login: data.data.last_login || null,
          status: typeof data.data.status === "number" ? data.data.status : 1,
          created_at: data.data.created_at || new Date(),
          updated_at: data.data.updated_at || new Date(),
          login_type: data.data.login_type || "email",
        };

        setCurrentUser(safeUserData);
      } else {
        console.error("獲取會員資料失敗:", data.message || "未知錯誤");
        throw new Error(data.message || "獲取會員資料失敗");
      }
    } catch (error) {
      console.error("獲取會員詳情時發生錯誤:", error);
      showCartAlert.error(error.message || "獲取會員資料時發生錯誤");
    }
  };

  // 處理排序
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortOrder("ASC");
    }
  };

  // 切換會員狀態（啟用/停用）
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 1 ? 0 : 1;
      const confirmText = newStatus === 1 ? "啟用" : "停用";

      const result = await showCartAlert.confirm(
        `確定要${confirmText}此會員？`,
        `會員: ${user.name} (${user.email})`
      );

      if (!result.isConfirmed) return;

      const res = await fetch(
        `/api/member/admin/users?id=${user.id}&status=${newStatus}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (data.success) {
        showCartAlert.success(data.message);
        fetchUsers();
      } else {
        throw new Error(data.message || `${confirmText}會員失敗`);
      }
    } catch (error) {
      showCartAlert.error(error.message);
    }
  };

  // 顯示會員詳情
  const handleViewUser = async (userId) => {
    try {
      await fetchUserDetail(userId);
      // 確保資料已經載入後才顯示對話框
      setTimeout(() => setShowDetailModal(true), 100);
    } catch (error) {
      showCartAlert.error(error.message || "無法顯示會員詳情");
    }
  };

  // 開始編輯會員
  const handleEditUser = async (userId) => {
    try {
      await fetchUserDetail(userId);
      setModalMode("edit");
      // 確保資料已經載入後才顯示對話框
      setTimeout(() => setShowModal(true), 100);
    } catch (error) {
      showCartAlert.error(error.message || "無法編輯會員資料");
    }
  };

  // 新增會員
  const handleAddUser = () => {
    setCurrentUser({
      id: null,
      name: "",
      email: "",
      password: "",
      phone: "",
      birthday: "",
      gender: "male",
      address: "",
      status: 1,
    });
    setModalMode("add");
    setShowModal(true);
  };

  // 儲存會員資料（新增或更新）
  const handleSaveUser = async () => {
    try {
      const method = modalMode === "add" ? "POST" : "PUT";

      // 基本驗證
      if (!currentUser.name) {
        throw new Error("請填寫姓名");
      }

      // 根據模式和登入類型判斷是否需要驗證電子郵件
      if (modalMode === "add" || currentUser.login_type === "email") {
        // 只有新增或一般登入模式才需要驗證電子郵件
        if (!currentUser.email) {
          throw new Error("請填寫電子郵件");
        }

        // 電子郵件格式驗證
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentUser.email)) {
          throw new Error("請輸入有效的電子郵件地址");
        }
      }

      // 只在新增會員且不是第三方登入時需要密碼
      if (modalMode === "add" && !currentUser.password) {
        throw new Error("請設定密碼");
      }

      // 電話號碼驗證 (如果有提供)
      if (currentUser.phone && !/^\d{10}$/.test(currentUser.phone)) {
        throw new Error("請輸入正確的手機號碼格式");
      }

      // 提交前處理空密碼：如果是編輯模式且密碼為空，從資料中移除密碼欄位
      let dataToSubmit = { ...currentUser };
      if (
        modalMode === "edit" &&
        (!dataToSubmit.password || dataToSubmit.password === "")
      ) {
        delete dataToSubmit.password;
      }

      // 對第三方登入用戶處理，確保不會因為顯示用的email導致問題
      if (
        modalMode === "edit" &&
        (currentUser.login_type === "line" ||
          currentUser.login_type === "google")
      ) {
        // 保留原始email，不提交顯示用的值
        // 因為表單中顯示的可能是 "LINE用戶(xxxxx)" 或 "Google用戶(ID:xxx)"
        // 這類型的值不應該更新到資料庫
        delete dataToSubmit.email;
      }

      // console.log("準備提交的資料:", dataToSubmit);

      const res = await fetch(`/api/member/admin/users`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      const data = await res.json();

      if (data.success) {
        showCartAlert.success(
          modalMode === "add" ? "會員新增成功" : "會員資料已更新"
        );
        setShowModal(false);
        fetchUsers();
      } else {
        throw new Error(data.message || "操作失敗");
      }
    } catch (error) {
      showCartAlert.error(error.message);
    }
  };

  // 格式化日期顯示 - 更健壯的處理
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return "-";
    }
  };

  // 性別中文顯示
  const translateGender = (gender) => {
    const map = {
      male: "男",
      female: "女",
      other: "其他",
    };
    return map[gender] || "其他";
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-3">會員管理</h1>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <Button
            variant="success"
            onClick={handleAddUser}
            className="mb-2 mb-md-0"
          >
            <FaPlus className="me-1" /> 新增會員
          </Button>
        </Col>
        <Col md={8}>
          <div className="d-flex flex-wrap justify-content-end gap-2">
            <Form.Check
              type="checkbox"
              id="hideStatusZero"
              label={`隱藏停用 ${statusZeroCount} 名會員`}
              checked={hideStatusZero}
              onChange={() => {
                setHideStatusZero(!hideStatusZero);
                setCurrentPage(1);
              }}
              className="me-3 d-flex align-items-center"
            />

            <Form onSubmit={handleSearch}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="搜尋會員名稱、Email、電話"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" variant="primary">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>

            <Form.Select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value);
                setCurrentPage(1);
              }}
              className="w-auto"
            >
              <option value="">--排序欄位--</option>
              <option value="id">編號</option>
              <option value="name">姓名</option>
              <option value="birthday">生日</option>
              <option value="created_at">建立時間</option>
            </Form.Select>

            <Form.Select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setCurrentPage(1);
              }}
              className="w-auto"
            >
              <option value="ASC">升序</option>
              <option value="DESC">降序</option>
            </Form.Select>
          </div>
        </Col>
      </Row>

      {/* 會員列表表格 */}
      <Row>
        <Col>
          <div className="card mb-4">
            <div className="card-body">
              {/* 添加div容器設定overflow屬性 */}
              <div style={tableStyles.tableContainer}>
                {/* 套用固定表格布局樣式 */}
                <Table hover className="align-middle" style={tableStyles.table}>
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleSort("id")}
                        style={{ ...tableStyles.thId, cursor: "pointer" }}
                      >
                        編號{" "}
                        {sortField === "id" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("email")}
                        style={{ ...tableStyles.thEmail, cursor: "pointer" }}
                      >
                        Email{" "}
                        {sortField === "email" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => handleSort("name")}
                        style={{ ...tableStyles.thName, cursor: "pointer" }}
                      >
                        姓名{" "}
                        {sortField === "name" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th style={tableStyles.thPhone}>電話</th>
                      <th
                        onClick={() => handleSort("birthday")}
                        style={{ ...tableStyles.thBirthday, cursor: "pointer" }}
                      >
                        生日{" "}
                        {sortField === "birthday" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th style={tableStyles.thGender}>性別</th>
                      <th style={tableStyles.thStatus}>狀態</th>
                      <th
                        onClick={() => handleSort("created_at")}
                        style={{ ...tableStyles.thDate, cursor: "pointer" }}
                      >
                        建立時間{" "}
                        {sortField === "created_at" &&
                          (sortOrder === "ASC" ? "↑" : "↓")}
                      </th>
                      <th className="text-center" style={tableStyles.thActions}>
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center">
                          無會員資料
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className="user-row"
                          onClick={() => handleViewUser(user.id)}
                        >
                          <td style={tableStyles.cell}>{user.id}</td>
                          <td style={tableStyles.cell}>{user.email}</td>
                          <td style={tableStyles.cell}>{user.name}</td>
                          <td style={tableStyles.cell}>{user.phone || "-"}</td>
                          <td style={tableStyles.cell}>
                            {formatDate(user.birthday)}
                          </td>
                          <td style={tableStyles.cell}>
                            {translateGender(user.gender)}
                          </td>
                          <td style={tableStyles.cell}>
                            <Badge
                              bg={user.status === 1 ? "success" : "danger"}
                            >
                              {user.status === 1 ? "啟用" : "停用"}
                            </Badge>
                          </td>
                          <td style={tableStyles.cell}>
                            {formatDate(user.created_at)}
                          </td>
                          <td style={tableStyles.cell} className="text-center">
                            <div
                              className="d-flex gap-2 justify-content-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditUser(user.id)}
                              >
                                <FaEdit /> 編輯
                              </Button>
                              <Button
                                variant={
                                  user.status === 1
                                    ? "outline-danger"
                                    : "outline-success"
                                }
                                size="sm"
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.status === 1 ? (
                                  <>
                                    <FaToggleOff /> 停用
                                  </>
                                ) : (
                                  <>
                                    <FaToggleOn /> 啟用
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>

          {/* 分頁 - 修復分頁標籤結構 */}
          {totalPages > 1 && (
            <Pagination className="justify-content-center">
              <Pagination.Prev
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              />

              {/* 顯示頁碼 */}
              {Array.from({ length: totalPages }, (_, i) => {
                // 只顯示當前頁附近的頁碼
                if (
                  i === 0 || // 第一頁
                  i === totalPages - 1 || // 最後一頁
                  (i >= currentPage - 2 && i <= currentPage + 2) // 當前頁附近
                ) {
                  return (
                    <Pagination.Item
                      key={`page-${i + 1}`} // 使用更唯一的 key 值
                      active={i + 1 === currentPage}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  );
                } else if (
                  (i === currentPage - 3 && i > 0) ||
                  (i === currentPage + 3 && i < totalPages - 1)
                ) {
                  // 顯示省略頁碼，使用唯一的 key
                  return <Pagination.Ellipsis key={`ellipsis-${i}`} />;
                }
                return null;
              })}

              <Pagination.Next
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          )}
        </Col>
      </Row>

      {/* 編輯/新增會員 Modal - 修復 Modal 標籤結構 */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === "add" ? "新增會員" : "編輯會員"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    姓名 <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={currentUser.name}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Email{" "}
                    {modalMode === "add" && (
                      <span className="text-danger">*</span>
                    )}
                  </Form.Label>
                  <Form.Control
                    type="text" // 改用 text 而不是 email，避免瀏覽器自動驗證
                    value={currentUser.email}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, email: e.target.value })
                    }
                    disabled={modalMode === "edit"}
                    required={modalMode === "add"}
                  />
                  {modalMode === "edit" &&
                    (currentUser.login_type === "line" ||
                      currentUser.login_type === "google") && (
                      <Form.Text className="text-muted">
                        第三方登入用戶的電子郵件地址無法修改
                      </Form.Text>
                    )}
                </Form.Group>
              </Col>
            </Row>

            {/* 根據條件顯示密碼欄位 - 只在新增用戶或編輯非第三方登入用戶時顯示 */}
            {(modalMode === "add" ||
              (modalMode === "edit" && currentUser.login_type === "email")) && (
              <Form.Group className="mb-3">
                <Form.Label>
                  密碼{" "}
                  {modalMode === "add" && (
                    <span className="text-danger">*</span>
                  )}
                </Form.Label>
                <Form.Control
                  type="password"
                  value={currentUser.password || ""}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, password: e.target.value })
                  }
                  placeholder={
                    modalMode === "edit"
                      ? "留空表示不更改密碼"
                      : "8個字以上英數混合"
                  }
                  required={modalMode === "add"}
                />
              </Form.Group>
            )}

            {/* 顯示第三方登入資訊 */}
            {modalMode === "edit" && currentUser.login_type !== "email" && (
              <div className="alert alert-info">
                此用戶使用{" "}
                {currentUser.login_type === "line" ? "LINE" : "Google"}{" "}
                登入，無需密碼管理。部分資訊可能無法編輯。
              </div>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>電話</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentUser.phone || ""}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, phone: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>性別</Form.Label>
                  <Form.Select
                    value={currentUser.gender || ""}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, gender: e.target.value })
                    }
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>生日</Form.Label>
                  <Form.Control
                    type="date"
                    value={
                      currentUser.birthday
                        ? currentUser.birthday.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setCurrentUser({
                        ...currentUser,
                        birthday: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>地址</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentUser.address || ""}
                    onChange={(e) =>
                      setCurrentUser({
                        ...currentUser,
                        address: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            {modalMode === "edit" && (
              <Form.Group className="mb-3">
                <Form.Label>狀態</Form.Label>
                <Form.Select
                  value={currentUser.status}
                  onChange={(e) =>
                    setCurrentUser({
                      ...currentUser,
                      status: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={1}>啟用</option>
                  <option value={0}>停用</option>
                </Form.Select>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSaveUser}>
            {modalMode === "add" ? "新增" : "更新"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 會員詳情 Modal - 增加資料防護 */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>會員詳細資料</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentUser ? (
            <>
              <p>
                <strong>編號:</strong> {currentUser.id}
              </p>
              <p>
                <strong>姓名:</strong> {currentUser.name || "-"}
              </p>
              <p>
                <strong>Email:</strong> {currentUser.email || "-"}
              </p>
              <p>
                <strong>電話:</strong> {currentUser.phone || "-"}
              </p>
              <p>
                <strong>性別:</strong> {translateGender(currentUser.gender)}
              </p>
              <p>
                <strong>生日:</strong> {formatDate(currentUser.birthday)}
              </p>
              <p>
                <strong>地址:</strong> {currentUser.address || "-"}
              </p>
              <p>
                <strong>會員狀態:</strong>{" "}
                {currentUser.status === 1 ? "啟用" : "停用"}
              </p>
              <p>
                <strong>登入類型:</strong> {currentUser.login_type || "email"}
              </p>
              <p>
                <strong>最後登入時間:</strong>{" "}
                {formatDate(currentUser.last_login)}
              </p>
              <p>
                <strong>建立時間:</strong> {formatDate(currentUser.created_at)}
              </p>
              <p>
                <strong>更新時間:</strong> {formatDate(currentUser.updated_at)}
              </p>
            </>
          ) : (
            <p className="text-center">載入中...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            關閉
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowDetailModal(false);
              if (currentUser && currentUser.id) {
                handleEditUser(currentUser.id);
              }
            }}
          >
            編輯
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
