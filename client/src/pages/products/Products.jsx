import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import LayoutApp from '../../components/Layout';
import { DeleteOutlined, EditOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Select, Table, message, Row, Col, Card } from 'antd';
import FormItem from 'antd/lib/form/FormItem';

const BASE_URL = process.env.REACT_APP_API_BASE_URL ;

const Products = () => {
  const dispatch = useDispatch();
  const [productData, setProductData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [editProduct, setEditProduct] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState({
    productNo: '',
    name: '',
    category: ''
  });

  const getAllProducts = async () => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get(`${BASE_URL}/products/getproducts`);
      setProductData(data);
      setFilteredData(data);
      dispatch({ type: 'HIDE_LOADING' });
    } catch (error) {
      dispatch({ type: 'HIDE_LOADING' });
      console.log(error);
    }
  };

  const getAllCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/categories`);
      setCategoryData(data);
    } catch (error) {
      console.log('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
    getAllCategories();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [filter, productData]);

  const handleFilter = () => {
    const filtered = productData.filter((product) => {
      return (
        product.productNo.toLowerCase().includes(filter.productNo.toLowerCase()) &&
        product.name.toLowerCase().includes(filter.name.toLowerCase()) &&
        (filter.category === '' || product.category === filter.category)
      );
    });
    setFilteredData(filtered);
  };

  const handlerDelete = async (record) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      await axios.post(`${BASE_URL}/products/deleteproducts`, {
        productId: record._id,
      });
      message.success('Product Deleted Successfully!');
      getAllProducts();
      setPopModal(false);
    } catch (error) {
      message.error('Error!');
      console.log(error);
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  const columns = [
    { title: 'Product No', dataIndex: 'productNo' },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Category', dataIndex: 'category' },
    { title: 'Cost', dataIndex: 'cost' },
    { title: 'Price', dataIndex: 'price' },
    {
      title: 'Action',
      dataIndex: '_id',
      render: (id, record) => (
        <div>
          <DeleteOutlined className="cart-action" onClick={() => handlerDelete(record)} />
          <EditOutlined
            className="cart-edit"
            onClick={() => {
              setEditProduct(record);
              setPopModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  const handlerSubmit = async (value) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });

      if (editProduct) {
        await axios.put(`${BASE_URL}/products/updateproducts`, {
          ...value,
          productId: editProduct._id,
        });
        message.success('Product Updated Successfully!');
      } else {
        await axios.post(`${BASE_URL}/products/addproducts`, value);
        message.success('Product Added Successfully!');
      }

      getAllProducts();
      setPopModal(false);
      setEditProduct(null);
    } catch (error) {
      console.error('API Error:', error);
      message.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  const handleResetFilters = () => {
    setFilter({
      productNo: '',
      name: '',
      category: ''
    });
  };


  return (
    <LayoutApp>
      <h2>All Products</h2>
      <Button className="add-new" onClick={() => setPopModal(true)}>
        Add New
      </Button>

      {/* Filter Section */}
      <Card
        
        style={{ marginBottom: 20 }}
        bordered={false}
      >
        <Row gutter={16} align="bottom" style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={6} md={6}>
            <label>Product No.</label>
            <Input
              placeholder="Filter by Product No"
              value={filter.productNo}
              onChange={(e) => setFilter({ ...filter, productNo: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={6} md={6}>
            <label>Product Name</label>
            <Input
              placeholder="Filter by Name"
              value={filter.name}
              onChange={(e) => setFilter({ ...filter, name: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={6} md={6}>
            <label>Category</label>
            <Select
              allowClear
              showSearch
              placeholder="Select Category"
              style={{ width: '100%' }}
              value={filter.category || undefined}
              onChange={(value) => setFilter({ ...filter, category: value || '' })}
              optionFilterProp="children"
              loading={loading}
            >
              {categoryData.map((category) => (
                <Select.Option key={category._id} value={category.categoryName}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={6}>
            <Button
              type="default"
              onClick={handleResetFilters}
              style={{ width: '50%', marginTop: 22 }}
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
      />

      {popModal && (
        <Modal
          title={editProduct ? 'Edit Product' : 'Add New Product'}
          visible={popModal}
          onCancel={() => {
            setEditProduct(null);
            setPopModal(false);
          }}
          footer={false}
          destroyOnClose
        >
          <Form layout="vertical" initialValues={editProduct || {}} onFinish={handlerSubmit}>
            <FormItem
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter product name' }]}
            >
              <Input />
            </FormItem>

            <FormItem
              name="productNo"
              label="Product Number"
              rules={[{ required: true, message: 'Please enter product number' }]}
            >
              <Input />
            </FormItem>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select category' }]}
            >
              <Select loading={loading}>
                {categoryData.map((category) => (
                  <Select.Option key={category._id} value={category.categoryName}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <FormItem
              name="price"
              label="Price"
              rules={[{ required: true, message: 'Please enter price' }]}
            >
              <Input type="number" />
            </FormItem>

            <div className="form-btn-add">
              <Button htmlType="submit" className="add-new">
                {editProduct ? 'Update' : 'Add'}
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </LayoutApp>
  );
};

export default Products;
