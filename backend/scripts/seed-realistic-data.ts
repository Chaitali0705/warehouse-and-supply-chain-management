import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import {
  OrderStatus,
  PoStatus,
  PrismaClient,
  ShipmentStatus,
  StockMovementType,
  UserRole,
} from '@prisma/client';

const COUNT = 60;
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('POSTGRES_URL or DATABASE_URL is missing');
if (!process.env.MONGODB_URL) throw new Error('MONGODB_URL is missing');

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

const pad = (value: number, size = 3) => String(value).padStart(size, '0');
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

async function seedSql() {
  const passwordHash = await bcrypt.hash('DemoPass123!', 10);
  const roleAccounts = [
    ['admin', UserRole.admin],
    ['manager', UserRole.manager],
    ['warehouse', UserRole.warehouse_staff],
    ['procurement', UserRole.procurement],
    ['sales', UserRole.sales],
    ['logistics', UserRole.logistics],
    ['analyst', UserRole.analyst],
    ['partner', UserRole.partner],
  ] as const;

  await prisma.user.createMany({
    data: Array.from({ length: COUNT }, (_, index) => {
      const [name, role] = roleAccounts[index % roleAccounts.length];
      const number = index < roleAccounts.length ? '' : `-${pad(index + 1, 2)}`;
      return {
        username: `seed-${name}${number}`,
        email: `seed-${name}${number || '-01'}@warehouse.demo`,
        fullName: `Demo ${name} user ${index + 1}`,
        passwordHash,
        role,
        active: true,
      };
    }),
    skipDuplicates: true,
  });

  await prisma.productCategory.createMany({
    data: Array.from({ length: 6 }, (_, index) => ({ name: `Seed Category ${pad(index + 1, 2)}` })),
    skipDuplicates: true,
  });
  const categories = await prisma.productCategory.findMany({ where: { name: { startsWith: 'Seed Category' } }, orderBy: { name: 'asc' } });

  await prisma.warehouse.createMany({
    data: Array.from({ length: 12 }, (_, index) => ({
      code: `SEED-WH-${pad(index + 1, 2)}`,
      name: `Seed Distribution Center ${pad(index + 1, 2)}`,
      address: `${index + 1} Logistics Avenue, India`,
    })),
    skipDuplicates: true,
  });
  const warehouses = await prisma.warehouse.findMany({ where: { code: { startsWith: 'SEED-WH-' } }, orderBy: { code: 'asc' } });

  for (const [warehouseIndex, warehouse] of warehouses.entries()) {
    await prisma.location.createMany({
      data: Array.from({ length: 5 }, (_, index) => ({
        warehouseId: warehouse.id,
        code: `S-${pad(warehouseIndex + 1, 2)}-${pad(index + 1, 2)}`,
        name: `Storage zone ${index + 1}`,
        capacity: 500 + index * 100,
        type: ['rack', 'shelf', 'pallet', 'bin', 'zone'][index],
      })),
      skipDuplicates: true,
    });
  }
  const locations = await prisma.location.findMany({ where: { code: { startsWith: 'S-' } }, orderBy: { code: 'asc' } });

  await prisma.product.createMany({
    data: Array.from({ length: COUNT }, (_, index) => ({
      sku: `SEED-SKU-${pad(index + 1, 4)}`,
      name: `Seed Product ${pad(index + 1, 3)}`,
      categoryId: categories[index % categories.length].id,
      unit: 'piece',
      barcode: `890000${pad(index + 1, 7)}`,
      minStockLevel: 20 + (index % 30),
      reorderPoint: 40 + (index % 50),
      leadTimeDays: 3 + (index % 12),
      safetyStockLevel: 10 + (index % 15),
      parameters: { brand: `Brand ${index % 10}`, model: `Model-${pad(index + 1, 3)}` },
    })),
    skipDuplicates: true,
  });
  await prisma.supplier.createMany({
    data: Array.from({ length: COUNT }, (_, index) => ({ code: `SEED-SUP-${pad(index + 1, 3)}`, name: `Seed Supplier ${pad(index + 1, 3)}`, address: `${index + 1} Supplier Road` })),
    skipDuplicates: true,
  });
  await prisma.customer.createMany({
    data: Array.from({ length: COUNT }, (_, index) => ({ code: `SEED-CUST-${pad(index + 1, 3)}`, name: `Seed Customer ${pad(index + 1, 3)}`, address: `${index + 1} Customer Street` })),
    skipDuplicates: true,
  });

  const products = await prisma.product.findMany({ where: { sku: { startsWith: 'SEED-SKU-' } }, orderBy: { sku: 'asc' } });
  const suppliers = await prisma.supplier.findMany({ where: { code: { startsWith: 'SEED-SUP-' } }, orderBy: { code: 'asc' } });
  const customers = await prisma.customer.findMany({ where: { code: { startsWith: 'SEED-CUST-' } }, orderBy: { code: 'asc' } });
  const users = await prisma.user.findMany({ where: { email: { endsWith: '@warehouse.demo' } }, orderBy: { email: 'asc' } });
  const admin = users.find((user) => user.role === UserRole.admin);
  if (!admin || products.length < COUNT || suppliers.length < COUNT || customers.length < COUNT || locations.length < COUNT) {
    throw new Error('The seed reference records were not created correctly. Run the script again after checking database connectivity.');
  }

  await prisma.userInvite.createMany({
    data: Array.from({ length: COUNT }, (_, index) => ({
      email: `invited-${pad(index + 1, 3)}@warehouse.demo`,
      role: roleAccounts[index % roleAccounts.length][1],
      token: `SEED-INVITE-${pad(index + 1, 4)}`,
      createdById: admin.id,
      expiresAt: new Date(Date.now() + (30 + index) * 86_400_000),
    })),
    skipDuplicates: true,
  });

  await prisma.productBatch.createMany({
    data: products.slice(0, COUNT).map((product, index) => ({ productId: product.id, batchNo: `SEED-BATCH-${pad(index + 1, 3)}`, quantity: 15 + (index % 120), manufactureDate: daysAgo(30 + index), expiryDate: new Date(Date.now() + (30 + index) * 86_400_000), barcodeOrQr: `SEED-QR-${pad(index + 1, 4)}` })),
    skipDuplicates: true,
  });
  const batches = await prisma.productBatch.findMany({ where: { batchNo: { startsWith: 'SEED-BATCH-' } }, orderBy: { batchNo: 'asc' } });
  if (batches.length < COUNT) throw new Error('The seed batches were not created correctly.');

  const rows = Array.from({ length: COUNT }, (_, index) => ({ index, product: products[index], batch: batches[index], location: locations[index % locations.length], user: users[index % users.length] }));
  await prisma.inventory.createMany({ data: rows.map(({ index, batch, location }) => ({ productBatchId: batch.id, locationId: location.id, availableQty: 5 + (index % 120), reservedQty: index % 8 })), skipDuplicates: true });

  const existingPo = new Set((await prisma.purchaseOrder.findMany({ where: { poNo: { startsWith: 'SEED-PO-' } }, select: { poNo: true } })).map((row) => row.poNo));
  const newPoRows = rows.filter(({ index }) => !existingPo.has(`SEED-PO-${pad(index + 1, 4)}`));
  await prisma.purchaseOrder.createMany({ data: newPoRows.map(({ index, user }) => ({ poNo: `SEED-PO-${pad(index + 1, 4)}`, supplierId: suppliers[index].id, createdById: user.id, status: [PoStatus.draft, PoStatus.ordered, PoStatus.partial, PoStatus.received][index % 4], placedAt: daysAgo(index % 90), expectedArrival: new Date(Date.now() + (index % 21) * 86_400_000), totalAmount: 1000 + index * 50 })), skipDuplicates: true });
  const purchaseOrders = await prisma.purchaseOrder.findMany({ where: { poNo: { startsWith: 'SEED-PO-' } }, orderBy: { poNo: 'asc' } });
  await prisma.purchaseOrderItem.createMany({ data: newPoRows.map(({ index, product, batch }) => ({ purchaseOrderId: purchaseOrders[index].id, productId: product.id, productBatchId: batch.id, qtyOrdered: 10 + (index % 40), qtyReceived: index % 20, unitPrice: 100 + index, lineTotal: (10 + (index % 40)) * (100 + index) })) });

  const existingSo = new Set((await prisma.salesOrder.findMany({ where: { soNo: { startsWith: 'SEED-SO-' } }, select: { soNo: true } })).map((row) => row.soNo));
  const newSoRows = rows.filter(({ index }) => !existingSo.has(`SEED-SO-${pad(index + 1, 4)}`));
  await prisma.salesOrder.createMany({ data: newSoRows.map(({ index, user }) => ({ soNo: `SEED-SO-${pad(index + 1, 4)}`, customerId: customers[index].id, createdById: user.id, status: [OrderStatus.pending, OrderStatus.approved, OrderStatus.processing, OrderStatus.shipped, OrderStatus.closed][index % 5], placedAt: daysAgo(index % 90), totalAmount: 1500 + index * 60 })), skipDuplicates: true });
  const salesOrders = await prisma.salesOrder.findMany({ where: { soNo: { startsWith: 'SEED-SO-' } }, orderBy: { soNo: 'asc' } });
  await prisma.salesOrderItem.createMany({ data: newSoRows.map(({ index, product, batch, location }) => ({ salesOrderId: salesOrders[index].id, productId: product.id, productBatchId: batch.id, locationId: location.id, qty: 2 + (index % 15), qtyFulfilled: index % 10, unitPrice: 150 + index, lineTotal: (2 + (index % 15)) * (150 + index) })) });

  const existingShipments = new Set((await prisma.shipment.findMany({ where: { shipmentNo: { startsWith: 'SEED-SHIP-' } }, select: { shipmentNo: true } })).map((row) => row.shipmentNo));
  const newShipmentRows = rows.filter(({ index }) => !existingShipments.has(`SEED-SHIP-${pad(index + 1, 4)}`));
  await prisma.shipment.createMany({ data: newShipmentRows.map(({ index }) => ({ shipmentNo: `SEED-SHIP-${pad(index + 1, 4)}`, warehouseId: warehouses[index % warehouses.length].id, salesOrderId: salesOrders[index].id, carrier: ['DHL', 'Blue Dart', 'Delhivery'][index % 3], trackingCode: `SEED-TRACK-${pad(index + 1, 5)}`, status: [ShipmentStatus.preparing, ShipmentStatus.in_transit, ShipmentStatus.delivered][index % 3], shippedAt: daysAgo(index % 30), estimatedDelivery: new Date(Date.now() + (index % 7) * 86_400_000) })), skipDuplicates: true });
  const shipments = await prisma.shipment.findMany({ where: { shipmentNo: { startsWith: 'SEED-SHIP-' } }, orderBy: { shipmentNo: 'asc' } });
  await prisma.shipmentItem.createMany({ data: newShipmentRows.map(({ index, product, batch }) => ({ shipmentId: shipments[index].id, salesOrderId: salesOrders[index].id, productId: product.id, productBatchId: batch.id, qty: 2 + (index % 15) })) });
  await prisma.shipmentTrackingEvent.createMany({ data: newShipmentRows.map(({ index }) => ({ shipmentId: shipments[index].id, location: warehouses[index % warehouses.length].name, statusText: 'Seed shipment created' })) });

  await prisma.stockMovement.createMany({ data: rows.map(({ index, product, batch, location, user }) => ({ movementType: StockMovementType.purchase_receipt, productId: product.id, productBatchId: batch.id, toLocationId: location.id, quantity: 10 + (index % 40), reference: `SEED-RECEIPT-${pad(index + 1, 4)}`, idempotencyKey: `seed-movement-${pad(index + 1, 4)}`, createdById: user.id })), skipDuplicates: true });
  await prisma.demandForecast.createMany({ data: rows.map(({ index, product }) => ({ productId: product.id, forecastDate: new Date('2026-12-01T00:00:00.000Z'), forecastedQuantity: 20 + (index % 80), algorithmUsed: 'SIMPLE_MOVING_AVERAGE' })), skipDuplicates: true });
  console.log(`Created or verified ${COUNT} realistic SQL records per core entity.`);
}

