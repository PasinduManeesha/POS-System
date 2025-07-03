import { Button, Form, Input, message } from 'antd';
import axios from 'axios';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector(state => state); // Adjust based on your Redux state structure

    const handlerSubmit = async (values) => {
        try {
            dispatch({ type: "SHOW_LOADING" });
            const response = await axios.post(`${BASE_URL}/users/login`, values, {
                headers: { 'Content-Type': 'application/json' }
            });
            dispatch({ type: "HIDE_LOADING" });

            if (response.data.success) {
                message.success("Login successful!");
                localStorage.setItem("auth", JSON.stringify(response.data.user));
                navigate("/");
            } else {
                message.error(response.data.message || "Invalid email or password");
            }
        } catch (error) {
            dispatch({ type: "HIDE_LOADING" });
            const errorMessage = error.response?.data?.message || "Login failed. Please check your email and password.";
            message.error(errorMessage);
            console.error("Login error:", error.response?.data || error);
        }
    };

    useEffect(() => {
        if (localStorage.getItem("auth")) {
            navigate("/");
        }
    }, [navigate]);

    return (
        <div className="form" style={{ maxWidth: 400, margin: 'auto', padding: '20px' }}>
            <h2>POS SYSTEM</h2>
            <p>Login to Your Account</p>
            <div className="form-group">
                <Form layout="vertical" onFinish={handlerSubmit}>
                    <Form.Item
                        name="userId"
                        label="Email Address"
                        rules={[
                            { required: true, message: "Please input your email!" },
                            { type: "email", message: "Please enter a valid email!" }
                        ]}
                    >
                        <Input placeholder="Enter Email Address" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: "Please input your password!" }]}
                    >
                        <Input.Password placeholder="Enter Password" />
                    </Form.Item>
                    <div className="form-btn-add" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            className="add-new" 
                            loading={loading}
                        >
                            Login
                        </Button>
                        {/* <Link to="/register">Register Here!</Link> */}
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Login;