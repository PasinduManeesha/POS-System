import { Button, Modal, Table } from 'antd';
import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { EyeOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import Layout from '../../components/Layout';

const Bills = () => {
    const componentRef = useRef();
    const dispatch = useDispatch();
    const [billsData, setBillsData] = useState([]);
    const [popModal, setPopModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);

    const getAllBills = async () => {
      try {
        dispatch({ type: "SHOW_LOADING" });
        const { data } = await axios.get('https://senuri-auto-server.onrender.com/api/bills/getbills');
        
        // Correct response structure handling
        setBillsData(data.data || []);
        
      } catch(error) {
        console.error("Error fetching bills:", error);
        setBillsData([]);
      } finally {
        dispatch({ type: "HIDE_LOADING" });
      }
    };

    useEffect(() => {
        getAllBills();
    }, []);

    const columns = [
      {
        title: "Bill No.",
        dataIndex: "billNumber",
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
          render: (value) => `$${(value || 0).toFixed(2)}`
      },
      { 
          title: "Tax", 
          dataIndex: "tax",
          render: (value) => `$${(value || 0).toFixed(2)}`
      },
      { 
          title: "Total Amount", 
          dataIndex: "totalAmount",
          render: (value) => `$${(value || 0).toFixed(2)}`
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

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    return (
        <Layout>
            <h2>All Invoices</h2>
            <Table 
                dataSource={billsData}
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
    visible={popModal}  // Fixed: no space before =
    onCancel={() => setPopModal(false)}
    footer={null}
    destroyOnClose
>
    {selectedBill && (
        <div className="card" ref={componentRef}>
            <div className="detail-group">
                <span>Bill Number:</span>
                <b>{selectedBill.billNumber ? `INV-${selectedBill.billNumber.toString().padStart(5, '0')}` : 'N/A'}</b>
            </div>
            {selectedBill.cartItems?.map((product, index) => (
                <div key={index}>
                    <span>{product.name || 'N/A'}</span>
                    <span>{product.price ? `$${product.price.toFixed(2)}` : 'N/A'}</span>
                </div>
            ))}
        </div>
    )}
    <div className="print-button">
        <Button 
            type="primary" 
            onClick={handlePrint}
            style={{ marginTop: 20 }}
        >
            Generate Invoice
        </Button>
    </div>
</Modal>
        </Layout>
    );
};

export default Bills;