import React, { useState } from "react";

import { MapPin, Search, Phone, Clock, Navigation } from "lucide-react";

export default function StoreLocatorPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const stores = [
    {
      id: 1,
      name: "ODA Market Westlands",
      address: "Woodvale Grove, Westlands, Nairobi",
      distance: "2.4 km",
      hours: "8:00 AM - 8:00 PM",
      phone: "+254 700 000 001",
      status: "Open Now"
    },
    {
      id: 2,
      name: "ODA Market CBD",
      address: "Kimathi Street, CBD, Nairobi",
      distance: "5.1 km",
      hours: "7:00 AM - 9:00 PM",
      phone: "+254 700 000 002",
      status: "Open Now"
    },
    {
      id: 3,
      name: "ODA Market Karen",
      address: "Karen Road, Karen, Nairobi",
      distance: "12.3 km",
      hours: "9:00 AM - 7:00 PM",
      phone: "+254 700 000 003",
      status: "Closed"
    }
  ];

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    store.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 w-full flex flex-col bg-[#FAF5EC]">
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#3A2418] mb-3">Store Locator</h1>
          <p className="text-[#5F5A54] max-w-2xl">
            Find an ODA Market pickup location or retail store near you. We're expanding our network to serve you better.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 h-[600px]">
          {/* Sidebar */}
          <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-[#E8DCC9] flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-[#E8DCC9] bg-[#FAF5EC]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B857D] w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by area or street..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E8DCC9] rounded-xl text-sm text-[#3A2418] focus:outline-none focus:border-[#C65A28] focus:ring-1 focus:ring-[#C65A28]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredStores.map(store => (
                <div key={store.id} className="p-4 border border-[#E8DCC9] rounded-xl hover:border-[#C65A28] transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#3A2418] group-hover:text-[#C65A28] transition-colors">{store.name}</h3>
                    <span className="text-xs font-semibold text-[#8B857D] bg-[#FAF5EC] px-2 py-1 rounded-md">{store.distance}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-[#5F5A54]">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#8B857D] shrink-0 mt-0.5" />
                      <span>{store.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#8B857D] shrink-0" />
                      <span className={store.status === "Open Now" ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                        {store.status}
                      </span>
                      <span className="text-xs text-[#8B857D]">({store.hours})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#8B857D] shrink-0" />
                      <span>{store.phone}</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 py-2 bg-[#FAF5EC] text-[#C65A28] font-bold rounded-lg text-sm group-hover:bg-[#C65A28] group-hover:text-white transition-colors flex items-center justify-center gap-2">
                    <Navigation className="w-4 h-4" /> Get Directions
                  </button>
                </div>
              ))}
              
              {filteredStores.length === 0 && (
                <div className="text-center py-8 text-[#8B857D]">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No stores found matching your search.</p>
                </div>
              )}
            </div>
          </div>

          {/* Map Area Mockup */}
          <div className="md:col-span-2 bg-[#FAF5EC] rounded-2xl shadow-sm border border-[#E8DCC9] overflow-hidden relative hidden md:block">
            {/* Simple static map visualization */}
            <div className="absolute inset-0 bg-[#E8DCC9] opacity-30 pattern-grid-lg"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#C65A28] shadow-lg mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#3A2418] mb-2">Interactive Map</h2>
              <p className="text-[#5F5A54] max-w-sm">
                In a production environment, this area would load Google Maps or Mapbox with interactive pins for all our store locations.
              </p>
            </div>
            
            {/* Mock Pins */}
            <div className="absolute top-1/4 left-1/3 w-8 h-8 text-[#C65A28] animate-bounce"><MapPin fill="currentColor" /></div>
            <div className="absolute top-1/2 left-2/3 w-8 h-8 text-[#C65A28]"><MapPin fill="currentColor" /></div>
            <div className="absolute bottom-1/3 left-1/2 w-8 h-8 text-[#C65A28]"><MapPin fill="currentColor" /></div>
          </div>
        </div>
      </main>
    </div>
  );
}