async function seedMongo() {
  const client = new MongoClient(process.env.MONGODB_URL!);
  await client.connect();
  const db = client.db();
  const now = new Date();
  await db.collection('alerts').bulkWrite(
    Array.from({ length: COUNT }, (_, index) => ({
      updateOne: {
        filter: { message: `Seed alert ${pad(index + 1, 3)}` },
        update: {
          $set: {
            type: index % 2 ? 'LOW_STOCK' : 'EXPIRING_SOON',
            severity: index % 5 === 0 ? 'CRITICAL' : 'WARNING',
            isRead: index % 3 === 0,
            updatedAt: now,
          },
          $setOnInsert: { message: `Seed alert ${pad(index + 1, 3)}`, createdAt: now },
        },
        upsert: true,
      },
    })),
  );
  await db.collection('audit_logs').bulkWrite(
    Array.from({ length: COUNT }, (_, index) => ({
      updateOne: {
        filter: { correlationId: `seed-audit-${pad(index + 1, 3)}` },
        update: {
          $set: {
            entityType: 'Inventory',
            entityId: `seed-${index + 1}`,
            action: 'SEED_RECORD_CREATED',
            userId: 'seed-admin',
            path: '/seed',
            metadata: { index, source: 'bulk-seed' },
            timestamp: now,
          },
        },
        upsert: true,
      },
    })),
  );
  await db.collection('metrics').bulkWrite(
    Array.from({ length: COUNT }, (_, index) => ({
      updateOne: {
        filter: { name: 'seed_daily_volume', 'labels.index': String(index + 1) },
        update: {
          $set: {
            name: 'seed_daily_volume',
            value: 50 + index,
            type: 'gauge',
            labels: { source: 'bulk-seed', index: String(index + 1) },
            timestamp: now,
          },
        },
        upsert: true,
      },
    })),
  );
  await client.close();
  console.log(`Created or verified ${COUNT} alerts, audit logs, and metrics documents.`);
}

Promise.all([seedSql(), seedMongo()])
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
