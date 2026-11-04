import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { OrderStatus, PoStatus, PrismaClient, ShipmentStatus, StockMovementType } from '@prisma/client';

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('POSTGRES_URL or DATABASE_URL is missing');

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

async function upsertBatch(productId: string, batchNo: string, quantity: number, expiryDate: Date) {
  const existing = await prisma.productBatch.findFirst({ where: { productId, batchNo } });
  if (existing) {
    return prisma.productBatch.update({ where: { id: existing.id }, data: { quantity, expiryDate } });
  }
  return prisma.productBatch.create({ data: { productId, batchNo, quantity, expiryDate } });
}

async function upsertInventory(productBatchId: string, locationId: string, availableQty: number, reservedQty: number) {
  const existing = await prisma.inventory.findFirst({ where: { productBatchId, locationId } });
  if (existing) {
    return prisma.inventory.update({ where: { id: existing.id }, data: { availableQty, reservedQty, deletedAt: null } });
  }
  return prisma.inventory.create({ data: { productBatchId, locationId, availableQty, reservedQty } });
}

async function main() {
  const category = await prisma.productCategory.upsert({
    where: { name: 'Demo Electronics' },
    update: {},
    create: { name: 'Demo Electronics' },
  });

  const laptop = await prisma.product.upsert({
    where: { sku: 'DEMO-LAPTOP-001' },
    update: { name: 'Demo Laptop', categoryId: category.id, unit: 'piece', minStockLevel: 10 },
    create: { sku: 'DEMO-LAPTOP-001', name: 'Demo Laptop', categoryId: category.id, unit: 'piece', minStockLevel: 10 },
  });
  const keyboard = await prisma.product.upsert({
    where: { sku: 'DEMO-KEYBOARD-001' },
    update: { name: 'Demo Keyboard', categoryId: category.id, unit: 'piece', minStockLevel: 20 },
    create: { sku: 'DEMO-KEYBOARD-001', name: 'Demo Keyboard', categoryId: category.id, unit: 'piece', minStockLevel: 20 },
  });
  const accessories = await prisma.productCategory.upsert({
    where: { name: 'Demo Accessories' },
    update: {},
    create: { name: 'Demo Accessories' },
  });
  const mouse = await prisma.product.upsert({
    where: { sku: 'DEMO-MOUSE-001' },
    update: { name: 'Demo Wireless Mouse', categoryId: accessories.id, unit: 'piece', minStockLevel: 25 },
    create: { sku: 'DEMO-MOUSE-001', name: 'Demo Wireless Mouse', categoryId: accessories.id, unit: 'piece', minStockLevel: 25 },
  });
  const monitor = await prisma.product.upsert({
    where: { sku: 'DEMO-MONITOR-001' },
    update: { name: 'Demo 24-inch Monitor', categoryId: category.id, unit: 'piece', minStockLevel: 8 },
    create: { sku: 'DEMO-MONITOR-001', name: 'Demo 24-inch Monitor', categoryId: category.id, unit: 'piece', minStockLevel: 8 },
  });
  const headset = await prisma.product.upsert({
    where: { sku: 'DEMO-HEADSET-001' },
    update: { name: 'Demo USB Headset', categoryId: accessories.id, unit: 'piece', minStockLevel: 15 },
    create: { sku: 'DEMO-HEADSET-001', name: 'Demo USB Headset', categoryId: accessories.id, unit: 'piece', minStockLevel: 15 },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'DEMO-WH-001' },
    update: { name: 'Demo Central Warehouse', address: 'Demo Street, Chennai' },
    create: { code: 'DEMO-WH-001', name: 'Demo Central Warehouse', address: 'Demo Street, Chennai' },
  });
  let location = await prisma.location.findFirst({ where: { warehouseId: warehouse.id, code: 'DEMO-A01' } });
  if (location) {
    location = await prisma.location.update({ where: { id: location.id }, data: { name: 'Demo Aisle A01', capacity: 500, type: 'rack' } });
  } else {
    location = await prisma.location.create({ data: { warehouseId: warehouse.id, code: 'DEMO-A01', name: 'Demo Aisle A01', capacity: 500, type: 'rack' } });
  }
  const secondWarehouse = await prisma.warehouse.upsert({
    where: { code: 'DEMO-WH-002' },
    update: { name: 'Demo North Warehouse', address: 'Demo Street, Bengaluru' },
    create: { code: 'DEMO-WH-002', name: 'Demo North Warehouse', address: 'Demo Street, Bengaluru' },
  });
  let secondLocation = await prisma.location.findFirst({ where: { warehouseId: secondWarehouse.id, code: 'DEMO-B01' } });
  if (secondLocation) {
    secondLocation = await prisma.location.update({ where: { id: secondLocation.id }, data: { name: 'Demo Aisle B01', capacity: 300, type: 'shelf' } });
  } else {
    secondLocation = await prisma.location.create({ data: { warehouseId: secondWarehouse.id, code: 'DEMO-B01', name: 'Demo Aisle B01', capacity: 300, type: 'shelf' } });
  }

  const expiresSoon = new Date();
  expiresSoon.setDate(expiresSoon.getDate() + 14);
  const laptopBatch = await upsertBatch(laptop.id, 'DEMO-LAPTOP-B01', 5, expiresSoon);
  const keyboardBatch = await upsertBatch(keyboard.id, 'DEMO-KEYBOARD-B01', 120, new Date('2027-12-31'));
  const mouseBatch = await upsertBatch(mouse.id, 'DEMO-MOUSE-B01', 18, new Date('2027-08-31'));
  const monitorBatch = await upsertBatch(monitor.id, 'DEMO-MONITOR-B01', 32, new Date('2028-01-31'));
  const headsetBatch = await upsertBatch(headset.id, 'DEMO-HEADSET-B01', 45, new Date('2027-11-30'));
  await upsertInventory(laptopBatch.id, location.id, 5, 1);
  await upsertInventory(keyboardBatch.id, location.id, 120, 0);
  await upsertInventory(mouseBatch.id, location.id, 18, 3);
  await upsertInventory(monitorBatch.id, secondLocation.id, 32, 4);
  await upsertInventory(headsetBatch.id, secondLocation.id, 45, 0);

  const customer = await prisma.customer.upsert({
    where: { code: 'DEMO-CUST-001' },
    update: { name: 'Demo Retail Customer' },
    create: { code: 'DEMO-CUST-001', name: 'Demo Retail Customer' },
  });
  const order = await prisma.salesOrder.upsert({
    where: { soNo: 'DEMO-SO-001' },
    update: { customerId: customer.id, status: OrderStatus.closed, totalAmount: 1500 },
    create: { soNo: 'DEMO-SO-001', customerId: customer.id, status: OrderStatus.closed, totalAmount: 1500, placedAt: new Date() },
  });
  const item = await prisma.salesOrderItem.findFirst({ where: { salesOrderId: order.id, productId: laptop.id } });
  if (!item) {
    await prisma.salesOrderItem.create({ data: { salesOrderId: order.id, productId: laptop.id, productBatchId: laptopBatch.id, locationId: location.id, qty: 1, qtyFulfilled: 1, unitPrice: 1500, lineTotal: 1500 } });
  }
  const wholesaleCustomer = await prisma.customer.upsert({
    where: { code: 'DEMO-CUST-002' },
    update: { name: 'Demo Wholesale Customer' },
    create: { code: 'DEMO-CUST-002', name: 'Demo Wholesale Customer' },
  });
  await prisma.salesOrder.upsert({
    where: { soNo: 'DEMO-SO-002' },
    update: { customerId: customer.id, status: OrderStatus.pending, totalAmount: 900 },
    create: { soNo: 'DEMO-SO-002', customerId: customer.id, status: OrderStatus.pending, totalAmount: 900, placedAt: new Date() },
  });
  await prisma.salesOrder.upsert({
    where: { soNo: 'DEMO-SO-003' },
    update: { customerId: wholesaleCustomer.id, status: OrderStatus.processing, totalAmount: 3200 },
    create: { soNo: 'DEMO-SO-003', customerId: wholesaleCustomer.id, status: OrderStatus.processing, totalAmount: 3200, placedAt: new Date() },
  });

  const supplier = await prisma.supplier.upsert({
    where: { code: 'DEMO-SUP-001' },
    update: { name: 'Demo Technology Supplier' },
    create: { code: 'DEMO-SUP-001', name: 'Demo Technology Supplier', address: 'Demo Supplier Road, Mumbai' },
  });
  const purchaseOrder = await prisma.purchaseOrder.upsert({
    where: { poNo: 'DEMO-PO-001' },
    update: { supplierId: supplier.id, status: PoStatus.partial, totalAmount: 4800 },
    create: {
      poNo: 'DEMO-PO-001', supplierId: supplier.id, status: PoStatus.partial, totalAmount: 4800,
      placedAt: new Date('2026-10-01'), expectedArrival: new Date('2026-10-12'), notes: 'Demo procurement order',
    },
  });
  const poLaptop = await prisma.purchaseOrderItem.findFirst({ where: { purchaseOrderId: purchaseOrder.id, productId: laptop.id } });
  if (!poLaptop) {
    await prisma.purchaseOrderItem.create({ data: { purchaseOrderId: purchaseOrder.id, productId: laptop.id, productBatchId: laptopBatch.id, qtyOrdered: 4, qtyReceived: 2, unitPrice: 1200, lineTotal: 4800, remark: 'Partial delivery received' } });
  }

  const shipment = await prisma.shipment.upsert({
    where: { shipmentNo: 'DEMO-SHIP-001' },
    update: { warehouseId: warehouse.id, salesOrderId: order.id, status: ShipmentStatus.in_transit, trackingCode: 'DEMO-TRACK-001' },
    create: { shipmentNo: 'DEMO-SHIP-001', warehouseId: warehouse.id, salesOrderId: order.id, carrier: 'Demo Express', trackingCode: 'DEMO-TRACK-001', status: ShipmentStatus.in_transit, shippedAt: new Date() },
  });
  const shipmentItem = await prisma.shipmentItem.findFirst({ where: { shipmentId: shipment.id, productId: laptop.id } });
  if (!shipmentItem) {
    await prisma.shipmentItem.create({ data: { shipmentId: shipment.id, salesOrderId: order.id, productId: laptop.id, productBatchId: laptopBatch.id, qty: 1 } });
  }
  const trackingEvent = await prisma.shipmentTrackingEvent.findFirst({ where: { shipmentId: shipment.id, statusText: 'Shipment picked up by carrier' } });
  if (!trackingEvent) {
    await prisma.shipmentTrackingEvent.create({ data: { shipmentId: shipment.id, location: 'Chennai Dispatch Centre', statusText: 'Shipment picked up by carrier' } });
  }

  const movement = await prisma.stockMovement.findFirst({ where: { reference: 'DEMO-RECEIPT-001', productBatchId: keyboardBatch.id } });
  if (!movement) {
    await prisma.stockMovement.create({ data: { movementType: StockMovementType.purchase_receipt, productId: keyboard.id, productBatchId: keyboardBatch.id, toLocationId: location.id, quantity: 120, reference: 'DEMO-RECEIPT-001', note: 'Demo inbound stock receipt' } });
  }
  for (const [productId, forecastedQuantity] of [[laptop.id, 18], [keyboard.id, 65], [mouse.id, 40]] as const) {
    const forecastDate = new Date('2026-11-01T00:00:00.000Z');
    const forecast = await prisma.demandForecast.findFirst({ where: { productId, forecastDate } });
    if (forecast) {
      await prisma.demandForecast.update({ where: { id: forecast.id }, data: { forecastedQuantity, algorithmUsed: 'SIMPLE_MOVING_AVERAGE' } });
    } else {
      await prisma.demandForecast.create({ data: { productId, forecastDate, forecastedQuantity, algorithmUsed: 'SIMPLE_MOVING_AVERAGE' } });
    }
  }

  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) throw new Error('MONGODB_URL is missing');
  const mongo = new MongoClient(mongoUrl);
  await mongo.connect();
  const alerts = mongo.db().collection('alerts');
  const now = new Date();
  await alerts.updateOne(
    { message: 'Demo: Laptop stock is below the reorder threshold' },
    { $set: { type: 'LOW_STOCK', severity: 'CRITICAL', isRead: false, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  await alerts.updateOne(
    { message: 'Demo: Wireless mouse stock is below the reorder threshold' },
    { $set: { type: 'LOW_STOCK', severity: 'WARNING', isRead: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  await alerts.updateOne(
    { message: 'Demo: Purchase order delivery needs review' },
    { $set: { type: 'PO_LATE_DELIVERY', severity: 'WARNING', isRead: false, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  await mongo.db().collection('audit_logs').updateOne(
    { correlationId: 'demo-stock-review-001' },
    { $set: { entityType: 'Inventory', entityId: laptopBatch.id, action: 'DEMO_STOCK_REVIEW', userId: 'demo-user', path: '/inventory', metadata: { source: 'demo-script' }, timestamp: now } },
    { upsert: true },
  );
  await mongo.db().collection('audit_logs').updateOne(
    { correlationId: 'demo-shipment-001' },
    { $set: { entityType: 'Shipment', entityId: shipment.id, action: 'DEMO_SHIPMENT_CREATED', userId: 'demo-user', path: '/shipments', metadata: { trackingCode: 'DEMO-TRACK-001', source: 'demo-script' }, timestamp: now } },
    { upsert: true },
  );
  const metrics = mongo.db().collection('metrics');
  for (const [name, value] of [['inventory_low_stock_count', 2], ['open_sales_orders', 2], ['warehouse_utilization_percent', 42]] as const) {
    await metrics.updateOne(
      { name, 'labels.source': 'demo-script' },
      { $set: { name, value, type: 'gauge', labels: { source: 'demo-script' }, timestamp: now } },
      { upsert: true },
    );
  }
  await alerts.updateOne(
    { message: 'Demo: Laptop batch expires within 14 days' },
    { $set: { type: 'EXPIRING_SOON', severity: 'WARNING', isRead: false, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  await mongo.close();

  console.log('Demo SQL and MongoDB data is ready.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
