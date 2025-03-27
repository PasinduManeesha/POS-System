import axios from 'axios';
import React, {useEffect, useState} from 'react'
import { useDispatch } from 'react-redux';
import LayoutApp from '../../components/Layout'
import {  EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal,  Table, message } from 'antd';

const Inventory = () => {
  const dispatch = useDispatch();
  const [inventoryData, setInventoryData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch all products
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
  }, []);

  // Handle stock adjustment
  const handleAdjustStock = async (values) => {
    try {
      dispatch({ type: "SHOW_LOADING" });
      
      await axios.post('/api/inventory/adjust-stock', {
        productId: selectedProduct._id,
        adjustment: values.adjustment
      });

      message.success("Stock adjusted successfully!");
      getAllInventory();
      setPopModal(false);
    } catch (error) {
      message.error(error.response?.data?.message || error.message);
    } finally {
      dispatch({ type: "HIDE_LOADING" });
    }
  };

  const columns = [
    {
      title: "Product Name",
      dataIndex: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
    },
    {
      title: "Current Stock",
      dataIndex: "stockQuantity",
    },
    {
      title: "Action",
      dataIndex: "_id",
      render: (id, record) => (
        <EditOutlined 
          onClick={() => {
            setSelectedProduct(record);
            setPopModal(true);
          }} 
        />
      )
    }
  ];

  return (
    <LayoutApp>
      <h2>Inventory Management</h2>
      <Table 
        dataSource={inventoryData} 
        columns={columns} 
        bordered 
        rowKey="_id" 
      />

      <Modal
        title={`Adjust Stock - ${selectedProduct?.name}`}
        visible={popModal}
        onCancel={() => {
          setSelectedProduct(null);
          setPopModal(false);
        }}
        footer={null}
      >
        <Form
          layout="vertical"
          initialValues={{
            currentStock: selectedProduct?.quantity,
            adjustment: 0
          }}
          onFinish={handleAdjustStock}
        >
          <Form.Item label="Current Stock" name="currentStock">
            <Input disabled />
          </Form.Item>

          <Form.Item 
            label="Adjustment Amount"
            name="adjustment"
            rules={[{ 
              required: true, 
              message: 'Please enter adjustment amount' 
            }]}
          >
            <Input 
              type="number" 
              placeholder="Positive number to add, negative to deduct" 
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