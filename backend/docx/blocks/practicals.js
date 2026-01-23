const {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
} = require("docx");

const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 6 },
  bottom: { style: BorderStyle.SINGLE, size: 6 },
  left: { style: BorderStyle.SINGLE, size: 6 },
  right: { style: BorderStyle.SINGLE, size: 6 },
};

function buildPracticalTable(experiments = []) {
  if (!experiments.length) return [];

  return [
    // 🔹 Section title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
          text: "PRACTICAL COMPONENT OF IPCC",
          bold: true,
        }),
      ],
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // HEADER
        new TableRow({
          children: [
            new TableCell({
              borders: BORDER,
              shading:{fill:"E6E6E6"},
              width: { size: 15, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  text: "Sl. No.",
                  bold: true,
                  alignment: AlignmentType.CENTER,
                }),
            ],
        }),
        new TableCell({
            borders: BORDER,
              shading:{fill:"E6E6E6"},
              width: { size: 85, type: WidthType.PERCENTAGE },
              children: [
                  new Paragraph({
                    text: "Experiments",
                    bold: true,
                    alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),

        // DATA ROWS
        ...experiments.map((exp) =>
          new TableRow({
            children: [
              new TableCell({
                borders: BORDER,
                children: [
                  new Paragraph({
                    text: String(exp.slno || "-"),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                borders: BORDER,
                children: [
                  new Paragraph({
                    text: exp.cont || "-",
                    alignment: AlignmentType.JUSTIFIED,
                  }),
                ],
              }),
            ],
          })
        ),
      ],
    }),
  ];
}

module.exports = { buildPracticalTable };
