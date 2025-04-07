import { Button, Modal, Table, Input, Row, Col, Card } from 'antd';
import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { EyeOutlined, FilterOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import Layout from '../../components/Layout';

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
        customerPhone: ''
    });

    const getAllBills = async () => {
      try {
        dispatch({ type: "SHOW_LOADING" });
        const { data } = await axios.get('https://senuri-auto-server.onrender.com/api/bills/getbills');
        setBillsData(data.data || []);
        setFilteredData(data.data || []);
      } catch(error) {
        console.error("Error fetching bills:", error);
        setBillsData([]);
        setFilteredData([]);
      } finally {
        dispatch({ type: "HIDE_LOADING" });
      }
    };

    useEffect(() => {
        getAllBills();
    }, []);

    useEffect(() => {
        // Apply filters whenever searchText changes
        const filtered = billsData.filter(bill => {
            const matchesInvoice = bill.invoiceNumber?.toString().includes(searchText.invoiceNumber) || 
                                  `INV-${bill.invoiceNumber?.toString().padStart(5, '0')}`.includes(searchText.invoiceNumber);
            const matchesName = bill.customerName?.toLowerCase().includes(searchText.customerName.toLowerCase());
            const matchesPhone = bill.customerPhone?.includes(searchText.customerPhone);
            
            return matchesInvoice && matchesName && matchesPhone;
        });
        setFilteredData(filtered);
    }, [searchText, billsData]);

    const handleSearch = (key, value) => {
        setSearchText(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleResetFilters = () => {
        setSearchText({
            invoiceNumber: '',
            customerName: '',
            customerPhone: ''
        });
    };

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
        removeAfterPrint: true
    });

    const columns = [
      {
        title: "Bill No.",
        dataIndex: "invoiceNumber",
        render: (number) => number ? `INV-${number.toString().padStart(5, '0')}` : '-'
      },
      {
          title: "Date",
          dataIndex: "createdAt",
          render: (date) => date ? new Date(date).toLocaleDateString() : '-'
      },
      { 
          title: "Customer Name", 
          dataIndex: "customerName",
          render: (text) => text || 'N/A'
      },
      { 
          title: "Contact Number", 
          dataIndex: "customerPhone",
          render: (text) => text || 'N/A'
      },
      { 
          title: "Sub Total", 
          dataIndex: "subTotal",
          render: (value) => `Rs ${(value || 0).toFixed(2)}`
      },
      { 
          title: "Profit", 
          dataIndex: "profit",
          render: (value) => `Rs ${(value || 0).toFixed(2)}`
      },
      { 
          title: "Total Amount", 
          dataIndex: "totalAmount",
          render: (value) => `Rs ${(value || 0).toFixed(2)}`
      },
      {
          title: "Action",
          dataIndex: "_id",
          render: (id, record) => (
              <EyeOutlined 
                  className='cart-edit eye' 
                  onClick={() => {
                      setSelectedBill(record); 
                      setPopModal(true);
                  }} 
              />
          )
      }
    ];

    return (
        <Layout>
            <h2>All Invoices</h2>
            
            {/* Filter Section */}
            <Card 
                title={
                    <span>
                        <FilterOutlined style={{ marginRight: 8 }} />
                        Filter Invoices
                    </span>
                } 
                style={{ marginBottom: 20 }}
                bordered={false}
            >
                <Row gutter={16}>
                    <Col xs={24} sm={12} md={8} lg={8}>
                        <div style={{ marginBottom: 16 }}>
                            <label>Bill No.</label>
                            <Input
                                placeholder="Search by Bill No."
                                value={searchText.invoiceNumber}
                                onChange={e => handleSearch('invoiceNumber', e.target.value)}
                                allowClear
                                style={{ width: '100%' }}
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={8}>
                        <div style={{ marginBottom: 16 }}>
                            <label>Customer Name</label>
                            <Input
                                placeholder="Search by Customer Name"
                                value={searchText.customerName}
                                onChange={e => handleSearch('customerName', e.target.value)}
                                allowClear
                                style={{ width: '100%' }}
                            />
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={8}>
                        <div style={{ marginBottom: 16 }}>
                            <label>Contact Number</label>
                            <Input
                                placeholder="Search by Contact Number"
                                value={searchText.customerPhone}
                                onChange={e => handleSearch('customerPhone', e.target.value)}
                                allowClear
                                style={{ width: '100%' }}
                            />
                        </div>
                    </Col>
                </Row>
                <Button 
                    type="default" 
                    onClick={handleResetFilters}
                    style={{ marginTop: 8 }}
                >
                    Reset Filters
                </Button>
            </Card>

            {/* Table Section */}
            <Table 
                dataSource={filteredData}
                columns={columns} 
                bordered 
                rowKey="_id"
                pagination={{ pageSize: 10 }}
                locale={{
                    emptyText: 'No bills found'
                }}
            />
            
            <Modal
                title="Invoice Details"
                width={800}
                visible={popModal}
                onCancel={() => setPopModal(false)}
                footer={null}
                destroyOnClose
            >
                <div id="print-content" ref={componentRef} style={{ padding: 20 }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <h2>INVOICE</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div>
                                <p><strong>Invoice No:</strong> {selectedBill?.invoiceNumber ? `INV-${selectedBill.invoiceNumber.toString().padStart(5, '0')}` : 'N/A'}</p>
                                <p><strong>Date:</strong> {selectedBill?.createdAt ? new Date(selectedBill.createdAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p><strong>Customer:</strong> {selectedBill?.customerName || 'N/A'}</p>
                                <p><strong>Phone:</strong> {selectedBill?.customerPhone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Item</th>
                                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>Unit Price</th>
                                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedBill?.cartItems?.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.itemDescription || 'N/A'}</td>
                                    <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>Rs {item.unitPrice?.toFixed(2) || '0.00'}</td>
                                    <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>{item.quantity || 0}</td>
                                    <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>Rs {(item.unitPrice * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ textAlign: 'right', marginTop: 20 }}>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ marginRight: 10 }}>Sub Total:</span>
                            <strong>Rs {selectedBill?.subTotal?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ marginRight: 10 }}>Tax:</span>
                            <strong>Rs {selectedBill?.tax?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ marginRight: 10 }}>Total Amount:</span>
                            <strong>Rs {selectedBill?.totalAmount?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ marginRight: 10 }}>Profit:</span>
                            <strong>Rs {selectedBill?.profit?.toFixed(2) || '0.00'}</strong>
                        </div>
                    </div>

                    <div style={{ marginTop: 30, textAlign: 'center', fontStyle: 'italic' }}>
                        Thank you for your business!
                    </div>
                </div>

                <div className="no-print" style={{ textAlign: 'center', marginTop: 20 }}>
                    <Button 
                        type="primary" 
                        onClick={handlePrint}
                        style={{ width: 150 }}
                    >
                        Print Invoice
                    </Button>
                </div>
            </Modal>
        </Layout>
    );
};

export default Bills;