import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@components/auth';

import Layout from '@layouts/Layout';
// import Dashboard from '@pages/dashboard';
import Login from '@pages/auth/login';
import Signup from '@pages/auth/signup';
import NotFound from '@pages/notfound';
import Warehouse from '@/pages/warehouse';
import ProductDetail from '@/pages/warehouse/ProductDetail';
import BatchDetail from '@/pages/warehouse/BatchDetail';
import LocationDetail from '@/pages/warehouse/LocationDetail';
import WarehouseDetail from '@/pages/warehouse/WarehouseDetail';
import Inventory from '@/pages/inventory';
// import Supplier from '@/pages/supplier';
import SupplierDetail from '@/pages/supplier/SupplierDetail';
import PODetail from '@/pages/purchase-order/PODetail';
import Procurement from '@/pages/procurement';
import ShipmentList from '@/pages/shipment';
import ShipmentCreate from '@/pages/shipment/ShipmentCreate';
import ShipmentDetail from '@/pages/shipment/ShipmentDetail';
import ShipmentTracking from '@/pages/shipment/ShipmentTracking';
import Report from '@/pages/reports';
import Alert from '@/pages/alert';
import DemandPlanning from '@/pages/demand-planning';
import Sales from '@/pages/sales';
import CustomerDetail from '@/pages/sales/CustomerDetail';
import SODetail from '../pages/sales/SODetail';
import AuditLog from '../pages/audit-log';
import UserManagement from '../pages/user/UserManagement';

const ROLES = {
  warehouse: ['admin', 'manager', 'warehouse_staff', 'procurement', 'sales', 'logistics', 'analyst'],
  procurement: ['admin', 'manager', 'procurement'],
  sales: ['admin', 'manager', 'sales'],
  shipments: ['admin', 'manager', 'warehouse_staff', 'logistics'],
  inventory: ['admin', 'manager', 'warehouse_staff', 'procurement'],
  reports: ['admin', 'manager', 'warehouse_staff', 'procurement', 'sales', 'analyst'],
  planning: ['admin', 'manager', 'procurement', 'sales', 'analyst'],
  audit: ['admin', 'manager', 'analyst'],
  users: ['admin', 'manager'],
};

const RoleRoute = ({ roles, children }) => <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>;

export default function MainRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<ProtectedRoute />}>
        {/* Route cha có Layout */}
        <Route element={<Layout />}>
          {/* <Route path="/" element={<Dashboard />} /> */}
          <Route path="/warehouse" element={<RoleRoute roles={ROLES.warehouse}><Warehouse /></RoleRoute>} />
          <Route path="/warehouse/products/:id" element={<RoleRoute roles={ROLES.warehouse}><ProductDetail /></RoleRoute>} />
          <Route path="/warehouse/batches/:id" element={<RoleRoute roles={ROLES.warehouse}><BatchDetail /></RoleRoute>} />
          <Route path="/warehouse/locations/:id" element={<RoleRoute roles={ROLES.warehouse}><LocationDetail /></RoleRoute>} />
          <Route
            path="/warehouse/warehouses/:id"
            element={<RoleRoute roles={ROLES.warehouse}><WarehouseDetail /></RoleRoute>}
          />
          <Route path="/inventory" element={<RoleRoute roles={ROLES.inventory}><Inventory /></RoleRoute>} />
          {/* <Route path="/supplier" element={<Supplier />} /> */}
          <Route path="/supplier/detail" element={<RoleRoute roles={ROLES.procurement}><SupplierDetail /></RoleRoute>} />
          <Route path="/purchase-order/detail" element={<RoleRoute roles={ROLES.procurement}><PODetail /></RoleRoute>} />
          <Route path="/procurement" element={<RoleRoute roles={ROLES.procurement}><Procurement /></RoleRoute>} />
          <Route path="/shipments" element={<RoleRoute roles={ROLES.shipments}><ShipmentList /></RoleRoute>} />
          <Route path="/shipments/create" element={<RoleRoute roles={ROLES.shipments}><ShipmentCreate /></RoleRoute>} />
          <Route path="/shipments/track" element={<RoleRoute roles={ROLES.shipments}><ShipmentTracking /></RoleRoute>} />
          <Route path="/shipments/:id" element={<RoleRoute roles={ROLES.shipments}><ShipmentDetail /></RoleRoute>} />
          <Route path="/reports" element={<RoleRoute roles={ROLES.reports}><Report /></RoleRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alert /></ProtectedRoute>} />
          <Route path="/demand-planning" element={<RoleRoute roles={ROLES.planning}><DemandPlanning /></RoleRoute>} />
          <Route path="/sales" element={<RoleRoute roles={ROLES.sales}><Sales /></RoleRoute>} />
          <Route path="/customer/detail" element={<RoleRoute roles={ROLES.sales}><CustomerDetail /></RoleRoute>} />
          <Route path="/sales-order/detail" element={<RoleRoute roles={ROLES.sales}><SODetail /></RoleRoute>} />
          <Route path="/audit-logs" element={<RoleRoute roles={ROLES.audit}><AuditLog /></RoleRoute>} />
          <Route path="/users" element={<RoleRoute roles={ROLES.users}><UserManagement /></RoleRoute>} />
        </Route>
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
