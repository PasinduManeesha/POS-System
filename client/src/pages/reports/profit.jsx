import { Button, Modal, Table, Row, Col, Card, Tag, DatePicker, Statistic, Space, Typography, Divider, Progress, Badge, Tooltip } from 'antd';
import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { EyeOutlined, PrinterOutlined, ReloadOutlined, DollarOutlined, LineChartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import Layout from '../../components/Layout';
import './reports.css'; // Import custom styles

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ProfitReport = () => {
    const componentRef = useRef();
    const dispatch = useDispatch();
    const [billsData, setBillsData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [popModal, setPopModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [searchText, setSearchText] = useState({
        invoiceNumber: '',
        dateRange: []
    });

    // Fetch bills
    const getAllBills = async () => {
        try {
            dispatch({ type: "SHOW_LOADING" });
            const { data } = await axios.get(`${BASE_URL}/bills/getbills`);
            setBillsData(data.data || []);
            setFilteredData(data.data || []);
        } catch (error) {
            setBillsData([]);
            setFilteredData([]);
        } finally {
            dispatch({ type: "HIDE_LOADING" });
        }
    };

    useEffect(() => { getAllBills(); }, []);

    useEffect(() => {
        // Filtering
        const filtered = billsData.filter(bill => {
            const matchesInvoice = bill.invoiceNumber?.toString().includes(searchText.invoiceNumber) ||
                `INV-${bill.invoiceNumber?.toString().padStart(5, '0')}`.includes(searchText.invoiceNumber);

            const matchesDateRange = searchText.dateRange.length === 0 || (
                new Date(bill.createdAt) >= searchText.dateRange[0]._d &&
                new Date(bill.createdAt) <= searchText.dateRange[1]._d
            );

            return matchesInvoice && matchesDateRange;
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
            dateRange: []
        });
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print {
        body * { visibility: hidden; }
        #print-content, #print-content * { visibility: visible; }
        #print-content { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
      }
    `,
        removeAfterPrint: true
    });

    // Table columns
    const columns = [
        {
            title: "BILL NO.",
            dataIndex: "invoiceNumber",
            render: (number) => number ? <Text strong>INV-{number.toString().padStart(5, '0')}</Text> : '-'
        },
        {
            title: "DATE",
            dataIndex: "createdAt",
            render: (date) => date ? <Text>{new Date(date).toLocaleDateString()}</Text> : '-'
        },
        {
            title: "CUSTOMER",
            dataIndex: "customerName",
            render: (text) => text || 'N/A'
        },
        {
            title: "CONTACT",
            dataIndex: "customerPhone",
            render: (text) => text || 'N/A'
        },
        {
            title: "COST",
            dataIndex: "totalCost",
            align: "right",
            render: (value) => <Text>Rs {(value || 0).toFixed(2)}</Text>
        },
        {
            title: "PROFIT",
            dataIndex: "profit",
            align: "right",
            render: (value) => (
                <Text strong style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    Rs {(value || 0).toFixed(2)}
                </Text>
            )
        },
        {
            title: "TOTAL",
            dataIndex: "totalAmount",
            align: "right",
            render: (value) => <Text strong>Rs {(value || 0).toFixed(2)}</Text>
        },
        {
            title: "ACTION",
            dataIndex: "_id",
            align: "center",
            render: (id, record) => (
                <Tooltip title="View Details">
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedBill(record);
                            setPopModal(true);
                        }}
                        style={{ borderRadius: 4 }}
                    />
                </Tooltip>
            )
        }
    ];

    // Totals
    const totalProfit = filteredData.reduce((sum, bill) => sum + (bill.profit || 0), 0);
    const totalCost = filteredData.reduce((sum, bill) => sum + (bill.totalCost || 0), 0);
    const totalAmount = filteredData.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

    // Profit ratio calculation
    const profitRatio = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

    // Count of profitable transactions
    const profitableCount = filteredData.filter(bill => (bill.profit || 0) >= 0).length;
    const lossCount = filteredData.length - profitableCount;

    return (
        <Layout>
            <div style={{
                background: 'linear-gradient(to right, #1a237e, #4a148c)',
                padding: '20px 24px',
                borderRadius: 8,
                marginBottom: 24,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                <Title level={2} style={{ color: 'white', margin: 0 }}>Profit Report</Title>
                <Text style={{ color: '#d1c4e9', fontSize: 16 }}>Analyze and track your business profitability</Text>
            </div>

            {/* Filters & Summary */}
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 8,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}
                        title={<Text strong style={{ fontSize: 16 }}>Filters</Text>}
                        extra={
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleResetFilters}
                                type="text"
                                style={{ color: '#1890ff' }}
                            />
                        }
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {/* <Input
                placeholder="Search by Bill No."
                value={searchText.invoiceNumber}
                onChange={e => handleSearch('invoiceNumber', e.target.value)}
                allowClear
                size="large"
              /> */}
                            <RangePicker
                                style={{ width: '100%' }}
                                onChange={(dates) => handleSearch('dateRange', dates)}
                                value={searchText.dateRange}
                                size="large"
                            />
                            <Button
                                type="primary"
                                onClick={getAllBills}
                                style={{ marginTop: 8 }}
                                block
                            >
                                Refresh Data
                            </Button>
                        </Space>
                    </Card>

                    {/* <Card
                        bordered={false}
                        style={{
                            borderRadius: 8,
                            marginTop: 24,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                        }}
                        title={<Text strong style={{ fontSize: 16 }}>Profitability</Text>}
                    >
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text>Profit Ratio</Text>
                                <Text strong>{profitRatio.toFixed(2)}%</Text>
                            </div>
                            <Progress
                                percent={Math.min(profitRatio, 100)}
                                strokeColor={profitRatio >= 0 ? '#52c41a' : '#ff4d4f'}
                                status="active"
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                            <div style={{ textAlign: 'center' }}>
                                <RiseOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                                <Text strong style={{ display: 'block', fontSize: 18, color: '#52c41a' }}>{profitableCount}</Text>
                                <Text>Profitable</Text>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <FallOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                                <Text strong style={{ display: 'block', fontSize: 18, color: '#ff4d4f' }}>{lossCount}</Text>
                                <Text>Loss</Text>
                            </div>
                        </div>
                    </Card> */}
                </Col>

                <Col xs={24} md={16}>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} sm={8}>
                            <Card
                                bordered={false}
                                style={{
                                    background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
                                    borderRadius: 8,
                                    boxShadow: '0 4px 8px rgba(24, 144, 255, 0.3)'
                                }}
                            >
                                <Statistic
                                    title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Total Profit</Text>}
                                    value={totalProfit}
                                    precision={2}
                                    prefix={<DollarOutlined style={{ color: 'rgba(255,255,255,0.85)' }} />}
                                    valueStyle={{
                                        color: totalProfit >= 0 ? 'white' : '#ffccc7',
                                        fontSize: 24
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card
                                bordered={false}
                                style={{
                                    background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
                                    borderRadius: 8,
                                    boxShadow: '0 4px 8px rgba(250, 140, 22, 0.3)'
                                }}
                            >
                                <Statistic
                                    title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Total Cost</Text>}
                                    value={totalCost}
                                    precision={2}
                                    prefix={<DollarOutlined style={{ color: 'rgba(255,255,255,0.85)' }} />}
                                    valueStyle={{ color: 'white', fontSize: 24 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card
                                bordered={false}
                                style={{
                                    background: 'linear-gradient(135deg, #52c41a 0%, #237804 100%)',
                                    borderRadius: 8,
                                    boxShadow: '0 4px 8px rgba(82, 196, 26, 0.3)'
                                }}
                            >
                                <Statistic
                                    title={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>Total Sale</Text>}
                                    value={totalAmount}
                                    precision={2}
                                    prefix={<DollarOutlined style={{ color: 'rgba(255,255,255,0.85)' }} />}
                                    valueStyle={{ color: 'white', fontSize: 24 }}
                                />
                            </Card>
                        </Col>

                        {/* <Col span={24}>
                            <Card
                                bordered={false}
                                style={{
                                    borderRadius: 8,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                                }}
                                title={<Text strong style={{ fontSize: 16 }}>Performance Summary</Text>}
                                extra={<LineChartOutlined style={{ color: '#1890ff', fontSize: 18 }} />}
                            >
                                <Row gutter={16}>
                                    <Col span={8} style={{ textAlign: 'center' }}>
                                        <Text strong style={{ fontSize: 24, color: '#1890ff' }}>{filteredData.length}</Text>
                                        <Text type="secondary">Transactions</Text>
                                    </Col>
                                    <Col span={8} style={{ textAlign: 'center', borderLeft: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0' }}>
                                        <Text strong style={{ fontSize: 24, color: '#52c41a' }}>{profitableCount}</Text>
                                        <Text type="secondary">Profitable</Text>
                                    </Col>
                                    <Col span={8} style={{ textAlign: 'center' }}>
                                        <Text strong style={{ fontSize: 24, color: '#ff4d4f' }}>{lossCount}</Text>
                                        <Text type="secondary">Loss Making</Text>
                                    </Col>
                                </Row>
                            </Card>
                        </Col> */}
                    </Row>
                </Col>
            </Row>

            {/* Table */}
            <Card
                bordered={false}
                style={{
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                }}
                title={<Text strong style={{ fontSize: 18 }}>Profit Details</Text>}
                extra={
                    <Text strong>
                        Showing <span style={{ color: '#1890ff' }}>{filteredData.length}</span> transactions
                    </Text>
                }
            >
                <Table
                    dataSource={filteredData}
                    columns={columns}
                    bordered
                    rowKey="_id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                    }}
                    locale={{ emptyText: 'No transactions found' }}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                    rowClassName={(record) =>
                        record.profit < 0 ? 'negative-lost-row' : 'positive-profit-row'
                    }
                />
            </Card>

            {/* Invoice Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <PrinterOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                        <span>Invoice Details</span>
                    </div>
                }
                width={800}
                open={popModal}
                onCancel={() => setPopModal(false)}
                footer={null}
                destroyOnClose
                centered
                bodyStyle={{ padding: 0 }}
            >
                <div id="print-content" ref={componentRef} style={{ padding: 24 }}>
                    <div style={{
                        background: 'linear-gradient(to right, #1a237e, #4a148c)',
                        padding: 24,
                        color: 'white',
                        textAlign: 'center',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8
                    }}>
                        <Title level={2} style={{ color: 'white', margin: 0 }}>INVOICE</Title>
                        <Text style={{ color: '#d1c4e9' }}>Thank you for your business</Text>
                    </div>

                    <div style={{ padding: 24, border: '1px solid #f0f0f0', borderTop: 'none' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 24
                        }}>
                            <div style={{ textAlign: 'left' }}>
                                <Text strong style={{ display: 'block', marginBottom: 4 }}>Invoice No:</Text>
                                <Text>{selectedBill?.invoiceNumber ? `INV-${selectedBill.invoiceNumber.toString().padStart(5, '0')}` : 'N/A'}</Text>

                                <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 4 }}>Date:</Text>
                                <Text>{selectedBill?.createdAt ? new Date(selectedBill.createdAt).toLocaleDateString() : 'N/A'}</Text>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <Text strong style={{ display: 'block', marginBottom: 4 }}>Customer:</Text>
                                <Text>{selectedBill?.customerName || 'N/A'}</Text>

                                <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 4 }}>Phone:</Text>
                                <Text>{selectedBill?.customerPhone || 'N/A'}</Text>
                            </div>
                        </div>

                        {selectedBill?.isCredit && (
                            <div style={{
                                marginBottom: 24,
                                textAlign: 'center',
                                padding: 8,
                                background: '#fff7e6',
                                borderRadius: 4
                            }}>
                                <Tag color="orange" style={{ fontSize: 16, padding: '4px 12px' }}>CREDIT SALE</Tag>
                            </div>
                        )}

                        <Table
                            dataSource={selectedBill?.cartItems || []}
                            columns={[
                                {
                                    title: 'Item',
                                    dataIndex: 'itemDescription',
                                    key: 'item',
                                    render: t => t || 'N/A',
                                    width: '40%'
                                },
                                {
                                    title: 'Unit Price',
                                    dataIndex: 'unitPrice',
                                    key: 'unitPrice',
                                    align: 'right',
                                    render: v => `Rs ${v?.toFixed(2) || '0.00'}`
                                },
                                {
                                    title: 'Qty',
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                    align: 'center'
                                },
                                {
                                    title: 'Total',
                                    key: 'total',
                                    align: 'right',
                                    render: (_, r) => <Text strong>Rs {(r.unitPrice * r.quantity).toFixed(2)}</Text>
                                }
                            ]}
                            pagination={false}
                            size="small"
                            rowKey={(_, idx) => idx}
                            style={{ marginBottom: 20 }}
                            bordered
                        />

                        <div style={{
                            textAlign: 'right',
                            marginTop: 20,
                            background: '#f9f9f9',
                            padding: 16,
                            borderRadius: 8
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Sub Total:</Text>
                                <Text strong>Rs {selectedBill?.subTotal?.toFixed(2) || '0.00'}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Total Amount:</Text>
                                <Text strong>Rs {selectedBill?.totalAmount?.toFixed(2) || '0.00'}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Cost:</Text>
                                <Text strong>Rs {selectedBill?.totalCost?.toFixed(2) || '0.00'}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Profit:</Text>
                                <Text strong style={{ color: selectedBill?.profit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                                    Rs {(selectedBill?.profit || 0).toFixed(2)}
                                </Text>
                            </div>
                            <Divider style={{ margin: '12px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Amount Paid:</Text>
                                <Text strong style={{ color: '#52c41a' }}>Rs {selectedBill?.amountPaid?.toFixed(2) || '0.00'}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Remaining Amount:</Text>
                                <Text strong style={{ color: selectedBill?.remainingAmount < 0 ? '#fa8c16' : '#52c41a' }}>
                                    Rs {Math.abs(selectedBill?.remainingAmount || 0).toFixed(2)}
                                    {selectedBill?.remainingAmount < 0 ? ' (Credit)' : ''}
                                </Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Payment Method:</Text>
                                <Text strong>{selectedBill?.paymentMethod || 'N/A'}</Text>
                            </div>
                        </div>

                        <div style={{
                            marginTop: 24,
                            textAlign: 'center',
                            padding: 16,
                            borderTop: '1px dashed #f0f0f0'
                        }}>
                            <Text type="secondary" italic>
                                Thank you for your business! We appreciate your trust in our services.
                            </Text>
                        </div>
                    </div>
                </div>

                <div className="no-print" style={{ textAlign: 'center', marginTop: 20, padding: '0 24px 24px' }}>
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={handlePrint}
                        size="large"
                        block
                    >
                        Print Invoice
                    </Button>
                </div>
            </Modal>
        </Layout>
    );
};

export default ProfitReport;