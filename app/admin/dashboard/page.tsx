import { db } from '@/lib/db';
import { locations, pdfFiles } from '@/lib/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const allPdfs = await db.select().from(pdfFiles);
  const allLocations = await db.select().from(locations);
  const recentPdfs = await db.select().from(pdfFiles).orderBy(desc(pdfFiles.createdAt)).limit(5);

  const totalSize = allPdfs.reduce((acc, curr) => acc + curr.fileSize, 0);
  const formattedSize = (totalSize / (1024 * 1024)).toFixed(2) + ' MB';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Painel Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Total de PDFs</p>
          <p className="text-3xl font-bold text-slate-900">{allPdfs.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Total de Unidades</p>
          <p className="text-3xl font-bold text-slate-900">{allLocations.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Espaço Utilizado</p>
          <p className="text-3xl font-bold text-slate-900">{formattedSize}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Uploads Recentes</h2>
          <Link href="/admin/manage/pdfs" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Ver Todos
          </Link>
        </div>
        <div className="p-0 overflow-x-auto">
          {recentPdfs.length === 0 ? (
            <p className="p-6 text-slate-500">Nenhum PDF enviado ainda.</p>
          ) : (
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-sm font-medium text-slate-500">Título</th>
                  <th className="px-6 py-3 text-sm font-medium text-slate-500">Data</th>
                  <th className="px-6 py-3 text-sm font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPdfs.map((pdf) => (
                  <tr key={pdf.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">{pdf.title}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(pdf.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {pdf.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          Inativo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
