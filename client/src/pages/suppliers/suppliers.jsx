import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, message } from 'antd';
import Layout from '../../components/Layout'; // Adjust the path as per your project structure

const Suppliers = () => {
  const dispatch = useDispatch();

  // State variables
  const [supplierData, setSupplierData] = useState([]); // List of suppliers
  const [popModal, setPopModal] = useState(false); // Modal visibility
  const [editSupplier, setEditSupplier] = useState(null); // Supplier being edited

  // Fetch all suppliers from the API
  const getAllSuppliers = async () => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get('/api/suppliers/getsuppliers');
      setSupplierData(data);
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
      message.error('Failed to fetch suppliers');
    }
  };

  // Fetch suppliers when the component mounts
  useEffect(() => {
    getAllSuppliers();
  }, []);

  // Delete a supplier
  const handlerDelete = async (record) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      await axios.delete(`/api/suppliers/deletesupplier/${record._id}`);
      message.success('Supplier Deleted Successfully!');
      getAllSuppliers(); // Refresh the supplier list
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
        // Update existing supplier
        await axios.put(`/api/suppliers/updatesupplier/${editSupplier._id}`, values);
        message.success('Supplier Updated Successfully!');
      } else {
        // Add new supplier
        await axios.post('/api/suppliers/addsupplier', values);
        message.success('Supplier Added Successfully!');
      }
      setPopModal(false); // Close the modal
      setEditSupplier(null); // Clear the edit state
      getAllSuppliers(); // Refresh the supplier list
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
      <Button className='add-new' onClick={() => setPopModal(true)}>
        Add New Supplier
      </Button>
      <Table
        dataSource={supplierData}
        columns={columns}
        bordered
        rowKey="_id"
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