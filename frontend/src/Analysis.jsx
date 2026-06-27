import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, FileJson, File, Activity, AlertCircle, ArrowLeft } from "lucide-react";

export default function Analysis() {
  const [stats, setStats] = useState({
    totalGenerated: 0,
    pdfCount: 0,
    docxCount: 0,
    jsonCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve apiUrl the same way it's done in InputForm.jsx
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiUrl}/api/stats`);
      if (!res.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-slate-500">
        <Activity className="animate-spin mb-4" size={32} />
        <p>Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-red-500">
        <AlertCircle size={32} className="mb-4" />
        <p>Error: {error}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 mt-8 relative">
      <Link 
        to="/" 
        className="absolute left-6 top-0 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 hover:text-[#0f2744] transition-all"
      >
        <ArrowLeft size={16} />
        Back to Web
      </Link>

      <div className="mb-8 text-center pt-2">
        <h2 className="text-3xl font-bold text-[#0f2744]">Usage Analysis</h2>
        <p className="text-slate-500 mt-2">Global document generation statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Card */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center transform transition-transform hover:scale-[1.02]">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <Activity size={28} />
          </div>
          <h3 className="text-slate-500 font-medium text-sm">Total Generated</h3>
          <p className="text-4xl font-bold text-[#0f2744] mt-2">{stats.totalGenerated || 0}</p>
        </div>

        {/* PDF Card */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center transform transition-transform hover:scale-[1.02]">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <FileText size={28} />
          </div>
          <h3 className="text-slate-500 font-medium text-sm">PDFs Generated</h3>
          <p className="text-4xl font-bold text-[#0f2744] mt-2">{stats.pdfCount || 0}</p>
        </div>

        {/* DOCX Card */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center transform transition-transform hover:scale-[1.02]">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <File size={28} />
          </div>
          <h3 className="text-slate-500 font-medium text-sm">DOCXs Generated</h3>
          <p className="text-4xl font-bold text-[#0f2744] mt-2">{stats.docxCount || 0}</p>
        </div>

        {/* JSON Card */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center transform transition-transform hover:scale-[1.02]">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <FileJson size={28} />
          </div>
          <h3 className="text-slate-500 font-medium text-sm">JSONs Generated</h3>
          <p className="text-4xl font-bold text-[#0f2744] mt-2">{stats.jsonCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
