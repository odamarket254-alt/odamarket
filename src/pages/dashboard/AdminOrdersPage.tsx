import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, MoreVertical, Eye, Download, RefreshCw,
  CheckCircle2, Clock, Truck, Package, XCircle, AlertCircle, Store,
  Calendar, MapPin, Check,
  MessageCircle, Copy, BellRing, Loader2, Mail
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import {
  OrderDetailsModal,
  OrderReminderSummary
} from '../../components/admin/orders/OrderDetailsModal';
import { toast } from 'sonner';
import { notifyOrderStatusChange } from '../../services/notificationService';
import { WhatsAppOrderData, generateWhatsAppMessage, getWhatsAppUrl } from '../../lib/whatsapp';

export type OrderCategory = 
  | 'all' 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'ready_for_pickup' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

interface CustomerInfo {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  location: string | null;
  subStatus?: string | null;
}

function getCustomerInfo(order: any): CustomerInfo {
  let notes: any = {};
  if (order.notes) {
    try {
      notes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
    } catch {
      notes = {};
    }
  }

  const name =
    notes?.contactDetails?.fullName ||
    notes?.shippingDetails?.recipientName ||
    (order.customer?.first_name ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim() : null) ||
    (order.profiles?.first_name ? `${order.profiles.first_name} ${order.profiles.last_name || ''}`.trim() : null) ||
    order.customer_name ||
    'Guest Customer';

  const email =
    notes?.contactDetails?.userEmail ||
    order.customer?.email ||
    order.profiles?.email ||
    order.customer_email ||
    null;

  const phone =
    notes?.contactDetails?.userPhone ||
    notes?.shippingDetails?.recipientPhone ||
    order.customer?.phone_number ||
    order.profiles?.phone ||
    order.customer_phone ||
    null;

  const address =
    notes?.shippingDetails?.deliveryAddress ||
    notes?.shippingDetails?.fullAddress ||
    order.delivery_address ||
    null;

  const location =
    notes?.shippingDetails?.location ||
    order.delivery_location ||
    null;

  return { name, email, phone, address, location, subStatus: notes?.sub_status };
}

function getEffectiveStatus(order: any): string {
  let notes: any = {};
  if (order.notes) {
    try {
      notes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
    } catch {
      notes = {};
    }
  }
  return (notes?.sub_status || order.status || 'pending').toLowerCase();
}

function isOrderEligibleForReminder(order: any): boolean {
  if (!order) return false;
  const effStatus = getEffectiveStatus(order);
  const dbStatus = String(order.status || 'pending').toLowerCase().trim();
  const paymentStatus = String(order.payment_status || 'pending').toLowerCase().trim();
  if (['success', 'paid', 'completed', 'settled', 'refunded'].includes(paymentStatus)) {
    return false;
  }
  return effStatus === 'pending' && dbStatus === 'pending';
}

