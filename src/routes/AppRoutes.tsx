import React, { JSX } from "react";
import { Routes, Route } from "react-router-dom";
import { PrivateRoute } from "../components/PrivateRoute";
import Dashboard from "../pages/Dashboard";
import { Customer } from "../pages/Customer";
import { Accounts } from "../pages/Accounts";
import { Product } from "../pages/Product";
import Invoice from "../pages/Invoice";
// import Vendor from "../pages/Vendor";
import { Bills } from "../pages/Bills";
import { Vendor } from "../pages/Vendor";
interface AppRoute {
  path: string;
  element: JSX.Element;
  isPrivate?: boolean;
}

const routes: AppRoute[] = [
  { path: "/", element: <Dashboard /> },
  { path: "/customers", element: <Customer />, },
  { path: "/accounts", element: <Accounts />, },
  { path: "/products", element: <Product />, },
  { path: "/invoices", element: <Invoice />, },
  { path: "/vendors", element: <Vendor />,  },
  { path: "/bills", element: <Bills />, },
];

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {routes.map(({ path, element, isPrivate }) => (
        <Route
          key={path}
          path={path}
          element={isPrivate ? <PrivateRoute>{element}</PrivateRoute> : element}
        />
      ))}
    </Routes>
  );
};

export default AppRoutes;
