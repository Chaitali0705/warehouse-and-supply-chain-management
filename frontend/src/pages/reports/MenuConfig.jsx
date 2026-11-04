import LowStockReport from './tabs/low-stock';
import ExpiryReport from './tabs/expiry';
import StockLevelReport from './tabs/stock-level';
import MovementReport from './tabs/movement';
import ValuationReport from './tabs/valuation';
import ProductPerformanceReport from './tabs/product-performance';
import WarehouseUtilizationReport from './tabs/warehouse-utilization';
import DemandAccuracyReport from './tabs/demand-accuracy';
import SupplierPerformanceReport from './tabs/supplier-performance';
import POPerformanceReport from './tabs/po-performance';
import AiInsightsReport from './tabs/ai-insights';

export const menuItems = [
  {
    id: 'ai-insights',
    label: 'AI Insights',
    roles: ['admin', 'manager', 'warehouse_staff', 'procurement', 'sales', 'analyst'],
    ReportComponent: AiInsightsReport,
  },
  {
    id: 'low-stock',
    label: 'Low Stock',
    roles: ['admin', 'manager', 'warehouse_staff', 'analyst'],
    ReportComponent: LowStockReport,
  },
  {
    id: 'expiry',
    label: 'Expiry',
    roles: ['admin', 'manager', 'warehouse_staff', 'analyst'],
    ReportComponent: ExpiryReport,
  },
  {
    id: 'stock-level',
    label: 'Stock Level',
    roles: ['admin', 'manager', 'warehouse_staff', 'analyst'],
    ReportComponent: StockLevelReport,
  },
  {
    id: 'movement',
    label: 'Movement',
    roles: ['admin', 'manager', 'warehouse_staff', 'analyst'],
    ReportComponent: MovementReport,
  },
  {
    id: 'valuation',
    label: 'Valuation',
    roles: ['admin', 'manager', 'analyst'],
    ReportComponent: ValuationReport,
  },
  {
    id: 'product-performance',
    label: 'Product Performance',
    roles: ['admin', 'manager', 'analyst'],
    ReportComponent: ProductPerformanceReport,
  },
  {
    id: 'warehouse-utilization',
    label: 'Warehouse Utilization',
    roles: ['admin', 'manager', 'warehouse_staff', 'analyst'],
    ReportComponent: WarehouseUtilizationReport,
  },
  {
    id: 'demand-accuracy',
    label: 'Demand Accuracy',
    roles: ['admin', 'manager', 'procurement', 'sales', 'analyst'],
    ReportComponent: DemandAccuracyReport,
  },
  {
    id: 'supplier-performance',
    label: 'Supplier Performance',
    roles: ['admin', 'manager', 'procurement', 'analyst'],
    ReportComponent: SupplierPerformanceReport,
  },
  {
    id: 'po-performance',
    label: 'PO Performance',
    roles: ['admin', 'manager', 'procurement', 'analyst'],
    ReportComponent: POPerformanceReport,
  },
];
