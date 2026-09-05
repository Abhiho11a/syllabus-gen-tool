import { useState } from "react";
import { X } from "lucide-react";

const emptyModule = {
  title: "",
  content: "",
  textbook: "",
  chapter: "",
  rbt: "",
  wkt: "",
  teachingHours: "",
  textbooks: [],
};

export default function ModulesSection({
  modules,
  setFormData,
  is2025Scheme,
}) {
  // =========================================================
  // MODULE OPERATIONS
  // =========================================================

  const addModule = () => {
    setFormData((prev) => ({
      ...prev,
      modules: [
        ...(prev.modules || []),
        {
          ...emptyModule,
          textbooks: [],
        },
      ],
    }));
  };

  const removeModule = (index) => {
    setFormData((prev) => ({
      ...prev,
      modules: (prev.modules || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateModule = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.modules || [])];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return {
        ...prev,
        modules: updated,
      };
    });
  };


  // =========================================================
  // TEXTBOOK OPERATIONS
  // =========================================================

  const addTextbook = (moduleIndex, textbook) => {
    setFormData((prev) => {
      const updatedModules = [...(prev.modules || [])];

      const currentModule = updatedModules[moduleIndex];

      updatedModules[moduleIndex] = {
        ...currentModule,
        textbooks: [
          ...(currentModule.textbooks || []),
          textbook,
        ],
      };

      return {
        ...prev,
        modules: updatedModules,
      };
    });
  };

  const removeTextbook = (moduleIndex, textbookIndex) => {
    setFormData((prev) => {
      const updatedModules = [...(prev.modules || [])];

      const currentModule = updatedModules[moduleIndex];

      updatedModules[moduleIndex] = {
        ...currentModule,
        textbooks: (currentModule.textbooks || []).filter(
          (_, index) => index !== textbookIndex
        ),
      };

      return {
        ...prev,
        modules: updatedModules,
      };
    });
  };


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="flex flex-col gap-10 mt-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex justify-between items-center border-b pb-2">

        <h2 className="text-lg font-semibold text-slate-700">
          Modules Details
        </h2>

        <button
          type="button"
          onClick={addModule}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
        >
          + Add Module
        </button>

      </div>


      {/* =====================================================
          MODULE LIST
      ====================================================== */}

      {(modules || []).map((mod, idx) => (

        <div
          key={idx}
          className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm space-y-5 relative"
        >

          {/* MODULE HEADER */}

          <h2 className="text-lg font-bold text-slate-700 border-b pb-2">
            Module {idx + 1}
          </h2>


          {/* REMOVE MODULE */}

          {modules.length > 1 && (
            <button
              type="button"
              onClick={() => removeModule(idx)}
              className="absolute top-5 right-5 text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors rounded-md py-1.5 px-3"
            >
              Remove
            </button>
          )}


          {/* =================================================
              TOPICS COVERED
          ================================================== */}

          <div>

            <div className="flex justify-between items-end mb-1">

              <label className="block text-sm font-semibold text-gray-700">
                Topics Covered
              </label>

              <span className="text-red-500 text-xs font-medium">
                Wrap words inside ** ** for bold text in PDF
              </span>

            </div>

            <textarea
              name="content"
              value={mod.content || ""}
              onChange={(e) =>
                updateModule(
                  idx,
                  "content",
                  e.target.value
                )
              }
              rows={5}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-slate-400 outline-none"
            />

          </div>


          {/* =================================================
              TEXTBOOK DETAILS
          ================================================== */}

          <div className="border border-gray-200 rounded-lg p-5 bg-slate-50">

            <div className="flex items-center justify-between mb-4">

              <label className="text-sm font-semibold text-gray-700">
                Textbooks
              </label>

              <span className="text-xs font-medium bg-slate-200 px-2 py-1 rounded text-slate-600">
                {(mod.textbooks || []).length} added
              </span>

            </div>


            {/* EXISTING TEXTBOOKS */}

            {(mod.textbooks || []).length > 0 && (

              <div className="space-y-3 mb-5">

                {(mod.textbooks || []).map(
                  (tb, tbIdx) => (

                    <div
                      key={tbIdx}
                      className="flex items-start justify-between gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
                    >

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-bold text-slate-800">
                          TB-{tb.slNo}
                        </p>

                        {/* <p className="text-xs text-slate-500 mt-1 truncate">
                          {tb.author || "Author not specified"}
                          {" • "}
                          {tb.publisher || "Publisher not specified"}

                          {tb.year
                            ? ` • ${tb.year}`
                            : ""}
                        </p> */}

                        {tb.chapter && (
                          <p className="text-xs text-indigo-500 font-medium mt-1">
                            Chapter: {tb.chapter}
                          </p>
                        )}

                      </div>


                      {/* REMOVE TEXTBOOK */}

                      <button
                        type="button"
                        onClick={() =>
                          removeTextbook(
                            idx,
                            tbIdx
                          )
                        }
                        className="text-red-400 hover:text-red-600 flex-shrink-0 w-8 h-8 flex items-center justify-center bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                        title="Remove textbook"
                      >
                        <X size={16} />
                      </button>

                    </div>

                  )
                )}

              </div>

            )}


            {/* ADD TEXTBOOK FORM */}

            <ModuleTextbookForm
              onAdd={(textbook) =>
                addTextbook(idx, textbook)
              }
            />

          </div>


          {/* =================================================
              RBT / WKT / TEACHING HOURS
          ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


            {/* RBT */}

            <div>

              <label className="text-sm font-semibold text-gray-700">
                RBT Level(s)
              </label>

              <input
                name="rbt"
                value={mod.rbt || ""}
                onChange={(e) =>
                  updateModule(
                    idx,
                    "rbt",
                    e.target.value
                  )
                }
                className="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none"
              />

            </div>


            {/* WKT */}

            <div>

              <label className="text-sm font-semibold text-gray-700">
                WKT
              </label>

              <input
                name="wkt"
                value={mod.wkt || ""}
                onChange={(e) =>
                  updateModule(
                    idx,
                    "wkt",
                    e.target.value
                  )
                }
                className="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none"
              />

            </div>


            {/* TEACHING HOURS */}

            {is2025Scheme && (

              <div>

                <label className="text-sm font-semibold text-gray-700">
                  Teaching Hours
                </label>

                <input
                  type="number"
                  min="0"
                  name="teachingHours"
                  value={
                    mod.teachingHours || ""
                  }
                  onChange={(e) =>
                    updateModule(
                      idx,
                      "teachingHours",
                      e.target.value
                    )
                  }
                  placeholder="Enter hours"
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />

              </div>

            )}

          </div>

        </div>

      ))}

    </div>
  );
}


