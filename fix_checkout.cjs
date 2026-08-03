const fs = require('fs');
const file = 'src/pages/CheckoutPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state
const imports = `import { useState, useEffect } from "react";`;
content = content.replace(/import \{ useState, useEffect \} from "react";/, `import { useState, useEffect } from "react";\nimport { Input } from "../components/ui/Input";\nimport { Label } from "../components/ui/Label";\nimport { Button } from "../components/ui/Button";`);

const states = `  const [loadingText, setLoadingText] = useState("");
  
  const [shippingDetails, setShippingDetails] = useState({
    recipientName: fullName,
    recipientPhone: userPhone,
    location: "Nairobi, Westlands",
    fullAddress: "Spring Valley Estate, Peponi Road, Building A, Opposite Mall"
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressData, setEditAddressData] = useState(shippingDetails);

  // Sync when user/profile loads
  useEffect(() => {
    setShippingDetails(prev => ({
      ...prev,
      recipientName: prev.recipientName === "Customer Name" ? (user?.user_metadata?.full_name || user?.user_metadata?.first_name || "Customer Name") : prev.recipientName,
      recipientPhone: prev.recipientPhone === "+254 700 000000" ? (profile?.phone || user?.phone || user?.user_metadata?.phone || "+254 700 000000") : prev.recipientPhone
    }));
  }, [user, profile]);`;

content = content.replace(/  const \[loadingText, setLoadingText\] = useState\(""\);/, states);

content = content.replace(
  /shippingDetails: \{\s*county: "Nairobi",\s*address: "Default Address"\s*\}/,
  `shippingDetails: shippingDetails`
);

const addressSectionOld = `            {/* Section 2: Delivery Address */}
            <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[slate-900] font-bold text-[20px]">2. Delivery Address</h2>
                <button className="text-[slate-900] font-bold text-[14px] hover:underline">Change Address</button>
              </div>
              <div className="bg-[#F8FAFC] rounded-[16px] p-5 border border-[#E5E7EB] flex items-start gap-4">
                <MapPin className="w-6 h-6 text-[#C65A28] shrink-0 mt-1" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 w-full">
                  <div>
                    <span className="text-[#6B7280] text-[13px] block">Recipient</span>
                    <span className="text-[slate-900] font-semibold text-[15px]">{fullName} ({userPhone})</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] text-[13px] block">Location</span>
                    <span className="text-[slate-900] font-semibold text-[15px]">Nairobi, Westlands</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-[#6B7280] text-[13px] block">Full Address</span>
                    <span className="text-[slate-900] font-semibold text-[15px]">Spring Valley Estate, Peponi Road, Building A, Opposite Mall</span>
                  </div>
                </div>
              </div>
            </div>`;

const addressSectionNew = `            {/* Section 2: Delivery Address */}
            <div className="bg-[#FFFDF8] rounded-[20px] shadow-sm border border-[#E5E7EB] p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[slate-900] font-bold text-[20px]">2. Delivery Address</h2>
                {!isEditingAddress && (
                  <button 
                    onClick={() => {
                      setEditAddressData(shippingDetails);
                      setIsEditingAddress(true);
                    }}
                    className="text-[#C65A28] font-bold text-[14px] hover:underline"
                  >
                    Change Address
                  </button>
                )}
              </div>
              
              {isEditingAddress ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipientName">Recipient Name</Label>
                      <Input 
                        id="recipientName" 
                        value={editAddressData.recipientName} 
                        onChange={(e) => setEditAddressData({...editAddressData, recipientName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="recipientPhone">Phone Number</Label>
                      <Input 
                        id="recipientPhone" 
                        value={editAddressData.recipientPhone} 
                        onChange={(e) => setEditAddressData({...editAddressData, recipientPhone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location (City, Area)</Label>
                    <Input 
                      id="location" 
                      value={editAddressData.location} 
                      onChange={(e) => setEditAddressData({...editAddressData, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullAddress">Full Address (Building, Street)</Label>
                    <Input 
                      id="fullAddress" 
                      value={editAddressData.fullAddress} 
                      onChange={(e) => setEditAddressData({...editAddressData, fullAddress: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsEditingAddress(false)}>Cancel</Button>
                    <Button onClick={() => {
                      setShippingDetails(editAddressData);
                      setIsEditingAddress(false);
                    }} className="bg-[#C65A28] hover:bg-[#A0451C] text-white">Save Address</Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F8FAFC] rounded-[16px] p-5 border border-[#E5E7EB] flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-[#C65A28] shrink-0 mt-1" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 w-full">
                    <div>
                      <span className="text-[#6B7280] text-[13px] block">Recipient</span>
                      <span className="text-[slate-900] font-semibold text-[15px]">{shippingDetails.recipientName} ({shippingDetails.recipientPhone})</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] text-[13px] block">Location</span>
                      <span className="text-[slate-900] font-semibold text-[15px]">{shippingDetails.location}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[#6B7280] text-[13px] block">Full Address</span>
                      <span className="text-[slate-900] font-semibold text-[15px]">{shippingDetails.fullAddress}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>`;

content = content.replace(addressSectionOld, addressSectionNew);

fs.writeFileSync(file, content);
console.log("Fixed checkout");
