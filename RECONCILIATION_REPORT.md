# ODA Market Historical Payment & Order Reconciliation Report

Generated on: 2026-10-12T22:03:51.856Z

## Executive Summary
An exhaustive audit of all **103** orders in the ODA Market Supabase database was conducted to identify discrepancy patterns where unverified or unpaid transactions were counted towards sales and revenue metrics.

- **Authoritative Verified Paid Orders:** 19 orders (KSh 24)
- **Pending Payment Orders:** 59 orders
- **Failed / Abandoned Orders:** 2 orders
- **Cancelled Orders:** 23 orders
- **Anomalous Orders (Unpaid but Fulfilled/Processing):** 25 orders
- **Unverified Phantom Revenue Excluded from Authoritative Analytics:** KSh 516,450.01

## Root Cause of Historical Anomalies
1. **Frontend-Driven Checkout Completion:** Prior to this fix, `CheckoutPage.tsx` invoked `setIsSuccess(true)` even when server verification failed or encountered errors.
2. **Missing Authoritative Payment Guard in Analytics:** `KPICards.tsx` and `SalesAnalytics.tsx` previously used `.neq('status', 'pending').neq('status', 'cancelled')` without filtering for `payment_status = 'success'`. This caused orders placed without payment or manually updated in testing to falsely inflate store revenue figures by over KSh 500,000.
3. **Absence of Atomic Transitions:** Webhooks and inline verification previously operated independently without conditional SQL updates or mutex locks, allowing race conditions.

## Safe Correction Plan (Non-Destructive)
In accordance with system specifications:
1. **Zero Record Deletion:** No historical order records are deleted. Valid orders are preserved for bookkeeping, inventory records, and buyer reference.
2. **No Blind State Alteration:** Ambiguous historical orders with missing Paystack references are NOT automatically marked as paid.
3. **Authoritative Metric Isolation:** All dashboard KPI calculations, charts, and seller revenue queries now filter strictly on `payment_status = 'success'`. The 25 unpaid orders are segregated into a distinct "Payment Pending / Unverified" classification.
4. **Manual Admin Review:** Historical orders marked `delivered` with `payment_status: 'pending'` can be individually reviewed by store administrators in the Command Center with dedicated payment badges.

## List of Anomalous Historical Orders
| # | Order ID | Order Number | Status | Payment Status | Amount (KSh) | Created At |
|---|---|---|---|---|---|---|
| 1 | `7216285a-843c-4304-965d-39703ac6d4a5` | ODA-E34CAF6F | delivered | pending | 1 | 2026-10-06 |
| 2 | `2af54edb-e1a3-48ab-8d6d-e065284ff7bf` | ODA-FC92FEA0 | delivered | pending | 360 | 2026-10-02 |
| 3 | `65beaefd-bab2-43a6-811d-18b766ff4885` | ODA-F2720D13 | delivered | pending | 365 | 2026-10-02 |
| 4 | `b7143cb2-4024-47e4-b31c-28aac720fe7a` | ODA-D939DD1F | delivered | pending | 1 | 2026-09-22 |
| 5 | `955bfb2c-290a-4089-919d-9bf2b4ef4c8f` | ODA-DB713D0F | delivered | pending | 1 | 2026-09-04 |
| 6 | `ee9f82f0-dd3e-4af5-9de7-a55acc7f901a` | ODA-43AFED46 | processing | pending | 322 | 2026-08-21 |
| 7 | `3a2582af-10fc-4cd5-9a85-c360146fb9dd` | ODA-D17E8353 | processing | pending | 360.01 | 2026-08-19 |
| 8 | `ade29cc9-f9cc-4d05-9f13-8a0ee92d996b` | ODA-A2CE3B43 | processing | pending | 120 | 2026-08-18 |
| 9 | `bbdffa50-3c07-4aeb-bda0-3a5f016f3911` | ODA-9B8B00D1 | processing | pending | 120 | 2026-08-18 |
| 10 | `89c1fa63-3a90-4af5-9af4-5fe9562fc503` | ODA-44D26BEA | processing | pending | 4,120 | 2026-08-18 |
| 11 | `66f2edcb-93ed-4ebc-9b28-4689d7e42309` | ODA-29EFBDE8 | processing | pending | 4,000 | 2026-08-18 |
| 12 | `81c812b4-63b5-4fe3-a861-d2a9ca42b0a6` | ODA-2C2BD1FD | processing | pending | 120 | 2026-08-18 |
| 13 | `5bdeb4a6-6c36-4d69-8952-9a39225ec943` | ODA-31983C9F | processing | pending | 120 | 2026-08-18 |
| 14 | `be731620-53fa-4350-a4d3-d69f4032e51b` | ODA-863D2DD7 | processing | pending | 120 | 2026-08-18 |
| 15 | `9f189c7d-26f2-4ff1-a475-d9aae606c120` | ODA-FA88C65B | processing | pending | 240 | 2026-08-18 |
| 16 | `ad5fa6a9-13a5-4e57-9927-14db89f6541b` | ODA-024E3E01 | processing | pending | 240 | 2026-08-18 |
| 17 | `a8fa353d-9038-4597-b0ff-a527c314ec76` | ODA-05B78F8A | processing | pending | 120 | 2026-08-18 |
| 18 | `fd98f3f8-8326-4f8c-9700-aa1f1442548b` | ODA-AFB5D6FA | processing | pending | 120 | 2026-08-18 |
| 19 | `06dd3a20-7398-4b2a-b60e-df3a14e18deb` | ODA-87CFC577 | shipped | pending | 120 | 2026-08-17 |
| 20 | `bb33c7ba-803c-470c-abb5-c3aea8d1ff27` | ODA-117B8612 | processing | pending | 120 | 2026-08-13 |
| 21 | `b2113c8d-b098-439d-8a85-e443f0f67260` | ODA-96657C2A | processing | pending | 120 | 2026-08-13 |
| 22 | `2ae18ef2-4418-4ef8-809c-86a79b01269c` | ODA-BE297C4D | processing | pending | 4,120 | 2026-08-13 |
| 23 | `710cedbb-6d67-4ce8-8e6e-2b37b5501d6f` | ODA-B8454A25 | processing | pending | 120 | 2026-08-13 |
| 24 | `b659593c-ff89-4fac-a94b-81c579977f2e` | ODA-E5DFF5E4 | processing | pending | 350,500 | 2026-08-06 |
| 25 | `9d63cbe5-b73e-4586-9df4-4dc4e18adadf` | ODA-D6FC0388 | delivered | pending | 150,500 | 2026-08-04 |
