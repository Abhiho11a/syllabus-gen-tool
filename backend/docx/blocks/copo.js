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

  if (!hasAnyCopoValue(copo.rows)) {
    return [];
  }

  // 🔹 filter rows with at least one value
  const validRows = copo.rows.filter(r =>
    [...(r.vals || []), ...(r.pso || [])].some(v => Number(v) > 0)
  );

  if (!validRows.length) return [];

  // 🔹 valid PO indexes
  const validPOIndexes = copo.headers
    .map((_, i) => validRows.some(r => Number(r.vals?.[i]) > 0) ? i : -1)
    .filter(i => i !== -1);

  // 🔹 valid PSO indexes
  const psoCount = validRows[0]?.pso?.length || 0;
  const validPSOIndexes = Array.from({ length: psoCount })
    .map((_, i) => validRows.some(r => Number(r.pso?.[i]) > 0) ? i : -1)
    .filter(i => i !== -1);

  const headers = [
    "CO",
    ...validPOIndexes.map(i => copo.headers[i]),
    ...validPSOIndexes.map(i => `PSO${i + 1}`),
  ];

  const rows = validRows.map(row =>
    new TableRow({
      children: [
        new TableCell({
          borders: BORDER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(row.co)] })],
        }),
        ...validPOIndexes.map(i =>
          new TableCell({
            borders: BORDER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(String(row.vals?.[i] || ""))] })],
          })
        ),
        ...validPSOIndexes.map(i =>
          new TableCell({
            borders: BORDER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(String(row.pso?.[i] || ""))] })],
          })
        ),
      ],
    })
  );

  const avgRow = new TableRow({
    children: [
      new TableCell({
        borders: BORDER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "AVG", bold: true })] })],
      }),
      ...validPOIndexes.map(i =>
        new TableCell({
          borders: BORDER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(calculateAverage(validRows.map(r => Number(r.vals?.[i]))))] })],
        })
      ),
      ...validPSOIndexes.map(i =>
        new TableCell({
          borders: BORDER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(calculateAverage(validRows.map(r => Number(r.pso?.[i]))))] })],
        })
      ),
    ],
  });

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 150 },
      children: [new TextRun({ text: "CO–PO–PSO Mapping", bold: true, size: 28 })],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: headers.map(h =>
            new TableCell({
              borders: BORDER,
              shading: { fill: "C4C2C2", type: ShadingType.CLEAR },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true })] })],
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
