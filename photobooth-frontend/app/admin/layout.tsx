"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const NavItem = ({ item }: { item: any }) => (
    <Link href={item.path} className={`flex items-center gap-4 px-4 py-3 mx-4 mb-1 rounded-[10px] border transition-all ${isActive(item.path) ? 'bg-[#EAF5F3] border-[#3A9F86] text-[#3A9F86] shadow-sm' : 'bg-white border-transparent text-[#4D4B4B] hover:bg-gray-50'}`}>
      <img src={item.icon} alt={item.name} className="w-[18px] h-[18px] object-contain" />
      <span className="font-bold text-[14px]">{item.name}</span>
    </Link>
  );

  return (
    <div className="flex h-screen bg-[#ECF0EE] font-inter overflow-hidden">
      <aside className="w-[280px] h-full flex flex-col shrink-0 bg-[#F9F9F9] border-r border-gray-200">
        
        {/* HEADER SIDEBAR (Dikecilin height-nya jadi 90px) */}
        <div className="h-[90px] bg-[#386359] flex items-center px-6 gap-3 border-b border-black/10">
          <div className="w-[40px] h-[40px] bg-[#ADBDC8] border border-black rounded-[10px] flex items-center justify-center shrink-0">
             <img src="/glambot.png" alt="Logo" className="w-[28px] h-[28px] object-contain" />
          </div>
          <h1 className="font-bold text-[20px] text-white">Glambot<span className="text-[#81E6D9] italic">Admin</span></h1>
        </div>
        
        {/* MENU (Spacing diperlebar antar menu) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-6">
          <h3 className="text-[10px] font-bold text-[#A0A0A0] px-8 mb-3 uppercase tracking-wider">Overview</h3>
          <div className="space-y-2">
            <NavItem item={{ name: "Dashboard", path: "/admin", icon: "/dashboard.png" }} />
            <NavItem item={{ name: "Transaksi", path: "/admin/transaksi", icon: "/transaksi.png" }} />
          </div>
          
          <h3 className="text-[10px] font-bold text-[#A0A0A0] px-8 mt-8 mb-3 uppercase tracking-wider">Content</h3>
          <div className="space-y-2">
            <NavItem item={{ name: "Template & Frame", path: "/admin/frame", icon: "/template.png" }} />
            <NavItem item={{ name: "Filter", path: "/admin/filter", icon: "/filt.png" }} />
            <NavItem item={{ name: "Voucher", path: "/admin/voucher", icon: "/voucher1.png" }} />
            <NavItem item={{ name: "Paket & Sesi", path: "/admin/paket", icon: "/sesi.png" }} />
          </div>
          
          <h3 className="text-[10px] font-bold text-[#A0A0A0] px-8 mt-8 mb-3 uppercase tracking-wider">System</h3>
          <div className="space-y-2">
            <NavItem item={{ name: "Printer", path: "/admin/printer", icon: "/printer.png" }} />
            <NavItem item={{ name: "Pengaturan", path: "/admin/pengaturan", icon: "/pengaturan.png" }} />
          </div>
        </div>

        {/* FOOTER SIDEBAR */}
        <div className="p-5 mt-auto bg-[#E5E5E5] border-t border-gray-300">
          
          {/* Card Admin Account - Dikasih space lebih lega */}
          <div className="bg-[#F9F9F9] px-4 py-3 rounded-[12px] flex items-center justify-between mb-4 border border-black/10 shadow-sm">
            <div className="flex items-center gap-3">
                {/* Box profil admin lebih persegi/simetris */}
                <div className="w-9 h-9 bg-[#386359] rounded-[8px]"></div>
                <div>
                  <p className="font-bold text-[13px] text-[#3A3A3A] leading-tight">Admin Account</p>
                  <p className="text-[11px] text-[#8C8888]">Administrator</p>
                </div>
            </div>
            <img src="/logout.png" alt="Logout" className="w-5 h-5 object-contain cursor-pointer hover:opacity-70 transition-opacity" />
          </div>

          <div className="w-full bg-white border border-[#3A9F86] py-2.5 rounded-full flex items-center justify-center gap-2 text-[13px] shadow-sm">
            <span className="w-2 h-2 bg-[#3A9F86] rounded-full"></span> 
            <span className="font-bold text-[#3A9F86]">Booth Online</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
      
      <div dangerouslySetInnerHTML={{ __html: `<style>.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }</style>` }} />
    </div>
  );
}