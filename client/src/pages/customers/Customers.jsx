import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, message, Card, Row, Col } from 'antd';
import Layout from '../../components/Layout';

const BASE_URL = process.env.REACT_APP_API_BASE_URL ;

const Customers = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

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
      const { data } = await axios.get(`${BASE_URL}/customers/getcustomers`);
      
      // Debugging: Log the raw response
      console.log('API Response:', data);
  
      // Handle case where data might be nested in a response object
      const customersArray = data.customers || data.data || data;
      
      if (!Array.isArray(customersArray)) {
        throw new Error(`Expected array but got ${typeof customersArray}`);
      }
  
      const normalizedData = customersArray.map(customer => ({
        ...customer,
        customerPhone: customer.customerPhone || '',
        customerAddress: customer.customerAddress || ''
      }));
  
      setCustomerData(normalizedData);
      setFilteredData(normalizedData);
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.error("Customer fetch error:", error);
      message.error(error.message || 'Failed to fetch customers');
    }
  };

  // Apply filters
  useEffect(() => {
    handleFilter();
  }, [filter, customerData]);

  // Filter function (includes customers with missing phone numbers)
  const handleFilter = () => {
    const filtered = customerData.filter((customer) => {
      const nameMatch = customer.customerName.toLowerCase().includes(filter.customerName.toLowerCase());
      const phoneMatch = 
        filter.customerPhone === '' || 
        !customer.customerPhone || 
        customer.customerPhone.includes(filter.customerPhone);
      
      return nameMatch && phoneMatch;
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

  // Fetch customers on mount
  useEffect(() => {
    getAllCustomers();
  }, []);

  // Delete a customer
  const handlerDelete = async (record) => {
    if (record.customerName.toLowerCase() === 'cash') {
      message.error('Cannot delete the Cash customer');
      return;
    }

    try {
      dispatch({ type: 'SHOW_LOADING' });
      await axios.delete(`${BASE_URL}/customers/deletecustomer/${record._id}`);
      message.success('Customer Deleted Successfully!');
      getAllCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      message.error('Failed to delete customer. Please try again.');
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  // Handle form submission
  const handlerSubmit = async (values) => {
    try {
      // Special case: Only "Cash" can skip phone/address
      if (values.customerName.toLowerCase() !== "cash") {
        if (!values.customerPhone) {
          message.error("Contact number is required for non-Cash customers");
          return;
        }
        if (!values.customerAddress) {
          message.error("Address is required for non-Cash customers");
          return;
        }
      }

      // Prevent editing the Cash customer's name
      if (editCustomer && editCustomer.customerName.toLowerCase() === 'cash' && 
          values.customerName.toLowerCase() !== 'cash') {
        message.error('Cannot change the name of the Cash customer');
        return;
      }

      dispatch({ type: 'SHOW_LOADING' });
      
      if (editCustomer) {
        await axios.put(`${BASE_URL}/customers/updatecustomer/${editCustomer._id}`, values);
        message.success('Customer Updated Successfully!');
      } else {
        await axios.post(`${BASE_URL}/customers/addcustomer`, values);
        message.success('Customer Added Successfully!');
      }
      
      setPopModal(false);
      setEditCustomer(null);
      form.resetFields();
      getAllCustomers();
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log('Error:', error);
      
      if (error.response) {
        if (error.response.status === 409) {
          message.error('Customer with this phone number already exists');
        } else {
          message.error(error.response.data.message || 'Failed to save customer');
        }
      } else {
        message.error('Network error. Please check your connection.');
      }
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
    },
    {
      title: 'Contact Number',
      dataIndex: 'customerPhone',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Customer Address',
      dataIndex: 'customerAddress',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Action',
      dataIndex: '_id',
      render: (id, record) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          {record.customerName.toLowerCase() !== 'cash' && (
            <DeleteOutlined
              style={{ cursor: 'pointer', color: 'red' }}
              onClick={() => handlerDelete(record)}
            />
          )}
          <EditOutlined
            style={{ 
              cursor: record.customerName.toLowerCase() === 'cash' ? 'not-allowed' : 'pointer', 
              color: record.customerName.toLowerCase() === 'cash' ? '#ccc' : 'blue' 
            }}
            onClick={() => {
              if (record.customerName.toLowerCase() === 'cash') {
                message.info('Cash customer cannot be edited');
                return;
              }
              setEditCustomer(record);
              form.setFieldsValue(record);
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
      <Button className="add-new" onClick={() => {
        setEditCustomer(null);
        form.resetFields();
        setPopModal(true);
      }}>
        Add New Customer
      </Button>

      {/* Filter Section */}
      <Card style={{ marginBottom: 20 }} bordered={false}>
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

      {/* Add/Edit Customer Modal */}
      <Modal
        title={editCustomer ? 'Edit Customer' : 'Add New Customer'}
        visible={popModal}
        onCancel={() => {
          setEditCustomer(null);
          setPopModal(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editCustomer || {}}
          onFinish={handlerSubmit}
        >
          <Form.Item
            name="customerName"
            label="Customer Name"
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input 
              placeholder="Enter customer name" 
              disabled={editCustomer?.customerName?.toLowerCase() === 'cash'}
            />
          </Form.Item>

          <Form.Item
            name="customerPhone"
            label="Contact Number"
            rules={[
              {
                validator: (_, value) => {
                  const customerName = form.getFieldValue('customerName') || '';
                  if (customerName.toLowerCase() !== "cash" && !value) {
                    return Promise.reject('Contact number is required (except for Cash)');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder={form.getFieldValue('customerName')?.toLowerCase() === "cash" ? "Optional for Cash" : "Required"} />
          </Form.Item>

          <Form.Item
            name="customerAddress"
            label="Customer Address"
            rules={[
              {
                validator: (_, value) => {
                  const customerName = form.getFieldValue('customerName') || '';
                  if (customerName.toLowerCase() !== "cash" && !value) {
                    return Promise.reject('Address is required (except for Cash)');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder={form.getFieldValue('customerName')?.toLowerCase() === "cash" ? "Optional for Cash" : "Required"} />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">
              {editCustomer ? 'Update' : 'Add'}
            </Button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Customers;