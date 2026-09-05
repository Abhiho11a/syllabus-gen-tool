import { X } from "lucide-react";

export default function RubricsSection({
  rubrics,
  setFormData,
}) {

  // Add rubric
  const addRubric = () => {
    setFormData((prev) => ({
      ...prev,
      rubrics: [
        ...(prev.rubrics || []),
        {
          id: crypto.randomUUID(),
          text: "",
        },
      ],
    }));
  };

  // Edit rubric
  const updateRubric = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      rubrics: (prev.rubrics || []).map((item, i) =>
        i === index
          ? { ...item, text: value }
          : item
      ),
    }));
  };

  // Delete rubric
  const removeRubric = (index) => {
    setFormData((prev) => ({
      ...prev,
      rubrics: (prev.rubrics || []).filter(
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
            Rubrics
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Add rubric points one at a time.
          </p>
        </div>

        <button
          type="button"
          onClick={addRubric}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          + Add Rubric
        </button>
      </div>

      {/* Empty state */}
      {(!rubrics || rubrics.length === 0) && (
        <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-slate-50">
          <p className="text-sm text-slate-500">
            No rubrics added yet.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Click "Add Rubric" to add one.
          </p>
        </div>
      )}

      {/* Rubric rows */}
      <div className="space-y-3">

        {(rubrics || []).map((item, index) => (
          <div
            key={item.id || index}
            className="flex items-center gap-3"
          >

            {/* Rubric label + input */}
            <div className="flex-1">

              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Rubric {index + 1}
              </label>

              <textarea
                value={item.text || ""}
                onChange={(e) =>
                  updateRubric(index, e.target.value)
                }
                placeholder="Enter rubric..."
                rows={1}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none transition"
              />

            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeRubric(index)}
              className="flex-shrink-0 mt-5 w-8 h-8 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Remove Rubric"
            >
              <X size={15} />
            </button>

          </div>
        ))}

      </div>
    </div>
  );
}