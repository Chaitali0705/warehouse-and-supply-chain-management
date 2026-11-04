import { Injectable } from '@nestjs/common';
import { PoStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';

type Insight = {
  id: string;
  category: 'Inventory' | 'Expiry' | 'Procurement' | 'Demand';
  severity: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  title: string;
  explanation: string;
  recommendation: string;
  entity: string;
};

@Injectable()
export class AiInsightsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Offline decision support: transparent rules turn live SQL signals into
   * ranked recommendations. No external AI model or API key is required.
   */
  async getInsights() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [inventory, overduePurchaseOrders] = await Promise.all([
      this.prisma.inventory.findMany({
        where: { deletedAt: null },
        include: {
          productBatch: {
            include: {
              product: {
                include: { demandForecasts: { orderBy: { forecastDate: 'desc' }, take: 1 } },
              },
            },
          },
        },
      }),
      this.prisma.purchaseOrder.findMany({
        where: {
          status: { in: [PoStatus.draft, PoStatus.ordered, PoStatus.partial] },
          expectedArrival: { lt: now },
        },
        include: { supplier: true },
        take: 20,
      }),
    ]);

    const insights: Insight[] = [];
    const stockByProduct = new Map<string, { name: string; sku: string; quantity: number; min: number; reorder: number; forecast: number | null }>();

    for (const row of inventory) {
      const product = row.productBatch.product;
      const current = stockByProduct.get(product.id) ?? {
        name: product.name,
        sku: product.sku,
        quantity: 0,
        min: product.minStockLevel ?? 0,
        reorder: product.reorderPoint ?? product.minStockLevel ?? 0,
        forecast: product.demandForecasts[0]?.forecastedQuantity ?? null,
      };
      current.quantity += row.availableQty;
      stockByProduct.set(product.id, current);

      const expiry = row.productBatch.expiryDate;
      if (expiry && expiry <= thirtyDaysFromNow) {
        const days = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000));
        const score = days <= 7 ? 95 : days <= 14 ? 80 : 60;
        insights.push({
          id: `expiry-${row.id}`,
          category: 'Expiry',
          severity: days <= 7 ? 'critical' : days <= 14 ? 'high' : 'medium',
          score,
          title: `${product.name} batch expires soon`,
          explanation: `Batch ${row.productBatch.batchNo ?? 'unlabelled'} has ${row.availableQty} units available and expires in ${days} day${days === 1 ? '' : 's'}.`,
          recommendation: 'Prioritize this batch for dispatch, discounting, or transfer before expiry.',
          entity: product.sku,
        });
      }
    }

    for (const product of stockByProduct.values()) {
      if (product.quantity <= product.min) {
        const score = product.quantity === 0 ? 100 : 85;
        insights.push({
          id: `stock-${product.sku}`,
          category: 'Inventory',
          severity: product.quantity === 0 ? 'critical' : 'high',
          score,
          title: `${product.name} needs replenishment`,
          explanation: `Available stock is ${product.quantity}; the minimum stock level is ${product.min}.`,
          recommendation: `Create or expedite a purchase order for ${Math.max(product.reorder - product.quantity, product.min)} or more units.`,
          entity: product.sku,
        });
      } else if (product.forecast !== null && product.quantity < product.forecast) {
        insights.push({
          id: `demand-${product.sku}`,
          category: 'Demand',
          severity: 'medium',
          score: 65,
          title: `${product.name} may not meet forecast demand`,
          explanation: `Available stock is ${product.quantity}, while the latest forecast is ${product.forecast} units.`,
          recommendation: 'Review forecast assumptions and plan replenishment before the forecast period.',
          entity: product.sku,
        });
      }
    }

    for (const po of overduePurchaseOrders) {
      const lateDays = Math.max(1, Math.ceil((now.getTime() - po.expectedArrival!.getTime()) / 86_400_000));
      insights.push({
        id: `po-${po.id}`,
        category: 'Procurement',
        severity: lateDays > 14 ? 'high' : 'medium',
        score: lateDays > 14 ? 75 : 55,
        title: `Purchase order ${po.poNo} is overdue`,
        explanation: `Expected arrival was ${lateDays} day${lateDays === 1 ? '' : 's'} ago. Supplier: ${po.supplier?.name ?? 'not assigned'}.`,
        recommendation: 'Contact the supplier, update the expected arrival date, and assess stock impact.',
        entity: po.poNo,
      });
    }

    const ranked = insights.sort((a, b) => b.score - a.score).slice(0, 20);
    return {
      success: true,
      generatedAt: now,
      method: 'Transparent rule based decision support',
      summary: {
        total: ranked.length,
        critical: ranked.filter((item) => item.severity === 'critical').length,
        high: ranked.filter((item) => item.severity === 'high').length,
        medium: ranked.filter((item) => item.severity === 'medium').length,
      },
      insights: ranked,
    };
  }
}
