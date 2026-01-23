const {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  AlignmentType,
  ShadingType,
  WidthType,
} = require("docx");

function buildCopoTable(copo) {
  if (!copo || !Array.isArray(copo.rows)) return [];

  const headers = ["CO", ...copo.headers, ...copo.rows[0].pso.map((_, i) => `PSO${i+1}`)];

  const rows = copo.rows.map(row =>
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(row.co)] }),
        ...[...(row.vals||[]), ...(row.pso||[])].map(v =>
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun(String(v||""))],
              }),
            ],
          })
        ),
      ],
    })
  );

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 150 },
      children: [new TextRun({ text: "CO–PO–PSO Mapping", bold: true,size:28 })],
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: headers.map(h =>
            new TableCell({
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
      ],
    }),
  ];
}

module.exports = { buildCopoTable };
