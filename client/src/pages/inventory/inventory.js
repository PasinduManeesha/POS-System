import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import LayoutApp from '../../components/Layout';
import { EditOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Table, message } from 'antd';

const Inventory = () => {
  const dispatch = useDispatch();
  const [inventoryData, setInventoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    productName: '',
    category: ''
  });

  const getAllInventory = async () => {
    try {
      dispatch({ type: "SHOW_LOADING" });
      const { data } = await axios.get('https://senuri-auto-server.onrender.com/api/products/getproducts');
      setInventoryData(data);
      setFilteredData(data);

      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      setCategories(uniqueCategories);

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

  // Apply filters whenever filters or inventoryData changes
  useEffect(() => {
    const filtered = inventoryData.filter(item => {
      const matchesName = item.name.toLowerCase().includes(filters.productName.toLowerCase());
      const matchesCategory = !filters.category || item.category === filters.category;
      return matchesName && matchesCategory;
    });
    setFilteredData(filtered);
  }, [filters, inventoryData]);

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

      await axios.post('https://senuri-auto-server.onrender.com/api/inventory/adjust-stock', {
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      productName: '',
      category: ''
    });
  };

  const columns = [
    { title: "Product Name", dataIndex: "name" },
    { title: "Category", dataIndex: "category" },
    {
      title: "Cost",
      dataIndex: "cost",
      render: cost => `$${parseFloat(cost).toFixed(2)}`
    },
    { title: "Current Stock", dataIndex: "stockQuantity" },
    {
      title: "Action",
      dataIndex: "_id",
      render: (id, record) => (
        <EditOutlined
          style={{ color: '#1890ff', cursor: 'pointer' }}
          onClick={() => openModal(record)}
        />
      ),
    },
  ];

  return (
    <LayoutApp>
      <h2>Inventory Management</h2>

      {/* Filter Section */}
      <Card
        title={
          <span>
            <FilterOutlined style={{ marginRight: 8 }} />
            Filter Inventory
          </span>
        }
        style={{ marginBottom: 20 }}
        bordered={false}
      >
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label>Product Name</label>
            <Input
              placeholder="Search by product name"
              value={filters.productName}
              onChange={e => handleFilterChange('productName', e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <label>Category</label>
            <Select
              style={{ width: '100%' }}
              placeholder="Select category"
              value={filters.category || undefined}
              onChange={value => handleFilterChange('category', value)}
              allowClear
              showSearch
            >
              {categories.map(category => (
                <Select.Option key={category} value={category}>
                  {category}
                </Select.Option>
              ))}
            </Select>
          </div>

          <Button
            type="default"
            onClick={resetFilters}
            style={{ marginTop: 20 }}
          >
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* Inventory Table */}
      <Table
        dataSource={filteredData}
        columns={columns}
        bordered
        rowKey="_id"
      />

      {/* Stock Adjustment Modal */}
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