import axios from 'axios';
import React, {useEffect, useState} from 'react'
import { useDispatch } from 'react-redux';
import LayoutApp from '../../components/Layout'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Select, Table, message } from 'antd';
import FormItem from 'antd/lib/form/FormItem';

const Products = () => {

  const dispatch = useDispatch();
  const [productData, setProductData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [editProduct, setEditProduct] = useState(false);

  const getAllProducts = async () => {
    try {
      dispatch({
        type: "SHOW_LOADING",
      });
      const {data} = await axios.get('/api/products/getproducts');
      setProductData(data);
      dispatch({
        type: "HIDE_LOADING",
      });
      console.log(data);

    } catch(error) {
      dispatch({
        type: "HIDE_LOADING",
      });
      console.log(error);
    }
  };

  useEffect(() => {
      getAllProducts();
  }, []);

  const handlerDelete = async (record) => {
    try {
      dispatch({
        type: "SHOW_LOADING",
      });
      await axios.post('/api/products/deleteproducts', {productId:record._id});
      message.success("Product Deleted Successfully!")
      getAllProducts();
      setPopModal(false);
      dispatch({
        type: "HIDE_LOADING",
      });
      

    } catch(error) {
      dispatch({
        type: "HIDE_LOADING",
      });
      message.error("Error!")
      console.log(error);
    }
  }

  const columns = [
    {
      title: "Product No",
      dataIndex: "productNo"
  }, 
    {
        title: "Name",
        dataIndex: "name"
    },
    {
      title: "Cost",
      dataIndex: "cost"
  },
   
    {
        title: "Price",
        dataIndex: "price",
    },
    {
        title: "Action",
        dataIndex: "_id",
        render:(id, record) => 
        <div>
          <DeleteOutlined className='cart-action' onClick={() => handlerDelete(record)}/>
          <EditOutlined className='cart-edit' onClick={() => {setEditProduct(record); setPopModal(true)}} />
        </div>
        
    }
  ]

  const handlerSubmit = async (value) => {
    console.log("editProduct:", editProduct);
    console.log("value:", value);
  
    const isAddingNew = !editProduct; // True if editProduct is null or undefined
  
    try {
      dispatch({ type: "SHOW_LOADING" });
  
      if (isAddingNew) {
        const res = await axios.post('/api/products/addproducts', value);
        message.success("Product Added Successfully!");
      } else {
        await axios.put('/api/products/updateproducts', { ...value, productId: editProduct._id });
        message.success("Product Updated Successfully!");
      }
  
      getAllProducts();
      setPopModal(false);
    } catch (error) {
      console.error("API Error:", error);
      if (error.response) {
        message.error(`Error: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        message.error("Error: Could not connect to the server.");
      } else {
        message.error(`Error: ${error.message}`);
      }
    } finally {
      dispatch({ type: "HIDE_LOADING" });
    }
  };

  return (
    <LayoutApp>
      <h2>All Products </h2>
      <Button className='add-new' onClick={() => setPopModal(true)}>Add New</Button>
      <Table dataSource={productData} columns={columns} bordered />
      
      {
        popModal && 
        <Modal
          title={`${editProduct !== null ? "Edit Product" : "Add New Product"}`}
          visible={popModal}
          onCancel={() => {
            setEditProduct(null);
            setPopModal(false);
          }}
          footer={false}
        >
          <Form
            layout="vertical"
            initialValues={editProduct}
            onFinish={handlerSubmit}
          >
            <FormItem name="name" label="Name">
              <Input />
            </FormItem>
            <FormItem name="productNo" label="Product Number">
              <Input />
            </FormItem>
            <Form.Item name="category" label="Category">
              <Select>
                <Select.Option value="pizzas">Pizzas</Select.Option>
                <Select.Option value="burgers">Burgers</Select.Option>
                <Select.Option value="drinks">Drinks</Select.Option>
              </Select>
            </Form.Item>
            <FormItem name="price" label="Price">
              <Input />
            </FormItem>

            <FormItem name="cost" label="Cost">
              <Input />
            </FormItem>

            <FormItem name="image" label="Image URL">
              <Input />
            </FormItem>
            <div className="form-btn-add">
              <Button htmlType="submit" className="add-new">
                {editProduct !== null ? "Update" : "Add"}
              </Button>
            </div>
          </Form>
        </Modal>
      }

    </LayoutApp>
  )
}

export default Products