"use client";

import { useState, useEffect } from 'react';
import { Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';

type Location = { id: string; name: string };
type PdfFile = { 
  id: string; 
  title: string; 
  fileUrl: string; 
  fileSize: number; 
  isActive: boolean; 
  createdAt: string; 
  locationId: string;
};

export default function ManagePdfsPage() {
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pdfRes, locRes] = await Promise.all([
        fetch('/api/pdfs?includeInactive=true').then(res => res.json()),
        fetch('/api/locations').then(res => res.json()),
      ]);
      setPdfs(pdfRes);
      setLocations(locRes);
    } catch {
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (pdf: PdfFile) => {
    try {
      const res = await fetch('/api/pdfs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pdf.id, isActive: !pdf.isActive }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchData();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to completely delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/pdfs?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete file records');
      fetchData();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const filteredPdfs = filterLocation 
    ? pdfs.filter(p => p.locationId === filterLocation) 
    : pdfs;

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || 'Unknown';
  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Manage PDFs</h1>
        
        <div className="flex gap-4">
          <select 
            value={filterLocation} 
            onChange={e => setFilterLocation(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-slate-500">Title & Location</th>
                <th className="px-6 py-3 text-sm font-medium text-slate-500 hidden md:table-cell">File Info</th>
                <th className="px-6 py-3 text-sm font-medium text-slate-500">Status</th>
                <th className="px-6 py-3 text-sm font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPdfs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No PDFs found for this criteria.</td>
                </tr>
              )}
              {filteredPdfs.map((pdf) => (
                <tr key={pdf.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{pdf.title}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      {getLocationName(pdf.locationId)}
                    </p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-sm text-slate-900">{formatSize(pdf.fileSize)}</p>
                    <p className="text-sm text-slate-500">{new Date(pdf.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    {pdf.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        Hidden
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 items-center">
                      <a href={pdf.fileUrl} target="_blank" rel="noreferrer" title="Open File" className="text-slate-400 hover:text-blue-600 transition-colors">
                        <ExternalLink size={18} />
                      </a>
                      <button 
                        onClick={() => handleToggleActive(pdf)} 
                        title={pdf.isActive ? "Deactivate" : "Activate"}
                        className={`transition-colors ${pdf.isActive ? 'text-slate-400 hover:text-orange-600' : 'text-orange-500 hover:text-orange-700'}`}
                      >
                        {pdf.isActive ? <ToggleRight size={22} className="text-green-500 hover:text-orange-500" /> : <ToggleLeft size={22} />}
                      </button>
                      <button onClick={() => handleDelete(pdf.id, pdf.title)} title="Delete" className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