function formatCooldownHoursLeft(nextEligibleAt: string | null): string {
  if (!nextEligibleAt) return '24h cooldown';
  const diffMs = new Date(nextEligibleAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Ready';
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const mins = Math.ceil((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 1) return `${hours}h left`;
  return `${Math.max(1, mins)}m left`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderCategory>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');
  
  // Modal & Selection state
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);

  // Payment Reminder state
  const [reminderSummaries, setReminderSummaries] = useState<Record<string, OrderReminderSummary>>({});
  const [remindingOrderId, setRemindingOrderId] = useState<string | null>(null);
  const [loadingModalReminders, setLoadingModalReminders] = useState(false);

  // Close card menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.card-action-menu')) {
        setActiveMenuOrderId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    fetchOrders();

    // Realtime subscription for live orders
    const subscription = supabase
      .channel('admin:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const orderIdDisplay = payload.new.order_number || ('#' + payload.new.id.split('-')[0].toUpperCase());
        toast.info(`New order received: ${orderIdDisplay}`);
        fetchOrders(false);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        fetchOrders(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch orders with customer profile
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles(id, first_name, last_name, email, phone_number)
        `)
        .order('created_at', { ascending: false });

      if (ordersErr && ordersErr.code !== '42P01') {
        throw ordersErr;
      }

      const rawOrders = ordersData || [];

      // 2. Fetch order items in batch to have images, product names, item counts
      if (rawOrders.length > 0) {
        const orderIds = rawOrders.map((o) => o.id);
        const { data: itemsData, error: itemsErr } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (!itemsErr && itemsData) {
          const itemsByOrderId = new Map<string, any[]>();
          itemsData.forEach((item) => {
            const list = itemsByOrderId.get(item.order_id) || [];
            list.push(item);
            itemsByOrderId.set(item.order_id, list);
          });

          const ordersWithItems = rawOrders.map((order) => ({
            ...order,
            order_items: itemsByOrderId.get(order.id) || []
          }));

          setOrders(ordersWithItems);
          fetchReminderSummaries(ordersWithItems.map((o) => o.id));
          return;
        }
      }

      setOrders(rawOrders);
      if (rawOrders.length > 0) {
        fetchReminderSummaries(rawOrders.map((o) => o.id));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchReminderSummaries = async (orderIds: string[]) => {
    if (!orderIds || orderIds.length === 0) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const batchIds = orderIds.slice(0, 250).join(',');
      const res = await fetch(`/api/checkout/admin/order-reminders?orderIds=${encodeURIComponent(batchIds)}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && data.summaries) {
        setReminderSummaries((prev) => ({ ...prev, ...data.summaries }));
      }
    } catch (err) {
      console.warn('Could not load order reminder summaries:', err);
    }
  };

  const fetchSingleOrderReminders = async (orderId: string) => {
    setLoadingModalReminders(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/checkout/admin/order-reminders?orderId=${encodeURIComponent(orderId)}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && data.summary) {
        setReminderSummaries((prev) => ({
          ...prev,
          [orderId]: data.summary
        }));
      }
    } catch (err) {
      console.warn('Could not load single order reminder history:', err);
    } finally {
      setLoadingModalReminders(false);
    }
  };

  const handleRemindBuyer = async (order: any) => {
    if (!order?.id) return;
    if (!isOrderEligibleForReminder(order)) {
      toast.error('Payment reminders can only be sent for pending unpaid orders.');
      return;
    }

    const orderLabel = order.order_number || '#' + order.id.slice(0, 8).toUpperCase();
    const toastId = `remind-${order.id}`;
    setRemindingOrderId(order.id);
    toast.loading(`Sending payment reminder for ${orderLabel}...`, { id: toastId });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Your admin session has expired. Please sign in again.', { id: toastId });
        return;
      }

      const response = await fetch('/api/checkout/admin/send-payment-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ orderId: order.id })
      });

      const data = await response.json().catch(() => null);

      if (data?.summary) {
        setReminderSummaries((prev) => ({
          ...prev,
          [order.id]: data.summary
        }));
      }

      if (!response.ok || !data?.success) {
        toast.error(data?.error || `Failed to send reminder for ${orderLabel}.`, { id: toastId });
        return;
      }

      toast.success(`Payment reminder sent to ${data.recipient} for ${orderLabel}`, { id: toastId });
      setActiveMenuOrderId(null);
    } catch (err: any) {
      console.error('Error sending payment reminder:', err);
      toast.error(err?.message || 'Network error sending payment reminder.', { id: toastId });
    } finally {
      setRemindingOrderId(null);
    }
  };

  const handleViewOrder = async (order: any) => {
    setSelectedOrder(order);
    fetchSingleOrderReminders(order.id);
    if (order.order_items && order.order_items.length > 0) {
      setOrderItems(order.order_items);
      setLoadingItems(false);
    } else {
      setLoadingItems(true);
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (error && error.code !== '42P01') throw error;
        setOrderItems(data || []);
      } catch (err) {
        console.error('Error fetching order items:', err);
        toast.error('Failed to load ordered products');
      } finally {
        setLoadingItems(false);
      }
    }
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const existingOrder = orders.find((o) => o.id === id);
      const currentEffStatus = existingOrder ? getEffectiveStatus(existingOrder) : '';
      if (currentEffStatus === newStatus.toLowerCase()) {
        toast.info(`Order is already marked as ${newStatus.replace(/_/g, ' ')}`);
        return;
      }

      // Guard: Fulfillment advancement requires verified payment
      const fulfillmentStatuses = [
        'processing',
        'confirmed',
        'ready_for_pickup',
        'packed',
        'ready',
        'out_for_delivery',
        'shipped',
        'delivered'
      ];
      if (
        fulfillmentStatuses.includes(newStatus.toLowerCase()) &&
        existingOrder?.payment_status !== 'success'
      ) {
        toast.error(`Cannot advance fulfillment for unpaid order. Payment is still ${existingOrder?.payment_status || 'pending'}.`);
        return;
      }

      // Map intermediate statuses to valid Postgres order_status enum values
      const dbStatusMap: Record<string, string> = {
        confirmed: 'processing',
        ready_for_pickup: 'processing',
        packed: 'processing',
        ready: 'processing',
        out_for_delivery: 'shipped'
      };
      const dbStatus = dbStatusMap[newStatus] || newStatus;

      let parsedNotes: Record<string, any> = {};
      if (existingOrder?.notes) {
        try {
          parsedNotes =
            typeof existingOrder.notes === 'string'
              ? JSON.parse(existingOrder.notes)
              : { ...existingOrder.notes };
        } catch {
          parsedNotes = {};
        }
      }
      parsedNotes.sub_status = newStatus;

      const { error } = await supabase
        .from('orders')
        .update({
          status: dbStatus,
          notes: JSON.stringify(parsedNotes),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: dbStatus, notes: JSON.stringify(parsedNotes) } : o
        )
      );

      // Trigger automatic customer notification
      await notifyOrderStatusChange({
        orderId: id,
        userId: existingOrder?.user_id || '',
        newStatus,
        oldStatus: existingOrder?.status,
        orderNumber: existingOrder?.order_number
      });

      toast.success(`Order marked as ${newStatus.replace(/_/g, ' ')}`);
      setActiveMenuOrderId(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleWhatsAppShare = (order: any) => {
    try {
      const cust = getCustomerInfo(order);
      const whatsappData: WhatsAppOrderData = {
        order_number: order.order_number || order.id.slice(0, 8).toUpperCase(),
        created_at: order.created_at,
        customer_name: cust.name,
        customer_phone: cust.phone || 'Phone unavailable',
        customer_email: cust.email || 'Email unavailable',
        items: (order.order_items || []).map((i: any) => ({
          product_name: i.product_name || 'Product',
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price || i.subtotal || i.unit_price * i.quantity
        })),
        subtotal: order.subtotal || order.total,
        delivery_fee: order.delivery_fee || order.shipping_fee || 0,
        discount: order.discount_amount || 0,
        grand_total: order.total,
        payment_method: order.payment_method || 'M-Pesa',
        payment_status: order.payment_status === 'success' ? 'PAID' : (order.payment_status || 'PENDING'),
        delivery_location: cust.location || 'Nairobi',
        delivery_address: cust.address || 'Nairobi, Kenya',
        status: getEffectiveStatus(order)
      };

      const msg = generateWhatsAppMessage(whatsappData);
      const url = getWhatsAppUrl(msg);
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Opened WhatsApp message draft');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate WhatsApp message');
    }
  };

  const handleCopyOrderId = (idStr: string) => {
    navigator.clipboard.writeText(idStr);
    toast.success(`Copied Order ID: ${idStr}`);
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.info('No orders to export');
      return;
    }

    const headers = ['Order Number', 'Date', 'Customer Name', 'Customer Email', 'Customer Phone', 'Status', 'Payment Status', 'Total (KES)', 'Items Count'];
    const rows = filteredOrders.map((o) => {
      const cust = getCustomerInfo(o);
      return [
        `"${o.order_number || o.id}"`,
        `"${format(new Date(o.created_at), 'yyyy-MM-dd HH:mm')}"`,
        `"${cust.name.replace(/"/g, '""')}"`,
        `"${(cust.email || '').replace(/"/g, '""')}"`,
        `"${(cust.phone || '').replace(/"/g, '""')}"`,
        `"${getEffectiveStatus(o)}"`,
        `"${o.payment_status || 'pending'}"`,
        `"${Number(o.total || 0).toFixed(2)}"`,
        `"${o.order_items?.length || 1}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `odamarket-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders CSV exported');
  };

  // Dynamic counts for all status categories
  const categoryCounts = useMemo(() => {
    const counts: Record<OrderCategory, number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      ready_for_pickup: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach((o) => {
      const st = getEffectiveStatus(o);
      if (st === 'confirmed') counts.confirmed++;
      else if (st === 'processing' || st === 'packed' || st === 'ready') counts.processing++;
      else if (st === 'ready_for_pickup') counts.ready_for_pickup++;
      else if (st === 'out_for_delivery' || st === 'shipped') counts.out_for_delivery++;
      else if (st === 'delivered') counts.delivered++;
      else if (st === 'cancelled') counts.cancelled++;
      else counts.pending++;
    });

    return counts;
  }, [orders]);

  // Status Categories Tabs
  const statusTabs: { id: OrderCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All Orders', count: categoryCounts.all },
    { id: 'pending', label: 'Pending', count: categoryCounts.pending },
    { id: 'confirmed', label: 'Confirmed', count: categoryCounts.confirmed },
    { id: 'processing', label: 'Processing', count: categoryCounts.processing },
    { id: 'ready_for_pickup', label: 'Ready for Pickup', count: categoryCounts.ready_for_pickup },
    { id: 'out_for_delivery', label: 'Out for Delivery', count: categoryCounts.out_for_delivery },
    { id: 'delivered', label: 'Delivered', count: categoryCounts.delivered },
    { id: 'cancelled', label: 'Cancelled', count: categoryCounts.cancelled }
  ];

  // Filtering & Sorting
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const cust = getCustomerInfo(o);
        const orderNumber = (o.order_number || '').toLowerCase();
        const orderId = (o.id || '').toLowerCase();
        const custName = cust.name.toLowerCase();
        const custEmail = (cust.email || '').toLowerCase();
        const q = search.trim().toLowerCase();

        // Search matches: Order ID, Customer name, Customer email, Product name
        const matchesProduct = o.order_items?.some((it: any) =>
          it.product_name?.toLowerCase().includes(q)
        );

        const matchesSearch =
          !q ||
          orderNumber.includes(q) ||
          orderId.includes(q) ||
          custName.includes(q) ||
          custEmail.includes(q) ||
          matchesProduct;

        // Status tab matching
        const st = getEffectiveStatus(o);
        let matchesStatus = true;
        if (statusFilter !== 'all') {
          if (statusFilter === 'processing') {
            matchesStatus = ['processing', 'packed', 'ready'].includes(st);
          } else if (statusFilter === 'out_for_delivery') {
            matchesStatus = ['out_for_delivery', 'shipped'].includes(st);
          } else {
            matchesStatus = st === statusFilter;
          }
        }

        // Payment status filter
        let matchesPayment = true;
        if (paymentFilter !== 'all') {
          if (paymentFilter === 'paid') {
            matchesPayment = o.payment_status === 'success';
          } else if (paymentFilter === 'pending') {
            matchesPayment = !o.payment_status || o.payment_status === 'pending';
          } else if (paymentFilter === 'failed') {
            matchesPayment = o.payment_status === 'failed' || o.payment_status === 'abandoned';
          }
        }

        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'amount_high') {
          return Number(b.total || 0) - Number(a.total || 0);
        }
        if (sortBy === 'amount_low') {
          return Number(a.total || 0) - Number(b.total || 0);
        }
        return 0;
      });
  }, [orders, search, statusFilter, paymentFilter, sortBy]);

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          label: 'Pending',
          icon: Clock,
          color: 'text-amber-800',
          bg: 'bg-amber-50',
          border: 'border-amber-200'
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          icon: CheckCircle2,
          color: 'text-emerald-800',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200'
        };
      case 'processing':
      case 'packed':
      case 'ready':
        return {
          label: 'Processing',
          icon: Package,
          color: 'text-[#C65A28]',
          bg: 'bg-orange-50',
          border: 'border-orange-200'
        };
      case 'ready_for_pickup':
        return {
          label: 'Ready for Pickup',
          icon: Store,
          color: 'text-[#C65A28]',
          bg: 'bg-orange-50',
          border: 'border-orange-200'
        };
      case 'out_for_delivery':
      case 'shipped':
        return {
          label: 'Out for Delivery',
          icon: Truck,
          color: 'text-blue-800',
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        };
      case 'delivered':
        return {
          label: 'Delivered',
          icon: CheckCircle2,
          color: 'text-emerald-800',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: XCircle,
          color: 'text-rose-800',
          bg: 'bg-rose-50',
          border: 'border-rose-200'
        };
      default:
        return {
          label: status ? status.replace(/_/g, ' ') : 'Unknown',
          icon: AlertCircle,
          color: 'text-neutral-600',
          bg: 'bg-white',
          border: 'border-neutral-200'
        };
    }
  };

  const availableStatusOptions = [
    { value: 'pending', label: 'Mark as Pending' },
    { value: 'confirmed', label: 'Mark as Confirmed' },
    { value: 'processing', label: 'Mark as Processing' },
    { value: 'ready_for_pickup', label: 'Mark as Ready for Pickup' },
    { value: 'out_for_delivery', label: 'Mark as Out for Delivery' },
    { value: 'delivered', label: 'Mark as Delivered' },
    { value: 'cancelled', label: 'Mark as Cancelled' }
  ];

  return (
    <div className="space-y-6 pb-12 bg-white text-neutral-800">
      {/* Page Header: Pure White with ODA Market Orange Accents */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-orange-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-neutral-900 tracking-tight">
              Orders Management
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-[#C65A28] border border-orange-200 shadow-2xs">
              {orders.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Track, fulfill, and manage customer orders across all stages in ODA Market.
          </p>
        </div>

        {/* Global Page Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchOrders(false)}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:text-[#C65A28] hover:border-orange-300 hover:bg-orange-50/50 transition-all shadow-xs"
            title="Refresh Orders"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#C65A28]")} />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-orange-50/60 border border-orange-200 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#C65A28] transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-[#C65A28]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Container - Crisp White and Theme Orange Only */}
      <div className="bg-white rounded-2xl border border-orange-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Status Categories Tabs */}
        <div className="border-b border-orange-100 px-3 sm:px-4 pt-3 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide bg-white">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "relative px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 mb-2.5",
                  isActive
                    ? "bg-gradient-to-r from-[#C65A28] via-[#cf5f2c] to-orange-500 text-white shadow-sm shadow-orange-500/25 border border-orange-600"
                    : "bg-white text-neutral-600 hover:text-[#C65A28] hover:bg-orange-50/60 border border-neutral-200 hover:border-orange-300"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-orange-50/80 text-[#C65A28] border border-orange-100"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Control Filters Bar - Pure White */}
        <div className="p-4 border-b border-orange-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C65A28]" />
            <input
              type="text"
              placeholder="Search by Order ID, customer, email, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10 pr-9 rounded-xl bg-white border border-neutral-200 focus:border-[#C65A28] focus:ring-2 focus:ring-orange-500/20 w-full transition-all outline-none text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters: Payment & Sorting */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500 font-medium hidden sm:inline">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="h-10 px-3 rounded-xl bg-white border border-neutral-200 hover:border-orange-300 text-xs font-semibold text-neutral-800 outline-none focus:border-[#C65A28] shadow-xs"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid (Verified)</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed / Abandoned</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500 font-medium hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 px-3 rounded-xl bg-white border border-neutral-200 hover:border-orange-300 text-xs font-semibold text-neutral-800 outline-none focus:border-[#C65A28] shadow-xs"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_high">Highest Amount</option>
                <option value="amount_low">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Area: Card-Based Grid on Pure White */}
        <div className="p-4 sm:p-6 bg-white">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-3 border-[#C65A28] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold text-neutral-900">
                Loading orders...
              </p>
              <p className="text-xs text-neutral-400 mt-1">Retrieving live orders from database.</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-4 text-[#C65A28]">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                No orders found
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                {search || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'No orders match your current filters or search term.'
                  : 'There are currently no orders in this category.'}
              </p>
              {(search || statusFilter !== 'all' || paymentFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setPaymentFilter('all');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C65A28] to-orange-500 text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Results summary counter */}
              <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
                <span>
                  Showing <strong className="text-neutral-900 font-bold">{filteredOrders.length}</strong> {filteredOrders.length === 1 ? 'order' : 'orders'}
                </span>
                {statusFilter !== 'all' && (
                  <span className="capitalize font-bold text-[#C65A28]">
                    Filtered by: {statusFilter.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {/* Responsive Cards Grid: 3-4 cards per row on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredOrders.map((order) => {
                  const cust = getCustomerInfo(order);
                  const effectiveStatus = getEffectiveStatus(order);
                  const statusConf = getStatusConfig(effectiveStatus);
                  const StatusIcon = statusConf.icon;
                  const isPaid = order.payment_status === 'success';
                  const orderNumberDisplay =
                    order.order_number || ('#' + (order.id ? order.id.slice(0, 8).toUpperCase() : 'UNKNOWN'));

                  const itemsList: any[] = order.order_items || [];
                  const totalItemsCount = itemsList.reduce(
                    (acc, it) => acc + (it.quantity || 1),
                    0
                  ) || 1;

                  const firstItem = itemsList[0];
                  const thumbnails = itemsList.filter((it) => it.product_image).slice(0, 3);
                  const isMenuOpen = activeMenuOrderId === order.id;
                  const remindable = isOrderEligibleForReminder(order);
                  const remSummary = reminderSummaries[order.id];
                  const isRemindingThis = remindingOrderId === order.id;
                  const isCooldownActive = Boolean(remSummary?.cooldownActive);

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-neutral-200 hover:border-[#C65A28] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Top Edge Decorative Orange Highlight Accent */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C65A28] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Top Row: Order ID, Status Badge & Action Menu */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => handleCopyOrderId(orderNumberDisplay)}
                                className="font-mono font-bold text-sm sm:text-base text-neutral-900 group-hover:text-[#C65A28] transition-colors cursor-pointer truncate"
                                title="Click to copy Order ID"
                              >
                                {orderNumberDisplay}
                              </span>
                              <button
                                onClick={() => handleCopyOrderId(orderNumberDisplay)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-[#C65A28] transition-opacity"
                                title="Copy Order Number"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                              <Calendar className="w-3 h-3 text-[#C65A28] shrink-0" />
                              <span className="truncate">
                                {format(new Date(order.created_at), 'MMM dd, yyyy • h:mm a')}
                              </span>
                            </div>
                          </div>

                          {/* Top-Right Menu & Status Pill */}
                          <div className="flex items-center gap-1 shrink-0 relative card-action-menu">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border shadow-2xs",
                                statusConf.bg,
                                statusConf.color,
                                statusConf.border
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span>{statusConf.label}</span>
                            </span>

                            {/* Dropdown Menu Trigger */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuOrderId(isMenuOpen ? null : order.id);
                              }}
                              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-orange-50/60 transition-colors"
                              title="More Options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Floating Action Menu */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-8 w-52 bg-white rounded-xl shadow-xl border border-orange-200 py-1.5 z-30"
                              >
                                <div className="px-3 py-1 text-[10px] uppercase font-bold text-neutral-400 tracking-wider border-b border-orange-100 mb-1">
                                  Update Order Status
                                </div>
                                {availableStatusOptions.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => updateOrderStatus(order.id, opt.value)}
                                    className={cn(
                                      "w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-orange-50/70 transition-colors",
                                      effectiveStatus === opt.value
                                        ? "font-bold text-[#C65A28]"
                                        : "text-neutral-700"
                                    )}
                                  >
                                    <span>{opt.label}</span>
                                    {effectiveStatus === opt.value && (
                                      <Check className="w-3.5 h-3.5 text-[#C65A28]" />
                                    )}
                                  </button>
                                ))}

                                <div className="border-t border-orange-100 my-1 pt-1">
                                  {remindable && (
                                    <button
                                      onClick={() => {
                                        handleRemindBuyer(order);
                                        setActiveMenuOrderId(null);
                                      }}
                                      disabled={isRemindingThis || isCooldownActive}
                                      className={cn(
                                        "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 font-semibold",
                                        isRemindingThis || isCooldownActive
                                          ? "text-neutral-400 cursor-not-allowed"
                                          : "text-[#C65A28] hover:bg-orange-50/70"
                                      )}
                                    >
                                      <BellRing className="w-3.5 h-3.5" />
                                      <span>
                                        {isCooldownActive
                                          ? `Reminded (${formatCooldownHoursLeft(remSummary?.nextEligibleAt || null)})`
                                          : 'Remind Buyer'}
                                      </span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      handleWhatsAppShare(order);
                                      setActiveMenuOrderId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-medium"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>WhatsApp Message</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleViewOrder(order);
                                      setActiveMenuOrderId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-neutral-800 hover:bg-orange-50/70 flex items-center gap-2 font-medium"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Full Details</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Customer Info Box: Crisp White to subtle Orange */}
                        <div className="bg-orange-50/40 border border-orange-100/90 rounded-xl p-3 my-3 shadow-2xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C65A28] to-orange-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {cust.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-neutral-900 truncate">
                                {cust.name}
                              </p>
                              {cust.email ? (
                                <p className="text-[11px] text-neutral-500 truncate">
                                  {cust.email}
                                </p>
                              ) : cust.phone ? (
                                <p className="text-[11px] text-neutral-500 truncate">
                                  {cust.phone}
                                </p>
                              ) : (
                                <p className="text-[11px] text-neutral-400 italic">
                                  Guest Checkout
                                </p>
                              )}
                            </div>
                          </div>

                          {cust.location && (
                            <div className="flex items-center gap-1.5 text-[10.5px] text-neutral-600 mt-2 pt-2 border-t border-orange-100/80 truncate">
                              <MapPin className="w-3 h-3 text-[#C65A28] shrink-0" />
                              <span className="truncate font-medium">{cust.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Product Thumbnail / Ordered Items Preview */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-neutral-400">
                              Products
                            </span>
                            <span className="font-bold bg-orange-50 px-2 py-0.5 rounded-full text-[10px] text-[#C65A28] border border-orange-200">
                              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {thumbnails.length > 0 ? (
                              <div className="flex items-center -space-x-2 overflow-hidden py-0.5">
                                {thumbnails.map((it, idx) => (
                                  <img
                                    key={idx}
                                    src={it.product_image}
                                    alt={it.product_name}
                                    className="w-10 h-10 rounded-xl object-cover border-2 border-white bg-white shadow-xs shrink-0"
                                  />
                                ))}
                                {itemsList.length > 3 && (
                                  <div className="w-10 h-10 rounded-xl bg-orange-50 border-2 border-white flex items-center justify-center text-[10px] font-extrabold text-[#C65A28] shrink-0 shadow-xs">
                                    +{itemsList.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C65A28] shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1 pl-1">
                              <p className="text-xs font-semibold text-neutral-800 line-clamp-1">
                                {firstItem?.product_name || 'Order Item'}
                              </p>
                              {itemsList.length > 1 && (
                                <p className="text-[10px] text-neutral-400">
                                  and {itemsList.length - 1} other {itemsList.length - 1 === 1 ? 'item' : 'items'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Amount, Payment Status & Actions */}
                      <div className="pt-3 border-t border-neutral-100 mt-2 space-y-2.5">
                        {remindable && remSummary && remSummary.sentCount > 0 && (
                          <div className="flex items-center justify-between gap-2 text-[10.5px] bg-orange-50/70 border border-orange-100 rounded-lg px-2.5 py-1.5 text-neutral-600">
                            <span className="inline-flex items-center gap-1 font-semibold text-[#C65A28]">
                              <Mail className="w-3 h-3 shrink-0" />
                              Reminded {remSummary.sentCount}x
                            </span>
                            {remSummary.lastRemindedAt && (
                              <span className="truncate text-neutral-500">
                                {format(new Date(remSummary.lastRemindedAt), 'MMM dd, h:mm a')}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-end justify-between gap-2">
                          {/* Total and Payment Status */}
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                              Total Amount
                            </span>
                            <span className="text-base sm:text-lg font-black text-neutral-900 tabular-nums tracking-tight">
                              KSh {Number(order.total || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <div className="mt-1">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-2xs",
                                  isPaid
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : order.payment_status === 'failed' || order.payment_status === 'abandoned'
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isPaid ? "bg-emerald-600" : "bg-amber-500"
                                  )}
                                />
                                {isPaid ? 'PAID' : (order.payment_status || 'PENDING')}
                              </span>
                            </div>
                          </div>

                          {/* Card Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {remindable && (
                              <button
                                onClick={() => handleRemindBuyer(order)}
                                disabled={isRemindingThis || isCooldownActive}
                                title={
                                  isCooldownActive && remSummary?.nextEligibleAt
                                    ? `24h cooldown active until ${format(new Date(remSummary.nextEligibleAt), 'MMM dd, h:mm a')}`
                                    : 'Send payment reminder email to buyer'
                                }
                                className={cn(
                                  "inline-flex items-center justify-center gap-1 px-2.5 py-2.5 rounded-xl text-xs font-bold border transition-all shrink-0",
                                  isRemindingThis || isCooldownActive
                                    ? "bg-orange-50/70 text-orange-400 border-orange-200 cursor-not-allowed"
                                    : "bg-white hover:bg-orange-50 text-[#C65A28] border-orange-300 hover:border-[#C65A28] shadow-2xs active:scale-95"
                                )}
                              >
                                {isRemindingThis ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Sending...</span>
                                  </>
                                ) : isCooldownActive ? (
                                  <>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatCooldownHoursLeft(remSummary?.nextEligibleAt || null)}</span>
                                  </>
                                ) : (
                                  <>
                                    <BellRing className="w-3.5 h-3.5" />
                                    <span>Remind Buyer</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Primary "View Order" Action Button with Theme Orange Gradient */}
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#C65A28] via-[#cf5f2c] to-orange-600 hover:from-[#b34e20] hover:to-[#C65A28] text-white text-xs sm:text-sm font-bold shadow-xs shadow-orange-500/25 active:scale-95 transition-all shrink-0"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Order</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal (Crisp Orange & White Theme) */}
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        orderItems={orderItems}
        loadingItems={loadingItems}
        reminderSummary={selectedOrder ? reminderSummaries[selectedOrder.id] || null : null}
        loadingReminders={loadingModalReminders}
        isRemindable={selectedOrder ? isOrderEligibleForReminder(selectedOrder) : false}
        isReminding={selectedOrder ? remindingOrderId === selectedOrder.id : false}
        onRemindBuyer={handleRemindBuyer}
      />
    </div>
  );
}