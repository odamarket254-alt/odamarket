import React, { useState, useEffect } from "react";
import { MapPin, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "sonner";
import { Input } from "../../components/ui/Input";

interface Address {
  id: string;
  full_name: string;
  phone: string;
  county: string;
  town_city: string;
  area_location: string;
  street_building: string;
  delivery_instructions: string;
  is_default: boolean;
}

export default function DeliveryAddressesPage() {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || "",
    phone: user?.user_metadata?.phone || "",
    county: "",
    town_city: "",
    area_location: "",
    street_building: "",
    delivery_instructions: "",
    is_default: false
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false });

      if (error && error.code !== '42P01') {
        throw error;
      }
      setAddresses(data || []);
    } catch (err: any) {
      console.error("Error fetching addresses", err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: user?.user_metadata?.full_name || "",
      phone: user?.user_metadata?.phone || "",
      county: "",
      town_city: "",
      area_location: "",
      street_building: "",
      delivery_instructions: "",
      is_default: addresses.length === 0
    });
    setIsEditing(false);
    setCurrentAddressId(null);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      if (formData.is_default) {
        await supabase
          .from('delivery_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (isEditing && currentAddressId) {
        const { error } = await supabase
          .from('delivery_addresses')
          .update(formData)
          .eq('id', currentAddressId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        toast.success("Address updated successfully");
      } else {
        const { error } = await supabase
          .from('delivery_addresses')
          .insert([{ ...formData, user_id: user.id }]);
        
        if (error) throw error;
        toast.success("Address added successfully");
      }
      setShowModal(false);
      resetForm();
      fetchAddresses();
    } catch (err: any) {
      console.error(err);
      toast.error(err.code === '42P01' ? "Database schema needs update." : "Failed to save address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
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
      toast.success("Default address updated");
      fetchAddresses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update default address");
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm("Are you sure you want to delete this address?")) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('delivery_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success("Address deleted");
      fetchAddresses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete address");
      setIsLoading(false);
    }
  };

  const openEdit = (addr: Address) => {
    setFormData({
      full_name: addr.full_name,
      phone: addr.phone,
      county: addr.county,
      town_city: addr.town_city,
      area_location: addr.area_location || "",
      street_building: addr.street_building,
      delivery_instructions: addr.delivery_instructions || "",
      is_default: addr.is_default
    });
    setCurrentAddressId(addr.id);
    setIsEditing(true);
    setShowModal(true);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2418]">Delivery Addresses</h1>
          <p className="text-[#5F5A54]">Manage where your orders get delivered</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-[#3A2418] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#3A2418]/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add New Address
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[#8B857D]">Loading addresses...</div>
      ) : addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white border border-[#E8DCC9] rounded-xl p-6 relative shadow-sm">
              {addr.is_default && (
                <span className="absolute top-0 right-0 bg-[#C65A28] text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Default
                </span>
              )}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#FAF5EC] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#C65A28]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3A2418] text-lg">{addr.full_name}</h3>
                  <p className="text-[#5F5A54] text-sm">{addr.phone}</p>
                </div>
              </div>
              <div className="space-y-1 mb-6 text-[#5F5A54] text-sm">
                <p>{addr.street_building}</p>
                <p>{addr.area_location && `${addr.area_location}, `}{addr.town_city}, {addr.county}</p>
                {addr.delivery_instructions && (
                  <p className="text-[#8B857D] text-xs italic mt-2">Note: {addr.delivery_instructions}</p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-[#E8DCC9]">
                <button 
                  onClick={() => openEdit(addr)}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#3A2418] hover:text-[#C65A28] transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(addr.id)}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                {!addr.is_default && (
                  <button 
                    onClick={() => handleSetDefault(addr.id)}
                    className="ml-auto text-sm font-medium text-[#C65A28] hover:underline"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-[#E8DCC9] rounded-2xl bg-[#FAF5EC]/50">
          <MapPin className="w-12 h-12 text-[#D3C4A5] mx-auto mb-4" />
          <h3 className="text-[#3A2418] font-bold text-lg mb-2">No addresses saved</h3>
          <p className="text-[#5F5A54]">Add a delivery address to make checkout faster.</p>
        </div>
      )}

      {/* Address Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E8DCC9] flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-[#3A2418]">
                {isEditing ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-[#8B857D] hover:text-[#3A2418]"
              >
                &times; Close
              </button>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#3A2418] mb-2">Full Name *</label>
                  <Input 
                    required 
                    value={formData.full_name} 
                    onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3A2418] mb-2">Phone Number *</label>
                  <Input 
                    required 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3A2418] mb-2">County *</label>
                  <Input 
                    required 
                    value={formData.county} 
                    onChange={e => setFormData({...formData, county: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3A2418] mb-2">Town/City *</label>
                  <Input 
                    required 
                    value={formData.town_city} 
                    onChange={e => setFormData({...formData, town_city: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3A2418] mb-2">Area/Location</label>
                  <Input 
                    value={formData.area_location} 
                    onChange={e => setFormData({...formData, area_location: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3A2418] mb-2">Street/Building *</label>
                  <Input 
                    required 
                    value={formData.street_building} 
                    onChange={e => setFormData({...formData, street_building: e.target.value})} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#3A2418] mb-2">Delivery Instructions</label>
                  <Input 
                    value={formData.delivery_instructions} 
                    onChange={e => setFormData({...formData, delivery_instructions: e.target.value})} 
                    placeholder="e.g. Call upon arrival"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={e => setFormData({...formData, is_default: e.target.checked})}
                      className="w-5 h-5 rounded border-[#D3C4A5] text-[#C65A28] focus:ring-[#C65A28]"
                    />
                    <span className="text-[#3A2418] font-medium">Set as default delivery address</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-lg text-[#5F5A54] hover:bg-[#FAF5EC] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#C65A28] hover:bg-[#b04f23] text-white px-8 py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
