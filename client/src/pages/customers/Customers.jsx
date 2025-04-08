import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DeleteOutlined, EditOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, message, Card, Row, Col } from 'antd';
import Layout from '../../components/Layout';

const Customers = () => {
  const dispatch = useDispatch();

  // State variables
  const [customerData, setCustomerData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [filter, setFilter] = useState({
    customerName: '',
    customerPhone: ''
  });

  // Fetch all customers from the API
  const getAllCustomers = async () => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get('https://senuri-auto-server.onrender.com/api/customers/getcustomers');
      setCustomerData(data);
      setFilteredData(data);
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
      message.error('Failed to fetch customers');
    }
  };

  // Apply filters whenever filter state or customer data changes
  useEffect(() => {
    handleFilter();
  }, [filter, customerData]);

  // Filter function
  const handleFilter = () => {
    const filtered = customerData.filter((customer) => {
      return (
        customer.customerName.toLowerCase().includes(filter.customerName.toLowerCase()) &&
        customer.customerPhone.includes(filter.customerPhone)
      );
    });
    setFilteredData(filtered);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilter({
      customerName: '',
      customerPhone: ''
    });
  };

  // Fetch customers when the component mounts
  useEffect(() => {
    getAllCustomers();
  }, []);

  // Delete a customer
  const handlerDelete = async (record) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      await axios.delete(`https://senuri-auto-server.onrender.com/api/customers/deletecustomer/${record._id}`);
      message.success('Customer Deleted Successfully!');
      getAllCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      message.error('Failed to delete customer. Please try again.');
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  // Handle form submission for adding or editing a customer
  const handlerSubmit = async (values) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      if (editCustomer) {
        await axios.put(`https://senuri-auto-server.onrender.com/api/customers/updatecustomer/${editCustomer._id}`, values);
        message.success('Customer Updated Successfully!');
      } else {
        await axios.post('https://senuri-auto-server.onrender.com/api/customers/addcustomer', values);
        message.success('Customer Added Successfully!');
      }
      setPopModal(false);
      setEditCustomer(null);
      getAllCustomers();
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
      <Button className="add-new" onClick={() => setPopModal(true)}>
        Add New Customer
      </Button>

      {/* Filter Section */}
      <Card
        title={
          <span>
            <FilterOutlined style={{ marginRight: 8 }} />
            Filter Customers
          </span>
        }
        style={{ marginBottom: 20 }}
        bordered={false}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={10}>
           
            <label>Customer Name</label>
              <Input
                placeholder="Filter by name"
                value={filter.customerName}
                onChange={(e) => setFilter({ ...filter, customerName: e.target.value })}
              />
            
          </Col>
          <Col xs={24} sm={12} md={10}>
            <label>Contact Number</label>
              <Input
                placeholder="Filter by phone"
                value={filter.customerPhone}
                onChange={(e) => setFilter({ ...filter, customerPhone: e.target.value })}
              />
          </Col>
          <Col xs={24} sm={24} md={4}>
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

      

      <Table
        dataSource={filteredData}
        columns={columns}
        bordered
        rowKey="_id"
        loading={loading}
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
          destroyOnClose
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