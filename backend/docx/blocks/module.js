const {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
} = require("docx");

const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 6 },
  bottom: { style: BorderStyle.SINGLE, size: 6 },
  left: { style: BorderStyle.SINGLE, size: 6 },
  right: { style: BorderStyle.SINGLE, size: 6 },
};

function buildModules(modules = []) {
  const blocks = [];

  if (modules.length > 0) {
    blocks.push(
      new Paragraph({
        spacing: {
          before: 100, // 👈 controls gap above all modules
          after: 0,
        },
      })
    );
  }

  modules.forEach((mod, i) => {
    blocks.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // TITLE
          new TableRow({
            children: [
              new TableCell({
                borders: BORDER,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Module ${i + 1}`,
                        bold: true,
                        size:28
                      }),
                    ],
                  }),
                ],
                margins:{
                    left:80,
                    right:80,
                    top:20
                }
              }),
            ],
          }),

          // CONTENT
          new TableRow({
            children: [
              new TableCell({
                borders: BORDER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.JUSTIFIED,
                    children: [new TextRun(mod.content || "")],
                  }),
                ],
                margins:{
                    left:80,
                    right:80,
                }
              }),
            ],
          }),

          // META
          new TableRow({
  children: [
    new TableCell({
      borders: BORDER,
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: `Textbook ${mod.textbook || "-"}`,
              bold: true,
            }),

            new TextRun({ text: "\t" }),

            new TextRun({
              text: `RBT: ${mod.rbt || "-"}`,
              bold: true,
            }),

            new TextRun({ text: "\t" }),

            new TextRun({
              text: `WK: ${mod.wkt || "-"}`,
              bold: true,
            }),
          ],

          // ✅ TAB STOPS MUST BE HERE
          tabStops: [
            { type: "left", position: 0 },       // REQUIRED
            { type: "center", position: 5200 },  // RBT
            { type: "right", position: 9020 },   // WK
          ],

          spacing: {
            before: 0,
            after: 0,
          },
        }),
      ],
      margins:{
        left:80,
        right:80,
    }
    }),
  ],
})

        ],
      })
    );
  });

  return blocks;
}

module.exports = { buildModules };
