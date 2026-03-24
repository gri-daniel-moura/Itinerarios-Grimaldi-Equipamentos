import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-blue-600 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image src="/GrimaldiLogo.jpg" alt="Grimaldi Logo" width={100} height={40} className="h-10 w-auto rounded" />
            <span className="font-bold text-lg tracking-tight">Rota Express</span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 max-w-md mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
