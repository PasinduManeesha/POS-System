import React, { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import LayoutApp from '../../components/Layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./home.css";
import axios from "axios";
import { message } from "antd"; // Import message from Ant Design

const POSBilling = () => {
  // State variables
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [date] = useState(new Date().toISOString().split("T")[0]);
  const [newProduct, setNewProduct] = useState({
    productNo: "",
    itemDescription: "",
    unitPrice: "",
    quantity: "",
    cost: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
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

  // Refs
  const componentRef = useRef();

  // Generate invoice number on mount
  useEffect(() => {
    const generateInvoiceNumber = () => {
      const randomNumber = Math.floor(Math.random() * 100000);
      setInvoiceNumber(`INV-${randomNumber.toString().padStart(5, "0")}`);
    };
    generateInvoiceNumber();
  }, []);

  // Fetch customers and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersRes = await axios.get("/api/customers/getcustomers");
        const productsRes = await axios.get("/api/products/getproducts");
        setCustomers(customersRes.data);
        setAllProducts(productsRes.data);
        console.log(customersRes.data);
        console.log(productsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Customer handling functions
  const filterCustomers = (input) => {
    if (isTypingCustomerNumber) {
      const filtered = customers.filter(customer =>
        customer.customerPhone.includes(input)
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
    setCustomerNumber(customer.customerPhone);
    setCustomerName(customer.customerName);
    setShowCustomerDropdown(false);
  };

  // Product handling functions
  const filterProducts = (input) => {
    if (input.trim() === "") {
      setFilteredProducts([]); // Clear suggestions if input is empty
      setShowProductDropdown(false);
      return;
    }
  
    if (isTypingProductNumber) {
      const filtered = allProducts.filter(product =>
         product.productNo.startsWith(input)
      );
      console.log("Filtered by product number:", filtered);
      setFilteredProducts(filtered);
    } else {
      const filtered = allProducts.filter(product =>
         product.name.toLowerCase().includes(input.toLowerCase())
      );
      console.log("Filtered by product name:", filtered);
      setFilteredProducts(filtered);
    }
    setShowProductDropdown(true); // Ensure the dropdown is shown
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
    filterProducts(value); // Call filterProducts with the input value
  };

  // Update the selectProduct function to match your backend fields
  const selectProduct = (product) => {
    setNewProduct({
      productNo: product.productNo,       // Match your backend field
      itemDescription: product.name,      // Match your backend field
      unitPrice: product.price,           // Match your backend field
      quantity: 1
    });
    setShowProductDropdown(false);
  };

  // Product management functions
  const addProduct = () => {
    console.log("New Product:", newProduct);

    if (
      !newProduct.productNo ||
      !newProduct.itemDescription ||
      !newProduct.unitPrice ||
      !newProduct.quantity
    ) {
      alert("Please fill in all product details before adding to the cart.");
      return;
    }

    if (editingIndex !== null) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[editingIndex] = newProduct;
      setSelectedProducts(updatedProducts);
      setEditingIndex(null);
    } else {
      setSelectedProducts([...selectedProducts, newProduct]);
    }

    setNewProduct({
      productNo: "",
      itemDescription: "",
      unitPrice: "",
      quantity: "",
    });
  };

  const removeProduct = (index) => {
    const updatedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(updatedProducts);
  };

  const editProduct = (index) => {
    const productToEdit = selectedProducts[index];
    setNewProduct(productToEdit);
    setEditingIndex(index);
  };

  // Calculation functions
  const calculateTotal = () => {
    return selectedProducts
      .reduce((total, product) => total + product.unitPrice * product.quantity, 0)
      .toFixed(2);
  };

   // Calculation  functions
  //  const calculateTotalCost = () => {
  //   return selectedProducts
  //     .reduce((totalCost, product) => totalCost + product.cost * product.quantity, 0)
  //     .toFixed(2);
  // };

  const remainingAmount = () => {
    return (amountPaid - calculateTotal()).toFixed(2);
  };

  // Print handling
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // Function to save the bill
  const saveBill = async () => {
    try {
      // Validate customer details
      if (!customerName || !customerNumber) {
        message.error("Please enter customer details before saving the bill.");
        return;
      }
  
      // Validate cart items
      if (selectedProducts.length === 0) {
        message.error("Please add at least one product to the cart.");
        return;
      }
  
      const subTotal = calculateTotal();
      const tax = Number(((subTotal / 100) * 10).toFixed(2)); // Assuming 10% tax
      const totalAmount = Number((Number(subTotal) + tax).toFixed(2));
      

      const newObject = {
        customerName,
        customerPhone: customerNumber,
        customerAddress: "N/A",
        subTotal,
        tax,
        totalAmount,
        // totleCost,
        cartItems: selectedProducts,
        createdAt: new Date(),
      };
  
      console.log("Data being sent to the backend:", newObject);
  
      await axios.post("/api/bills/addbills", newObject);
      message.success("Bill Generated!");
  
      // Print the bill after it is successfully saved
      handlePrint();
    } catch (error) {
      message.error("Error generating bill!");
      console.error("Error response from backend:", error.response?.data || error.message);
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
              <input type="text" value={invoiceNumber} readOnly className="mt-1 block w-full border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" value={date} readOnly className="mt-1 block w-full border p-2" />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Customer Number</label>
              <input
                type="text"
                placeholder="Customer Number"
                value={customerNumber}
                onChange={handleCustomerNumberChange}
                className="mt-1 block w-full border p-2"
              />
              {showCustomerDropdown && isTypingCustomerNumber && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg">
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
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={handleCustomerNameChange}
                className="mt-1 block w-full border p-2"
              />
              {showCustomerDropdown && !isTypingCustomerNumber && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectCustomer(customer)}
                    >
                      {customer.customerName} - {customer.customerPhone}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Entry Section */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Product No</label>
              <input
                type="number"
                value={newProduct.productNo}
                onChange={(e) => setNewProduct(prev => ({
                  ...prev,
                  productNo: Number(e.target.value)
                }))}
                className="mt-1 block w-full border p-2"
              />
              {showProductDropdown && isTypingProductNumber && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectProduct(product)}
                    >
                      {product.productNo} - {product.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                value={newProduct.itemDescription}
                onChange={handleProductNameChange}
                className="mt-1 block w-full border p-2"
                placeholder="Enter product name"
              />
              {showProductDropdown && !isTypingProductNumber && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectProduct(product)}
                    >
                      {product.name} - {product.productNo}
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
                  quantity: Number(e.target.value)
                }))}
                className="mt-1 block w-full border p-2"
              />
            </div>
          </div>
          <button onClick={addProduct} className="mt-2 bg-blue-500 text-black p-2 addToCardBtn rounded">
              {editingIndex !== null ? "Update Product" : "Add to Cart"}
            </button>

          {/* Products Table */}
          <div className="table-container">
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
                    <td className="border p-2">${product.unitPrice}</td>
                    <td className="border p-2">{product.quantity}</td>
                    <td className="border p-2">${(product.unitPrice * product.quantity).toFixed(2)}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => editProduct(index)}
                        className="bg-yellow-500 text-white p-1 rounded mr-2 hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeProduct(index)}
                        className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </td>
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
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 block w-full border p-2"
              >
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Credit Card Payment">Credit Card Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="mt-1 block w-full border p-2"
              />
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-between font-bold mb-4">
            <span>Total Value:</span>
            <span>${calculateTotal()}</span>
          </div>
          <div className="flex justify-between font-bold mb-4">
            <span>Remaining Amount to be Paid:</span>
            <span>${remainingAmount()}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
              onClick={saveBill}
            >
              Bill Print
            </button>
            <button className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600" onClick={saveBill}>
              Suspend
            </button>
            <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              New Display
            </button>
            <button className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
              End Storage
            </button>
          </div>

          {/* Printable Invoice Section */}
          <div style={{ display: "none" }}>
            <div ref={componentRef} className="p-6">
              <h2 className="text-2xl font-bold mb-4">Invoice</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="font-semibold">Invoice Number:</p>
                  <p>{invoiceNumber}</p>
                </div>
                <div>
                  <p className="font-semibold">Date:</p>
                  <p>{date}</p>
                </div>
                <div>
                  <p className="font-semibold">Customer Number:</p>
                  <p>{customerNumber}</p>
                </div>
                <div>
                  <p className="font-semibold">Customer Name:</p>
                  <p>{customerName}</p>
                </div>
              </div>

              <table className="w-full border mb-6">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Product No</th>
                    <th className="border p-2">Item Description</th>
                    <th className="border p-2">Unit Price</th>
                    <th className="border p-2">Quantity</th>
                    <th className="border p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="border p-2">{product.productNo}</td>
                      <td className="border p-2">{product.itemDescription}</td>
                      <td className="border p-2">${product.unitPrice}</td>
                      <td className="border p-2">{product.quantity}</td>
                      <td className="border p-2">${(product.unitPrice * product.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-right">
                <p className="font-semibold text-lg">Total Value: ${calculateTotal()}</p>
                <p className="font-semibold text-lg">Amount Paid: ${amountPaid}</p>
                <p className="font-semibold text-lg">
                  Remaining Amount: ${remainingAmount()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {console.log("Selected Products:", selectedProducts)}
    </LayoutApp>
  );
};

export default POSBilling;