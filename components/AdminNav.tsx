"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MapPin, FileText, UploadCloud, LogOut } from 'lucide-react';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Upload PDF', href: '/admin/upload', icon: UploadCloud },
    { name: 'Manage Locations', href: '/admin/manage/locations', icon: MapPin },
    { name: 'Manage PDFs', href: '/admin/manage/pdfs', icon: FileText },
  ];

  return (
    <div className="w-64 bg-blue-600 text-white min-h-screen flex flex-col hidden md:flex">
      <div className="p-4 border-b border-slate-800 bg-white flex justify-center">
        <Image src="/GrimaldiLogo.jpg" alt="Grimaldi Logo" width={120} height={48} className="h-12 w-auto rounded" />
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-800 text-white' : 'hover:bg-blue-700/50 text-blue-100'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        {/* Basic clear cookie link logic */}
        <button 
          onClick={() => {
            document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = '/admin/login';
          }}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
