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

  // Fetch inventory
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

    // Listen for stock updates (polling every 5 seconds)
    const interval = setInterval(() => {
      getAllInventory();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle stock adjustment
  const handleAdjustStock = async (values) => {
    try {
      dispatch({ type: "SHOW_LOADING" });

      // Ensure the stock adjustment is valid
      const adjustmentAmount = values.adjustment;
      if (adjustmentAmount === 0) {
        message.error("Adjustment amount cannot be zero");
        return;
      }

      if (selectedProduct.stockQuantity + adjustmentAmount < 0) {
        message.error("Stock cannot go below zero.");
        return;
      }

      await axios.post('/api/inventory/adjust-stock', {
        productId: selectedProduct._id,
        adjustment: adjustmentAmount
      });

      message.success("Stock adjusted successfully!");
      getAllInventory(); // Refresh inventory list after update
      setPopModal(false); // Close the modal
    } catch (error) {
      // Handle any error that may occur during the API call
      message.error(error.response?.data?.message || error.message);
    } finally {
      dispatch({ type: "HIDE_LOADING" });
    }
  };

  // Columns for the inventory table
  const columns = [
    { title: "Product Name", dataIndex: "name" },
    { title: "Category", dataIndex: "category" },
    { title: "Current Stock", dataIndex: "stockQuantity" },
    {
      title: "Action",
      dataIndex: "_id",
      render: (id, record) => (
        <EditOutlined
          onClick={() => {
            setSelectedProduct(record); // Set selected product
            setPopModal(true); // Show the modal
          }}
        />
      ),
    },
  ];

  return (
    <LayoutApp>
      <h2>Inventory Management</h2>
      <Table dataSource={inventoryData} columns={columns} bordered rowKey="_id" />

      {/* Modal for adjusting stock */}
      <Modal
        title={`Adjust Stock - ${selectedProduct?.name}`}
        visible={popModal}
        onCancel={() => {
          setSelectedProduct(null); // Reset selected product
          setPopModal(false); // Close the modal
        }}
        footer={null}
      >
        <Form
          layout="vertical"
          initialValues={{
            currentStock: selectedProduct?.stockQuantity || 0,
            adjustment: 0,
          }}
          onFinish={handleAdjustStock}
        >
          <Form.Item label="Current Stock" name="currentStock">
            <Input disabled value={selectedProduct?.stockQuantity} />
          </Form.Item>

          <Form.Item
            label="Adjustment Amount"
            name="adjustment"
            rules={[{ required: true, message: 'Please enter adjustment amount' }]}
          >
            <Input
              type="number"
              placeholder="Positive to add, negative to deduct"
            />
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
