import { X } from "lucide-react";

export default function GuidelinesSection({
  guidelines,
  setFormData,
}) {

  // Add guideline
  const addGuideline = () => {
    setFormData((prev) => ({
      ...prev,
      guidelines: [
        ...(prev.guidelines || []),
        {
          id: crypto.randomUUID(),
          text: "",
        },
      ],
    }));
  };

  // Edit guideline
  const updateGuideline = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      guidelines: (prev.guidelines || []).map((item, i) =>
        i === index
          ? { ...item, text: value }
          : item
      ),
    }));
  };

  // Delete guideline
  const removeGuideline = (index) => {
    setFormData((prev) => ({
      ...prev,
      guidelines: (prev.guidelines || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  return (
    <div className="mt-12">

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-700">
            Guidelines
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Add guidelines one at a time.
          </p>
        </div>

        <button
          type="button"
          onClick={addGuideline}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          + Add Guideline
        </button>
      </div>

      {/* Empty state */}
      {(!guidelines || guidelines.length === 0) && (
        <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-slate-50">
          <p className="text-sm text-slate-500">
            No guidelines added yet.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Click "Add Guideline" to add one.
          </p>
        </div>
      )}

      {/* Guideline rows */}
      <div className="space-y-3">

        {(guidelines || []).map((item, index) => (
          <div
            key={item.id || index}
            className="flex items-center gap-3"
          >

            {/* Guideline label + input */}
            <div className="flex-1">

              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Guideline {index + 1}
              </label>

              <textarea
                value={item.text || ""}
                onChange={(e) =>
                  updateGuideline(index, e.target.value)
                }
                placeholder="Enter guideline..."
                rows={1}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none transition"
              />

            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeGuideline(index)}
              className="flex-shrink-0 mt-5 w-8 h-8 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Remove Guideline"
            >
              <X size={15} />
            </button>

          </div>
        ))}

      </div>
    </div>
  );
}