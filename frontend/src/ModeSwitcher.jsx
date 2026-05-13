import { FileText, Combine } from "lucide-react";

export default function ModeSwitcher({ mode, setMode }) {
  return (
    <div className="w-full flex justify-center mt-6 mb-4">
      
      <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-sm">
        
        {/* Generator Button */}
        <button
          onClick={() => setMode("generator")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
          ${
            mode === "generator"
              ? "bg-white text-[#0f2744] shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText size={16} />
          Syllabus Generator
        </button>

        {/* Divider */}
        <div className="w-px bg-slate-200 mx-1" />

        {/* Merge Button */}
        <button
          onClick={() => setMode("merge")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
          ${
            mode === "merge"
              ? "bg-white text-[#0f2744] shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Combine size={16} />
          Merge Documents
        </button>

      </div>

    </div>
  );
}