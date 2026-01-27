const {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  AlignmentType,
  ShadingType,
  WidthType,
  BorderStyle,
} = require("docx");

const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 6 },
  bottom: { style: BorderStyle.SINGLE, size: 6 },
  left: { style: BorderStyle.SINGLE, size: 6 },
  right: { style: BorderStyle.SINGLE, size: 6 },
};

function calculateAverage(values = []) {
  const valid = values.filter(v => typeof v === "number" && v > 0);
  if (!valid.length) return "";
  return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
}
function hasAnyCopoValue(rows = []) {
  return rows.some(row =>
    [...(row.vals || []), ...(row.pso || [])].some(v => Number(v) > 0)
  );
}


function buildCopoTable(copo) {
  if (!copo || !Array.isArray(copo.rows) || copo.rows.length === 0) return [];

  const poCount = copo.headers.length;
  const psoCount = copo.rows[0]?.pso?.length || 0;

  const headers = [
    "CO",
    ...copo.headers,
    ...Array.from({ length: psoCount }, (_, i) => `PSO${i + 1}`),
  ];

  // 🔹 NORMAL ROWS (NO FILTERING)
  const rows = copo.rows.map(row =>
    new TableRow({
      children: [
        new TableCell({
          borders: BORDER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun(row.co)],
            }),
          ],
        }),

        ...(row.vals || []).map(v =>
          new TableCell({
            borders: BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun(String(v || ""))],
              }),
            ],
          })
        ),

        ...(row.pso || []).map(v =>
          new TableCell({
            borders: BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun(String(v || ""))],
              }),
            ],
          })
        ),
      ],
    })
  );

  // 🔹 AVG ROW
  const avgRow = new TableRow({
    children: [
      new TableCell({
        borders: BORDER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "AVG", bold: true })],
          }),
        ],
      }),

      ...Array.from({ length: poCount }, (_, i) =>
        new TableCell({
          borders: BORDER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun(
                  calculateAverage(copo.rows.map(r => Number(r.vals?.[i])))
                ),
              ],
            }),
          ],
        })
      ),

      ...Array.from({ length: psoCount }, (_, i) =>
        new TableCell({
          borders: BORDER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun(
                  calculateAverage(copo.rows.map(r => Number(r.pso?.[i])))
                ),
              ],
            }),
          ],
        })
      ),
    ],
  });

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
          text: "CO–PO–PSO Mapping",
          bold: true,
          size: 28,
        }),
      ],
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // 🔹 HEADER ROW
        new TableRow({
          children: headers.map(h =>
            new TableCell({
              borders: BORDER,
              shading: { fill: "C4C2C2", type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: h, bold: true })],
                }),
              ],
            })
          ),
        }),

        ...rows,
        avgRow,
      ],
    }),
  ];
}


module.exports = { buildCopoTable };