// =============================================================
// MODULE TEXTBOOK FORM
// =============================================================

function ModuleTextbookForm({ onAdd }) {

  const empty = {
    slNo: "",
    chapter: "",
  };

  const [tb, setTb] = useState(empty);


  const handleAdd = () => {

    if (!tb.slNo || !tb.chapter) {
      alert(
        "Please fill TB No and Chapter/Article"
      );
      return;
    }

    onAdd({
      ...tb,
    });

    setTb({
      ...empty,
    });
  };


  return (

    <div className="border border-dashed border-slate-300 rounded-2xl p-5 bg-white">

      <p className="text-sm font-semibold text-slate-600 mb-4">
        Add Textbook Details
      </p>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">


        {/* TB NO */}

        <div>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            TB No *
          </label>

          <input
            type="text"
            value={tb.slNo}
            onChange={(e) =>
              setTb((prev) => ({
                ...prev,
                slNo: e.target.value,
              }))
            }
            placeholder="1"
            className="w-full p-3 py-2 bg-gray-100 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-400"
          />

        </div>


        {/* CHAPTER */}

        <div>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chapter / Article
          </label>

          <input
            type="text"
            value={tb.chapter}
            onChange={(e) =>
              setTb((prev) => ({
                ...prev,
                chapter: e.target.value,
              }))
            }
            placeholder="24.1, 24.4..."
            className="w-full p-3 py-2 bg-gray-100 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-400"
          />

        </div>


        {/* ADD BUTTON */}

        <button
          type="button"
          onClick={handleAdd}
          className="h-[48px] px-6 text-sm bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all"
        >
          Add Details
        </button>

      </div>

    </div>

  );
}