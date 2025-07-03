import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, message, Card, Row, Col } from 'antd';
import Layout from '../../components/Layout';

const BASE_URL = process.env.REACT_APP_API_BASE_URL ;

const Category = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // State variables
  const [categoryData, setCategoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [filter, setFilter] = useState({
    categoryName: ''
  });

  // Fetch all categories
  const getAllCategories = async () => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get(`${BASE_URL}/categories/`);
      setCategoryData(data);
      setFilteredData(data);
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.error(error);
      message.error('Failed to fetch categories');
    }
  };

  // Apply filters
  useEffect(() => {
    const filtered = categoryData.filter(category => 
      category.categoryName.toLowerCase().includes(filter.categoryName.toLowerCase())
    );
    setFilteredData(filtered);
  }, [filter, categoryData]);

  // Initial data fetch
  useEffect(() => {
    getAllCategories();
  }, []);

  // Handle modal open for adding new category
  const showAddModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle modal open for editing
  const showEditModal = (record) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  // Handle modal close
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      
      if (editingCategory) {
        await axios.put(
          `${BASE_URL}/categories/${editingCategory._id}`,
          values
        );
        message.success('Category updated successfully!');
      } else {
        await axios.post(
          `${BASE_URL}/categories/`,
          values
        );
        message.success('Category added successfully!');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      getAllCategories();
    } catch (error) {
      console.error(error);
      message.error('Operation failed');
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  // Handle category deletion
  const handleDelete = async (record) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      await axios.delete(
        `${BASE_URL}/categories/${record._id}`
      );
      message.success('Category deleted successfully!');
      getAllCategories();
    } catch (error) {
      console.error(error);
      message.error('Failed to delete category');
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilter({ categoryName: '' });
  };

  // Table columns
  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'categoryName',
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (id, record) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <DeleteOutlined
            style={{ color: 'red', cursor: 'pointer' }}
            onClick={() => handleDelete(record)}
          />
          <EditOutlined
            style={{ color: 'blue', cursor: 'pointer' }}
            onClick={() => showEditModal(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <h2>All Categories</h2>
      
      <Button  className="add-new" onClick={showAddModal} style={{ marginBottom: 16 }}>
        Add New Category
      </Button>

      {/* Filter Section */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={18} md={10}>
            <Form.Item label="Filter by Category Name">
              <Input
                placeholder="Enter category name"
                value={filter.categoryName}
                onChange={(e) => setFilter({ ...filter, categoryName: e.target.value })}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Button onClick={resetFilters} block>
              Reset Filters
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="_id"
        loading={loading}
        bordered
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="categoryName"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingCategory ? 'Update' : 'Add'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Category;