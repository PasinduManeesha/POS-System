import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import LayoutApp from '../../components/Layout';
import { DeleteOutlined, EditOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Table, message, Row, Col } from 'antd';

const Products = () => {
  const dispatch = useDispatch();
  const [productData, setProductData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchProductNo, setSearchProductNo] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState('');

  const getAllProducts = async () => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get('https://senuri-auto-server.onrender.com/api/products/getproducts');
      setProductData(data);
      setFilteredData(data);
    } catch (error) {
      console.error(error);
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  const getAllCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('https://senuri-auto-server.onrender.com/api/categories');
      setCategoryData(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
    getAllCategories();
  }, []);

  useEffect(() => {
    let filtered = [...productData];

    if (searchProductNo) {
      filtered = filtered.filter(item =>
        item.productNo?.toLowerCase().includes(searchProductNo.toLowerCase())
      );
    }

    if (searchName) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchCategory) {
      filtered = filtered.filter(item =>
        item.category?.toLowerCase() === searchCategory.toLowerCase()
      );
    }

    setFilteredData(filtered);
  }, [searchProductNo, searchName, searchCategory, productData]);

  const handlerDelete = async (record) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });
      await axios.post('https://senuri-auto-server.onrender.com/api/products/deleteproducts', {
        productId: record._id,
      });
      message.success('Product Deleted Successfully!');
      getAllProducts();
    } catch (error) {
      message.error('Delete failed!');
      console.error(error);
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  const handlerSubmit = async (value) => {
    try {
      dispatch({ type: 'SHOW_LOADING' });

      if (editProduct) {
        await axios.put('https://senuri-auto-server.onrender.com/api/products/updateproducts', {
          ...value,
          productId: editProduct._id,
        });
        message.success('Product Updated Successfully!');
      } else {
        await axios.post('https://senuri-auto-server.onrender.com/api/products/addproducts', value);
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

  const resetFilters = () => {
    setSearchProductNo('');
    setSearchName('');
    setSearchCategory('');
  };

  const columns = [
    { title: 'Product No', dataIndex: 'productNo' },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Category', dataIndex: 'category' },
    { title: 'Cost', dataIndex: 'cost' , render: cost => `Rs ${parseFloat(cost).toFixed(2)}`},
    { title: 'Price', dataIndex: 'price' },
    {
      title: 'Action',
      render: (text, record) => (
        <div>
          <DeleteOutlined
            className="cart-action"
            onClick={() => handlerDelete(record)}
          />
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

  return (
    <LayoutApp>
      <h2>All Products</h2>

      <Card
        title={
          <span>
            <FilterOutlined style={{ marginRight: 8 }} />
            Filter Inventory
          </span>
        }
        style={{ marginBottom: 20 }}
        bordered={false}
      >
        <Form layout="vertical">
          <Row gutter={[16, 16]} wrap>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Product No">
                <Input
                  placeholder="Search Product No"
                  value={searchProductNo}
                  onChange={(e) => setSearchProductNo(e.target.value)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Product Name">
                <Input
                  placeholder="Search Name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Category">
                <Select
                  showSearch
                  allowClear
                  placeholder="Select Category"
                  value={searchCategory || undefined}
                  onChange={(value) => setSearchCategory(value)}
                  loading={loading}
                >
                  {categoryData.map((category) => (
                    <Select.Option key={category._id} value={category.categoryName}>
                      {category.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col style={{ textAlign: 'right' }}>
              <Button onClick={resetFilters} style={{ marginTop: 30 }}>Reset Filters</Button>
            </Col>
          </Row>
        </Form>
      </Card>


      <Button className="add-new" onClick={() => setPopModal(true)}>
        Add New
      </Button>

      <Table
        dataSource={filteredData}
        columns={columns}
        bordered
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title={editProduct ? 'Edit Product' : 'Add New Product'}
        open={popModal}
        onCancel={() => {
          setEditProduct(null);
          setPopModal(false);
        }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" initialValues={editProduct || {}} onFinish={handlerSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="productNo"
            label="Product Number"
            rules={[{ required: true, message: 'Please enter product number' }]}
          >
            <Input />
          </Form.Item>

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

          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <Input type="number" />
          </Form.Item>

          <div className="form-btn-add">
            <Button htmlType="submit" className="add-new">
              {editProduct ? 'Update' : 'Add'}
            </Button>
          </div>
        </Form>
      </Modal>
    </LayoutApp>
  );
};

export default Products;
