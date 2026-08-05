const {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
 AlignmentType,
  BorderStyle,
  ShadingType,
} = require("docx");

const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 6 },
  bottom: { style: BorderStyle.SINGLE, size: 6 },
  left: { style: BorderStyle.SINGLE, size: 6 },
  right: { style: BorderStyle.SINGLE, size: 6 },
};

function headingRow(text) {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: BORDER,
        shading: {
          fill: "D9D9D9",
          type: ShadingType.CLEAR,
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text,
                bold: true,
                size: 24,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function headerRow() {
  return new TableRow({
    children: [
      new TableCell({
        borders: BORDER,
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Sl.No.", bold: true })],
          }),
        ],
      }),
      new TableCell({
        borders: BORDER,
        width: { size: 65, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Activity", bold: true })],
          }),
        ],
      }),
      new TableCell({
        borders: BORDER,
        width: { size: 20, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Hours / Semester",
                bold: true,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function dataRows(items = []) {
  return items
    .filter(i => i.activity || i.hours)
    .map((item, index) =>
      new TableRow({
        children: [
          new TableCell({
            borders: BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun(String(index + 1)),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: BORDER,
            children: [
              new Paragraph({
                children: [
                  new TextRun(item.activity || "-"),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: BORDER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun(item.hours || "-"),
                ],
              }),
            ],
          }),
        ],
      })
    );
}

function buildTwSlTable(termWork = [], selfLearning = []) {

  const rows = [

    headingRow("Term Work and Self Learning"),

    headingRow("Term Work (TW)"),

    headerRow(),

    ...dataRows(termWork),

    headingRow("Self Learning (SL)"),

    headerRow(),

    ...dataRows(selfLearning),
  ];

  return [
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows,
    }),
  ];
}

module.exports = { buildTwSlTable };