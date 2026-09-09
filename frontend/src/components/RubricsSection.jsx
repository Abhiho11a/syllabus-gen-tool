import { useRef } from "react";
import { X, Upload, FileText } from "lucide-react";

export default function RubricsSection({
  rubrics,
  setFormData,
  rubricFile,
  setRubricFile,
}) {
  const fileInputRef = useRef(null);

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

  const removeRubric = (index) => {
    setFormData((prev) => ({
      ...prev,
      rubrics: (prev.rubrics || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  // =========================================================
  // RUBRIC DOCUMENT UPLOAD
  // =========================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // -------------------------------------------------------
    // Allowed file types
    // -------------------------------------------------------

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const isValidType = allowedTypes.includes(file.type);

    // -------------------------------------------------------
    // Some browsers may not provide the MIME type correctly.
    // So also check the file extension.
    // -------------------------------------------------------

    const fileName = file.name.toLowerCase();

    const isValidExtension =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".docx");

    if (!isValidType && !isValidExtension) {
      alert("Please upload only PDF or DOCX files.");

      event.target.value = "";
      return;
    }

    // -------------------------------------------------------
    // 10 MB limit
    // -------------------------------------------------------

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("File size must be less than 10 MB.");

      event.target.value = "";
      return;
    }

    // -------------------------------------------------------
    // Store File separately from formData
    // -------------------------------------------------------

    setRubricFile(file);
  };

  const removeRubricFile = () => {
    setRubricFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mt-12">

      {/* =====================================================
          HEADER
      ====================================================== */}

      {/* <div className="flex justify-between items-center border-b pb-2 mb-4">

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

      </div> */}

      {/* =====================================================
          NO RUBRICS
      ====================================================== */}

      {/* {(!rubrics || rubrics.length === 0) && (
        <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center bg-slate-50">

          <p className="text-sm text-slate-500">
            No rubrics added yet.
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Click "Add Rubric" to add one.
          </p>

        </div>
      )} */}

      {/* =====================================================
          RUBRIC INPUTS
      ====================================================== */}

      {/* <div className="space-y-3">

        {(rubrics || []).map((item, index) => (

          <div
            key={item.id || index}
            className="flex items-center gap-3"
          >

            <div className="flex-1">

              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Rubric {index + 1}
              </label>

              <textarea
                value={item.text || ""}
                onChange={(e) =>
                  updateRubric(
                    index,
                    e.target.value
                  )
                }
                placeholder="Enter rubric..."
                rows={1}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none transition"
              />

            </div>

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

      </div> */}

      {/* =====================================================
          RUBRIC DOCUMENT UPLOAD
      ====================================================== */}

      <div className="mt-8">

        <div className="border-t border-slate-200 pt-6">

          <div className="mb-3">

            <h4 className="text-sm font-semibold text-slate-700">
              Rubric Document
              <span className="font-normal text-slate-400">
                {" "} (Optional)
              </span>
            </h4>

            <p className="text-xs text-slate-500 mt-1">
              Upload a PDF or DOCX rubric document.
              It will be added to the generated PDF after the Rubrics section.
            </p>

          </div>

          {/* =================================================
              FILE NOT SELECTED
          ================================================== */}

          {!rubricFile && (

            <div
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition cursor-pointer"
            >

              <div className="flex flex-col items-center justify-center text-center">

                <div className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3">
                  <Upload
                    size={20}
                    className="text-slate-500"
                  />
                </div>

                <p className="text-sm font-medium text-slate-700">
                  Upload Rubric Document
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  PDF or DOCX • Maximum 10 MB
                </p>

              </div>

            </div>

          )}

          {/* =================================================
              FILE SELECTED
          ================================================== */}

          {rubricFile && (

            <div className="flex items-center justify-between gap-3 border border-slate-200 rounded-xl p-4 bg-slate-50">

              <div className="flex items-center gap-3 min-w-0">

                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center">

                  <FileText
                    size={19}
                    className="text-slate-600"
                  />

                </div>

                <div className="min-w-0">

                  <p className="text-sm font-medium text-slate-700 truncate">
                    {rubricFile.name}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {(rubricFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={removeRubricFile}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition"
              >
                Remove
              </button>

            </div>

          )}

          {/* =================================================
              HIDDEN INPUT
          ================================================== */}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="hidden"
          />

        </div>

      </div>

    </div>
  );
}