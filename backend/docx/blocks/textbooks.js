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

function buildTextbooksTable(textbooks = []) {
  if (!textbooks.length) return [];

  return [
    // 🔹 Section title
    new Paragraph({
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
          text: "Textbooks",
          bold: true,
          size: 28,
        }),
      ],
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // HEADER
        new TableRow({
          children: ["Sl.No", "Author", "Book Title", "Publisher", "Year"].map(
            (h) =>
              new TableCell({
                borders: BORDER,
                shading:{fill:"E6E6E6"},
                children: [
                  new Paragraph({
                    text: h,
                    bold: true,
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              })
          ),
        }),

        // DATA ROWS
        ...textbooks.map((tb) =>
          new TableRow({
            children: [
              tb.slNo,
              tb.author,
              tb.bookTitle,
              tb.publisher,
              tb.year,
            ].map(
              (val) =>
                new TableCell({
                  borders: BORDER,
                  children: [
                    new Paragraph({
                      text: String(val || "-"),
                      alignment:"center"
                    }),
                  ],
                })
            ),
          })
        ),
      ],
    }),
  ];
}

module.exports = { buildTextbooksTable };
