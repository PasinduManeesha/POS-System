import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "antd/dist/antd.min.css";
import "./App.css";
import Home from "./pages/home/Home";
import Products from "./pages/products/Products";
import Cart from "./pages/cart/Cart";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Bills from "./pages/bills/Bills";
import Customers from "./pages/customers/Customers";
import Category from "./pages/category/category";
import Suppliers from "./pages/suppliers/suppliers";
import Inventory from "./pages/inventory/inventory";
import ProfitReport from "./pages/reports/profit";
import CustomersCredit from "./pages/customers/CustomersCredit";
//import DailyCollection from "./pages/reports/DailyCollection";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRouter>
                <Home />
              </ProtectedRouter>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRouter>
                <Products />
              </ProtectedRouter>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRouter>
                <Inventory />
              </ProtectedRouter>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRouter>
                <Cart />
              </ProtectedRouter>
            }
          />
          <Route
            path="/bills"
            element={
              <ProtectedRouter>
                <Bills />
              </ProtectedRouter>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRouter>
                <Customers />
              </ProtectedRouter>
            }
          />
           <Route
            path="/customers-credit"
            element={
              <ProtectedRouter>
                <CustomersCredit />
              </ProtectedRouter>
            }
          />
          <Route
            path="/supplier"
            element={
              <ProtectedRouter>
                <Suppliers />
              </ProtectedRouter>
            }
          />
          <Route
            path="/category"
            element={
              <ProtectedRouter>
                <Category />
              </ProtectedRouter>
            }
          />

          <Route
            path="/reports/profit"
            element={
              <ProtectedRouter>
                <ProfitReport />
              </ProtectedRouter>
            }
          />

          {/* <Route
            path="/reports/daily"
            element={
              <ProtectedRouter>
                <DailyCollection />
              </ProtectedRouter>
            }
          /> */}

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;

export function ProtectedRouter({ children }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);

  React.useEffect(() => {
    const auth = localStorage.getItem("auth");
    setIsAuthenticated(!!auth); // true if exists, false if null
  }, []);

  if (isAuthenticated === null) {
    return <div className="loading-spinner">Loading...</div>; // Optional loading UI
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}
