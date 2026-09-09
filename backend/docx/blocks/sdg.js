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


// =========================================================
// HEADER CELL
// =========================================================

function headerCell(text) {
  return new TableCell({
    borders: BORDER,

    shading: {
      fill: "E6E6E6",
      type: ShadingType.CLEAR,
    },

    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,

        children: [
          new TextRun({
            text: String(text ?? ""),
            bold: true,
            size: 20,
          }),
        ],
      }),
    ],
  });
}


// =========================================================
// VALUE CELL
// =========================================================

function valueCell(text, alignment = AlignmentType.LEFT) {
  return new TableCell({
    borders: BORDER,

    children: [
      new Paragraph({
        alignment,

        children: [
          new TextRun({
            text: String(text ?? ""),
            size: 20,
          }),
        ],
      }),
    ],
  });
}


// =========================================================
// CHECK WHETHER SDG ROW HAS ANY DATA
// =========================================================

function hasSDGValue(row) {

  if (!row) return false;

  const goalNo = String(
    row.goalNo ?? ""
  ).trim();

  const goalTitle = String(
    row.goalTitle ?? ""
  ).trim();

  const description = String(
    row.description ?? ""
  ).trim();

  return Boolean(
    goalNo ||
    goalTitle ||
    description
  );
}


// =========================================================
// BUILD SDG TABLE
// =========================================================

function buildSDGTable(sdgs = []) {

  if (!Array.isArray(sdgs)) {
    return [];
  }


  // =========================================================
  // REMOVE COMPLETELY EMPTY ROWS
  // =========================================================

  const validSDGs = sdgs.filter(
    row => hasSDGValue(row)
  );


  // =========================================================
  // DON'T DISPLAY EMPTY SDG TABLE
  // =========================================================

  if (validSDGs.length === 0) {
    return [];
  }


  // =========================================================
  // HEADER
  // =========================================================

  const headerRow = new TableRow({
    children: [

      headerCell("Goal No."),

      headerCell("Goal Title"),

      headerCell("Description"),

    ],
  });


  // =========================================================
  // DATA ROWS
  // =========================================================

  const dataRows = validSDGs.map(row =>
    new TableRow({

      children: [

        valueCell(
          row.goalNo,
          AlignmentType.CENTER
        ),

        valueCell(
          row.goalTitle,
          AlignmentType.LEFT
        ),

        valueCell(
          row.description,
          AlignmentType.LEFT
        ),

      ],

    })
  );


  // =========================================================
  // RETURN DOCX BLOCK
  // =========================================================

  return [

    new Paragraph({
      alignment: AlignmentType.CENTER,

      spacing: {
        before: 300,
        after: 150,
      },

      children: [
        new TextRun({
          text: "Sustainable Development Goals (SDGs)",
          bold: true,
          size: 28,
        }),
      ],
    }),

    new Table({

      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },

      rows: [
        headerRow,
        ...dataRows,
      ],

    }),

  ];
}


module.exports = {
  buildSDGTable,
};