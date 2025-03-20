import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, message } from 'antd';
import Layout from '../../components/Layout'; // Adjust the path as per your project structure

const Customers = () => {
  const dispatch = useDispatch();

  // State variables
  const [customerData, setCustomerData] = useState([]); // List of customers
  const [popModal, setPopModal] = useState(false); // Modal visibility
  const [editCustomer, setEditCustomer] = useState(null); // Customer being edited

  // Fetch all customers from the API
  const getAllCustomers = async () => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get('/api/customers/getcustomers');
      setCustomerData(data);
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
      message.error('Failed to fetch customers');
    }
  };

  // Fetch customers when the component mounts
  useEffect(() => {
    getAllCustomers();
  }, []);

  // Delete a customer
  const handlerDelete = async (record) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      await axios.post('/api/customers/deletecustomer', { customerId: record._id });
      message.success('Customer Deleted Successfully!');
      getAllCustomers(); // Refresh the customer list
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
      message.error('Something went wrong');
    }
  };

  // Handle form submission for adding or editing a customer
  const handlerSubmit = async (values) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      if (editCustomer) {
        // Update existing customer
        await axios.put(`/api/customers/updatecustomer/${editCustomer._id}`, values);
        message.success('Customer Updated Successfully!');
      } else {
        // Add new customer
        await axios.post('/api/customers/addcustomer', values);
        message.success('Customer Added Successfully!');
      }
      setPopModal(false); // Close the modal
      setEditCustomer(null); // Clear the edit state
      getAllCustomers(); // Refresh the customer list
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
      message.error('Something went wrong');
    }
  };

  // Define table columns
  const columns = [
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
    },
    {
      title: 'Contact Number',
      dataIndex: 'customerPhone',
    },
    {
      title: 'Customer Address',
      dataIndex: 'customerAddress',
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
              setEditCustomer(record);
              setPopModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <h2>All Customers</h2>
      <Button className='add-new' onClick={() => setPopModal(true)}>
        Add New Customer
      </Button>
      <Table
        dataSource={customerData}
        columns={columns}
        bordered
        rowKey="_id"
        style={{ marginTop: '20px' }}
      />

      {popModal && (
        <Modal
          title={editCustomer ? 'Edit Customer' : 'Add New Customer'}
          visible={popModal}
          onCancel={() => {
            setEditCustomer(null);
            setPopModal(false);
          }}
          footer={null}
        >
          <Form
            layout="vertical"
            initialValues={editCustomer || {}}
            onFinish={handlerSubmit}
          >
            <Form.Item
              name="customerName"
              label="Customer Name"
              rules={[{ required: true, message: 'Please enter customer name' }]}
            >
              <Input placeholder="Enter customer name" />
            </Form.Item>
            <Form.Item
              name="customerPhone"
              label="Contact Number"
              rules={[{ required: true, message: 'Please enter contact number' }]}
            >
              <Input placeholder="Enter contact number" />
            </Form.Item>
            <Form.Item
              name="customerAddress"
              label="Customer Address"
              rules={[{ required: true, message: 'Please enter customer address' }]}
            >
              <Input placeholder="Enter customer address" />
            </Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button type="primary" htmlType="submit">
                {editCustomer ? 'Update' : 'Add'}
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </Layout>
  );
};

export default Customers;