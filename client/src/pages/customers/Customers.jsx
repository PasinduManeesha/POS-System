import { Table, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Layout from '../../components/Layout';

const Customers = () => {
  const dispatch = useDispatch();

  // State for customer data, modal visibility, and editing a customer
  const [customerData, setCustomerData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  // Fetch all customers from the API
  const getAllCustomers = async () => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get('/api/customers/getcustomers');
      setCustomerData(data);
      dispatch({ type: 'HIDE_LOADING' });
      console.log(data);
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
    }
  };

  // Fetch customers when the component mounts
  useEffect(() => {
    getAllCustomers();
  }, []);

  // Delete a customer by ID
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
        <div>
          <DeleteOutlined
            className="cart-action"
            onClick={() => handlerDelete(record)}
          />
          <EditOutlined
            className="cart-edit"
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
      <Table dataSource={customerData} columns={columns} bordered />
    </Layout>
  );
};

export default Customers;