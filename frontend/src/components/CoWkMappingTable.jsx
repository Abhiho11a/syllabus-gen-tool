import React from "react";

export default function CowkMappingTable({
  formData,
  setFormData,
}) {

  const cowkMapping = formData.cowkMapping || {
    headers: [
      "WK1",
      "WK2",
      "WK3",
      "WK4",
      "WK5",
      "WK6",
      "WK7",
      "WK8",
      "WK9",
    ],

    rows: [
      {
        co: "CO1",
        vals: ["", "", "", "", "", "", "", "", ""],
      },
    ],
  };


  // =====================================================
  // ADD WK COLUMN
  // =====================================================

  const addWkCol = () => {

    setFormData((prev) => {

      const currentHeaders =
        prev.cowkMapping?.headers || [];

      const currentRows =
        prev.cowkMapping?.rows || [];

      const newWkNumber =
        currentHeaders.length + 1;

      return {

        ...prev,

        cowkMapping: {

          ...prev.cowkMapping,

          headers: [
            ...currentHeaders,
            `WK${newWkNumber}`,
          ],

          rows: currentRows.map((row) => ({
            ...row,

            vals: [
              ...(row.vals || []),
              "",
            ],

          })),

        },

      };

    });

  };


  // =====================================================
  // REMOVE WK COLUMN
  // =====================================================

  const removeWkCol = () => {

    const currentHeaders =
      formData.cowkMapping?.headers || [];

    if (currentHeaders.length <= 1) {

      alert(
        "At least one WK column is required."
      );

      return;
    }


    setFormData((prev) => ({

      ...prev,

      cowkMapping: {

        ...prev.cowkMapping,

        headers:
          prev.cowkMapping.headers.slice(0, -1),

        rows:
          prev.cowkMapping.rows.map((row) => ({

            ...row,

            vals:
              row.vals.slice(0, -1),

          })),

      },

    }));

  };


  // =====================================================
  // ADD CO ROW
  // =====================================================

  const addCoRow = () => {

    setFormData((prev) => {

      const rows =
        prev.cowkMapping?.rows || [];

      const headers =
        prev.cowkMapping?.headers || [];

      const newCoNumber =
        rows.length + 1;


      const newRow = {

        co: `CO${newCoNumber}`,

        vals:
          Array(headers.length).fill(""),

      };


      return {

        ...prev,

        cowkMapping: {

          ...prev.cowkMapping,

          rows: [
            ...rows,
            newRow,
          ],

        },

      };

    });

  };


  // =====================================================
  // REMOVE CO ROW
  // =====================================================

  const removeCoRow = () => {

    const currentRows =
      formData.cowkMapping?.rows || [];

    if (currentRows.length <= 1) {

      alert(
        "At least one CO row is required."
      );

      return;
    }


    setFormData((prev) => ({

      ...prev,

      cowkMapping: {

        ...prev.cowkMapping,

        rows:
          prev.cowkMapping.rows.slice(0, -1),

      },

    }));

  };


  // =====================================================
  // UPDATE WK VALUE
  // =====================================================

  const updateValue = (
    rowIndex,
    colIndex,
    value
  ) => {

    setFormData((prev) => {

      const updatedRows =
        prev.cowkMapping.rows.map(
          (row, index) => {

            if (index !== rowIndex) {
              return row;
            }

            const updatedVals = [
              ...(row.vals || []),
            ];

            updatedVals[colIndex] =
              value;

            return {
              ...row,
              vals: updatedVals,
            };

          }
        );


      return {

        ...prev,

        cowkMapping: {

          ...prev.cowkMapping,

          rows: updatedRows,

        },

      };

    });

  };


  return (

    <div className="mt-12">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="border-b pb-2 mb-4">

        <h3 className="text-lg font-semibold text-slate-700">

          CO - WK Mapping Table

        </h3>

        {/* <p className="text-xs text-slate-500 mt-1">

          Mapping of COs with Knowledge and
          Attitude Profile (WK)

        </p>

        <p className="text-xs text-slate-500 mt-1">

          Strength of correlation:
          <span className="font-medium">
            {" "}Strongly related-3
          </span>,
          <span className="font-medium">
            {" "}Moderately related-2
          </span>,
          <span className="font-medium">
            {" "}Weakly related-1
          </span>,
          <span className="font-medium">
            {" "}Not related-0
          </span>

        </p> */}

      </div>


      {/* ================================================= */}
      {/* BUTTONS */}
      {/* ================================================= */}

      <div className="flex flex-col md:flex-row gap-5 my-4 justify-between text-xs">

        {/* CO BUTTONS */}

        <div className="flex gap-3">

          <button
            type="button"
            onClick={addCoRow}
            className="border rounded-md cursor-pointer border-transparent px-4 py-2 text-white bg-slate-600 hover:bg-slate-700 transition-colors"
          >
            Add CO
          </button>

          <button
            type="button"
            onClick={removeCoRow}
            className="border rounded-md cursor-pointer border-transparent px-4 py-2 text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Remove CO
          </button>

        </div>


        {/* WK BUTTONS */}

        <div className="flex gap-3">

          <button
            type="button"
            onClick={addWkCol}
            className="border rounded-md cursor-pointer border-transparent px-4 py-2 text-white bg-slate-600 hover:bg-slate-700 transition-colors"
          >
            Add WK
          </button>

          <button
            type="button"
            onClick={removeWkCol}
            className="border rounded-md cursor-pointer border-transparent px-4 py-2 text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Remove WK
          </button>

        </div>

      </div>


      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm mt-4">

        <table className="w-full text-center border-collapse bg-white">

          <thead className="bg-slate-100">

            <tr>

              <th className="border border-slate-200 p-3 font-semibold text-slate-700">

                CO

              </th>


              {cowkMapping.headers.map(
                (header, index) => (

                  <th
                    key={index}
                    className="border border-slate-200 p-3 font-semibold text-slate-700"
                  >

                    {header}

                  </th>

                )
              )}

            </tr>

          </thead>


          <tbody>

            {cowkMapping.rows.map(
              (row, rowIndex) => (

                <tr
                  key={rowIndex}
                  className="hover:bg-slate-50 transition-colors"
                >

                  {/* CO */}

                  <td className="border border-slate-200 p-2 font-bold text-slate-600 bg-slate-50">

                    {row.co}

                  </td>


                  {/* WK VALUES */}

                  {cowkMapping.headers.map(
                    (_, colIndex) => (

                      <td
                        key={colIndex}
                        className="border border-slate-200 p-1"
                      >

                        <input
                          type="number"
                          min="0"
                          max="3"
                          value={
                            row.vals?.[colIndex] || ""
                          }
                          onChange={(e) =>
                            updateValue(
                              rowIndex,
                              colIndex,
                              e.target.value
                            )
                          }
                          className="w-12 md:w-16 text-center border outline-none rounded-md p-1.5 focus:ring-2 focus:ring-indigo-400 mx-auto block"
                        />

                      </td>

                    )
                  )}

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>

  );
}