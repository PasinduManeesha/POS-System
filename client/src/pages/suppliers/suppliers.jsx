import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DeleteOutlined, EditOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, message, Card, Row, Col } from 'antd';
import Layout from '../../components/Layout';

const BASE_URL = process.env.REACT_APP_API_BASE_URL ;

const Suppliers = () => {
  const dispatch = useDispatch();

  // State variables
  const [supplierData, setSupplierData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [filter, setFilter] = useState({
    supplierName: '',
    supplierPhone: ''
  });

  // Fetch all suppliers from the API
  const getAllSuppliers = async () => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get(`${BASE_URL}/suppliers/getsuppliers`);
      setSupplierData(data);
      setFilteredData(data);
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
      message.error('Failed to fetch suppliers');
    }
  };

  // Apply filters whenever filter state or supplier data changes
  useEffect(() => {
    handleFilter();
  }, [filter, supplierData]);

  // Filter function
  const handleFilter = () => {
    const filtered = supplierData.filter((supplier) => {
      return (
        supplier.supplierName.toLowerCase().includes(filter.supplierName.toLowerCase()) &&
        supplier.supplierPhone.includes(filter.supplierPhone)
      );
    });
    setFilteredData(filtered);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilter({
      supplierName: '',
      supplierPhone: ''
    });
  };

  // Fetch suppliers when the component mounts
  useEffect(() => {
    getAllSuppliers();
  }, []);

  // Delete a supplier
  const handlerDelete = async (record) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      await axios.delete(`${BASE_URL}/suppliers/deletesupplier/${record._id}`);
      message.success('Supplier Deleted Successfully!');
      getAllSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      message.error('Failed to delete supplier. Please try again.');
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  // Handle form submission for adding or editing a supplier
  const handlerSubmit = async (values) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      if (editSupplier) {
        await axios.put(`${BASE_URL}/suppliers/updatesupplier/${editSupplier._id}`, values);
        message.success('Supplier Updated Successfully!');
      } else {
        await axios.post(`${BASE_URL}/suppliers/addsupplier`, values);
        message.success('Supplier Added Successfully!');
      }
      setPopModal(false);
      setEditSupplier(null);
      getAllSuppliers();
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
      title: 'Supplier Name',
      dataIndex: 'supplierName',
    },
    {
      title: 'Contact Number',
      dataIndex: 'supplierPhone',
    },
    {
      title: 'Supplier Address',
      dataIndex: 'supplierAddress',
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
              setEditSupplier(record);
              setPopModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <h2>All Suppliers</h2>
      <Button className="add-new" onClick={() => setPopModal(true)}>
        Add New Supplier
      </Button>

      {/* Filter Section */}
      <Card
        style={{ marginBottom: 20 }}
        bordered={false}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={10}>
            <label>Supplier Name</label>
              <Input
                placeholder="Filter by name"
                value={filter.supplierName}
                onChange={(e) => setFilter({ ...filter, supplierName: e.target.value })}
              />
          </Col>
          <Col xs={24} sm={12} md={10}>
            <label>Contact Number</label>
              <Input
                placeholder="Filter by phone"
                value={filter.supplierPhone}
                onChange={(e) => setFilter({ ...filter, supplierPhone: e.target.value })}
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
          title={editSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          visible={popModal}
          onCancel={() => {
            setEditSupplier(null);
            setPopModal(false);
          }}
          footer={null}
          destroyOnClose
        >
          <Form
            layout="vertical"
            initialValues={editSupplier || {}}
            onFinish={handlerSubmit}
          >
            <Form.Item
              name="supplierName"
              label="Supplier Name"
              rules={[{ required: true, message: 'Please enter supplier name' }]}
            >
              <Input placeholder="Enter supplier name" />
            </Form.Item>
            <Form.Item
              name="supplierPhone"
              label="Contact Number"
              rules={[{ required: true, message: 'Please enter contact number' }]}
            >
              <Input placeholder="Enter contact number" />
            </Form.Item>
            <Form.Item
              name="supplierAddress"
              label="Supplier Address"
              rules={[{ required: true, message: 'Please enter supplier address' }]}
            >
              <Input placeholder="Enter supplier address" />
            </Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button type="primary" htmlType="submit">
                {editSupplier ? 'Update' : 'Add'}
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </Layout>
  );
};

export default Suppliers;