import 'dotenv/config';
import { PoStatus, PrismaClient } from '@prisma/client';

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('POSTGRES_URL or DATABASE_URL is missing');

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

async function main() {
  const [category, location, supplier] = await Promise.all([
    prisma.productCategory.findFirst({ orderBy: { name: 'asc' } }),
    prisma.location.findFirst({ orderBy: { code: 'asc' } }),
    prisma.supplier.findFirst({ orderBy: { name: 'asc' } }),
  ]);

  if (!location || !supplier) {
    throw new Error('Seed reference data is missing. Run "npm run seed:realistic" first.');
  }

  const scenarios = [
    {
      sku: 'AI-DEMO-OUT-001',
      name: 'AI Demo Emergency Gloves',
      batchNo: 'AI-OUT-001',
      availableQty: 0,
      minStockLevel: 25,
      reorderPoint: 75,
      expiryDays: 180,
      forecast: 40,
      explanation: 'Critical out-of-stock recommendation',
    },
    {
      sku: 'AI-DEMO-LOW-001',
      name: 'AI Demo Safety Helmets',
      batchNo: 'AI-LOW-001',
      availableQty: 8,
      minStockLevel: 30,
      reorderPoint: 90,
      expiryDays: 180,
      forecast: 50,
      explanation: 'High-priority low-stock recommendation',
    },
    {
      sku: 'AI-DEMO-EXP-001',
      name: 'AI Demo Perishable Sealant',
      batchNo: 'AI-EXP-001',
      availableQty: 70,
      minStockLevel: 15,
      reorderPoint: 40,
      expiryDays: 4,
      forecast: 25,
      explanation: 'Critical batch-expiry recommendation',
    },
    {
      sku: 'AI-DEMO-DMD-001',
      name: 'AI Demo Forecasted Packaging',
      batchNo: 'AI-DMD-001',
      availableQty: 20,
      minStockLevel: 10,
      reorderPoint: 35,
      expiryDays: 180,
      forecast: 140,
      explanation: 'Demand forecast exceeds available stock recommendation',
    },
  ];

  for (const scenario of scenarios) {
    const product = await prisma.product.upsert({
      where: { sku: scenario.sku },
      update: {
        name: scenario.name,
        minStockLevel: scenario.minStockLevel,
        reorderPoint: scenario.reorderPoint,
        parameters: { aiDemo: true, scenario: scenario.explanation },
      },
      create: {
        sku: scenario.sku,
        name: scenario.name,
        categoryId: category?.id,
        unit: 'piece',
        barcode: `AI-${scenario.sku}`,
        minStockLevel: scenario.minStockLevel,
        reorderPoint: scenario.reorderPoint,
        leadTimeDays: 7,
        safetyStockLevel: 10,
        parameters: { aiDemo: true, scenario: scenario.explanation },
      },
    });

    const batch = await prisma.productBatch.upsert({
      where: { productId_batchNo: { productId: product.id, batchNo: scenario.batchNo } },
      update: { quantity: scenario.availableQty, expiryDate: daysFromNow(scenario.expiryDays) },
      create: {
        productId: product.id,
        batchNo: scenario.batchNo,
        quantity: scenario.availableQty,
        manufactureDate: daysFromNow(-30),
        expiryDate: daysFromNow(scenario.expiryDays),
        barcodeOrQr: `AI-QR-${scenario.batchNo}`,
      },
    });

    await prisma.inventory.upsert({
      where: { productBatchId_locationId: { productBatchId: batch.id, locationId: location.id } },
      update: { availableQty: scenario.availableQty, reservedQty: 0 },
      create: { productBatchId: batch.id, locationId: location.id, availableQty: scenario.availableQty, reservedQty: 0 },
    });

    await prisma.demandForecast.upsert({
      where: { productId_forecastDate: { productId: product.id, forecastDate: new Date('2027-01-01T00:00:00.000Z') } },
      update: { forecastedQuantity: scenario.forecast, algorithmUsed: 'AI_DEMO_RULE_BASED' },
      create: {
        productId: product.id,
        forecastDate: new Date('2027-01-01T00:00:00.000Z'),
        forecastedQuantity: scenario.forecast,
        algorithmUsed: 'AI_DEMO_RULE_BASED',
      },
    });
  }

  await prisma.purchaseOrder.upsert({
    where: { poNo: 'AI-DEMO-OVERDUE-001' },
    update: { status: PoStatus.ordered, expectedArrival: daysFromNow(-12), notes: 'AI demo: intentionally overdue purchase order' },
    create: {
      poNo: 'AI-DEMO-OVERDUE-001',
      supplierId: supplier.id,
      status: PoStatus.ordered,
      placedAt: daysFromNow(-25),
      expectedArrival: daysFromNow(-12),
      totalAmount: 45000,
      notes: 'AI demo: intentionally overdue purchase order',
    },
  });

  console.log('AI demo data is ready: out-of-stock, low-stock, expiry, forecast-shortfall, and overdue-PO scenarios.');
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
