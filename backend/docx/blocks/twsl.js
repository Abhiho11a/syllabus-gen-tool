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

function sectionRow(text) {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: BORDER,
        shading: {
          fill: "EFEFEF",
          type: ShadingType.CLEAR,
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
                size: 22,
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
    .filter(item =>
      String(item?.activity || "").trim() ||
      String(item?.hours || "").trim()
    )
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

  const validTW = (termWork || []).filter(item =>
    String(item?.activity || "").trim() ||
    String(item?.hours || "").trim()
  );

  const validSL = (selfLearning || []).filter(item =>
    String(item?.activity || "").trim() ||
    String(item?.hours || "").trim()
  );

  // Nothing to show
  if (!validTW.length && !validSL.length) {
    return [];
  }

  const rows = [];

  // Main Heading
  rows.push(
    headingRow("Term Work and Self Learning")
  );

  // Common header (only once)
  rows.push(headerRow());

  // ---------- TERM WORK ----------
  if (validTW.length > 0) {
    rows.push(sectionRow("Term Work (TW)"));
    rows.push(...dataRows(validTW));
  }

  // ---------- SELF LEARNING ----------
  if (validSL.length > 0) {
    rows.push(sectionRow("Self Learning (SL)"));
    rows.push(...dataRows(validSL));
  }

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