import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import LayoutApp from '../../components/Layout';
import { EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, message } from 'antd';

const Inventory = () => {
  const dispatch = useDispatch();
  const [inventoryData, setInventoryData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form] = Form.useForm();

  const getAllInventory = async () => {
    try {
      dispatch({ type: "SHOW_LOADING" });
      const { data } = await axios.get('/api/products/getproducts');
      setInventoryData(data);
      dispatch({ type: "HIDE_LOADING" });
    } catch (error) {
      dispatch({ type: "HIDE_LOADING" });
      message.error("Failed to fetch inventory");
    }
  };

  useEffect(() => {
    getAllInventory();
    const interval = setInterval(() => {
      getAllInventory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const openModal = (product) => {
    setSelectedProduct(product);
    setPopModal(true);
    setTimeout(() => {
      form.setFieldsValue({
        currentStock: product.stockQuantity,
        adjustment: 0,
        addedCost: 0,
      });
    }, 100);
  };

  const handleAdjustStock = async (values) => {
    try {
      dispatch({ type: "SHOW_LOADING" });

      const adjustment = Number(values.adjustment);
      const addedCost = Number(values.addedCost);
      const preCost = Number(selectedProduct.cost);
      const preQty = Number(selectedProduct.stockQuantity);

      if (adjustment === 0) {
        message.error("Adjustment amount cannot be zero");
        return;
      }

      if (preQty + adjustment < 0) {
        message.error("Stock cannot go below zero.");
        return;
      }

      let finalCost = preCost;

      if (adjustment > 0 && addedCost >= 0) {
        finalCost = ((preCost * preQty) + (addedCost * adjustment)) / (preQty + adjustment);
        finalCost = parseFloat(finalCost.toFixed(2));
      }

      // ✅ Send updated cost to backend
      await axios.post('/api/inventory/adjust-stock', {
        productId: selectedProduct._id,
        adjustment: adjustment,
        cost: finalCost,
      });

      message.success("Stock and cost updated successfully!");
      getAllInventory();
      setPopModal(false);
      setSelectedProduct(null);
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || error.message);
    } finally {
      dispatch({ type: "HIDE_LOADING" });
    }
  };

  const columns = [
    { title: "Product Name", dataIndex: "name" },
    { title: "Category", dataIndex: "category" },
    { title: "Cost", dataIndex: "cost" },
    { title: "Current Stock", dataIndex: "stockQuantity" },
    {
      title: "Action",
      dataIndex: "_id",
      render: (id, record) => (
        <EditOutlined onClick={() => openModal(record)} />
      ),
    },
  ];

  return (
    <LayoutApp>
      <h2>Inventory Management</h2>
      <Table dataSource={inventoryData} columns={columns} bordered rowKey="_id" />

      <Modal
        title={`Adjust Stock - ${selectedProduct?.name}`}
        visible={popModal}
        onCancel={() => {
          setPopModal(false);
          setSelectedProduct(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAdjustStock}>
          <Form.Item label="Current Stock">
            <Input disabled value={selectedProduct?.stockQuantity} />
          </Form.Item>

          <Form.Item
            label="Adjustment Amount"
            name="adjustment"
            rules={[{ required: true, message: 'Please enter adjustment amount' }]}
          >
            <Input type="number" placeholder="Positive to add, negative to deduct" />
          </Form.Item>

          <Form.Item
            label="Cost for Added Stock"
            name="addedCost"
            rules={[{ required: true, message: 'Please enter cost' }]}
          >
            <Input type="number" step="0.01" placeholder="Only used when adding stock" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Adjust Stock
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </LayoutApp>
  );
};

export default Inventory;
