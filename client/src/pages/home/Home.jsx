import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import LayoutApp from '../../components/Layout';
import "./home.css";

const POSBilling = () => {
  const [invoiceNumber, setInvoiceNumber] = useState("53011");
  const [customerNumber, setCustomerNumber] = useState("0001");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState("2025-03-21");
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    subNumber: "",
    itemDescription: "",
    unitPrice: "",
    quantity: "",
  });
  const [editingIndex, setEditingIndex] = useState(null); // Track the index of the product being edited
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [amountPaid, setAmountPaid] = useState("");

  const componentRef = useRef();

  const addProduct = () => {
    if (newProduct.subNumber && newProduct.itemDescription && newProduct.unitPrice && newProduct.quantity) {
      if (editingIndex !== null) {
        // If editing, update the existing product
        const updatedProducts = [...products];
        updatedProducts[editingIndex] = newProduct;
        setProducts(updatedProducts);
        setEditingIndex(null); // Reset editing state
      } else {
        // If not editing, add a new product
        setProducts([...products, newProduct]);
      }
      setNewProduct({ subNumber: "", itemDescription: "", unitPrice: "", quantity: "" }); // Clear the form
    }
  };

  const removeProduct = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };

  const editProduct = (index) => {
    const productToEdit = products[index];
    setNewProduct(productToEdit); // Populate the form with the product to edit
    setEditingIndex(index); // Set the editing index
  };

  const calculateTotal = () => {
    return products.reduce((total, product) => total + product.unitPrice * product.quantity, 0).toFixed(2);
  };

  const remainingAmount = () => {
    return (amountPaid - calculateTotal()).toFixed(2);
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <LayoutApp>
      <div className="p-6 bg-gray-100 min-h-screen flex justify-center items-center">
        <div className="bg-white p-6 rounded shadow-lg w-full max-w-4xl">
          <h2 className="text-lg font-bold mb-4">Billing System</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <input type="text" value={invoiceNumber} readOnly className="mt-1 block w-full border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" value={date} readOnly className="mt-1 block w-full border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Number</label>
              <input type="text" value={customerNumber} readOnly className="mt-1 block w-full border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 block w-full border p-2" />
            </div>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold">Add Product</h3>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <input type="text" placeholder="Sub-Number" value={newProduct.subNumber} onChange={(e) => setNewProduct({ ...newProduct, subNumber: e.target.value })} className="border p-2" />
              <input type="text" placeholder="Item Description" value={newProduct.itemDescription} onChange={(e) => setNewProduct({ ...newProduct, itemDescription: e.target.value })} className="border p-2" />
              <input type="number" placeholder="Unit Price" value={newProduct.unitPrice} onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) || "" })} className="border p-2" />
              <input type="number" placeholder="Quantity" value={newProduct.quantity} onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || "" })} className="border p-2" />
            </div>
            <button onClick={addProduct} className="mt-2 bg-blue-500 text-white p-2 addToCardBtn rounded">
              {editingIndex !== null ? "Update Product" : "Add to Cart"}
            </button>
          </div>
          <div className="table-container">
            <table className="w-full border mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Sub-Number</th>
                  <th className="border p-2">Item Description</th>
                  <th className="border p-2">Unit Price</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index}>
                    <td className="border p-2">{product.subNumber}</td>
                    <td className="border p-2">{product.itemDescription}</td>
                    <td className="border p-2">{product.unitPrice}</td>
                    <td className="border p-2">{product.quantity}</td>
                    <td className="border p-2">{(product.unitPrice * product.quantity).toFixed(2)}</td>
                    <td className="border p-2">
                      <button onClick={() => editProduct(index)} className="bg-yellow-500 text-white p-1 rounded mr-2">Edit</button>
                      <button onClick={() => removeProduct(index)} className="bg-red-500 text-white p-1 rounded">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                placeholder="Amount Paid" 
                value={amountPaid} 
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || "")} 
                className="mt-1 block w-full border p-2" 
              />
            </div>
          </div>
          <div className="flex justify-between font-bold mb-4">
            <span>Total Value:</span>
            <span>${calculateTotal()}</span>
          </div>
          <div className="flex justify-between font-bold mb-4">
            <span>Remaining Amount to be Paid:</span>
            <span>${remainingAmount()}</span>
          </div>
          <div className="flex justify-between">
            <button className="bg-green-500 text-white p-2 rounded" onClick={handlePrint}>Bill Print</button>
            <button className="bg-yellow-500 text-white p-2 rounded">Suspend</button>
            <button className="bg-blue-500 text-white p-2 rounded">New Display</button>
            <button className="bg-gray-500 text-white p-2 rounded">End Storage</button>
          </div>

          {/* Printable Bill Section */}
          <div style={{ display: "none" }}>
            <div ref={componentRef} className="p-6">
              <h2 className="text-lg font-bold mb-4">Invoice</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <span>{invoiceNumber}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <span>{date}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Number</label>
                  <span>{customerNumber}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <span>{customerName}</span>
                </div>
              </div>
              <table className="w-full border mb-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Sub-Number</th>
                    <th className="border p-2">Item Description</th>
                    <th className="border p-2">Unit Price</th>
                    <th className="border p-2">Quantity</th>
                    <th className="border p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={index}>
                      <td className="border p-2">{product.subNumber}</td>
                      <td className="border p-2">{product.itemDescription}</td>
                      <td className="border p-2">{product.unitPrice}</td>
                      <td className="border p-2">{product.quantity}</td>
                      <td className="border p-2">{(product.unitPrice * product.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between font-bold mb-4">
                <span>Total Value:</span>
                <span>${calculateTotal()}</span>
              </div>
              <div className="flex justify-between font-bold mb-4">
                <span>Amount Paid:</span>
                <span>${amountPaid}</span>
              </div>
              <div className="flex justify-between font-bold mb-4">
                <span>Remaining Amount to be Paid:</span>
                <span>${remainingAmount()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutApp>
  );
};

export default POSBilling;