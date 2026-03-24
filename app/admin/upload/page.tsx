"use client";

import { useState, useEffect, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        setLocations(data);
        if (data.length > 0) setLocationId(data[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !locationId || !title) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("File is too large. Max 15MB allowed.");
      return;
    }

    try {
      setUploading(true);
      setProgress(10); // Start progress

      // 1. Upload the file direct to Vercel Blob using the client upload. 
      // The token is generated safely by /api/upload.
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: (progressEvent) => {
          // Fake intermediate progress if native isn't perfectly granular
          if (progressEvent.percentage) setProgress(Math.floor(progressEvent.percentage));
          else setProgress(prev => Math.min(prev + 10, 90));
        },
      });

      setProgress(95); // Finalizing DB save

      // 2. Save metadata to Neon DB
      const res = await fetch('/api/pdfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          title,
          description,
          fileUrl: blob.url,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });

      if (!res.ok) throw new Error('Failed to save record to database');

      setProgress(100);
      
      // Cleanup and redirect
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 500);

    } catch (err: unknown) {
      alert(`Upload failed: ${(err as Error).message}`);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Upload Itinerary PDF</h1>

      {loading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location Unit *</label>
            <select
              required
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white outline-none text-slate-900 font-medium shadow-sm"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {locations.length === 0 && <p className="text-sm text-red-500 mt-2">You must add a location first!</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Document Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Fretado Rota 01 - Matutino"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description / Notes</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Any additional information..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] text-slate-900 font-medium shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">PDF File * (Max 15MB)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:bg-slate-50 transition-colors">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-slate-600 justify-center">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="sr-only" 
                      accept="application/pdf"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">
                  {file ? <span className="font-semibold text-slate-900">{file.name} ({(file.size/1024/1024).toFixed(2)}MB)</span> : "PDF files only up to 15MB"}
                </p>
              </div>
            </div>
          </div>

          {uploading && (
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4 overflow-hidden">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={uploading || locations.length === 0 || !file}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Save & Publish'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
