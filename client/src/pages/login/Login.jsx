import { Button, Form, Input, message } from 'antd';
import axios from 'axios';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_API_BASE_URL ;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handlerSubmit = async (value) => {
    try {
      dispatch({ type: "SHOW_LOADING" });
      const res = await axios.post(`${BASE_URL}/users/login`, value);
      dispatch({ type: "HIDE_LOADING" });
      message.success("User Login Successfully!");
      localStorage.setItem("auth", JSON.stringify(res.data));
      navigate("/");
    } catch (error) {
      dispatch({ type: "HIDE_LOADING" });
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error("An unexpected error occurred!");
      }
      console.error("Login error:", error);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("auth")) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="form">
      <h2>POS SYSTEM</h2>
      <p>Login</p>
      <div className="form-group">
        <Form layout="vertical" onFinish={handlerSubmit}>
          <Form.Item
            name="userId"
            label="Email Address"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input placeholder="Enter Email Address" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input type="password" placeholder="Enter Password" />
          </Form.Item>
          <div className="form-btn-add">
            <Button htmlType="submit" className="add-new">
              Login
            </Button>
            {/* <Link className="form-other" to="/register">
              Register Here!
            </Link> */}
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;