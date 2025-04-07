import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DeleteOutlined, EditOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, message, Card, Row, Col } from 'antd';
import Layout from '../../components/Layout';

const Category = () => {
  const dispatch = useDispatch();

  // State variables
  const [categoryData, setCategoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [filter, setFilter] = useState({
    categoryName: ''
  });

  // Fetch all categories from the API
  const getAllCategory = async () => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get('https://senuri-auto-server.onrender.com/api/categories/');
      setCategoryData(data);
      setFilteredData(data);
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
      message.error('Failed to fetch categories');
    }
  };

  // Apply filters whenever filter state or category data changes
  useEffect(() => {
    handleFilter();
  }, [filter, categoryData]);

  // Filter function
  const handleFilter = () => {
    const filtered = categoryData.filter((category) => {
      return (
        category.categoryName.toLowerCase().includes(filter.categoryName.toLowerCase())
      );
    });
    setFilteredData(filtered);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilter({
      categoryName: ''
    });
  };

  // Fetch categories when the component mounts
  useEffect(() => {
    getAllCategory();
  }, []);

  // Delete a category
  const handlerDelete = async (record) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      await axios.delete(`https://senuri-auto-server.onrender.com/api/categories/${record._id}`);
      message.success('Category deleted successfully!');
      getAllCategory();
    } catch (error) {
      console.error('Error deleting category:', error);
      message.error('Failed to delete category');
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  // Handle form submission
  const handlerSubmit = async (values) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      if (editCategory) {
        await axios.put(`https://senuri-auto-server.onrender.com/api/categories/${editCategory._id}`, values);
        message.success('Category updated successfully!');
      } else {
        await axios.post('https://senuri-auto-server.onrender.com/api/categories/', values);
        message.success('Category added successfully!');
      }
      setPopModal(false);
      setEditCategory(null);
      getAllCategory();
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
      message.error('Operation failed');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'categoryName',
    },
    {
      title: 'Action',
      dataIndex: '_id',
      render: (id, record) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <DeleteOutlined
            style={{ cursor: 'pointer', color: 'red' }}
            onClick={() => handlerDelete(record)}
          />
          <EditOutlined
            style={{ cursor: 'pointer', color: 'blue' }}
            onClick={() => {
              setEditCategory(record);
              setPopModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <h2>All Categories</h2>

      {/* Filter Section */}
      <Card
        title={
          <span>
            <FilterOutlined style={{ marginRight: 8 }} />
            Filter Categories
          </span>
        }
        style={{ marginBottom: 20 }}
        bordered={false}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={18} md={10}>
            <label>Category Name</label>
              <Input
                placeholder="Filter by category name"
                value={filter.categoryName}
                onChange={(e) => setFilter({ ...filter, categoryName: e.target.value })}
              />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Button
              type="default"
              onClick={handleResetFilters}
              style={{ marginTop: 20 }}
              block
            >
              Reset Filters
            </Button>
          </Col>
        </Row>
      </Card>

      <Button className="add-new" onClick={() => setPopModal(true)}>
        Add New Category
      </Button>

      <Table
        dataSource={filteredData}
        columns={columns}
        bordered
        rowKey="_id"
        loading={loading}
        style={{ marginTop: '20px' }}
      />

      <Modal
        title={editCategory ? 'Edit Category' : 'Add New Category'}
        open={popModal}
        onCancel={() => {
          setEditCategory(null);
          setPopModal(false);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          initialValues={editCategory || {}}
          onFinish={handlerSubmit}
          preserve={false}
        >
          <Form.Item
            name="categoryName"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">
              {editCategory ? 'Update' : 'Add'}
            </Button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Category;