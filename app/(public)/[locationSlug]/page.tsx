import { db } from '@/lib/db';
import { locations, pdfFiles } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';
import Link from 'next/link';
import { FileText, ArrowLeft, Download, Eye } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LocationPdfsPage({ params }: { params: { locationSlug: string } }) {
  const [location] = await db.select().from(locations).where(eq(locations.slug, params.locationSlug));
  
  if (!location) {
    notFound();
  }

  const activePdfs = await db
    .select()
    .from(pdfFiles)
    .where(and(eq(pdfFiles.locationId, location.id), eq(pdfFiles.isActive, true)))
    .orderBy(desc(pdfFiles.createdAt));

  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  return (
    <div className="p-4 pt-6 pb-20">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6 transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back to Locations
      </Link>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{location.name}</h1>
        <p className="text-slate-500">Available itineraries and schedules.</p>
      </div>

      <div className="space-y-4">
        {activePdfs.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm mt-8">
            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-medium text-slate-900">No documents found</h3>
            <p className="text-sm text-slate-500 mt-1">HR hasn&apos;t uploaded any PDFs for this unit yet.</p>
          </div>
        ) : (
          activePdfs.map((pdf) => (
            <div key={pdf.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold text-slate-800 leading-tight pr-4">{pdf.title}</h2>
                <span className="shrink-0 bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-medium">
                  {formatSize(pdf.fileSize)}
                </span>
              </div>
              
              {pdf.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{pdf.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                <span>Updated: {new Date(pdf.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-3">
                <Link 
                  href={`/${params.locationSlug}/${pdf.id}`}
                  className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                >
                  <Eye size={18} /> View
                </Link>
                <a 
                  href={pdf.fileUrl}
                  target="_blank"
                  download
                  rel="noreferrer"
                  className="flex-none bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors active:scale-[0.98]"
                  title="Download File directly"
                >
                  <Download size={18} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
