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
// CHECK WHETHER AT LEAST ONE WK VALUE EXISTS
// =========================================================

function hasAnyCowkValue(rows = []) {
  return rows.some(row =>
    Array.isArray(row?.vals) &&
    row.vals.some(value =>
      String(value ?? "").trim() !== ""
    )
  );
}


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

function valueCell(text) {
  return new TableCell({
    borders: BORDER,

    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,

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
// BUILD CO-WK TABLE
// =========================================================

function buildCowkTable(cowk = {}) {

  if (!cowk || typeof cowk !== "object") {
    return [];
  }

  const headers = Array.isArray(cowk.headers)
    ? cowk.headers
    : [];

  const rows = Array.isArray(cowk.rows)
    ? cowk.rows
    : [];


  // =========================================================
  // NO HEADERS / NO ROWS
  // =========================================================

  if (
    headers.length === 0 ||
    rows.length === 0
  ) {
    return [];
  }


  // =========================================================
  // IMPORTANT:
  // DON'T DISPLAY TABLE IF ALL WK INPUTS ARE EMPTY
  // =========================================================

  if (!hasAnyCowkValue(rows)) {
    return [];
  }


  // =========================================================
  // VALID ROWS
  // =========================================================

  const validRows = rows.filter(row =>
    row &&
    String(row.co ?? "").trim() !== ""
  );

  if (validRows.length === 0) {
    return [];
  }


  // =========================================================
  // TABLE HEADER
  // =========================================================

  const headerRow = new TableRow({
    children: [
      headerCell("CO"),

      ...headers.map(header =>
        headerCell(header)
      ),
    ],
  });


  // =========================================================
  // DATA ROWS
  // =========================================================

  const dataRows = validRows.map(row => {

    const values = Array.isArray(row.vals)
      ? row.vals
      : [];

    return new TableRow({
      children: [
        valueCell(row.co),

        ...headers.map((_, index) =>
          valueCell(values[index] ?? "")
        ),
      ],
    });

  });


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
          text: "CO - WK Mapping",
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
  buildCowkTable,
};