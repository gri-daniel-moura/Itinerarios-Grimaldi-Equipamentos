import { db } from '@/lib/db';
import { locations } from '@/lib/schema';
import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import WhatsAppButton from '@/components/WhatsAppButton';

export const dynamic = 'force-dynamic'; // Prevent aggressive static caching if locations update frequently

export default async function HomePage() {
  const allLocations = await db.select().from(locations).orderBy(locations.name);

  return (
    <div className="p-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">Selecione Sua Unidade</h1>
        <p className="text-slate-500">Escolha sua localidade para ver os itinerários de transporte e os horários dos ônibus disponíveis.</p>
      </div>

      <div className="space-y-3">
        {allLocations.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-slate-200">
            <MapPin className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-medium text-slate-900">Nenhuma unidade encontrada</h3>
            <p className="text-sm text-slate-500 mt-1">Volte mais tarde ou contate o RH.</p>
          </div>
        ) : (
          allLocations.map((loc) => (
            <Link 
              key={loc.id} 
              href={`/${loc.slug}`}
              className="group block bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 rounded-full p-3 group-hover:bg-blue-100 transition-colors">
                    <MapPin className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{loc.name}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Ver itinerários</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={24} />
              </div>
            </Link>
          ))
        )}
      </div>
      <WhatsAppButton />
    </div>
  );
}
