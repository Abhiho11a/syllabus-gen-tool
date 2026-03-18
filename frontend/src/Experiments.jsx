import { useState } from "react";
import { Plus, Check, X, Edit2, Trash2 } from "lucide-react";

export default function ExperimentsSection({
  formData,
  setFormData,
  hasParts,
  setHasParts,
  newExpNo,
  setNewExpNo,
  newExpCont,
  setNewExpCont,
  newExpPart,
  setNewExpPart,
  editingExpIndex,
  setEditingExpIndex,
  editExpNo,
  setEditExpNo,
  editExpCont,
  setEditExpCont,
  editExpPart,
  setEditExpPart,
}) {

  function addNewExperiment() {
    if (!newExpNo || !newExpCont.trim()) return;
    const newExp = {
      slno: newExpNo,
      cont: newExpCont.trim(),
      part: hasParts ? newExpPart : null,
    };
    setFormData((prev) => ({
      ...prev,
      experiments: [...(prev.experiments || []), newExp],
    }));
    setNewExpNo("");
    setNewExpCont("");
    setNewExpPart("A");
  }

  function startEditExperiment(idx) {
    const exp = formData.experiments[idx];
    setEditingExpIndex(idx);
    setEditExpNo(exp.slno);
    setEditExpCont(exp.cont);
    setEditExpPart(exp.part ?? "A");
  }

  function saveEditExperiment() {
    const updated = formData.experiments.map((exp, idx) =>
      idx === editingExpIndex
        ? { slno: editExpNo, cont: editExpCont, part: hasParts ? editExpPart : null }
        : exp
    );
    setFormData((prev) => ({ ...prev, experiments: updated }));
    setEditingExpIndex(null);
  }

  function cancelEditExperiment() {
    setEditingExpIndex(null);
  }

  function handleDeleteExperiment(idx) {
    setFormData((prev) => ({
      ...prev,
      experiments: prev.experiments.filter((_, i) => i !== idx),
    }));
  }

  // When hasParts is toggled off, strip part info
  function handleToggleParts(e) {
    setHasParts(e.target.checked);
    if (!e.target.checked) {
      setFormData((prev) => ({
        ...prev,
        experiments: (prev.experiments || []).map((exp) => ({
          ...exp,
          part: null,
        })),
      }));
    }
  }

  const experiments = formData.experiments || [];
  const partAExps = experiments.filter((e) => e.part === "A");
  const partBExps = experiments.filter((e) => e.part === "B");

  // Reusable table renderer
  function renderTable(exps, partOffset = 0) {
    return (
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-700 text-white">
            <th className="px-4 py-3 text-left font-semibold w-20 border-r border-slate-500">
              Sl No
            </th>
            <th className="px-4 py-3 text-left font-semibold border-r border-slate-500">
              Experiment
            </th>
            {hasParts && (
              <th className="px-4 py-3 text-center font-semibold w-24 border-r border-slate-500">
                Part
              </th>
            )}
            <th className="px-4 py-3 text-center font-semibold w-32">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {exps.map((exp) => {
            // find real index in full experiments array for editing/deleting
            const realIdx = experiments.indexOf(exp);
            return (
              <tr
                key={exp.slno + "-" + realIdx}
                className={`border-b border-gray-200 transition ${
                  realIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                {editingExpIndex === realIdx ? (
                  <>
                    {/* EDIT MODE */}
                    <td className="px-4 py-3 border-r border-gray-200">
                      <input
                        type="number"
                        value={editExpNo}
                        onChange={(e) => setEditExpNo(Number(e.target.value))}
                        className="w-16 px-2 py-1 border-2 border-blue-400 rounded focus:outline-none"
                      />
                    </td>

                    <td className="px-4 py-3 border-r border-gray-200">
                      <textarea
                        value={editExpCont}
                        onChange={(e) => setEditExpCont(e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 border-2 border-blue-400 rounded focus:outline-none resize-none"
                      />
                    </td>

                    {hasParts && (
                      <td className="px-4 py-3 border-r border-gray-200">
                        <select
                          value={editExpPart}
                          onChange={(e) => setEditExpPart(e.target.value)}
                          className="px-2 py-1 border-2 border-blue-400 rounded focus:outline-none"
                        >
                          <option value="A">Part A</option>
                          <option value="B">Part B</option>
                        </select>
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={saveEditExperiment}
                          className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditExperiment}
                          className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    {/* VIEW MODE */}
                    <td className="px-4 py-3 text-center font-semibold text-gray-700 border-r border-gray-200">
                      {exp.slno}
                    </td>

                    <td className="px-4 py-3 text-gray-700 leading-relaxed border-r border-gray-200 whitespace-pre-line">
                      {exp.cont}
                    </td>

                    {hasParts && (
                      <td className="px-4 py-3 text-center border-r border-gray-200">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            exp.part === "A"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          Part {exp.part}
                        </span>
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditExperiment(realIdx)}
                          className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperiment(realIdx)}
                          className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className="my-10 py-3 px-5 border-2 border-gray-200 bg-white">
      <label className="text-sm font-semibold text-slate-600">Experiments</label>

      {/* ── Has Parts Toggle ── */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <label className="text-sm font-semibold text-slate-600">
          Has Parts (Part A / Part B)?
        </label>
        <input
          type="checkbox"
          checked={hasParts}
          onChange={handleToggleParts}
          className="w-4 h-4 cursor-pointer accent-blue-600"
        />
      </div>

      {/* ── Add Experiment Form ── */}
      <div className="mt-2 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">
          Add New Experiment
        </h3>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="number"
            placeholder="Sl No."
            value={newExpNo}
            onChange={(e) => setNewExpNo(Number(e.target.value))}
            className="w-full md:w-24 px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:border-blue-500 transition"
          />

          <textarea
            placeholder="Enter Experiment Description..."
            value={newExpCont}
            onChange={(e) => setNewExpCont(e.target.value)}
            rows={1}
            className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:border-blue-500 transition resize-none"
          />

          {/* Part selector — only shown when hasParts is true */}
          {hasParts && (
            <select
              value={newExpPart}
              onChange={(e) => setNewExpPart(e.target.value)}
              className="w-full md:w-32 px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:border-blue-500 transition bg-white"
            >
              <option value="A">Part A</option>
              <option value="B">Part B</option>
            </select>
          )}

          <button
            type="button"
            onClick={addNewExperiment}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium whitespace-nowrap"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      {/* ── Experiments Table ── */}
      {experiments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No experiments added yet</p>
          <p className="text-sm mt-2">Add your first experiment using the form above</p>
        </div>
      ) : hasParts ? (
        // ── PARTS MODE: Show Part A then Part B ──
        <div className="space-y-8">

          {/* Part A */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
                Part A
              </span>
              {/* <span className="text-xs text-gray-400">
                {partAExps.length} experiment{partAExps.length !== 1 ? "s" : ""}
              </span> */}
            </div>
            {partAExps.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 pl-2">
                No Part A experiments added yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                {renderTable(partAExps)}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t-2 border-dashed border-gray-200" />

          {/* Part B */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
                Part B
              </span>
              {/* <span className="text-xs text-gray-400">
                {partBExps.length} experiment{partBExps.length !== 1 ? "s" : ""}
              </span> */}
            </div>
            {partBExps.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 pl-2">
                No Part B experiments added yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                {renderTable(partBExps)}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ── NO PARTS MODE: Single table ──
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          {renderTable(experiments)}
        </div>
      )}
    </div>
  );
}