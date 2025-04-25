import { Button, Modal, Table, Input, Row, Col, Card, Tag } from 'antd';
import axios from 'axios';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import Layout from '../../components/Layout';
import debounce from 'lodash/debounce';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Bills = () => {
  const componentRef = useRef();
  const dispatch = useDispatch();
  const [billsData, setBillsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [popModal, setPopModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [searchText, setSearchText] = useState({
    invoiceNumber: '',
    customerName: '',
    customerPhone: '',
  });
  const [loading, setLoading] = useState(false);

  // Data Fetching
  const getAllBills = async () => {
    try {
      setLoading(true);
      dispatch({ type: 'SHOW_LOADING' });
      const { data } = await axios.get(`${BASE_URL}/bills/getbills`);
      if (data && Array.isArray(data.data)) {
        setBillsData(data.data);
        setFilteredData(data.data);
      } else {
        console.error('Unexpected API response structure:', data);
        setBillsData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      setBillsData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
      dispatch({ type: 'HIDE_LOADING' });
    }
  };

  useEffect(() => {
    getAllBills();
  }, []);

  // Filtering Logic
  useEffect(() => {
    const filtered = billsData.filter((bill) => {
      const matchesInvoice =
        bill.invoiceNumber?.toString().includes(searchText.invoiceNumber) ||
        `INV-${bill.invoiceNumber?.toString().padStart(5, '0')}`.includes(searchText.invoiceNumber);
      const matchesName = bill.customerName?.toLowerCase().includes(searchText.customerName.toLowerCase());
      const matchesPhone = bill.customerPhone?.includes(searchText.customerPhone);
      return matchesInvoice && matchesName && matchesPhone;
    });
    setFilteredData(filtered);
  }, [searchText, billsData]);

  const debounceSearch = useCallback(
    debounce((key, value) => {
      setSearchText((prev) => ({
        ...prev,
        [key]: value,
      }));
    }, 300),
    []
  );

  const handleResetFilters = () => {
    setSearchText({
      invoiceNumber: '',
      customerName: '',
      customerPhone: '',
    });
  };

  // Print Functionality
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        #print-content, #print-content * {
          visibility: visible;
        }
        #print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
    removeAfterPrint: true,
  });

  // Table Columns
  const columns = [
    {
      title: 'Bill No.',
      dataIndex: 'invoiceNumber',
      render: (number) => (number ? `INV-${number.toString().padStart(5, '0')}` : '-'),
      sorter: (a, b) => a.invoiceNumber - b.invoiceNumber,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      render: (text) => text || 'N/A',
      sorter: (a, b) => a.customerName?.localeCompare(b.customerName),
    },
    {
      title: 'Contact Number',
      dataIndex: 'customerPhone',
      render: (text) => text || 'N/A',
      sorter: (a, b) => a.customerPhone?.localeCompare(b.customerPhone),
    },
    {
      title: 'Cost',
      dataIndex: 'totalCost',
      render: (value) => `Rs ${(value || 0).toFixed(2)}`,
      sorter: (a, b) => a.totalCost - b.totalCost,
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      render: (value) => `Rs ${(value || 0).toFixed(2)}`,
      sorter: (a, b) => a.profit - b.profit,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      render: (value) => `Rs ${(value || 0).toFixed(2)}`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Action',
      dataIndex: '_id',
      render: (_, record) => (
        <EyeOutlined
          className="cart-edit eye"
          onClick={() => {
            setSelectedBill(record);
            setPopModal(true);
          }}
        />
      ),
    },
  ];

  return (
    <Layout>
      <h2>All Invoices</h2>

      {/* Filter Section */}
      <Card style={{ marginBottom: 20 }} bordered={false}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <label>Bill No.</label>
            <Input
              placeholder="Search by Bill No."
              value={searchText.invoiceNumber}
              onChange={(e) => debounceSearch('invoiceNumber', e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <label>Customer Name</label>
            <Input
              placeholder="Search by Customer Name"
              value={searchText.customerName}
              onChange={(e) => debounceSearch('customerName', e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <label>Contact Number</label>
            <Input
              placeholder="Search by Contact Number"
              value={searchText.customerPhone}
              onChange={(e) => debounceSearch('customerPhone', e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: 20 }}>
          <Col>
            <Button onClick={handleResetFilters}>Reset Filters</Button>
          </Col>
        </Row>
      </Card>

      {/* Bills Table */}
      <Table
        dataSource={filteredData}
        columns={columns}
        bordered
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'No bills found' }}
        loading={loading}
      />

      {/* Invoice Modal */}
      <Modal
        title="Invoice Details"
        width={800}
        open={popModal}
        onCancel={() => setPopModal(false)}
        footer={null}
        destroyOnClose
      >
        <div
          id="print-content"
          ref={componentRef}
          style={{ padding: 20, border: '1px solid #ddd', backgroundColor: '#fff' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2>INVOICE</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p>
                  <strong>Invoice No:</strong>{' '}
                  {selectedBill?.invoiceNumber
                    ? `INV-${selectedBill.invoiceNumber.toString().padStart(5, '0')}`
                    : 'N/A'}
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {selectedBill?.createdAt ? new Date(selectedBill.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p>
                  <strong>Customer:</strong> {selectedBill?.customerName || 'N/A'}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedBill?.customerPhone || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {selectedBill?.isCredit && (
            <div style={{ marginBottom: 10, textAlign: 'center' }}>
              <Tag color="orange">CREDIT SALE</Tag>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: 8, border: '1px solid #ddd', width: '5%' }}>S.No.</th>
                <th style={{ padding: 8, border: '1px solid #ddd', width: '45%' }}>Item</th>
                <th style={{ padding: 8, border: '1px solid #ddd', width: '15%', textAlign: 'right' }}>
                  Unit Price
                </th>
                <th style={{ padding: 8, border: '1px solid #ddd', width: '10%', textAlign: 'center' }}>
                  Qty
                </th>
                <th style={{ padding: 8, border: '1px solid #ddd', width: '25%', textAlign: 'right' }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedBill?.cartItems?.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.itemDescription || 'N/A'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>
                    Rs {item.unitPrice?.toFixed(2) || '0.00'}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                    {item.quantity || 0}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>
                    Rs {(item.unitPrice * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 8 }}>
              <span>Sub Total:</span> <strong>Rs {selectedBill?.subTotal?.toFixed(2) || '0.00'}</strong>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span>Total Amount:</span>{' '}
              <strong>Rs {selectedBill?.totalAmount?.toFixed(2) || '0.00'}</strong>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span>Amount Paid:</span>{' '}
              <strong>Rs {selectedBill?.amountPaid?.toFixed(2) || '0.00'}</strong>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span>Remaining Amount:</span>
              <strong style={{ color: selectedBill?.remainingAmount < 0 ? 'red' : 'inherit' }}>
                Rs {Math.abs(selectedBill?.remainingAmount || 0).toFixed(2)}
                {selectedBill?.remainingAmount < 0 ? ' (Credit)' : ''}
              </strong>
            </div>
            <div>
              <span>Payment Method:</span> <strong>{selectedBill?.paymentMethod || 'N/A'}</strong>
            </div>
          </div>

          <div style={{ marginTop: 30, textAlign: 'center', fontStyle: 'italic' }}>
            Thank you for your business!
          </div>
        </div>

        <div className="no-print" style={{ textAlign: 'center', marginTop: 20 }}>
          <Button type="primary" onClick={handlePrint} style={{ width: 150 }}>
            Print Invoice
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

export default Bills;