import React, { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import LayoutApp from '../../components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./home.css";
import axios from "axios";
import { message, Modal, Table, Tag } from "antd";
import moment from "moment";

const POSBilling = () => {
  // State variables
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [date] = useState(new Date().toISOString().split("T")[0]);
  const [newProduct, setNewProduct] = useState({
    productNo: "",
    itemDescription: "",
    unitPrice: "",
    quantity: "",
    cost: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isTypingCustomerNumber, setIsTypingCustomerNumber] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isTypingProductNumber, setIsTypingProductNumber] = useState(false);
  const [customerBalance, setCustomerBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const componentRef = useRef();

  // Generate invoice number on mount
  useEffect(() => {
    const generateInvoiceNumber = () => {
      const randomNumber = Math.floor(Math.random() * 100000);
      setInvoiceNumber(randomNumber.toString().padStart(5, "0"));
    };
    generateInvoiceNumber();
  }, []);

  // Fetch customers and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [customersRes, productsRes] = await Promise.all([
          axios.get("https://senuri-auto-server.onrender.com/api/customers/getcustomers"),
          axios.get("https://senuri-auto-server.onrender.com/api/products/getproducts")
        ]);
        setCustomers(customersRes.data);
        setAllProducts(productsRes.data);
        
        // Find and set the Cash customer if exists
        const cashCustomer = customersRes.data.find(c => c.customerName === "Cash");
        if (cashCustomer) {
          setCustomerName("Cash");
          setCustomerId(cashCustomer._id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Customer handling functions
  const filterCustomers = (input) => {
    if (isTypingCustomerNumber) {
      const filtered = customers.filter(customer =>
        customer.customerPhone && customer.customerPhone.includes(input)
      );
      setFilteredCustomers(filtered);
    } else {
      const filtered = customers.filter(customer =>
        customer.customerName.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
    setShowCustomerDropdown(true);
  };

  const handleCustomerNumberChange = (e) => {
    const value = e.target.value;
    setCustomerNumber(value);
    setIsTypingCustomerNumber(true);
    filterCustomers(value);
  };

  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    setCustomerName(value);
    setIsTypingCustomerNumber(false);
    filterCustomers(value);
  };

  const selectCustomer = (customer) => {
    setCustomerNumber(customer.customerPhone || "");
    setCustomerName(customer.customerName);
    setCustomerId(customer._id);
    setShowCustomerDropdown(false);
  };

  // Product handling functions
  const filterProducts = (input) => {
    if (input.trim() === "") {
      setFilteredProducts([]);
      setShowProductDropdown(false);
      return;
    }

    if (isTypingProductNumber) {
      const filtered = allProducts.filter(product =>
        product.productNo.startsWith(input)
      );
      setFilteredProducts(filtered);
    } else {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
    setShowProductDropdown(true);
  };

  const handleProductNumberChange = (e) => {
    const value = e.target.value;
    setNewProduct(prev => ({ ...prev, productNo: value }));
    setIsTypingProductNumber(true);
    filterProducts(value);
  };

  const handleProductNameChange = (e) => {
    const value = e.target.value;
    setNewProduct(prev => ({ ...prev, itemDescription: value }));
    setIsTypingProductNumber(false);
    filterProducts(value);
  };

  const selectProduct = (product) => {
    setNewProduct({
      productNo: product.productNo,
      itemDescription: product.name,
      unitPrice: product.price,
      quantity: 1,
      cost: product.cost
    });
    setShowProductDropdown(false);
  };

  // Product management functions
  const addProduct = () => {
    if (
      !newProduct.productNo ||
      !newProduct.itemDescription ||
      !newProduct.unitPrice ||
      !newProduct.quantity
    ) {
      message.error("Please fill in all product details before adding to the cart.");
      return;
    }

    const productWithCost = {
      ...newProduct,
      unitPrice: parseFloat(newProduct.unitPrice),
      quantity: parseInt(newProduct.quantity),
      cost: parseFloat(newProduct.cost || 0),
      totalCost: (parseFloat(newProduct.cost || 0) * parseInt(newProduct.quantity)),
      profit: ((parseFloat(newProduct.unitPrice) - parseFloat(newProduct.cost || 0)) * parseInt(newProduct.quantity))
    };

    if (editingIndex !== null) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[editingIndex] = productWithCost;
      setSelectedProducts(updatedProducts);
      setEditingIndex(null);
    } else {
      setSelectedProducts([...selectedProducts, productWithCost]);
    }

    setNewProduct({
      productNo: "",
      itemDescription: "",
      unitPrice: "",
      quantity: "",
      cost: ""
    });
  };

  const removeProduct = (index) => {
    const updatedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(updatedProducts);
  };

  const editProduct = (index) => {
    const productToEdit = selectedProducts[index];
    setNewProduct({
      productNo: productToEdit.productNo,
      itemDescription: productToEdit.itemDescription,
      unitPrice: productToEdit.unitPrice,
      quantity: productToEdit.quantity,
      cost: productToEdit.cost
    });
    setEditingIndex(index);
  };

  // Calculation functions
  const calculateTotal = () => {
    return selectedProducts
      .reduce((total, product) => total + (product.unitPrice * product.quantity), 0)
      .toFixed(2);
  };

  const calculateTotalCost = () => {
    return selectedProducts
      .reduce((total, product) => total + (product.cost * product.quantity), 0)
      .toFixed(2);
  };

  const calculateProfit = () => {
    return (parseFloat(calculateTotal()) - parseFloat(calculateTotalCost())).toFixed(2);
  };

  const remainingAmount = () => {
    return (parseFloat(amountPaid || 0) - parseFloat(calculateTotal())).toFixed(2);
  };

  const totalPayable = () => {
    return calculateTotal();
  };

  // Print handling
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
          padding: 20px;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
    removeAfterPrint: true
  });

  // Function to save the bill
  const saveBill = async () => {
    try {
      setIsLoading(true);
      
      // Validate customer details
      if (!customerName) {
        message.error("Please enter customer details before saving the bill.");
        return;
      }
      
      // Calculate amounts
      const subTotal = parseFloat(calculateTotal());
      const remaining = parseFloat(remainingAmount());
      const isCreditSale = remaining < 0;
      const creditAmount = isCreditSale ? Math.abs(remaining) : 0;
  
      // Prepare bill data (always save the actual remaining amount, positive or negative)
      const billData = {
        invoiceNumber,
        customer: customerId || null,
        customerName,
        customerPhone: customerNumber || "N/A",
        customerAddress: "N/A",
        subTotal,
        tax: 0,
        totalAmount: subTotal,
        totalCost: parseFloat(calculateTotalCost()),
        profit: subTotal - parseFloat(calculateTotalCost()),
        paymentMethod,
        amountPaid: parseFloat(amountPaid || 0),
        remainingAmount: remaining, // Keep the original value (positive or negative)
        creditAmount,
        isCredit: isCreditSale,
        cartItems: selectedProducts.map(item => ({
          productNo: item.productNo,
          itemDescription: item.itemDescription,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          cost: item.cost,
          totalItemCost: item.cost * item.quantity,
          profit: (item.unitPrice - item.cost) * item.quantity
        })),
        createdAt: new Date(),
      };
  
      // 1. Always save the bill first
      const response = await axios.post(
        "/api/bills/addbills", 
        billData
      );
  
      // 2. If this is a credit sale (remaining < 0) and not a Cash customer, update customer's credit
      if (isCreditSale && customerId && customerName !== "Cash") {
        try {
          await axios.post(
            `/api/customers/${customerId}/payments`,
            {
              amount: creditAmount,
              billId: response.data._id,
              description: `Credit sale INV-${invoiceNumber}`,
              type: 'credit'  // Explicitly mark as credit transaction
            }
          );
          
          // Refresh customer balance
          const balanceResponse = await axios.get(
            `/api/customers/${customerId}/balance`
          );
          setCustomerBalance(balanceResponse.data.balance || 0);
        } catch (error) {
          console.error("Error updating customer credit:", error);
          message.warning("Bill saved but failed to update customer credit balance");
        }
      }
  
      // 3. Always print the bill (regardless of payment status)
      handlePrint();
  
      // Show appropriate success message
      if (isCreditSale && customerName !== "Cash") {
        message.success(
          `Credit sale recorded! New outstanding balance: Rs ${(parseFloat(customerBalance) + creditAmount).toFixed(2)}`
        );
      } else {
        message.success("Bill generated successfully!");
      }
  
      // Reset form for next bill (keep customer info)
      const randomNumber = Math.floor(Math.random() * 100000);
      setInvoiceNumber(randomNumber.toString().padStart(5, "0"));
      setSelectedProducts([]);
      setAmountPaid("");
      setNewProduct({
        productNo: "",
        itemDescription: "",
        unitPrice: "",
        quantity: "",
        cost: ""
      });
  
    } catch (error) {
      console.error("Error generating bill:", error);
      message.error(
        error.response?.data?.message || 
        "Failed to generate bill. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LayoutApp>
      <div className="p-6 min-h-screen flex justify-center items-center">
        <div className="bg-white p-6 w-full max-w-4xl">
          <h2 className="text-lg font-bold mb-4">Billing System</h2>

          {/* Customer Information Section */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input 
                type="text" 
                value={`INV-${invoiceNumber}`} 
                readOnly 
                className="mt-1 block w-full border p-2" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input 
                type="date" 
                value={date} 
                readOnly 
                className="mt-1 block w-full border p-2" 
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Customer Number</label>
              <input
                type="text"
                placeholder="Customer Number"
                value={customerNumber}
                onChange={handleCustomerNumberChange}
                className="mt-1 block w-full border p-2"
                disabled={customerName === "Cash"}
              />
              {showCustomerDropdown && isTypingCustomerNumber && (
                <div className="absolute top-full left-0 w-full z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectCustomer(customer)}
                    >
                      {customer.customerPhone} - {customer.customerName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative customer-dropdown-container">
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={handleCustomerNameChange}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
              {showCustomerDropdown && !isTypingCustomerNumber && (
                <div className="customer-dropdown">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer._id}
                        className="customer-dropdown-item"
                        onMouseDown={() => selectCustomer(customer)}
                      >
                        {customer.customerName} - {customer.customerPhone || "No number"}
                      </div>
                    ))
                  ) : (
                    <div className="customer-dropdown-item text-gray-500">No customers found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Product Entry Section */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="relative product-dropdown-container">
              <label className="block text-sm font-medium text-gray-700">Product No</label>
              <input
                type="number"
                value={newProduct.productNo}
                onChange={handleProductNumberChange}
                onFocus={() => setShowProductDropdown(true)}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Enter product number"
              />
              {showProductDropdown && isTypingProductNumber && (
                <div className="product-dropdown">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="product-dropdown-item"
                        onMouseDown={() => selectProduct(product)}
                      >
                        {product.productNo} - {product.name}
                        <span className="float-right">Rs {product.price.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="product-dropdown-item text-gray-500">No products found</div>
                  )}
                </div>
              )}
            </div>

            <div className="relative product-dropdown-container">
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                value={newProduct.itemDescription}
                onChange={handleProductNameChange}
                onFocus={() => setShowProductDropdown(true)}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Enter product name"
              />
              {showProductDropdown && !isTypingProductNumber && filteredProducts.length > 0 && (
                <div className="product-dropdown">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="product-dropdown-item"
                      onMouseDown={() => selectProduct(product)}
                    >
                      {product.name} - {product.productNo}
                      <span className="float-right">Rs {product.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Price</label>
              <input
                type="number"
                value={newProduct.unitPrice}
                onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: e.target.value }))}
                className="mt-1 block w-full border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct(prev => ({
                  ...prev,
                  quantity: e.target.value
                }))}
                className="mt-1 block w-full border p-2"
                min="1"
              />
            </div>
          </div>
          <button 
            onClick={addProduct} 
            className="mt-2 add-to-cart-btn bg-blue-500 text-white p-2 addToCardBtn rounded"
            disabled={isLoading}
          >
            {editingIndex !== null ? "Update Product" : "Add to Cart"}
          </button>

          {/* Products Table */}
          <div className="table-container relative z-10 mt-4">
            <table className="w-full border mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Product No</th>
                  <th className="border p-2">Item Name</th>
                  <th className="border p-2">Unit Price</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.length > 0 ? (
                  selectedProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="border p-2">{product.productNo}</td>
                      <td className="border p-2">{product.itemDescription}</td>
                      <td className="border p-2">Rs {product.unitPrice.toFixed(2)}</td>
                      <td className="border p-2">{product.quantity}</td>
                      <td className="border p-2">Rs {(product.unitPrice * product.quantity).toFixed(2)}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => editProduct(index)}
                          className="bg-yellow-500 text-black p-2 edit-btn rounded mr-2 hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeProduct(index)}
                          className="bg-red-500 text-black p-2 remove-btn rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="border p-2 text-center text-gray-500">
                      No products added to cart
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payment Section */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 block w-full border p-2"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="mt-1 block w-full border p-2"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Totals Section */}
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <div className="flex justify-between font-bold mb-2">
              <span>Subtotal:</span>
              <span>Rs {calculateTotal()}</span>
            </div>
            <div className="flex justify-between font-bold mb-2">
              <span>Total Payable:</span>
              <span>Rs {totalPayable()}</span>
            </div>
            <div className="flex justify-between font-bold mb-2">
              <span>Amount Paid:</span>
              <span>Rs {amountPaid || '0.00'}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Remaining Amount:</span>
              <span style={{ color: remainingAmount() < 0 ? 'red' : 'inherit' }}>
                Rs {Math.abs(remainingAmount()).toFixed(2)}
                {remainingAmount() < 0 ? ' (Credit)' : ''}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              className="bg-green-500 bill-btn text-bla p-2 rounded hover:bg-green-600"
              onClick={saveBill}
              disabled={isLoading || selectedProducts.length === 0}
            >
              {isLoading ? 'Processing...' : 'Generate Bill'}
            </button>
            <button
              className="bg-red-500 clear-btn text-black p-2 rounded hover:bg-red-600"
              onClick={() => {
                // Generate new invoice number
                const randomNumber = Math.floor(Math.random() * 100000);
                setInvoiceNumber(randomNumber.toString().padStart(5, "0"));

                // Clear all form fields
                setSelectedProducts([]);
                setCustomerNumber("");
                setAmountPaid("");
                setNewProduct({
                  productNo: "",
                  itemDescription: "",
                  unitPrice: "",
                  quantity: "",
                  cost: ""
                });
                message.success("Form cleared successfully! New bill number generated.");
              }}
            >
              Clear Form
            </button>
            <button
              className="bg-yellow-400 text-black p-2 new-display-btn rounded hover:bg-yellow-500"
              onClick={() => {
                window.open('/', '_blank'); // Open bills view in new tab
              }}
            >
              New Display
            </button>
          </div>

          {/* Printable Invoice Section - Hidden until printed */}
          <div style={{ display: "none" }}>
            <div id="print-content" ref={componentRef} style={{ padding: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 24, fontWeight: 'bold' }}>INVOICE</h2>
                <p style={{ fontSize: 14 }}>Senuri Auto</p>
                <p style={{ fontSize: 12 }}>Business Address | Phone Number</p>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 20,
                borderBottom: '1px solid #ddd',
                paddingBottom: 10
              }}>
                <div>
                  <p><strong>Invoice No:</strong> INV-{invoiceNumber}</p>
                  <p><strong>Date:</strong> {moment(date).format('DD/MM/YYYY')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p><strong>Customer:</strong> {customerName || 'N/A'}</p>
                  <p><strong>Phone:</strong> {customerNumber || 'N/A'}</p>
                </div>
              </div>

              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                marginBottom: 20,
                border: '1px solid #ddd'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>#</th>
                    <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((product, index) => (
                    <tr key={index}>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{index + 1}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>
                        {product.itemDescription} ({product.productNo})
                      </td>
                      <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>
                        Rs {product.unitPrice?.toFixed(2) || '0.00'}
                      </td>
                      <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                        {product.quantity || 0}
                      </td>
                      <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>
                        Rs {(product.unitPrice * product.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ 
                textAlign: 'right', 
                marginTop: 20,
                borderTop: '1px solid #ddd',
                paddingTop: 10
              }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ marginRight: 10 }}>Subtotal:</span>
                  <strong>Rs {calculateTotal()}</strong>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ marginRight: 10 }}>Total Payable:</span>
                  <strong>Rs {totalPayable()}</strong>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ marginRight: 10 }}>Amount Paid:</span>
                  <strong>Rs {amountPaid || '0.00'}</strong>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ marginRight: 10 }}>Remaining Amount:</span>
                  <strong style={{ color: remainingAmount() < 0 ? 'red' : 'inherit' }}>
                    Rs {Math.abs(remainingAmount()).toFixed(2)}
                    {remainingAmount() < 0 ? ' (Credit)' : ''}
                  </strong>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ marginRight: 10 }}>Payment Method:</span>
                  <strong>{paymentMethod}</strong>
                </div>
              </div>

              <div style={{ 
                marginTop: 30, 
                textAlign: 'center', 
                fontStyle: 'italic',
                borderTop: '1px solid #ddd',
                paddingTop: 20
              }}>
                <p>Thank you for your business!</p>
                <p style={{ fontSize: 12 }}>Please retain this invoice for your records</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutApp>
  );
};

export default POSBilling;