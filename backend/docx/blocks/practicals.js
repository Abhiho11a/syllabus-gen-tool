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

function buildFormattedMultilineText(text = "") {
  const lines = text.split("\n");
  const runs = [];

  lines.forEach((line, lineIndex) => {
    // Split bold parts
    const parts = line.split(/(\*\*.*?\*\*)/g);

    parts.forEach((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        runs.push(
          new TextRun({
            text: part.slice(2, -2),
            bold: true,
          })
        );
      } else {
        runs.push(
          new TextRun({
            text: part,
          })
        );
      }
    });

    // Add line break (except last line)
    if (lineIndex !== lines.length - 1) {
      runs.push(new TextRun({ break: 1 }));
    }
  });

  return runs;
}



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
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 0 },
      children: buildFormattedMultilineText(exp.cont || "-"),
    }),
  ],
})

            ],
          })
        ),
      ],
    }),
  ];
}

module.exports = { buildPracticalTable };
