import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { EyeOutlined, DollarOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button, Form, Input, Modal, Table, message, Tag, Statistic,
  List, Typography, Space, Card, Divider, Descriptions
} from 'antd';
import Layout from '../../components/Layout';
import moment from 'moment';

const { Text, Title } = Typography;
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const CustomersCredit = () => {
  const dispatch = useDispatch();
  const [paymentForm] = Form.useForm();
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creditHistoryModalVisible, setCreditHistoryModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    console.log('creditHistoryModalVisible:', creditHistoryModalVisible);
    console.log('paymentModalVisible:', paymentModalVisible);
    console.log('selectedCustomer:', selectedCustomer);
  }, [creditHistoryModalVisible, paymentModalVisible, selectedCustomer]);

  const getAllCustomers = async (params = {}) => {
    try {
      console.log('Fetching customers with params:', params);
      setLoading(true);
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get(`${BASE_URL}/customers/getcustomers`, {
        params: {
          page: params.pagination?.current || pagination.current,
          limit: params.pagination?.pageSize || pagination.pageSize,
          search: searchText,
        },
      });

      const customers = data?.customers || data?.data || [];
      const filteredCustomers = customers
        .filter((c) => c.customerName?.toLowerCase() !== 'cash')
        .map((customer) => ({
          ...customer,
          key: customer._id || Math.random().toString(),
          customerName: customer.customerName || 'Unknown Customer',
          creditBalance: parseFloat(customer.creditBalance || 0),
        }));

      console.log('Processed customers:', filteredCustomers);
      setCustomerData(filteredCustomers);
      setPagination({
        ...pagination,
        total: data?.pagination?.totalItems || 0,
        current: params.pagination?.current || pagination.current,
        pageSize: params.pagination?.pageSize || pagination.pageSize,
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error(error.response?.data?.message || 'Failed to fetch customers');
    } finally {
      dispatch({ type: 'HIDE_LOADING' });
      setLoading(false);
    }
  };

  const getCreditHistory = async (customerId) => {
    try {
      console.log('Fetching credit history for customerId:', customerId);
      setHistoryLoading(true);
      const { data } = await axios.get(`${BASE_URL}/customers/${customerId}/history`);

      if (!data) {
        throw new Error('No data received from server');
      }

      if (data.success) {
        const sortedHistory = Array.isArray(data.history)
          ? data.history.sort((a, b) => new Date(b.date) - new Date(a.date))
          : [];
        setCreditHistory(sortedHistory);
        console.log('Credit history loaded:', sortedHistory);
      } else {
        throw new Error(data.message || 'Failed to load credit history');
      }
    } catch (error) {
      console.error('Error fetching credit history:', error);
      message.error(error.response?.data?.message || 'Failed to load credit history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePaymentSubmit = async (values) => {
    try {
      console.log('Submitting payment with values:', values);
      Modal.confirm({
        title: 'Confirm Payment',
        content: `Are you sure you want to record a payment of Rs${parseFloat(values.amount).toFixed(2)} for ${selectedCustomer?.customerName}?`,
        onOk: async () => {
          setPaymentLoading(true);
          const paymentAmount = parseFloat(values.amount);
          if (!selectedCustomer?._id) throw new Error('No customer selected');

          const { data } = await axios.post(`${BASE_URL}/customers/${selectedCustomer._id}/payments`, {
            amount: paymentAmount,
            description: values.notes || 'Credit payment',
          });

          if (data?.success) {
            message.success(`Payment of Rs${paymentAmount.toFixed(2)} recorded successfully!`);
            setPaymentModalVisible(false);
            paymentForm.resetFields();

            const updatedCustomers = customerData.map((customer) => {
              if (customer._id === selectedCustomer._id) {
                return {
                  ...customer,
                  creditBalance: data.newBalance || customer.creditBalance - paymentAmount,
                  creditHistory: [
                    ...(customer.creditHistory || []),
                    {
                      amount: -paymentAmount,
                      description: values.notes || 'Credit payment',
                      type: 'payment',
                      date: new Date(),
                    },
                  ],
                };
              }
              return customer;
            });

            setCustomerData(updatedCustomers);
            if (creditHistoryModalVisible) {
              await getCreditHistory(selectedCustomer._id);
            }
            setSelectedCustomer({
              ...selectedCustomer,
              creditBalance: data.newBalance || selectedCustomer.creditBalance - paymentAmount,
            });
          } else {
            throw new Error(data.message || 'Payment failed');
          }
        },
        onCancel: () => {
          setPaymentLoading(false);
        },
      });
    } catch (error) {
      console.error('Payment error:', error);
      message.error(error.response?.data?.message || 'Failed to process payment');
      setPaymentLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    console.log('Table pagination changed:', pagination);
    setPagination(pagination);
    getAllCustomers({ pagination });
  };

  const handleSearch = (value) => {
    console.log('Search triggered with value:', value);
    setSearchText(value);
    getAllCustomers({ pagination: { ...pagination, current: 1 } });
  };

  const handleViewHistory = (record) => {
    console.log('View History clicked:', record);
    if (!record?._id) {
      message.error('Invalid customer data');
      console.error('Invalid record:', record);
      return;
    }
    setSelectedCustomer(record);
    setCreditHistoryModalVisible(true);
    getCreditHistory(record._id);
  };

  const handleMakePayment = (record) => {
    console.log('Make Payment clicked:', record);
    if (!record?._id) {
      message.error('Invalid customer data');
      console.error('Invalid record:', record);
      return;
    }
    setSelectedCustomer(record);
    setPaymentModalVisible(true);
    paymentForm.setFieldsValue({
      amount: parseFloat(record.creditBalance || 0).toFixed(2),
      notes: '',
    });
  };

  useEffect(() => {
    console.log('Fetching initial customers');
    getAllCustomers();
  }, []);

  const columns = [
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.customerAddress && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.customerAddress}</div>
          )}
        </div>
      ),
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    {
      title: 'Contact',
      dataIndex: 'customerPhone',
      render: (text) => (text ? text.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'N/A'),
    },
    {
      title: 'Credit Balance',
      dataIndex: 'creditBalance',
      render: (balance) => (
        <Tag color={balance > 0 ? 'red' : 'green'}>
          Rs{parseFloat(balance || 0).toFixed(2)}
        </Tag>
      ),
      sorter: (a, b) => a.creditBalance - b.creditBalance,
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (_, record) => {
        console.log('Rendering actions for record:', record);
        return (
          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewHistory(record)}
              size="small"
              disabled={!record._id}
            >
              View History
            </Button>
            <Button
              icon={<DollarOutlined />}
              onClick={() => handleMakePayment(record)}
              disabled={!record.creditBalance || record.creditBalance <= 0}
              size="small"
              type={record.creditBalance > 0 ? 'primary' : 'default'}
            >
              Make Payment
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Layout>
      <Card>
        <Title level={3}>Customer Credit Management</Title>
        <div style={{ margin: '16px 0', display: 'flex', gap: 8 }}>
          <Input
            placeholder="Search customers..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => handleSearch(searchText)}
            style={{ width: 300 }}
            allowClear
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchText('');
              getAllCustomers({ pagination: { ...pagination, current: 1 } });
            }}
          >
            Refresh
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={customerData}
          loading={loading}
          rowKey="_id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title={`Credit History - ${selectedCustomer?.customerName || 'Customer'}`}
        visible={creditHistoryModalVisible}
        onCancel={() => {
          console.log('Closing credit history modal');
          setCreditHistoryModalVisible(false);
          setCreditHistory([]);
          setSelectedCustomer(null);
        }}
        footer={[
          <Button
            key="payment"
            type="primary"
            onClick={() => {
              console.log('Make Payment from history modal');
              setCreditHistoryModalVisible(false);
              handleMakePayment(selectedCustomer);
            }}
            disabled={!selectedCustomer?.creditBalance || selectedCustomer?.creditBalance <= 0}
          >
            <DollarOutlined /> Make Payment
          </Button>,
          <Button
            key="close"
            onClick={() => {
              console.log('Closing credit history modal');
              setCreditHistoryModalVisible(false);
              setCreditHistory([]);
              setSelectedCustomer(null);
            }}
          >
            Close
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        <Card bordered={false}>
          <Statistic
            title="Current Balance"
            value={selectedCustomer?.creditBalance || 0}
            precision={2}
            prefix="Rs"
            valueStyle={{
              color: selectedCustomer?.creditBalance > 0 ? '#f5222d' : '#52c41a',
              fontSize: 24,
              marginBottom: 16,
            }}
          />
        </Card>

        <Divider orientation="left">Transaction History</Divider>

        <List
          loading={historyLoading}
          dataSource={creditHistory}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Tag color={item.type === 'credit' ? 'volcano' : 'green'}>
                    {item.type?.toUpperCase()}
                  </Tag>
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.description || (item.type === 'credit' ? 'Credit Added' : 'Payment Made')}</span>
                    <span
                      style={{
                        color: item.type === 'payment' ? '#52c41a' : '#f5222d',
                        fontWeight: 'bold',
                      }}
                    >
                      {item.type === 'payment' ? '-' : '+'}Rs{Math.abs(item.amount).toFixed(2)}
                    </span>
                  </div>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">
                      {item.date ? moment(item.date).format('MMMM Do YYYY, h:mm a') : 'No date'}
                    </Text>
                    {item.billId && (
                      <Text type="secondary">Bill ID: {item.billId}</Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title={`Record Payment - ${selectedCustomer?.customerName || 'Customer'}`}
        visible={paymentModalVisible}
        onCancel={() => {
          console.log('Closing payment modal');
          setPaymentModalVisible(false);
          paymentForm.resetFields();
        }}
        footer={[
          <Button
            key="Close"
            onClick={() => {
              console.log('Cancel payment modal');
              setPaymentModalVisible(false);
              paymentForm.resetFields();
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={paymentLoading}
            onClick={() => {
              console.log('Submitting payment form');
              paymentForm.submit();
            }}
          >
            Submit Payment
          </Button>,
        ]}
        destroyOnClose
      >
        <Form form={paymentForm} layout="vertical" onFinish={handlePaymentSubmit}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Current Balance">
              <Text
                strong
                style={{
                  color: selectedCustomer?.creditBalance > 0 ? '#f5222d' : '#52c41a',
                }}
              >
                Rs{selectedCustomer?.creditBalance?.toFixed(2) || '0.00'}
              </Text>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Form.Item
            name="amount"
            label="Amount (Rs)"
            rules={[
              { required: true, message: 'Please enter payment amount' },
              () => ({
                validator(_, value) {
                  const amount = parseFloat(value);
                  const maxAmount = selectedCustomer?.creditBalance || 0;

                  if (isNaN(amount)) {
                    return Promise.reject('Please enter a valid number');
                  }
                  if (amount <= 0) {
                    return Promise.reject('Amount must be greater than 0');
                  }
                  if (amount > maxAmount) {
                    return Promise.reject(`Amount cannot exceed customer's balance of Rs${maxAmount.toFixed(2)}`);
                  }
                  if (amount > 100000) {
                    return Promise.reject('Amount is too large (maximum Rs100,000)');
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input
              type="number"
              min={0.01}
              step={0.01}
              max={selectedCustomer?.creditBalance || 0}
              placeholder={`Maximum: Rs${(selectedCustomer?.creditBalance || 0).toFixed(2)}`}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Optional payment notes" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default CustomersCredit;