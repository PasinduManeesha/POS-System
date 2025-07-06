import React, { useState, useRef, useEffect, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import LayoutApp from '../../components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./home.css";
import axios from "axios";
import { message, Modal, Button } from "antd";
import moment from "moment";
import Logo from '../../Img/cake-shop-logo.png';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const COMPANY_NAME = process.env.REACT_APP_COMPANY_NAME;
const COMPANY_ADDRESS = process.env.REACT_APP_COMPANY_ADDRESS;
const COMPANY_PHONE = process.env.REACT_APP_COMPANY_PHONE;

console.log("BASE_URL:", COMPANY_NAME, COMPANY_ADDRESS, COMPANY_PHONE);

const POSBilling = () => {
  // State declarations
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
    cost: ""
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
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(-1);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const [popModal, setPopModal] = useState(false);

  const shortcuts = [
    { keys: ["F1"], description: "Focus Amount Paid Field" },
    { keys: ["F2"], description: "Focus Payment Method" },
    { keys: ["F3"], description: "Focus Customer Name" },
    { keys: ["Tab"], description: "Generate Bill" },
    { keys: ["Del"], description: "Clear Form" },
    { keys: ["Ctrl", "N"], description: "New Display Window" },
    { keys: ["F4"], description: "Show This Help" }
  ];

  // Refs
  const componentRef = useRef();
  const productNoRef = useRef();
  const unitPriceRef = useRef();
  const quantityRef = useRef();
  const amountPaidInput = useRef(null);
  const paymentMethodSelect = useRef(null);
  const customerNameInput = useRef(null);
  const clearButton = useRef(null);
  const newDisplayButton = useRef(null);
  const saveBillRef = useRef();
  const handlePrintRef = useRef();

  // Print handling
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 2mm;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          font-size: 10pt;
          line-height: 1.2;
        }
        #print-content {
          display: block !important;
        }
      }
    `,
    removeAfterPrint: true,
    onAfterPrint: () => {
      // Reset form after successful printing
      setInvoiceNumber(Math.floor(Math.random() * 100000).toString().padStart(5, "0"));
      setSelectedProducts([]);
      setAmountPaid("");
      setCustomerNumber("");
      setCustomerName(customers.find(c => c.customerName?.toLowerCase() === "cash") ? "Cash" : "");
    }
  });

  useEffect(() => {
    handlePrintRef.current = handlePrint;
  }, [handlePrint]);

  // Generate invoice number on mount
  useEffect(() => {
    const generateInvoiceNumber = () => {
      const randomNumber = Math.floor(Math.random() * 100000);
      setInvoiceNumber(randomNumber.toString().padStart(5, "0"));
    };
    generateInvoiceNumber();
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [customersRes, productsRes] = await Promise.all([
          axios.get(`${BASE_URL}/customers/getcustomers`),
          axios.get(`${BASE_URL}/products/getproducts`)
        ]);
        const customersData = customersRes.data.customers || customersRes.data.data || customersRes.data;
        const productsData = productsRes.data.products || productsRes.data.data || productsRes.data;
        setCustomers(customersData);
        setAllProducts(productsData);
        const cashCustomer = customersData.find(c => c.customerName?.toLowerCase() === "cash");
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

  // Customer handlers
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

  const handleCustomerKeyDown = (e) => {
    if (!showCustomerDropdown || filteredCustomers.length === 0) return;
    if (e.key === 'ArrowDown') {
      setHighlightedCustomerIndex((prev) =>
        prev < filteredCustomers.length - 1 ? prev + 1 : 0
      );
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlightedCustomerIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCustomers.length - 1
      );
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (highlightedCustomerIndex >= 0) {
        selectCustomer(filteredCustomers[highlightedCustomerIndex]);
        setTimeout(() => productNoRef.current?.focus(), 0);
      }
      e.preventDefault();
    }
  };

  // Product handlers
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

  const handleProductKeyDown = (e) => {
    if (!showProductDropdown || filteredProducts.length === 0) return;
    if (e.key === 'ArrowDown') {
      setHighlightedProductIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlightedProductIndex(prev => Math.max(prev - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter' && highlightedProductIndex >= 0) {
      selectProduct(filteredProducts[highlightedProductIndex]);
      e.preventDefault();
    }
  };

  // Helper functions
  const filterCustomers = (input) => {
    const filtered = isTypingCustomerNumber
      ? customers.filter(c => c.customerPhone?.includes(input))
      : customers.filter(c => c.customerName?.toLowerCase().includes(input.toLowerCase()));
    setFilteredCustomers(filtered);
    setShowCustomerDropdown(true);
  };

  const filterProducts = (input) => {
    const filtered = isTypingProductNumber
      ? allProducts.filter(p => p.productNo?.startsWith(input))
      : allProducts.filter(p => p.name?.toLowerCase().includes(input.toLowerCase()));
    setFilteredProducts(filtered);
    setShowProductDropdown(true);
  };

  const selectCustomer = (customer) => {
    setCustomerNumber(customer.customerPhone || "");
    setCustomerName(customer.customerName);
    setCustomerId(customer._id);
    setShowCustomerDropdown(false);
    productNoRef.current?.focus();
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
    setTimeout(() => unitPriceRef.current?.focus(), 0);
  };

  // Product management
  const addProduct = () => {
    if (!newProduct.productNo || !newProduct.itemDescription || !newProduct.unitPrice || !newProduct.quantity) {
      message.error("Please fill in all product details");
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
    setSelectedProducts(prev => editingIndex !== null
      ? prev.map((item, i) => i === editingIndex ? productWithCost : item)
      : [...prev, productWithCost]
    );
    setNewProduct({ productNo: "", itemDescription: "", unitPrice: "", quantity: "", cost: "" });
    setEditingIndex(null);
    productNoRef.current?.focus();
  };

  const removeProduct = (index) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const editProduct = (index) => {
    const product = selectedProducts[index];
    setNewProduct({
      productNo: product.productNo,
      itemDescription: product.itemDescription,
      unitPrice: product.unitPrice,
      quantity: product.quantity,
      cost: product.cost
    });
    setEditingIndex(index);
  };

  // Calculations
  const calculateTotal = () => selectedProducts
    .reduce((total, p) => total + (p.unitPrice * p.quantity), 0)
    .toFixed(2);

  const calculateTotalCost = () => selectedProducts
    .reduce((total, p) => total + (p.cost * p.quantity), 0)
    .toFixed(2);

  const calculateProfit = () => (parseFloat(calculateTotal()) - parseFloat(calculateTotalCost())).toFixed(2);

  const remainingAmount = () => (parseFloat(amountPaid || 0) - parseFloat(calculateTotal())).toFixed(2);

  // Save bill function
  const saveBill = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!customerName) {
        message.error("Please enter customer details");
        return;
      }

      const subTotal = parseFloat(calculateTotal());
      const remaining = parseFloat(remainingAmount());

      if (customerName.toLowerCase() === "cash" && remaining < 0) {
        message.error("Cash customers cannot have credit");
        return;
      }

      const billData = {
        invoiceNumber,
        customer: customerId,
        customerName,
        customerPhone: customerNumber || "N/A",
        subTotal,
        totalAmount: subTotal,
        totalCost: parseFloat(calculateTotalCost()),
        profit: parseFloat(calculateProfit()),
        paymentMethod,
        amountPaid: parseFloat(amountPaid || 0),
        remainingAmount: remaining,
        creditAmount: Math.max(-remaining, 0),
        isCredit: remaining < 0,
        status: remaining < 0 ? 'pending' : 'completed',
        cartItems: selectedProducts.map(item => ({
          productNo: item.productNo,
          itemDescription: item.itemDescription,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          cost: item.cost,
          totalItemCost: item.cost * item.quantity,
          profit: (item.unitPrice - item.cost) * item.quantity
        })),
      };

      const response = await axios.post(`${BASE_URL}/bills/addbills`, billData);

      // Update customer balance for credit transactions (unpaid)
      if (remaining < 0 && customerId && customerName.toLowerCase() !== "cash") {
        const balanceRes = await axios.get(`${BASE_URL}/customers/${customerId}/balance`);
        setCustomerBalance(balanceRes.data.balance || 0);
      }

      message.success("Bill generated successfully!");

      // Trigger print after saving
      if (handlePrintRef.current) {
        handlePrintRef.current();
      }

    } catch (error) {
      console.error("Error saving bill:", error);
      message.error(error.response?.data?.message || "Failed to save bill");
    } finally {
      setIsLoading(false);
    }
  }, [customerId, customerName, selectedProducts, paymentMethod, amountPaid, customers, invoiceNumber, customerNumber]);

  useEffect(() => {
    saveBillRef.current = saveBill;
  }, [saveBill]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        amountPaidInput.current?.focus();
      } 
      // Remove Tab global handler for bill generation
      else if (e.key === 'F2') {
        e.preventDefault();
        paymentMethodSelect.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        customerNameInput.current?.focus();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        clearButton.current?.click();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newDisplayButton.current?.click();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [customerName, selectedProducts]);

  return (
    <LayoutApp>
      <div className="p-6 min-h-screen flex justify-center items-center">
        <div className="bg-white p-6 w-full max-w-4xl rounded">


          {/* Modal */}
          <Modal
            title="Keyboard Shortcuts"
            visible={popModal}
            onCancel={() => setPopModal(false)}
            footer={null}
            destroyOnClose
          >
            <div className="shortcut-list">
              {shortcuts.map((shortcut, index) => (
                <div className="shortcut-item" key={index}>
                  <div className="key-combination">
                    {shortcut.keys.map((key, i) => (
                      <React.Fragment key={i}>
                        <kbd className="key">{key}</kbd>
                        {i < shortcut.keys.length - 1 && <span> + </span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <span>{shortcut.description}</span>
                </div>
              ))}
            </div>
          </Modal>

          {/* Customer Section */}
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
                onFocus={() => {
                  setShowCustomerDropdown(true);
                  setIsTypingCustomerNumber(true);
                  filterCustomers(customerNumber);
                  setHighlightedCustomerIndex(0);
                }}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                onKeyDown={(e) => {
                  if (showCustomerDropdown && filteredCustomers.length > 0) {
                    if (e.key === 'ArrowDown') {
                      setHighlightedCustomerIndex((prev) =>
                        prev < filteredCustomers.length - 1 ? prev + 1 : 0
                      );
                      e.preventDefault();
                    } else if (e.key === 'ArrowUp') {
                      setHighlightedCustomerIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredCustomers.length - 1
                      );
                      e.preventDefault();
                    } else if (e.key === 'Enter') {
                      if (highlightedCustomerIndex >= 0) {
                        selectCustomer(filteredCustomers[highlightedCustomerIndex]);
                        setTimeout(() => productNoRef.current?.focus(), 0);
                      }
                      e.preventDefault();
                    }
                  }
                }}
                className="mt-1 block w-full border p-2"
                disabled={customerName === "Cash"}
              />
              {showCustomerDropdown && isTypingCustomerNumber && (
                <div className="absolute top-full left-0 w-full z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer, index) => (
                      <div
                        key={customer._id}
                        className={`p-2 hover:bg-gray-100 cursor-pointer ${index === highlightedCustomerIndex ? 'bg-gray-200' : ''}`}
                        onMouseDown={() => {
                          selectCustomer(customer);
                          setTimeout(() => productNoRef.current?.focus(), 0);
                        }}
                      >
                        {customer.customerPhone} - {customer.customerName}
                      </div>
                    ))
                  ) : (
                    <div className="customer-dropdown-item text-gray-500">No customers found</div>
                  )}
                </div>
              )}
            </div>
            <div className="relative customer-dropdown-container">
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                ref={customerNameInput}
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={handleCustomerNameChange}
                onFocus={() => {
                  setShowCustomerDropdown(true);
                  filterCustomers(customerName);
                  setHighlightedCustomerIndex(0); // Always highlight first
                }}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                onKeyDown={(e) => {
                  if (showCustomerDropdown && filteredCustomers.length > 0) {
                    if (e.key === 'ArrowDown') {
                      setHighlightedCustomerIndex((prev) => Math.min(prev + 1, filteredCustomers.length - 1));
                      e.preventDefault();
                    } else if (e.key === 'ArrowUp') {
                      setHighlightedCustomerIndex((prev) => Math.max(prev - 1, 0));
                      e.preventDefault();
                    } else if (e.key === 'Enter') {
                      if (highlightedCustomerIndex >= 0) {
                        selectCustomer(filteredCustomers[highlightedCustomerIndex]);
                        setTimeout(() => productNoRef.current?.focus(), 0);
                      }
                      e.preventDefault();
                    }
                  }
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
              {showCustomerDropdown && !isTypingCustomerNumber && (
                <div className="customer-dropdown">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer, index) => (
                      <div
                        key={customer._id}
                        className={`customer-dropdown-item ${index === highlightedCustomerIndex ? 'bg-gray-200' : ''}`}
                        onMouseDown={() => {
                          selectCustomer(customer);
                          setTimeout(() => productNoRef.current?.focus(), 0);
                        }}
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
                ref={productNoRef}
                type="text"
                value={newProduct.productNo}
                onChange={handleProductNumberChange}
                onFocus={() => {
                  setShowProductDropdown(true);
                  filterProducts(newProduct.productNo);
                  setHighlightedProductIndex(0);
                }}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                onKeyDown={(e) => {
                  if (showProductDropdown && filteredProducts.length > 0) {
                    if (e.key === 'ArrowDown') {
                      setHighlightedProductIndex((prev) =>
                        prev < filteredProducts.length - 1 ? prev + 1 : 0
                      );
                      e.preventDefault();
                    } else if (e.key === 'ArrowUp') {
                      setHighlightedProductIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredProducts.length - 1
                      );
                      e.preventDefault();
                    } else if (e.key === 'Enter') {
                      if (highlightedProductIndex >= 0) {
                        selectProduct(filteredProducts[highlightedProductIndex]);
                        setTimeout(() => unitPriceRef.current?.focus(), 0);
                      }
                      e.preventDefault();
                    }
                  }
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Enter product number"
              />
              {showProductDropdown && isTypingProductNumber && (
                <div className="product-dropdown">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => (
                      <div
                        key={product._id}
                        className={`product-dropdown-item ${index === highlightedProductIndex ? 'bg-gray-200' : ''}`}
                        onMouseDown={() => {
                          selectProduct(product);
                          setTimeout(() => unitPriceRef.current?.focus(), 0);
                        }}
                      >
                        {product.productNo} - {product.name}
                        <span className="float-right">Rs {product.price?.toFixed(2)}</span>
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
                onKeyDown={handleProductKeyDown}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                placeholder="Enter product name"
              />
              {showProductDropdown && !isTypingProductNumber && filteredProducts.length > 0 && (
                <div className="product-dropdown">
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product._id}
                      className={`product-dropdown-item ${index === highlightedProductIndex ? 'bg-gray-200' : ''}`}
                      onMouseDown={() => selectProduct(product)}
                    >
                      {product.name} - {product.productNo}
                      <span className="float-right">Rs {product.price?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Price</label>
              <input
                ref={unitPriceRef}
                type="number"
                value={newProduct.unitPrice}
                onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    quantityRef.current?.focus();
                  }
                }}
                className="mt-1 block w-full border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                ref={quantityRef}
                type="number"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addProduct();
                    setTimeout(() => productNoRef.current?.focus(), 0);
                  }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    amountPaidInput.current?.focus();
                  }
                }}
                className="mt-1 block w-full border p-2"
                min="1"
              />
            </div>
          </div>
          {/* <button
            onClick={addProduct}
            className="mt-2 add-to-cart-btn bg-blue-500 text-white p-2 addToCardBtn rounded"
            disabled={isLoading}
          >
            {editingIndex !== null ? "Update Product" : "Add to Cart"}
          </button> */}

          {/* Cart Items Table */}
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
                {selectedProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="border p-2">{product.productNo}</td>
                    <td className="border p-2">{product.itemDescription}</td>
                    <td className="border p-2">Rs {product.unitPrice?.toFixed(2)}</td>
                    <td className="border p-2">{product.quantity}</td>
                    <td className="border p-2">Rs {(product.unitPrice * product.quantity)?.toFixed(2)}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => editProduct(index)}
                        className="bg-yellow-500 text-black px-3 py-1 rounded mr-2 hover:bg-yellow-600 edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeProduct(index)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 remove-btn"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Add empty rows if needed */}
                {Array.from({ length: Math.max(0, 5 - selectedProducts.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`}>
                    <td className="border p-2" colSpan={6} style={{ height: '51px', background: '#f9fafb' }}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Section */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                ref={paymentMethodSelect}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 block w-full border p-2"
                disabled={customerName.trim().toLowerCase() === "cash"}
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
                ref={amountPaidInput}
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="mt-1 block w-full border p-2"
                min="0"
                step="0.01"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveBill();
                  }
                }}
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
              <span>Rs {calculateTotal()}</span>
            </div>
            {/* <div className="flex justify-between font-bold mb-2">
              <span>Amount Paid:</span>
              <span>Rs {amountPaid || '0.00'}</span>
            </div> */}
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
              className="bg-green-500 bill-btn text-black p-2 rounded hover:bg-green-600"
              onClick={saveBill}
              disabled={isLoading || selectedProducts.length === 0}
            >
              {isLoading ? 'Processing...' : 'Generate Bill (Tab)'}
            </button>
            <button
              ref={clearButton}
              className="bg-red-500 clear-btn text-white p-2 rounded hover:bg-red-600"
              onClick={() => {
                setInvoiceNumber(Math.floor(Math.random() * 100000).toString().padStart(5, "0"));
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
                message.success("Form cleared");
              }}
            >
              Clear Form
            </button>
            <button
              ref={newDisplayButton}
              className="bg-yellow-400 text-black p-2 new-display-btn rounded hover:bg-yellow-500"
              onClick={() => window.open('/', '_blank')}
            >
              New Display
            </button>

             {/* Action Button */}
          <Button
            className="add-new"
            type="primary"
            onClick={() => setPopModal(true)}
          >
            Shortcuts
          </Button>
          </div>
          
         

          <div style={{ display: "none" }}>
  <div 
    id="print-content" 
    ref={componentRef} 
    style={{ 
      width: '76mm', 
      fontFamily: 'Arial, sans-serif', 
      fontSize: '10pt', 
      lineHeight: '1.1',
      padding: '2mm',
      boxSizing: 'border-box',
      fontWeight: 550  // Default bolder text
    }}
  >
    {/* Header with bolder text */}
    <div style={{ 
      textAlign: 'center', 
      borderBottom: '2px dashed #000',
      paddingBottom: '3mm',
      marginBottom: '3mm'
    }}>
      <img 
        src={Logo} 
        alt="Logo" 
        style={{ 
          width: '20mm',  // Slightly smaller to save space
          height: '20mm', 
          margin: '0 auto 2mm',
          objectFit: 'contain'
        }} 
      />
      <h1 style={{ 
        fontSize: '14pt', 
        margin: '0 0 1mm',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {COMPANY_NAME}
      </h1>
      <p style={{ 
        fontSize: '8pt', 
        margin: '0',
        lineHeight: '1.2',
        fontWeight: 'bold'
      }}>
        {COMPANY_ADDRESS}
      </p>
      <p style={{ 
        fontSize: '9pt', 
        margin: '0',
        fontWeight: 'bold'
      }}>
        Tel: {COMPANY_PHONE}
      </p>
    </div>

    {/* Invoice Info - bolder and larger */}
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1mm',
      marginBottom: '3mm',
      fontSize: '9pt',
      fontWeight: 'bold'
    }}>
      <div>
        <span style={{ fontWeight: 'bold' }}>Invoice:</span> INV-{invoiceNumber}
      </div>
      <div>
        <span style={{ fontWeight: 'bold' }}>Date:</span> {moment(date).format('DD/MM/YY')}
      </div>
      <div style={{ gridColumn: 'span 2' }}>
        <span style={{ fontWeight: 'bold' }}>Customer:</span> {customerName || 'Walk-in'}
      </div>
      <div style={{ gridColumn: 'span 2' }}>
        <span style={{ fontWeight: 'bold' }}>Phone:</span> {customerNumber || 'N/A'}
      </div>
    </div>

    {/* Items Table - bolder text */}
    <table style={{ 
      width: '100%', 
      fontSize: '9pt', 
      borderCollapse: 'collapse',
      marginBottom: '3mm',
      fontWeight: 'bold'
    }}>
      <thead>
        <tr style={{ borderBottom: '2px dashed #000' }}>
          <th style={{ textAlign: 'left', padding: '1mm 0', width: '5%' }}>#</th>
          <th style={{ textAlign: 'left', padding: '1mm 0', width: '35%' }}>Item</th>
          <th style={{ textAlign: 'right', padding: '1mm 0', width: '15%' }}>Price</th>
          <th style={{ textAlign: 'center', padding: '1mm 0', width: '15%' }}>Qty</th>
          <th style={{ textAlign: 'right', padding: '1mm 0', width: '30%' }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {selectedProducts.map((product, index) => (
          <tr key={index} style={{ borderBottom: '1px dashed #ccc' }}>
            <td style={{ padding: '1.5mm 0', verticalAlign: 'top' }}>{index + 1}</td>
            <td style={{ padding: '1.5mm 0', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold' }}>{product.itemDescription}</div>
              {/* <div style={{ fontSize: '8pt' }}>({product.productNo})</div> */}
            </td>
            <td style={{ padding: '1.5mm 0', textAlign: 'right', verticalAlign: 'top' }}>
              {product.unitPrice?.toFixed(2)}
            </td>
            <td style={{ padding: '1.5mm 0', textAlign: 'center', verticalAlign: 'top' }}>
              {product.quantity || 0}
            </td>
            <td style={{ padding: '1.5mm 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>
              {(product.unitPrice * product.quantity)?.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Totals Section - emphasized numbers */}
    <div style={{ 
      borderTop: '2px dashed #000',
      borderBottom: '2px dashed #000',
      padding: '2.5mm 0',
      marginBottom: '3mm'
    }}>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '2mm',
        fontWeight: 'bold'
      }}>
        <span>SUBTOTAL:</span>
        <span>Rs {calculateTotal()}</span>
      </div>
      
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '2mm',
        fontWeight: 'bold'
      }}>
        <span>AMOUNT PAID:</span>
        <span>Rs {amountPaid || '0.00'}</span>
      </div>
      
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '2mm',
        fontWeight: 'bold'
      }}>
        <span>PAYMENT METHOD:</span>
        <span>{paymentMethod}</span>
      </div>
      
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        fontWeight: 'bold',
        fontSize: '10pt',
        marginTop: '2mm',
        paddingTop: '2mm',
        borderTop: '1px dashed #ccc'
      }}>
        <span>BALANCE:</span>
        <span style={{ 
          color: remainingAmount() < 0 ? 'red' : 'inherit',
          fontWeight: 'bold',
          fontSize: '10pt'
        }}>
          Rs {Math.abs(remainingAmount()).toFixed(2)}
          {remainingAmount() < 0 ? ' (CREDIT)' : remainingAmount() > 0 ? ' (CHANGE)' : ''}
        </span>
      </div>
    </div>

    {/* Footer with larger text */}
    <div style={{ 
      textAlign: 'center',
      fontSize: '9pt',
      paddingTop: '2mm',
      fontWeight: 'bold'
    }}>
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '2mm',
        fontSize: '10pt'
      }}>
        THANK YOU FOR YOUR BUSINESS!
      </div>
      {/* <div style={{ fontSize: '8pt', fontWeight: 'bold' }}>
        {moment().format('DD MMM YYYY hh:mm A')}
      </div> */}
      <div style={{ 
        fontSize: '8pt', 
        marginTop: '2mm',
        borderTop: '1px dashed #000',
        paddingTop: '2mm',
        fontWeight: 'bold'
      }}>
        <p>Software Partner CWS • Phone 076 1838000</p>  
      </div>
    </div>
  </div>
</div>
        </div>
      </div>
    </LayoutApp>
  );
};

export default POSBilling;
