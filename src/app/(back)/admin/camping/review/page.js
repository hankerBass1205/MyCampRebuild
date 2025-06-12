"use client";
import { useState, useEffect } from "react";
import { Table, Tag, Select, Button, Modal, App, Space } from "antd";
import Image from "next/image";
import axios from "axios";
import { format } from "date-fns";

const CampReviewContent = () => {
  const { message, modal } = App.useApp();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // 載入資料
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/camps");
      setApplications(response.data);
    } catch (error) {
      message.error("載入資料失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // 狀態對應
  const statusMap = {
    0: { text: "審核中", color: "processing" },
    1: { text: "已通過", color: "success" },
    2: { text: "已退回", color: "error" },
  };

  // 營運狀態對應
  const operationStatusMap = {
    0: { text: "下架中", color: "default" },
    1: { text: "營業中", color: "success" },
    2: { text: "維護中", color: "warning" },
    3: { text: "暫停營業", color: "error" },
  };

  // 更新申請狀態
  const handleStatusChange = async (record, newStatus) => {
    try {
      if (newStatus === 2) {
        modal.confirm({
          title: "退回申請",
          content: (
            <div>
              <p>請輸入退回原因：</p>
              <textarea
                id="rejectReason"
                className="w-full p-2 border rounded"
                rows="4"
              />
            </div>
          ),
          onOk: async () => {
            const reason = document.getElementById("rejectReason").value;
            if (!reason) {
              message.error("請輸入退回原因");
              return;
            }
            await updateStatus(record.application_id, newStatus, reason);
          },
        });
      } else {
        await updateStatus(record.application_id, newStatus);
      }
    } catch (error) {
      message.error("更新狀態失敗");
    }
  };

  // 更新營運狀態
  const handleOperationStatusChange = async (record, newStatus) => {
    try {
      await axios.patch(`/api/admin/camps/${record.application_id}`, {
        operation_status: newStatus,
      });
      message.success("更新成功");
      fetchApplications();
    } catch (error) {
      message.error("更新失敗");
    }
  };

  // 更新狀態的 API 調用
  const updateStatus = async (id, status, reason = "") => {
    try {
      await axios.patch(`/api/admin/camps/${id}`, {
        status,
        status_reason: reason,
      });
      message.success("更新成功");
      fetchApplications();
    } catch (error) {
      message.error("更新失敗");
    }
  };

  // 查看詳情
  const showDetails = (record) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const columns = [
    {
      title: "營地圖片",
      dataIndex: "image_url",
      width: 120,
      render: (url) => (
        <div className="relative w-20 h-20">
          <Image
            src={url || "/images/camps/default/default.jpg"}
            alt="營地圖片"
            fill
            className="object-cover rounded"
          />
        </div>
      ),
    },
    {
      title: "營地名稱",
      dataIndex: "name",
      width: 200,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.address}</div>
        </div>
      ),
    },
    {
      title: "營主資訊",
      width: 150,
      render: (_, record) => (
        <div>
          <div>ID: {record.owner_id}</div>
          <div>{record.owner_name}</div>
        </div>
      ),
    },
    {
      title: "申請狀態",
      dataIndex: "status",
      width: 150,
      render: (status, record) => (
        <Space>
          <Tag color={statusMap[status].color}>
            {statusMap[status].text}
          </Tag>
          <Select
            value={status}
            style={{ width: 100 }}
            onChange={(value) => handleStatusChange(record, value)}
          >
            <Select.Option value={0}>審核中</Select.Option>
            <Select.Option value={1}>通過</Select.Option>
            <Select.Option value={2}>退回</Select.Option>
          </Select>
        </Space>
      ),
    },
    {
      title: "營運狀態",
      dataIndex: "operation_status",
      width: 150,
      render: (status, record) => (
        <Space>
          <Tag color={operationStatusMap[status].color}>
            {operationStatusMap[status].text}
          </Tag>
          <Select
            value={status}
            style={{ width: 100 }}
            onChange={(value) => handleOperationStatusChange(record, value)}
          >
            <Select.Option value={0}>下架中</Select.Option>
            <Select.Option value={1}>營業中</Select.Option>
            <Select.Option value={2}>維護中</Select.Option>
            <Select.Option value={3}>暫停營業</Select.Option>
          </Select>
        </Space>
      ),
    },
    {
      title: "申請時間",
      dataIndex: "created_at",
      width: 150,
      render: (date) => format(new Date(date), "yyyy/MM/dd HH:mm"),
    },
    {
      title: "操作",
      width: 100,
      render: (_, record) => (
        <Button type="primary" onClick={() => showDetails(record)}>
          查看詳情
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">營地申請審核</h1>
        <Select
          value={selectedStatus}
          onChange={setSelectedStatus}
          style={{ width: 200 }}
        >
          <Select.Option value="all">全部狀態</Select.Option>
          <Select.Option value="0">審核中</Select.Option>
          <Select.Option value="1">已通過</Select.Option>
          <Select.Option value="2">已退回</Select.Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={applications.filter((app) =>
          selectedStatus === "all" ? true : app.status.toString() === selectedStatus
        )}
        loading={loading}
        rowKey="application_id"
        scroll={{ x: 1200 }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 筆`,
        }}
      />

      <Modal
        title="營地詳細資訊"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">基本資訊</h3>
                <p>營地名稱：{selectedRecord.name}</p>
                <p>營主名稱：{selectedRecord.owner_name}</p>
                <p>地址：{selectedRecord.address}</p>
              </div>
              <div className="relative h-40">
                <Image
                  src={selectedRecord.image_url || "/images/camps/default/default.jpg"}
                  alt={selectedRecord.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">營地描述</h3>
              <p className="text-gray-600">{selectedRecord.description}</p>
            </div>
            {selectedRecord.rules && (
              <div>
                <h3 className="font-medium mb-2">營地規則</h3>
                <p className="text-gray-600">{selectedRecord.rules}</p>
              </div>
            )}
            {selectedRecord.notice && (
              <div>
                <h3 className="font-medium mb-2">注意事項</h3>
                <p className="text-gray-600">{selectedRecord.notice}</p>
              </div>
            )}
            {selectedRecord.status_reason && (
              <div>
                <h3 className="font-medium mb-2">狀態說明</h3>
                <p className="text-gray-600">{selectedRecord.status_reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default function CampReviewPage() {
  return (
    <App>
      <CampReviewContent />
    </App>
  );
} 