import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  User, MapPin, CreditCard, Bell, Globe, 
  Shield, Key, Trash2, Plus, Edit2, CheckCircle2, 
  Loader2, Smartphone, AlertTriangle, Eye, EyeOff,
  LogOut, Check, X, Info, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

// Kenyan Counties List
const KENYA_COUNTIES = [
  "Nairobi", "Kiambu", "Machakos", "Kajiado", "Mombasa", "Nakuru", 
  "Kisumu", "Uasin Gishu (Eldoret)", "Kilifi", "Nyeri", "Meru", "Murang'a",
  "Embu", "Laikipia", "Kericho", "Bomet", "Kakamega", "Bungoma", "Trans Nzoia (Kitale)",
  "Homa Bay", "Migori", "Kisii", "Nyamira", "Siaya", "Busia", "Garissa", "Wajir",
  "Mandera", "Marsabit", "Isiolo", "Kitui", "Makueni", "Nyandarua", "Kirinyaga",
  "Turkana", "West Pokot", "Samburu", "Elgeyo-Marakwet", "Nandi", "Baringo",
  "Narok", "Vihiga", "Kwale", "Taita-Taveta", "Tana River", "Lamu", "Tharaka-Nithi"
];

// Helper: Normalize & validate Kenyan phone numbers
export function formatKenyanPhone(phone: string): string {
  const cleaned = phone.trim().replace(/[^0-9+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+254')) return cleaned;
  if (cleaned.startsWith('254')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+254${cleaned.slice(1)}`;
  if (cleaned.length === 9) return `+254${cleaned}`;
  return cleaned;
}

export function isValidKenyanPhone(phone: string): boolean {
  const formatted = formatKenyanPhone(phone);
  return /^\+254[17]\d{8}$/.test(formatted);
}

// Helper: Formats Kenyan phone numbers for clear readable presentation (e.g. +254 11 946 6519)
export function displayKenyanPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return `+254 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+254 ${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (phone.startsWith('+254') && phone.length === 13) {
    return `+254 ${phone.slice(4, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
  }
  return phone;
}

interface DeliveryAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  county: string;
  town_city: string;
  area_location: string;
  street_building: string;
  delivery_instructions: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SavedPaymentMethod {
  id: string;
  type: 'mpesa' | 'airtel' | 'card' | 'bank' | 'cash';
  phone?: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  cardholder_name?: string;
  nickname?: string;
  is_default: boolean;
  created_at?: string;
}

interface NotificationPreferences {
  order_confirmations: boolean;
  order_status_updates: boolean;
  promotions_and_deals: boolean;
  whatsapp_updates: boolean;
  price_drop_alerts: boolean;
  security_alerts: boolean;
}

interface BuyerPreferences {
  currency: string;
  language: string;
  theme: string;
  delivery_window: string;
  packaging_preference: string;
  substitution_rule: string;
  save_cart: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  order_confirmations: true,
  order_status_updates: true,
  promotions_and_deals: true,
  whatsapp_updates: true,
  price_drop_alerts: false,
  security_alerts: true,
};

const DEFAULT_PREFERENCES: BuyerPreferences = {
  currency: 'KES',
  language: 'en',
  theme: 'system',
  delivery_window: 'anytime',
  packaging_preference: 'eco_friendly',
  substitution_rule: 'call_first',
  save_cart: true,
};

export interface SettingsPageProps {
  defaultTab?: 'personal' | 'addresses' | 'payments' | 'notifications' | 'preferences' | 'security';
}

export default function SettingsPage({ defaultTab }: SettingsPageProps = {}) {
  const { profile, user, setProfile, signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const getInitialTab = (): 'personal' | 'addresses' | 'payments' | 'notifications' | 'preferences' | 'security' => {
    if (defaultTab) return defaultTab;
    if (location.pathname.endsWith('/payments') || location.pathname.includes('/payments')) return 'payments';
    if (location.pathname.endsWith('/addresses') || location.pathname.includes('/addresses')) return 'addresses';
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['personal', 'addresses', 'payments', 'notifications', 'preferences', 'security'].includes(tabParam)) {
      return tabParam as any;
    }
    return 'personal';
  };

  const [activeTab, setActiveTab] = useState<'personal' | 'addresses' | 'payments' | 'notifications' | 'preferences' | 'security'>(getInitialTab);

  useEffect(() => {
    if (location.pathname.endsWith('/payments') || location.pathname.includes('/payments') || defaultTab === 'payments') {
      setActiveTab('payments');
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    } else {
      const params = new URLSearchParams(location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['personal', 'addresses', 'payments', 'notifications', 'preferences', 'security'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      } else if (location.pathname.endsWith('/settings')) {
        setActiveTab('personal');
      }
    }
  }, [location.pathname, location.search, defaultTab]);

  // ==========================================
  // 1. PERSONAL INFO STATE
  // ==========================================
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  // Sync initial personal info from profile or user metadata
  useEffect(() => {
    if (profile || user) {
      const initialFirst = profile?.first_name || 
        user?.user_metadata?.first_name || 
        (user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : '') || '';
      
      const initialLast = profile?.last_name || 
        user?.user_metadata?.last_name || 
        (user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ').slice(1).join(' ') : '') || '';
      
      const initialPhone = (profile as any)?.phone_number || 
        profile?.phone || 
        user?.phone || 
        user?.user_metadata?.phone || 
        '';

      setFirstName(initialFirst);
      setLastName(initialLast);
      setPhone(initialPhone);
    }
  }, [profile, user]);

  // Realtime subscription for Profile changes
  useEffect(() => {
    if (!user?.id) return;

    const profileChannel = supabase
      .channel(`profile_realtime_${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as any;
            setFirstName(updated.first_name || '');
            setLastName(updated.last_name || '');
            setPhone(updated.phone_number || '');
            if (profile) {
              setProfile({
                ...profile,
                first_name: updated.first_name,
                last_name: updated.last_name,
                phone: updated.phone_number,
                phone_number: updated.phone_number,
              } as any);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user?.id, profile, setProfile]);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to update your profile.');
      return;
    }

    if (!firstName.trim()) {
      toast.error('First Name is required.');
      return;
    }

    let formattedPhone = phone.trim();
    if (formattedPhone) {
      if (!isValidKenyanPhone(formattedPhone)) {
        toast.error('Please enter a valid Kenyan phone number (e.g. 0712 345 678 or +254 712 345 678).');
        return;
      }
      formattedPhone = formatKenyanPhone(formattedPhone);
    }

    setIsSavingPersonal(true);
    try {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

      // 1. Update Supabase profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: trimmedFirst,
          last_name: trimmedLast,
          phone_number: formattedPhone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError && profileError.code !== '42703') {
        throw profileError;
      }

      // 2. Update Supabase Auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          first_name: trimmedFirst,
          last_name: trimmedLast,
          phone: formattedPhone || null,
        }
      });

      if (authError) {
        console.warn('Notice updating user metadata:', authError);
      }

      // 3. Update auth store so changes reflect globally across headers and dashboard immediately
      if (profile) {
        setProfile({
          ...profile,
          first_name: trimmedFirst,
          last_name: trimmedLast,
          phone: formattedPhone,
          phone_number: formattedPhone,
        } as any);
      }

      setPhone(formattedPhone);
      toast.success('Personal information updated successfully!');
    } catch (err: any) {
      console.error('Failed to update personal details:', err);
      toast.error(err.message || 'Failed to update personal information');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // ==========================================
  // 2. DELIVERY ADDRESSES STATE
  // ==========================================
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    county: 'Nairobi',
    town_city: '',
    area_location: '',
    street_building: '',
    delivery_instructions: '',
    is_default: false
  });

  const fetchAddresses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error fetching delivery addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Realtime subscription for Delivery Addresses
  useEffect(() => {
    if (!user?.id) return;

    const addressChannel = supabase
      .channel(`delivery_addresses_realtime_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_addresses', filter: `user_id=eq.${user.id}` },
        () => {
          fetchAddresses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(addressChannel);
    };
  }, [user?.id, fetchAddresses]);

  const openAddAddressModal = () => {
    const defaultRecipient = [firstName, lastName].filter(Boolean).join(' ') || 
      user?.user_metadata?.full_name || 
      '';
    const defaultRecipientPhone = phone || user?.phone || user?.user_metadata?.phone || '';

    setAddressForm({
      full_name: defaultRecipient,
      phone: defaultRecipientPhone,
      county: 'Nairobi',
      town_city: '',
      area_location: '',
      street_building: '',
      delivery_instructions: '',
      is_default: addresses.length === 0
    });
    setEditingAddressId(null);
    setShowAddressModal(true);
  };

  const openEditAddressModal = (addr: DeliveryAddress) => {
    setAddressForm({
      full_name: addr.full_name || '',
      phone: addr.phone || '',
      county: addr.county || 'Nairobi',
      town_city: addr.town_city || '',
      area_location: addr.area_location || '',
      street_building: addr.street_building || '',
      delivery_instructions: addr.delivery_instructions || '',
      is_default: !!addr.is_default
    });
    setEditingAddressId(addr.id);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!addressForm.full_name.trim()) {
      toast.error('Recipient full name is required.');
      return;
    }

    if (!addressForm.phone.trim()) {
      toast.error('Contact phone number is required.');
      return;
    }

    if (!isValidKenyanPhone(addressForm.phone)) {
      toast.error('Please enter a valid Kenyan phone number for delivery updates.');
      return;
    }

    if (!addressForm.county.trim()) {
      toast.error('County is required.');
      return;
    }

    if (!addressForm.street_building.trim()) {
      toast.error('Street / Building / House information is required.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const normalizedPhone = formatKenyanPhone(addressForm.phone);
      const isDefault = addressForm.is_default || addresses.length === 0;

      // If setting default, unset existing defaults first
      if (isDefault) {
        await supabase
          .from('delivery_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (editingAddressId) {
        const { error } = await supabase
          .from('delivery_addresses')
          .update({
            full_name: addressForm.full_name.trim(),
            phone: normalizedPhone,
            county: addressForm.county.trim(),
            town_city: addressForm.town_city.trim(),
            area_location: addressForm.area_location.trim(),
            street_building: addressForm.street_building.trim(),
            delivery_instructions: addressForm.delivery_instructions.trim(),
            is_default: isDefault,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAddressId)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Delivery address updated successfully!');
      } else {
        const { error } = await supabase
          .from('delivery_addresses')
          .insert([{
            user_id: user.id,
            full_name: addressForm.full_name.trim(),
            phone: normalizedPhone,
            county: addressForm.county.trim(),
            town_city: addressForm.town_city.trim(),
            area_location: addressForm.area_location.trim(),
            street_building: addressForm.street_building.trim(),
            delivery_instructions: addressForm.delivery_instructions.trim(),
            is_default: isDefault,
          }]);

        if (error) throw error;
        toast.success('New delivery address added successfully!');
      }

      setShowAddressModal(false);
      setEditingAddressId(null);
      await fetchAddresses();
    } catch (err: any) {
      console.error('Error saving address:', err);
      toast.error(err.message || 'Failed to save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;
    try {
      await supabase
        .from('delivery_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('delivery_addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Default delivery address updated.');
      await fetchAddresses();
    } catch (err: any) {
      console.error('Failed to set default address:', err);
      toast.error('Failed to update default address.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this delivery address?')) return;

    try {
      const { error } = await supabase
        .from('delivery_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Address removed.');
      await fetchAddresses();
    } catch (err: any) {
      console.error('Failed to delete address:', err);
      toast.error('Failed to delete address.');
    }
  };

  // ==========================================
  // 3. PAYMENT METHODS STATE
  // ==========================================
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalTab, setPaymentModalTab] = useState<'mpesa' | 'card'>('mpesa');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // M-Pesa Form
  const [mpesaForm, setMpesaForm] = useState({
    type: 'mpesa' as const,
    phone: '',
    nickname: 'Personal M-Pesa',
    is_default: true
  });

  // Card Form
  const [cardForm, setCardForm] = useState({
    cardholder_name: '',
    card_brand: 'Visa',
    card_last4: '',
    card_exp_month: 12,
    card_exp_year: 2028,
    is_default: false
  });

  const fetchPaymentMethods = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Try querying buyer_payment_methods table
      const { data, error } = await supabase
        .from('buyer_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (!error && data) {
        setPaymentMethods(data);
        return;
      }

      // 2. Fallback to user metadata
      const metaMethods = (user.user_metadata?.saved_payment_methods as SavedPaymentMethod[]) || [];
      setPaymentMethods(metaMethods);
    } catch (err) {
      console.warn('Note loading payment methods:', err);
      const metaMethods = (user.user_metadata?.saved_payment_methods as SavedPaymentMethod[]) || [];
      setPaymentMethods(metaMethods);
    } finally {
      setIsLoadingPayments(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // Realtime subscription for buyer_payment_methods
  useEffect(() => {
    if (!user?.id) return;

    const pmChannel = supabase
      .channel(`payment_methods_realtime_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'buyer_payment_methods', filter: `user_id=eq.${user.id}` },
        () => {
          fetchPaymentMethods();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pmChannel);
    };
  }, [user?.id, fetchPaymentMethods]);

  // State for editing and deletion confirmation
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<SavedPaymentMethod | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<SavedPaymentMethod | null>(null);

  const openAddPaymentModal = () => {
    setEditingPaymentMethod(null);
    const defaultMpesa = phone || user?.phone || user?.user_metadata?.phone || '';
    setMpesaForm({
      type: 'mpesa',
      phone: defaultMpesa,
      nickname: 'Personal M-Pesa',
      is_default: paymentMethods.length === 0
    });
    setCardForm({
      cardholder_name: [firstName, lastName].filter(Boolean).join(' ') || 'Valued Buyer',
      card_brand: 'Visa',
      card_last4: '',
      card_exp_month: 12,
      card_exp_year: new Date().getFullYear() + 3,
      is_default: false
    });
    setPaymentModalTab('mpesa');
    setShowPaymentModal(true);
  };

  const openEditPaymentModal = (pm: SavedPaymentMethod) => {
    setEditingPaymentMethod(pm);
    if (pm.type === 'mpesa') {
      setMpesaForm({
        type: 'mpesa',
        phone: pm.phone || '',
        nickname: pm.nickname || 'Personal M-Pesa',
        is_default: !!pm.is_default
      });
      setPaymentModalTab('mpesa');
    } else {
      setCardForm({
        cardholder_name: pm.cardholder_name || '',
        card_brand: pm.card_brand || 'Visa',
        card_last4: pm.card_last4 || '',
        card_exp_month: pm.card_exp_month || 12,
        card_exp_year: pm.card_exp_year || (new Date().getFullYear() + 3),
        is_default: !!pm.is_default
      });
      setPaymentModalTab('card');
    }
    setShowPaymentModal(true);
  };

  const handleSaveMpesaMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!mpesaForm.phone.trim()) {
      toast.error('M-Pesa phone number is required.');
      return;
    }

    if (!isValidKenyanPhone(mpesaForm.phone)) {
      toast.error('Please enter a valid Safaricom/Kenyan mobile number.');
      return;
    }

    const formatted = formatKenyanPhone(mpesaForm.phone);
    const isDefault = mpesaForm.is_default || paymentMethods.length === 0;

    setIsSavingPayment(true);
    try {
      if (editingPaymentMethod) {
        // Update existing method
        if (isDefault) {
          try {
            await supabase
              .from('buyer_payment_methods')
              .update({ is_default: false })
              .eq('user_id', user.id);
          } catch (e) {}
        }

        try {
          await supabase
            .from('buyer_payment_methods')
            .update({
              phone: formatted,
              nickname: mpesaForm.nickname.trim() || 'Personal M-Pesa',
              is_default: isDefault,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingPaymentMethod.id)
            .eq('user_id', user.id);
        } catch (dbErr) {
          console.warn('Note updating buyer_payment_methods:', dbErr);
        }

        const existing = (user.user_metadata?.saved_payment_methods as SavedPaymentMethod[]) || [];
        const updatedList = existing.map(pm => {
          if (pm.id === editingPaymentMethod.id) {
            return {
              ...pm,
              phone: formatted,
              nickname: mpesaForm.nickname.trim() || 'Personal M-Pesa',
              is_default: isDefault
            };
          }
          return isDefault ? { ...pm, is_default: false } : pm;
        });

        await supabase.auth.updateUser({
          data: { saved_payment_methods: updatedList }
        });

        toast.success('M-Pesa details updated successfully!');
      } else {
        // Add new method
        const newMethod: SavedPaymentMethod = {
          id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'mpesa',
          phone: formatted,
          nickname: mpesaForm.nickname.trim() || 'Personal M-Pesa',
          is_default: isDefault,
          created_at: new Date().toISOString()
        };

        if (isDefault) {
          try {
            await supabase
              .from('buyer_payment_methods')
              .update({ is_default: false })
              .eq('user_id', user.id);
          } catch (e) {}
        }

        try {
          await supabase.from('buyer_payment_methods').insert([{
            user_id: user.id,
            type: 'mpesa',
            phone: formatted,
            nickname: newMethod.nickname,
            is_default: isDefault
          }]);
        } catch (dbErr) {
          console.warn('Note persisting to buyer_payment_methods table (fallback to metadata):', dbErr);
        }

        const existing = (user.user_metadata?.saved_payment_methods as SavedPaymentMethod[]) || [];
        const updatedList = isDefault 
          ? existing.map(pm => ({ ...pm, is_default: false })).concat(newMethod)
          : existing.concat(newMethod);

        await supabase.auth.updateUser({
          data: { saved_payment_methods: updatedList }
        });

        toast.success('M-Pesa payment method saved successfully!');
      }

      setShowPaymentModal(false);
      setEditingPaymentMethod(null);
      await fetchPaymentMethods();
    } catch (err: any) {
      console.error('Error saving M-Pesa payment method:', err);
      toast.error(err.message || 'Failed to save payment method.');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleSaveCardMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!cardForm.cardholder_name.trim()) {
      toast.error('Cardholder name is required.');
      return;
    }

    const cleanLast4 = cardForm.card_last4.replace(/\D/g, '');
    if (cleanLast4.length !== 4) {
      toast.error('Please enter the last 4 digits of your card.');
      return;
    }

    const isDefault = cardForm.is_default || paymentMethods.length === 0;
    setIsSavingPayment(true);

    try {
      if (editingPaymentMethod) {
        if (isDefault) {
          try {
            await supabase
              .from('buyer_payment_methods')
              .update({ is_default: false })
              .eq('user_id', user.id);
          } catch (e) {}
        }

        try {
          await supabase
            .from('buyer_payment_methods')
            .update({
              cardholder_name: cardForm.cardholder_name.trim(),
              card_brand: cardForm.card_brand,
              card_last4: cleanLast4,
              card_exp_month: Number(cardForm.card_exp_month),
              card_exp_year: Number(cardForm.card_exp_year),
              is_default: isDefault,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingPaymentMethod.id)
            .eq('user_id', user.id);
        } catch (dbErr) {}

        const existing = (user.user_metadata?.saved_payment_methods as SavedPaymentMethod[]) || [];
        const updatedList = existing.map(pm => {
          if (pm.id === editingPaymentMethod.id) {
            return {
              ...pm,
              cardholder_name: cardForm.cardholder_name.trim(),
              card_brand: cardForm.card_brand,
              card_last4: cleanLast4,
              card_exp_month: Number(cardForm.card_exp_month),
              card_exp_year: Number(cardForm.card_exp_year),
              is_default: isDefault
            };
          }
          return isDefault ? { ...pm, is_default: false } : pm;
        });

        await supabase.auth.updateUser({
          data: { saved_payment_methods: updatedList }
        });

        toast.success('Card details updated successfully!');
      } else {
        const newMethod: SavedPaymentMethod = {
          id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'card',
          cardholder_name: cardForm.cardholder_name.trim(),
          card_brand: cardForm.card_brand,
          card_last4: cleanLast4,
          card_exp_month: Number(cardForm.card_exp_month),
          card_exp_year: Number(cardForm.card_exp_year),
          is_default: isDefault,
          created_at: new Date().toISOString()
        };

        if (isDefault) {
          try {
            await supabase
              .from('buyer_payment_methods')
              .update({ is_default: false })
              .eq('user_id', user.id);
          } catch (e) {}
        }

        try {
          await supabase.from('buyer_payment_methods').insert([{
            user_id: user.id,
            type: 'card',
            cardholder_name: newMethod.cardholder_name,
            card_brand: newMethod.card_brand,
            card_last4: cleanLast4,
            card_exp_month: newMethod.card_exp_month,
            card_exp_year: newMethod.card_exp_year,
            is_default: isDefault
          }]);
        } catch (dbErr) {
          console.warn('Note inserting card to buyer_payment_methods:', dbErr);
        }

        const existing = (user.user_metadata?.saved_payment_methods as SavedPaymentMethod[]) || [];
        const updatedList = isDefault
          ? existing.map(pm => ({ ...pm, is_default: false })).concat(newMethod)
          : existing.concat(newMethod);

        await supabase.auth.updateUser({
          data: { saved_payment_methods: updatedList }
        });

        toast.success('Payment card saved safely!');
      }

      setShowPaymentModal(false);
      setEditingPaymentMethod(null);
      await fetchPaymentMethods();
    } catch (err: any) {
      console.error('Error saving card:', err);
      toast.error(err.message || 'Failed to save card payment method.');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleSetDefaultPayment = async (id: string) => {
    if (!user) return;
    try {
      try {
        await supabase
          .from('buyer_payment_methods')
          .update({ is_default: false })
          .eq('user_id', user.id);

        await supabase
          .from('buyer_payment_methods')
          .update({ is_default: true })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err) {}

      const currentList = paymentMethods.map(pm => ({
        ...pm,
        is_default: pm.id === id
      }));

      await supabase.auth.updateUser({
        data: { saved_payment_methods: currentList }
      });

      setPaymentMethods(currentList);
      toast.success('Default payment method updated.');
    } catch (err) {
      console.error('Error setting default payment:', err);
      toast.error('Failed to update default payment method.');
    }
  };

  const promptDeletePayment = (pm: SavedPaymentMethod) => {
    setPaymentToDelete(pm);
  };

  const confirmDeletePayment = async () => {
    if (!user || !paymentToDelete) return;
    const id = paymentToDelete.id;

    try {
      try {
        await supabase
          .from('buyer_payment_methods')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
      } catch (err) {}

      const filtered = paymentMethods.filter(pm => pm.id !== id);
      await supabase.auth.updateUser({
        data: { saved_payment_methods: filtered }
      });

      setPaymentMethods(filtered);
      toast.success('Payment method removed.');
    } catch (err) {
      console.error('Error removing payment method:', err);
      toast.error('Failed to remove payment method.');
    } finally {
      setPaymentToDelete(null);
    }
  };

  // ==========================================
  // 4. NOTIFICATIONS PREFERENCES STATE
  // ==========================================
  const [notifications, setNotifications] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load from DB or metadata
    const loadNotificationPrefs = async () => {
      try {
        const { data, error } = await supabase
          .from('buyer_notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setNotifications({
            order_confirmations: data.order_confirmations ?? true,
            order_status_updates: data.order_status_updates ?? true,
            promotions_and_deals: data.promotions_and_deals ?? true,
            whatsapp_updates: data.whatsapp_updates ?? true,
            price_drop_alerts: data.price_drop_alerts ?? false,
            security_alerts: data.security_alerts ?? true,
          });
          return;
        }

        if (user.user_metadata?.notification_preferences) {
          setNotifications({
            ...DEFAULT_NOTIFICATIONS,
            ...user.user_metadata.notification_preferences
          });
        }
      } catch (err) {
        if (user.user_metadata?.notification_preferences) {
          setNotifications({
            ...DEFAULT_NOTIFICATIONS,
            ...user.user_metadata.notification_preferences
          });
        }
      }
    };

    loadNotificationPrefs();
  }, [user]);

  const handleToggleNotification = async (key: keyof NotificationPreferences) => {
    if (!user) return;

    const updated = {
      ...notifications,
      [key]: !notifications[key]
    };

    // Optimistic UI update
    setNotifications(updated);
    setIsSavingNotifications(true);

    try {
      // 1. Try DB upsert
      try {
        await supabase
          .from('buyer_notification_preferences')
          .upsert({
            user_id: user.id,
            ...updated,
            updated_at: new Date().toISOString()
          });
      } catch (dbErr) {
        // Fallback
      }

      // 2. Update user metadata
      await supabase.auth.updateUser({
        data: { notification_preferences: updated }
      });

      toast.success('Notification preference updated.');
    } catch (err) {
      console.error('Error saving notification preference:', err);
      toast.error('Failed to update notification settings.');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // ==========================================
  // 5. BUYER PREFERENCES STATE
  // ==========================================
  const [preferences, setPreferences] = useState<BuyerPreferences>(DEFAULT_PREFERENCES);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadBuyerPrefs = async () => {
      try {
        const { data, error } = await supabase
          .from('buyer_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setPreferences({
            currency: data.currency || 'KES',
            language: data.language || 'en',
            theme: data.theme || 'system',
            delivery_window: data.delivery_window || 'anytime',
            packaging_preference: data.packaging_preference || 'eco_friendly',
            substitution_rule: data.substitution_rule || 'call_first',
            save_cart: data.save_cart ?? true,
          });
          return;
        }

        if (user.user_metadata?.buyer_preferences) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...user.user_metadata.buyer_preferences
          });
        }
      } catch (err) {
        if (user.user_metadata?.buyer_preferences) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...user.user_metadata.buyer_preferences
          });
        }
      }
    };

    loadBuyerPrefs();
  }, [user]);

  const handleUpdatePreference = async <K extends keyof BuyerPreferences>(key: K, value: BuyerPreferences[K]) => {
    if (!user) return;

    const updated = {
      ...preferences,
      [key]: value
    };

    setPreferences(updated);
    setIsSavingPreferences(true);

    try {
      // 1. Try DB upsert
      try {
        await supabase
          .from('buyer_preferences')
          .upsert({
            user_id: user.id,
            ...updated,
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        // Fallback
      }

      // 2. Persist in user metadata
      await supabase.auth.updateUser({
        data: { buyer_preferences: updated }
      });

      toast.success('Shopping preferences updated.');
    } catch (err) {
      console.error('Error saving preference:', err);
      toast.error('Failed to save preference.');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // ==========================================
  // 6. SECURITY STATE
  // ==========================================
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeactivatingAccount, setIsDeactivatingAccount] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Your password has been updated securely!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password update error:', err);
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOutAllSessions = async () => {
    if (!window.confirm('Do you want to sign out from all devices? You will need to log in again.')) return;
    try {
      signOut();
      await supabase.auth.signOut({ scope: 'global' });
      toast.success('Signed out of all sessions.');
      window.location.href = '/login';
    } catch (err: any) {
      console.error('Sign out error:', err);
      toast.error('Failed to complete global sign-out.');
    }
  };

  const handleDeactivateAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DEACTIVATE') {
      toast.error('Please type DEACTIVATE to confirm.');
      return;
    }

    setIsDeactivatingAccount(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('No active session token found. Please log in again.');
      }

      const res = await fetch('/api/auth/delete-own-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to deactivate account.');
      }

      toast.success('Your account has been deactivated safely.');
      signOut();
      await supabase.auth.signOut().catch(() => {});
      window.location.href = '/';
    } catch (err: any) {
      console.error('Error deactivating account:', err);
      toast.error(err.message || 'Failed to deactivate account.');
    } finally {
      setIsDeactivatingAccount(false);
      setShowDeleteModal(false);
    }
  };

  // Nav tabs list
  const tabs = [
    { id: 'personal' as const, label: 'Personal Info', icon: User },
    { id: 'addresses' as const, label: 'Delivery Addresses', icon: MapPin },
    { id: 'payments' as const, label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'preferences' as const, label: 'Preferences', icon: Globe },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {location.pathname.includes('/payments') ? 'Payment Methods' : 'Account Settings'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {location.pathname.includes('/payments')
            ? 'Manage your saved Safaricom M-Pesa mobile money numbers and credit/debit cards.'
            : 'Manage your personal details, delivery destinations, payment options, and security preferences.'}
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Navigation Sidebar */}
        <Card className="w-full md:w-64 shrink-0 p-2 border-0 shadow-none bg-transparent md:bg-card md:border md:shadow-sm md:p-3">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'payments' && !location.pathname.includes('/payments')) {
                      navigate('/buyer/dashboard/payments');
                    } else if (tab.id !== 'payments' && location.pathname.includes('/payments')) {
                      navigate(tab.id === 'personal' ? '/buyer/dashboard/settings' : `/buyer/dashboard/settings?tab=${tab.id}`);
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-left ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Tab Content Panel */}
        <div className="flex-1 w-full">
          {/* ========================================================= */}
          {/* 1. PERSONAL INFORMATION TAB                                */}
          {/* ========================================================= */}
          {activeTab === 'personal' && (
            <Card className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
                <p className="text-sm text-muted-foreground">
                  Update your contact details and how you are addressed across ODA Market.
                </p>
              </div>

              <form onSubmit={handleSavePersonal} className="space-y-5 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      First Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Sandra"
                      required
                      className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Otieno"
                      className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Email Address
                    </label>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3 h-3" /> Verified ODA Account
                    </span>
                  </div>
                  <input
                    type="email"
                    value={user?.email || profile?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 border rounded-lg bg-muted text-muted-foreground cursor-not-allowed text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Your login email is protected for security. Contact customer support if you need to transfer your account.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Phone Number (Kenya)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678 or +254 712 345 678"
                      className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Used for M-Pesa STK push checkouts, rider delivery calls, and order SMS notifications.
                  </p>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isSavingPersonal} className="min-w-36">
                    {isSavingPersonal ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 2. DELIVERY ADDRESSES TAB                                 */}
          {/* ========================================================= */}
          {activeTab === 'addresses' && (
            <Card className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Delivery Addresses</h2>
                  <p className="text-sm text-muted-foreground">
                    Save your home, office, and frequent drop-off locations for quick checkout.
                  </p>
                </div>
                <Button onClick={openAddAddressModal} size="sm" className="gap-2 shrink-0">
                  <Plus className="w-4 h-4" /> Add New Address
                </Button>
              </div>

              {isLoadingAddresses ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                  <p className="text-sm">Loading delivery addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed rounded-xl bg-muted/20">
                  <MapPin className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No saved delivery addresses</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                    Add a delivery address so our riders know exactly where to deliver your fresh groceries.
                  </p>
                  <Button onClick={openAddAddressModal} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Add Your First Address
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`relative p-5 rounded-xl border transition-all flex flex-col justify-between ${
                        addr.is_default
                          ? 'border-primary/50 bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:border-border/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-base">
                              {addr.full_name}
                            </span>
                            {addr.is_default && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                <CheckCircle2 className="w-3 h-3" /> Default
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground font-mono mb-2">
                          {addr.phone}
                        </p>

                        <div className="text-sm text-foreground space-y-0.5 mb-3">
                          <p className="font-medium">{addr.street_building}</p>
                          <p className="text-muted-foreground">
                            {[addr.area_location, addr.town_city, addr.county].filter(Boolean).join(', ')}
                          </p>
                        </div>

                        {addr.delivery_instructions && (
                          <div className="text-xs bg-muted/60 p-2 rounded-lg text-muted-foreground italic mb-4">
                            "{addr.delivery_instructions}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-2">
                        {!addr.is_default ? (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-xs text-primary font-medium hover:underline"
                          >
                            Set as Default
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Primary Delivery Address</span>
                        )}

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEditAddressModal(addr)}
                            title="Edit Address"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteAddress(addr.id)}
                            title="Delete Address"
                            className="hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* ========================================================= */}
          {/* 3. PAYMENT METHODS TAB                                    */}
          {/* ========================================================= */}
          {activeTab === 'payments' && (
            <Card className="p-6 md:p-8 space-y-6 bg-white dark:bg-card border border-[#E8DCC9] dark:border-border rounded-2xl shadow-sm">
              {/* Header Area */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8DCC9]/60">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2D1F17] dark:text-foreground">
                    Payment Methods
                  </h2>
                  <p className="text-xs sm:text-sm text-[#736357] dark:text-muted-foreground mt-1">
                    Save your Safaricom M-Pesa details for faster checkout. (Credit/Debit cards coming soon)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddPaymentModal}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#D96A27] hover:bg-[#C65A28] active:scale-[0.98] text-white text-sm font-medium shadow-sm transition-all duration-150 self-start sm:self-auto shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Payment Method</span>
                </button>
              </div>

              {isLoadingPayments ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#D96A27]" />
                  <p className="text-sm">Loading saved payment methods...</p>
                </div>
              ) : paymentMethods.length === 0 ? (
                /* Empty State */
                <div className="p-8 sm:p-12 text-center border-2 border-dashed border-[#E8DCC9] dark:border-border rounded-2xl bg-[#FAF7F2]/60 dark:bg-muted/10">
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F8EE] flex items-center justify-center mx-auto mb-4 text-[#00A859]">
                    <Smartphone className="w-7 h-7 stroke-[1.8]" />
                  </div>
                  <h3 className="font-bold text-[#2D1F17] dark:text-foreground text-base sm:text-lg mb-1">
                    No saved payment methods
                  </h3>
                  <p className="text-xs sm:text-sm text-[#736357] dark:text-muted-foreground max-w-sm mx-auto mb-5">
                    Add your Safaricom M-Pesa number to make grocery checkout swift and effortless.
                  </p>
                  <button
                    type="button"
                    onClick={openAddPaymentModal}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#D96A27] hover:bg-[#C65A28] active:scale-[0.98] text-white text-sm font-medium shadow-sm transition-all duration-150 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Payment Method</span>
                  </button>
                </div>
              ) : (
                /* Payment Method Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="relative bg-white dark:bg-card border border-[#E8DCC9] dark:border-border/80 rounded-[18px] p-5 sm:p-6 shadow-[0_2px_10px_rgba(45,31,23,0.04)] hover:shadow-[0_4px_16px_rgba(45,31,23,0.07)] transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top: Logo, Labels & Default Badge */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {pm.type === 'mpesa' ? (
                              /* Balanced, Authentic Safaricom M-Pesa Logo Container */
                              <div
                                aria-label="Safaricom M-Pesa"
                                className="w-12 h-12 rounded-xl bg-[#00A859] flex flex-col items-center justify-center text-white font-sans shadow-xs select-none shrink-0 ring-1 ring-black/5"
                              >
                                <span className="text-[11px] font-black tracking-tight leading-none">M-PESA</span>
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] ring-0.5 ring-white/20" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-white ring-0.5 ring-black/10" />
                                </div>
                              </div>
                            ) : (
                              /* Card Logo Container */
                              <div
                                aria-label="Payment Card"
                                className="w-12 h-12 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shadow-xs select-none shrink-0 ring-1 ring-white/10"
                              >
                                <CreditCard className="w-6 h-6 text-white stroke-[1.8]" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <h3 className="text-[15px] sm:text-base font-semibold text-[#2D1F17] dark:text-foreground leading-snug truncate">
                                {pm.type === 'mpesa'
                                  ? (pm.nickname || 'Personal M-Pesa')
                                  : `${pm.card_brand || 'Card'} •••• ${pm.card_last4}`}
                              </h3>
                              <p className="text-xs text-[#736357] dark:text-muted-foreground mt-0.5 truncate">
                                {pm.type === 'mpesa'
                                  ? 'Mobile Money (STK Push)'
                                  : `Cardholder: ${pm.cardholder_name || 'Buyer'}`}
                              </p>
                            </div>
                          </div>

                          {/* Default Status Badge */}
                          {pm.is_default && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 shrink-0 select-none">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-emerald-400 stroke-[2.5]" />
                              Default
                            </span>
                          )}
                        </div>

                        {/* Middle Field: Phone Number or Card Number */}
                        {pm.type === 'mpesa' && pm.phone && (
                          <div className="bg-[#FAF7F2] dark:bg-muted/30 rounded-xl p-3.5 sm:p-4 mb-4 border border-[#EFE8DC] dark:border-border/50 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-[#736357] dark:text-muted-foreground block mb-1">
                                M-Pesa Phone Number
                              </span>
                              <span className="text-base sm:text-[17px] font-semibold text-[#2D1F17] dark:text-foreground tracking-tight font-mono">
                                {displayKenyanPhone(pm.phone) || pm.phone}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => openEditPaymentModal(pm)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#D96A27] hover:text-[#C65A28] px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-card transition-colors shrink-0 cursor-pointer"
                              title="Edit M-Pesa details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                        )}

                        {pm.type === 'card' && (
                          <div className="bg-[#FAF7F2] dark:bg-muted/30 rounded-xl p-3.5 sm:p-4 mb-4 border border-[#EFE8DC] dark:border-border/50 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-[#736357] dark:text-muted-foreground block mb-1">
                                Card Details
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base sm:text-[17px] font-semibold text-[#2D1F17] dark:text-foreground tracking-tight font-mono">
                                  •••• •••• •••• {pm.card_last4}
                                </span>
                                <span className="text-xs text-[#736357] dark:text-muted-foreground">
                                  (Exp {pm.card_exp_month?.toString().padStart(2, '0')}/{pm.card_exp_year})
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openEditPaymentModal(pm)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#D96A27] hover:text-[#C65A28] px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-card transition-colors shrink-0 cursor-pointer"
                              title="Edit card details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Default status / Set default action on Left, Delete action on Right */}
                      <div className="pt-3.5 border-t border-[#EFE8DC] dark:border-border/60 flex items-center justify-between gap-2 mt-auto">
                        <div>
                          {pm.is_default ? (
                            <span className="text-xs font-medium text-[#059669] dark:text-emerald-400 flex items-center gap-1.5 select-none">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              Default payment method
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultPayment(pm.id)}
                              className="text-xs font-medium text-[#D96A27] hover:text-[#C65A28] hover:underline transition-colors cursor-pointer"
                            >
                              Set as default
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => promptDeletePayment(pm)}
                            title="Remove payment method"
                            aria-label="Remove payment method"
                            className="p-1.5 rounded-lg text-[#8C7A6B] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Credit / Debit Card - Coming Soon Banner */}
              <div className="rounded-[18px] border border-dashed border-[#E8DCC9] dark:border-border/80 bg-[#FAF7F2]/60 dark:bg-muted/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F0EBE1] dark:bg-muted flex items-center justify-center text-[#8C7A6B] shrink-0 border border-[#E8DCC9]/60">
                    <CreditCard className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[#2D1F17] dark:text-foreground">
                        Credit / Debit Cards
                      </h4>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#F3ECE2] text-[#8C5D39] border border-[#E2D4C3]">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-[#736357] dark:text-muted-foreground mt-0.5">
                      Direct Visa and Mastercard payments are in progress. For now, we only support Safaricom M-Pesa.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#736357] bg-white dark:bg-card px-3 py-1 rounded-full border border-[#E8DCC9] shrink-0 self-start sm:self-auto select-none">
                  Currently M-Pesa Only
                </span>
              </div>

              {/* Security Notice Box */}
              <div className="rounded-2xl border border-[#E8DCC9]/90 dark:border-border bg-[#FAF7F2] dark:bg-muted/20 p-4 sm:p-5 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#EFE8DC] dark:bg-muted flex items-center justify-center text-[#D96A27] shrink-0 mt-0.5">
                  <Shield className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="text-xs sm:text-[13px] leading-relaxed">
                  <strong className="block font-semibold text-[#2D1F17] dark:text-foreground mb-0.5">
                    Payment Security
                  </strong>
                  <p className="text-[#736357] dark:text-muted-foreground">
                    Your payment information is securely protected. OdaMarket never stores your M-Pesa PIN or card CVV.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 4. NOTIFICATIONS TAB                                      */}
          {/* ========================================================= */}
          {activeTab === 'notifications' && (
            <Card className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">
                  Choose how and when ODA Market contacts you with order updates and deals.
                </p>
              </div>

              <div className="divide-y divide-border/60">
                {/* 1. Order Confirmation */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 max-w-lg">
                    <p className="font-medium text-foreground text-sm">Order Confirmations & Invoices</p>
                    <p className="text-xs text-muted-foreground">
                      Receive immediate order receipts and invoices via email and SMS when you complete checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('order_confirmations')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      notifications.order_confirmations ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.order_confirmations ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Order Status Updates */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 max-w-lg">
                    <p className="font-medium text-foreground text-sm">Order Dispatch & Delivery Updates</p>
                    <p className="text-xs text-muted-foreground">
                      Real-time alerts when your grocery basket is packed, dispatched, and when the rider arrives.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('order_status_updates')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      notifications.order_status_updates ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.order_status_updates ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. WhatsApp Updates */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm">WhatsApp Order Updates</p>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">Popular</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Receive tracking links and customer care updates on WhatsApp for hassle-free order management.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('whatsapp_updates')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      notifications.whatsapp_updates ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.whatsapp_updates ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Promotions and Deals */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 max-w-lg">
                    <p className="font-medium text-foreground text-sm">Weekly Fresh Deals & Flash Discounts</p>
                    <p className="text-xs text-muted-foreground">
                      Special weekend discounts on fresh farm vegetables, pantry items, and supermarket flash deals.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('promotions_and_deals')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      notifications.promotions_and_deals ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.promotions_and_deals ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Price Drop Alerts */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 max-w-lg">
                    <p className="font-medium text-foreground text-sm">Wishlist & Price Drop Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified when items in your favorites list drop in price or are back in stock.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('price_drop_alerts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      notifications.price_drop_alerts ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.price_drop_alerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 6. Security Alerts */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 max-w-lg">
                    <p className="font-medium text-foreground text-sm">Security & Account Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Crucial alerts regarding password updates or new device sign-ins (recommended).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleNotification('security_alerts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      notifications.security_alerts ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.security_alerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {isSavingNotifications && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Saving notification preferences...
                </div>
              )}
            </Card>
          )}

          {/* ========================================================= */}
          {/* 5. PREFERENCES TAB                                        */}
          {/* ========================================================= */}
          {activeTab === 'preferences' && (
            <Card className="p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Shopping Preferences</h2>
                <p className="text-sm text-muted-foreground">
                  Customize your delivery schedule, currency, and grocery packaging choices.
                </p>
              </div>

              <div className="space-y-6 max-w-xl">
                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Currency
                  </label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => handleUpdatePreference('currency', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="KES">Kenyan Shilling (KES - KSh)</option>
                    <option value="USD">US Dollar (USD - $)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    All checkouts and invoices on ODA Market are settled in Kenyan Shillings (KES).
                  </p>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Preferred Language
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => handleUpdatePreference('language', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="en">English (Default)</option>
                    <option value="sw">Kiswahili</option>
                  </select>
                </div>

                {/* Preferred Delivery Window */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Preferred Delivery Window
                  </label>
                  <select
                    value={preferences.delivery_window}
                    onChange={(e) => handleUpdatePreference('delivery_window', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="anytime">Anytime during working hours (8:00 AM - 6:00 PM)</option>
                    <option value="morning">Morning Delivery (8:00 AM - 12:00 PM)</option>
                    <option value="afternoon">Afternoon Delivery (12:00 PM - 5:00 PM)</option>
                    <option value="evening">Evening Delivery (5:00 PM - 8:00 PM)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Riders prioritize this delivery schedule when dispatching orders to your address.
                  </p>
                </div>

                {/* Packaging Preference */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Produce Packaging Preference
                  </label>
                  <select
                    value={preferences.packaging_preference}
                    onChange={(e) => handleUpdatePreference('packaging_preference', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="eco_friendly">Eco-friendly Brown Paper Bags (Recommended)</option>
                    <option value="minimal">Minimal Packaging (Zero Waste / Direct Crates)</option>
                    <option value="standard">Standard Sealed Packaging</option>
                  </select>
                </div>

                {/* Out of Stock Substitution */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Out-of-Stock Item Handling
                  </label>
                  <select
                    value={preferences.substitution_rule}
                    onChange={(e) => handleUpdatePreference('substitution_rule', e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="call_first">Call me before substituting any fresh produce</option>
                    <option value="substitute_similar">Substitute automatically with freshest equal or better item</option>
                    <option value="refund_immediately">Do not substitute (refund the item amount directly)</option>
                  </select>
                </div>

                {/* Auto Save Cart */}
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Save Active Cart Across Devices</p>
                    <p className="text-xs text-muted-foreground">Keep items in your basket when switching between laptop and mobile.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdatePreference('save_cart', !preferences.save_cart)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      preferences.save_cart ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        preferences.save_cart ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* 6. SECURITY TAB                                           */}
          {/* ========================================================= */}
          {activeTab === 'security' && (
            <Card className="p-6 md:p-8 space-y-8">
              {/* Change Password */}
              <div>
                <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-foreground">
                  <Key className="w-5 h-5 text-primary" /> Change Password
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Update your account password with a strong, secure passphrase.
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      New Password (Min 6 Characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <Button type="submit" disabled={isUpdatingPassword} className="min-w-36">
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </div>

              {/* Active Session & Security Overview */}
              <div className="pt-6 border-t border-border space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Session & Account Security
                </h3>

                <div className="bg-muted/40 p-4 rounded-xl space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Account Email:</span>
                    <span className="font-mono font-medium text-foreground">{user?.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="font-mono text-xs text-muted-foreground">{user?.id}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Last Signed In:</span>
                    <span className="text-foreground">
                      {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Current Session'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                    <span className="text-muted-foreground">Multi-Factor Status:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Email OTP Protected</span>
                  </div>
                </div>

                <div>
                  <Button
                    variant="outline"
                    onClick={handleSignOutAllSessions}
                    className="text-xs h-9 gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out of All Devices
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-destructive/20 space-y-3">
                <h3 className="text-base font-bold text-destructive flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground">
                  Deactivating your account archives your profile and cancels all active notifications. Your past completed receipts remain securely recorded for bookkeeping.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Deactivate Account
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADDRESS MODAL (ADD / EDIT)                                 */}
      {/* ========================================================= */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Recipient Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.full_name}
                    onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                    placeholder="e.g. Sandra Otieno"
                    required
                    className="w-full px-3.5 py-2 border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Phone Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="0712 345 678"
                    required
                    className="w-full px-3.5 py-2 border rounded-lg text-sm bg-background text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    County <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={addressForm.county}
                    onChange={(e) => setAddressForm({ ...addressForm, county: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary"
                  >
                    {KENYA_COUNTIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Town / City
                  </label>
                  <input
                    type="text"
                    value={addressForm.town_city}
                    onChange={(e) => setAddressForm({ ...addressForm, town_city: e.target.value })}
                    placeholder="e.g. Westlands, Kilimani, Thika"
                    className="w-full px-3.5 py-2 border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Estate / Area / Landmark
                </label>
                <input
                  type="text"
                  value={addressForm.area_location}
                  onChange={(e) => setAddressForm({ ...addressForm, area_location: e.target.value })}
                  placeholder="e.g. Spring Valley, Kileleshwa, South B"
                  className="w-full px-3.5 py-2 border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Street / Building / House / Apt No. <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.street_building}
                  onChange={(e) => setAddressForm({ ...addressForm, street_building: e.target.value })}
                  placeholder="e.g. Peponi Road, Green Apple Apartments, House 4B"
                  required
                  className="w-full px-3.5 py-2 border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  value={addressForm.delivery_instructions}
                  onChange={(e) => setAddressForm({ ...addressForm, delivery_instructions: e.target.value })}
                  placeholder="e.g. Call when at the black gate, leave with day guard if unavailable"
                  rows={2}
                  className="w-full px-3.5 py-2 border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="addr_is_default"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                />
                <label htmlFor="addr_is_default" className="text-sm font-medium text-foreground cursor-pointer">
                  Set as default delivery address
                </label>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddressModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingAddress}>
                  {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PAYMENT METHOD MODAL (ADD / EDIT MPESA & CARD)              */}
      {/* ========================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card w-full max-w-md rounded-2xl border border-[#E8DCC9] dark:border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#E8DCC9]/60 dark:border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#2D1F17] dark:text-foreground">
                  {editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                </h3>
                <p className="text-xs text-[#736357] dark:text-muted-foreground mt-0.5">
                  Save your M-Pesa or card details for faster checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  setEditingPaymentMethod(null);
                }}
                className="text-[#8C7A6B] hover:text-[#2D1F17] dark:hover:text-foreground p-1 rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#E8DCC9]/60 dark:border-border bg-[#FAF7F2]/60 dark:bg-muted/30">
              <button
                type="button"
                onClick={() => setPaymentModalTab('mpesa')}
                className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                  paymentModalTab === 'mpesa'
                    ? 'border-[#00A859] text-[#00A859] bg-white dark:bg-card'
                    : 'border-transparent text-[#736357] dark:text-muted-foreground hover:text-[#2D1F17] dark:hover:text-foreground'
                }`}
              >
                Safaricom M-Pesa
              </button>
              <button
                type="button"
                onClick={() => setPaymentModalTab('card')}
                className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentModalTab === 'card'
                    ? 'border-[#D96A27] text-[#D96A27] bg-white dark:bg-card'
                    : 'border-transparent text-[#736357] dark:text-muted-foreground hover:text-[#2D1F17] dark:hover:text-foreground'
                }`}
              >
                <span>Credit / Debit Card</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F3ECE2] text-[#8C5D39] border border-[#E2D4C3]">
                  Coming Soon
                </span>
              </button>
            </div>

            {paymentModalTab === 'mpesa' ? (
              <form onSubmit={handleSaveMpesaMethod} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#2D1F17] dark:text-foreground mb-1">
                    M-Pesa Phone Number <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8C7A6B] select-none flex items-center gap-1">
                      🇰🇪 +254
                    </span>
                    <input
                      type="tel"
                      value={mpesaForm.phone}
                      onChange={(e) => setMpesaForm({ ...mpesaForm, phone: e.target.value })}
                      placeholder="0712 345 678 or 0112 345 678"
                      required
                      className="w-full pl-20 pr-3.5 py-2.5 border border-[#E8DCC9] dark:border-border rounded-xl text-sm bg-background text-[#2D1F17] dark:text-foreground font-mono focus:outline-none focus:border-[#D96A27] focus:ring-1 focus:ring-[#D96A27]"
                    />
                  </div>
                  <p className="text-[11px] text-[#736357] dark:text-muted-foreground mt-1.5 leading-relaxed">
                    During checkout, the Safaricom STK prompt will be triggered to this number automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2D1F17] dark:text-foreground mb-1">
                    Nickname / Label
                  </label>
                  <input
                    type="text"
                    value={mpesaForm.nickname}
                    onChange={(e) => setMpesaForm({ ...mpesaForm, nickname: e.target.value })}
                    placeholder="e.g. Personal M-Pesa, Business Line"
                    className="w-full px-3.5 py-2.5 border border-[#E8DCC9] dark:border-border rounded-xl text-sm bg-background text-[#2D1F17] dark:text-foreground focus:outline-none focus:border-[#D96A27] focus:ring-1 focus:ring-[#D96A27]"
                  />
                </div>

                <div className="pt-1 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="mpesa_is_default"
                    checked={mpesaForm.is_default}
                    onChange={(e) => setMpesaForm({ ...mpesaForm, is_default: e.target.checked })}
                    className="w-4 h-4 text-[#D96A27] rounded border-[#E8DCC9] focus:ring-[#D96A27]"
                  />
                  <label htmlFor="mpesa_is_default" className="text-xs font-medium text-[#2D1F17] dark:text-foreground cursor-pointer select-none">
                    Set as default payment method
                  </label>
                </div>

                {/* Important PIN Reassurance */}
                <div className="rounded-xl bg-[#FAF7F2] dark:bg-muted/30 border border-[#EFE8DC] dark:border-border/50 p-3 text-[11px] text-[#736357] dark:text-muted-foreground leading-relaxed flex items-start gap-2">
                  <Shield className="w-4 h-4 text-[#00A859] shrink-0 mt-0.5" />
                  <span>
                    <strong>Security Guarantee:</strong> OdaMarket never requests, stores, or exposes your M-Pesa PIN. PIN entry is handled only by Safaricom on your phone.
                  </span>
                </div>

                <div className="pt-3 border-t border-[#E8DCC9]/60 dark:border-border flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setEditingPaymentMethod(null);
                    }}
                    className="rounded-full border-[#E8DCC9] text-[#736357] hover:bg-[#FAF7F2]"
                  >
                    Cancel
                  </Button>
                  <button
                    type="submit"
                    disabled={isSavingPayment}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-[#D96A27] hover:bg-[#C65A28] active:scale-[0.98] text-white text-sm font-medium shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {editingPaymentMethod ? 'Update M-Pesa' : 'Save M-Pesa'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FAF7F2] dark:bg-muted flex items-center justify-center text-[#8C7A6B] border border-[#E8DCC9]">
                  <CreditCard className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F3ECE2] text-[#8C5D39] border border-[#E2D4C3] mb-2">
                    Coming Soon
                  </span>
                  <h4 className="text-base font-bold text-[#2D1F17] dark:text-foreground">
                    Credit & Debit Cards Coming Soon
                  </h4>
                  <p className="text-xs text-[#736357] dark:text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed">
                    For now, we don&apos;t accept credit or debit cards. Please save your Safaricom M-Pesa line for swift, secure 1-click checkout.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setEditingPaymentMethod(null);
                    }}
                    className="rounded-full border-[#E8DCC9] text-[#736357] hover:bg-[#FAF7F2]"
                  >
                    Close
                  </Button>
                  <button
                    type="button"
                    onClick={() => setPaymentModalTab('mpesa')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#00A859] hover:bg-[#00924c] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <span>Use Safaricom M-Pesa</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REMOVE PAYMENT METHOD CONFIRMATION MODAL                  */}
      {/* ========================================================= */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card w-full max-w-md rounded-2xl border border-[#E8DCC9] dark:border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0 text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#2D1F17] dark:text-foreground text-lg">
                  Remove this payment method?
                </h3>
                <p className="text-xs text-[#736357] dark:text-muted-foreground">
                  This payment method will no longer be available for 1-click checkout.
                </p>
              </div>
            </div>

            <div className="bg-[#FAF7F2] dark:bg-muted/30 rounded-xl p-3.5 border border-[#EFE8DC] dark:border-border/50 text-sm">
              <div className="font-semibold text-[#2D1F17] dark:text-foreground">
                {paymentToDelete.type === 'mpesa'
                  ? (paymentToDelete.nickname || 'Personal M-Pesa')
                  : `${paymentToDelete.card_brand || 'Card'} •••• ${paymentToDelete.card_last4}`}
              </div>
              <div className="text-xs text-[#736357] dark:text-muted-foreground font-mono mt-0.5">
                {paymentToDelete.type === 'mpesa'
                  ? displayKenyanPhone(paymentToDelete.phone)
                  : `Expires ${paymentToDelete.card_exp_month?.toString().padStart(2, '0')}/${paymentToDelete.card_exp_year}`}
              </div>
              {paymentToDelete.is_default && (
                <div className="mt-2 text-[11px] text-[#059669] dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[2.5]" /> This is currently your default payment method.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentToDelete(null)}
                className="border-[#E8DCC9] text-[#736357] hover:bg-[#FAF7F2] rounded-full px-5"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDeletePayment}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full px-5 shadow-sm"
              >
                Remove Payment Method
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DEACTIVATE ACCOUNT CONFIRMATION MODAL                      */}
      {/* ========================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl border border-destructive/30 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Deactivate Account</h3>
                <p className="text-xs text-muted-foreground">This action will immediately disable your profile.</p>
              </div>
            </div>

            <p className="text-sm text-foreground">
              Are you sure you want to deactivate your ODA Market buyer account? You will be signed out from all sessions.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">
                Type <strong className="text-destructive font-mono">DEACTIVATE</strong> below to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DEACTIVATE"
                className="w-full px-3.5 py-2 border rounded-lg text-sm bg-background text-foreground font-mono focus:outline-none focus:border-destructive"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'DEACTIVATE' || isDeactivatingAccount}
                onClick={handleDeactivateAccount}
              >
                {isDeactivatingAccount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Deactivation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
