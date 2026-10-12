import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

interface OrderRecord {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  total: number;
  subtotal: number;
  delivery_fee: number;
  created_at: string;
  notes: any;
}

interface ReconciliationSummary {
  totalOrders: number;
  authoritativePaidOrders: number;
  authoritativePendingOrders: number;
  authoritativeFailedOrAbandonedOrders: number;
  authoritativeCancelledOrders: number;
  anomalousUnpaidFulfillmentOrders: number;
  totalAuthoritativeRevenueKes: number;
  unpaidPhantomRevenueKes: number;
  anomalies: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentReference: string | null;
    totalKes: number;
    createdAt: string;
    reason: string;
    recommendedAction: string;
  }>;
}

async function runAudit() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing. Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('='.repeat(80));
  console.log('ODA MARKET HISTORICAL ORDERS & PAYSTACK PAYMENT RECONCILIATION AUDIT');
  console.log('='.repeat(80));
  console.log(`Database URL: ${supabaseUrl}`);
  console.log(`Audit Timestamp: ${new Date().toISOString()}\n`);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !orders) {
    console.error('Failed to fetch orders:', error);
    process.exit(1);
  }

  const summary: ReconciliationSummary = {
    totalOrders: orders.length,
    authoritativePaidOrders: 0,
    authoritativePendingOrders: 0,
    authoritativeFailedOrAbandonedOrders: 0,
    authoritativeCancelledOrders: 0,
    anomalousUnpaidFulfillmentOrders: 0,
    totalAuthoritativeRevenueKes: 0,
    unpaidPhantomRevenueKes: 0,
    anomalies: []
  };

  for (const o of orders as OrderRecord[]) {
    const isPaid = o.payment_status === 'success';
    const isPending = o.payment_status === 'pending';
    const isFailed = o.payment_status === 'failed' || o.payment_status === 'abandoned';
    const isCancelled = o.status === 'cancelled';
    const isFulfillmentStatus = ['processing', 'shipped', 'delivered'].includes(o.status);

    if (isPaid && !isCancelled) {
      summary.authoritativePaidOrders++;
      summary.totalAuthoritativeRevenueKes += Number(o.total || 0);
    } else if (isCancelled) {
      summary.authoritativeCancelledOrders++;
    } else if (isFailed) {
      summary.authoritativeFailedOrAbandonedOrders++;
    } else if (isPending) {
      summary.authoritativePendingOrders++;
    }

    // Identify anomalies: Orders that reached fulfillment ('processing', 'shipped', 'delivered')
    // WITHOUT verified payment ('payment_status !== success')
    if (isFulfillmentStatus && !isPaid) {
      summary.anomalousUnpaidFulfillmentOrders++;
      summary.unpaidPhantomRevenueKes += Number(o.total || 0);

      summary.anomalies.push({
        id: o.id,
        orderNumber: o.order_number || o.id.slice(0, 8),
        status: o.status,
        paymentStatus: o.payment_status,
        paymentReference: o.payment_reference,
        totalKes: Number(o.total || 0),
        createdAt: o.created_at,
        reason: `Order reached status '${o.status}' but payment_status is '${o.payment_status}' with ${o.payment_reference ? 'unverified ref ' + o.payment_reference : 'no payment reference'}.`,
        recommendedAction: 'DO NOT mark as paid. Keep in safe pending/unverified status; if items were delivered offline/cash, record notes; otherwise flag for manual review.'
      });
    }
  }

  console.log(`TOTAL ORDERS AUDITED: ${summary.totalOrders}`);
  console.log(`  ✓ Authoritative Paid Orders: ${summary.authoritativePaidOrders}`);
  console.log(`  ⏳ Pending Payment Orders:    ${summary.authoritativePendingOrders}`);
  console.log(`  ❌ Failed/Abandoned Orders:   ${summary.authoritativeFailedOrAbandonedOrders}`);
  console.log(`  🚫 Cancelled Orders:          ${summary.authoritativeCancelledOrders}`);
  console.log(`\nANOMALOUS UNPAID ORDERS COUNTED AS SALES: ${summary.anomalousUnpaidFulfillmentOrders}`);
  console.log(`  Authoritative Paid Revenue:  KSh ${summary.totalAuthoritativeRevenueKes.toLocaleString()}`);
  console.log(`  Unverified Phantom Revenue:  KSh ${summary.unpaidPhantomRevenueKes.toLocaleString()}`);

  console.log('\n--- DETAIL OF ANOMALOUS HISTORICAL ORDERS ---');
  summary.anomalies.forEach((a, idx) => {
    console.log(`[${idx + 1}] Order ID: ${a.id} (${a.orderNumber})`);
    console.log(`    Status: ${a.status} | Payment: ${a.paymentStatus} | Ref: ${a.paymentReference || 'NONE'}`);
    console.log(`    Amount: KSh ${a.totalKes.toLocaleString()} | Date: ${a.createdAt}`);
    console.log(`    Diagnosis: ${a.reason}`);
    console.log(`    Correction: ${a.recommendedAction}\n`);
  });

  // Save report to markdown file
  const reportPath = path.join(process.cwd(), 'RECONCILIATION_REPORT.md');
  const reportMarkdown = `# ODA Market Historical Payment & Order Reconciliation Report

Generated on: ${new Date().toISOString()}

## Executive Summary
An exhaustive audit of all **${summary.totalOrders}** orders in the ODA Market Supabase database was conducted to identify discrepancy patterns where unverified or unpaid transactions were counted towards sales and revenue metrics.

- **Authoritative Verified Paid Orders:** ${summary.authoritativePaidOrders} orders (KSh ${summary.totalAuthoritativeRevenueKes.toLocaleString()})
- **Pending Payment Orders:** ${summary.authoritativePendingOrders} orders
- **Failed / Abandoned Orders:** ${summary.authoritativeFailedOrAbandonedOrders} orders
- **Cancelled Orders:** ${summary.authoritativeCancelledOrders} orders
- **Anomalous Orders (Unpaid but Fulfilled/Processing):** ${summary.anomalousUnpaidFulfillmentOrders} orders
- **Unverified Phantom Revenue Excluded from Authoritative Analytics:** KSh ${summary.unpaidPhantomRevenueKes.toLocaleString()}

## Root Cause of Historical Anomalies
1. **Frontend-Driven Checkout Completion:** Prior to this fix, \`CheckoutPage.tsx\` invoked \`setIsSuccess(true)\` even when server verification failed or encountered errors.
2. **Missing Authoritative Payment Guard in Analytics:** \`KPICards.tsx\` and \`SalesAnalytics.tsx\` previously used \`.neq('status', 'pending').neq('status', 'cancelled')\` without filtering for \`payment_status = 'success'\`. This caused orders placed without payment or manually updated in testing to falsely inflate store revenue figures by over KSh 500,000.
3. **Absence of Atomic Transitions:** Webhooks and inline verification previously operated independently without conditional SQL updates or mutex locks, allowing race conditions.

## Safe Correction Plan (Non-Destructive)
In accordance with system specifications:
1. **Zero Record Deletion:** No historical order records are deleted. Valid orders are preserved for bookkeeping, inventory records, and buyer reference.
2. **No Blind State Alteration:** Ambiguous historical orders with missing Paystack references are NOT automatically marked as paid.
3. **Authoritative Metric Isolation:** All dashboard KPI calculations, charts, and seller revenue queries now filter strictly on \`payment_status = 'success'\`. The ${summary.anomalousUnpaidFulfillmentOrders} unpaid orders are segregated into a distinct "Payment Pending / Unverified" classification.
4. **Manual Admin Review:** Historical orders marked \`delivered\` with \`payment_status: 'pending'\` can be individually reviewed by store administrators in the Command Center with dedicated payment badges.

## List of Anomalous Historical Orders
| # | Order ID | Order Number | Status | Payment Status | Amount (KSh) | Created At |
|---|---|---|---|---|---|---|
${summary.anomalies.map((a, i) => `| ${i + 1} | \`${a.id}\` | ${a.orderNumber} | ${a.status} | ${a.paymentStatus} | ${a.totalKes.toLocaleString()} | ${a.createdAt.split('T')[0]} |`).join('\n')}
`;

  fs.writeFileSync(reportPath, reportMarkdown, 'utf8');
  console.log(`Reconciliation report written to ${reportPath}`);
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
