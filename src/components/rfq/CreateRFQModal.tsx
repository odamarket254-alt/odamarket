import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Label } from "../ui/Label";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "sonner";
import { PackageSearch, FileText, Upload } from "lucide-react";
import { motion } from "motion/react";

interface CreateRFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  categoryId?: string;
  initialTitle?: string;
}

export function CreateRFQModal({ isOpen, onClose, productId, categoryId, initialTitle }: CreateRFQModalProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: initialTitle || "",
    description: "",
    quantity: "",
    unit: "pieces",
    target_price: "",
    delivery_location: "",
    delivery_date: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in to create an RFQ");
    if (!formData.title || !formData.description || !formData.quantity || !formData.unit || !formData.delivery_location) {
      return toast.error("Please fill in all required fields.");
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("rfqs").insert({
        buyer_id: user.id,
        product_id: productId || null,
        category_id: categoryId || null,
        title: formData.title,
        description: formData.description,
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit,
        target_price: formData.target_price ? parseFloat(formData.target_price) : null,
        delivery_location: formData.delivery_location,
        delivery_date: formData.delivery_date ? formData.delivery_date : null,
        status: "pending"
      });

      if (error) throw error;
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit RFQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset success state if modal is closed manually
  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isSuccess) onClose();
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card rounded-xl">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4"
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
              >
                <motion.path d="M20 6 9 17l-5-5" />
              </motion.svg>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">RFQ Submitted!</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your request has been sent successfully. Suppliers will be notified.
              </p>
            </motion.div>
          </div>
        ) : (
          <>
            <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#00B074]/10 text-[#00B074]">
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Request for Quotation</DialogTitle>
              <DialogDescription>
                Provide details to fetch quotes from certified suppliers
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-semibold">Product Name / RfQ Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., iPhone 15 Pro Max 256GB"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-semibold">Quantity <span className="text-red-500">*</span></Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    className="flex-1"
                  />
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="pieces">Pieces</option>
                    <option value="kg">Kg</option>
                    <option value="tons">Tons</option>
                    <option value="liters">Liters</option>
                    <option value="boxes">Boxes</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="target_price" className="text-sm font-semibold">Target Unit Price (Optional)</Label>
                <Input
                  id="target_price"
                  name="target_price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 50.00"
                  value={formData.target_price}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_location" className="text-sm font-semibold">Delivery Location <span className="text-red-500">*</span></Label>
                <Input
                  id="delivery_location"
                  name="delivery_location"
                  placeholder="City, Country"
                  value={formData.delivery_location}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="delivery_date" className="text-sm font-semibold">Expected Delivery Date (Optional)</Label>
                <Input
                  id="delivery_date"
                  name="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-semibold">Detailed Requirements <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Please describe your exact requirements, materials, certifications needed, etc."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
                className="mt-1 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#00B074] hover:bg-[#009260] text-white">
              {isSubmitting ? "Submitting..." : "Submit RFQ"}
            </Button>
          </div>
        </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
