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

  const hasAnyPart = experiments.some(e => e.part === "A" || e.part === "B");
  const partA = experiments.filter(e => e.part === "A" || !e.part);
  const partB = experiments.filter(e => e.part === "B");

  // Header row
  const headerRow = new TableRow({
    children: [
      new TableCell({
        borders: BORDER,
        shading: { fill: "E6E6E6" },
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ text: "Sl. No.", bold: true, alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        borders: BORDER,
        shading: { fill: "E6E6E6" },
        width: { size: 85, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ text: "Experiments", bold: true, alignment: AlignmentType.CENTER })],
      }),
    ],
  });

  // Part label row (Part A / Part B)
  function buildPartLabelRow(label) {
    return new TableRow({
      children: [
        new TableCell({
          borders: BORDER,
          columnSpan: 2,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: label, bold: true })],
            }),
          ],
        }),
      ],
    });
  }

  // Data rows for a set of experiments
  function buildDataRows(exps) {
    return exps.map(exp =>
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
          }),
        ],
      })
    );
  }

  // Build table rows based on hasParts
  const tableRows = hasAnyPart
    ? [
        headerRow,
        ...(partA.length > 0 ? [buildPartLabelRow("Part A"), ...buildDataRows(partA)] : []),
        ...(partB.length > 0 ? [buildPartLabelRow("Part B"), ...buildDataRows(partB)] : []),
      ]
    : [
        headerRow,
        ...buildDataRows(experiments),
      ];

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({ text: "PRACTICAL COMPONENT OF IPCC", bold: true }),
      ],
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    }),
  ];
}

module.exports = { buildPracticalTable };
