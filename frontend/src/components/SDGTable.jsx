import React from "react";

export default function SDGTable({
  formData,
  setFormData,
}) {

  const sdgs =
    formData.sdgs || [
      {
        goalNo: "",
        goalTitle: "",
        description: "",
      },
    ];


  // =====================================================
  // ADD SDG
  // =====================================================

  const addSDG = () => {

    setFormData((prev) => ({

      ...prev,

      sdgs: [

        ...(prev.sdgs || []),

        {
          goalNo: "",
          goalTitle: "",
          description: "",
        },

      ],

    }));

  };


  // =====================================================
  // REMOVE SDG
  // =====================================================

  const removeSDG = () => {

    const currentRows =
      formData.sdgs || [];

    if (currentRows.length <= 1) {

      alert(
        "At least one SDG row is required."
      );

      return;
    }


    setFormData((prev) => ({

      ...prev,

      sdgs:
        prev.sdgs.slice(0, -1),

    }));

  };


  // =====================================================
  // UPDATE SDG
  // =====================================================

  const updateSDG = (
    index,
    field,
    value
  ) => {

    setFormData((prev) => {

      const updated =
        [...(prev.sdgs || [])];

      updated[index] = {

        ...updated[index],

        [field]: value,

      };


      return {

        ...prev,

        sdgs: updated,

      };

    });

  };


  return (

    <div className="mt-12">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex justify-between items-center border-b pb-2 mb-4">

        <div>

          <h3 className="text-lg font-semibold text-slate-700">

            Sustainable Development Goals (SDGs)

          </h3>

          <p className="text-xs text-slate-500 mt-1">

            Add the Sustainable Development Goals
            associated with this course.

          </p>

        </div>

      </div>


      {/* ================================================= */}
      {/* BUTTONS */}
      {/* ================================================= */}

      <div className="flex gap-3 my-4">

        <button
          type="button"
          onClick={addSDG}
          className="border rounded-md cursor-pointer border-transparent px-4 py-2 text-white bg-slate-600 hover:bg-slate-700 transition-colors text-sm"
        >
          Add SDG
        </button>


        <button
          type="button"
          onClick={removeSDG}
          className="border rounded-md cursor-pointer border-transparent px-4 py-2 text-white bg-red-500 hover:bg-red-600 transition-colors text-sm"
        >
          Remove SDG
        </button>

      </div>


      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">

        <table className="w-full text-center border-collapse bg-white">

          <thead className="bg-slate-100">

            <tr>

              <th className="border border-slate-200 p-3 font-semibold text-slate-700 w-28">

                Goal No.

              </th>

              <th className="border border-slate-200 p-3 font-semibold text-slate-700">

                Goal Title

              </th>

              <th className="border border-slate-200 p-3 font-semibold text-slate-700">

                Description

              </th>

            </tr>

          </thead>


          <tbody>

            {sdgs.map(
              (item, index) => (

                <tr
                  key={index}
                  className="hover:bg-slate-50 transition-colors"
                >

                  {/* GOAL NO */}

                  <td className="border border-slate-200 p-2">

                    <input
                      type="text"
                      value={
                        item.goalNo || ""
                      }
                      placeholder="4"
                      onChange={(e) =>
                        updateSDG(
                          index,
                          "goalNo",
                          e.target.value
                        )
                      }
                      className="w-full text-center border rounded-md p-2 outline-none focus:ring-2 focus:ring-indigo-400"
                    />

                  </td>


                  {/* GOAL TITLE */}

                  <td className="border border-slate-200 p-2">

                    <input
                      type="text"
                      value={
                        item.goalTitle || ""
                      }
                      placeholder="Quality Education"
                      onChange={(e) =>
                        updateSDG(
                          index,
                          "goalTitle",
                          e.target.value
                        )
                      }
                      className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-indigo-400"
                    />

                  </td>


                  {/* DESCRIPTION */}

                  <td className="border border-slate-200 p-2">

                    <textarea
                      value={
                        item.description || ""
                      }
                      placeholder="Enter SDG description..."
                      rows={2}
                      onChange={(e) =>
                        updateSDG(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full border rounded-md p-2 outline-none resize-none focus:ring-2 focus:ring-indigo-400"
                    />

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>

  );
}