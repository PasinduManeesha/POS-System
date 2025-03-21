import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, message } from 'antd';
import Layout from '../../components/Layout';

const Category = () => {
  const dispatch = useDispatch();

  // State variables
  const [categoryData, setCategoryData] = useState([]);
  const [popModal, setPopModal] = useState(false); // Modal visibility
  const [editCategory, setEditCategory] = useState(null);

  // Fetch all categories from the API
  const getAllCategory = async () => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get('/api/categories/');
      setCategoryData(data);
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
      message.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  // Delete a category
  const handlerDelete = async (record) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      await axios.delete(`/api/categories//${record._id}`);
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
        await axios.put(`/api/categories/${editCategory._id}`, values);
        message.success('Category updated successfully!');
      } else {
        await axios.post('/api/categories/', values);
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
    <h2>All Category</h2>
    <Button className='add-new' onClick={() => setPopModal(true)}>
      Add New Category
    </Button>
    <Table
      dataSource={categoryData}
      columns={columns}
      bordered
      rowKey="_id"
      style={{ marginTop: '20px' }}
    />

    {/* Fixed Modal Component */}
    <Modal
      title={editCategory ? 'Edit Category' : 'Add New Category'}
      visible={popModal}  // Changed from 'visible' to 'open'
      onCancel={() => {
        setEditCategory(null);
        setPopModal(false);
      }}
      footer={null}
      destroyOnClose  // Add this to reset form state
    >
      <Form
        layout="vertical"
        initialValues={editCategory || {}}
        onFinish={handlerSubmit}
        preserve={false}  // Ensure form resets
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