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

function hasValue(value) {
  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  );
}

function getTextbookDetails(mod) {
  if (!Array.isArray(mod?.textbooks)) return [];

  return mod.textbooks
    .filter(tb => tb && hasValue(tb.slNo) && hasValue(tb.chapter))
    .map(tb => {
      const slNo = hasValue(tb.slNo)
        ? `TB${String(tb.slNo).trim()}`
        : "";
      const chapter = hasValue(tb.chapter)
        ? `Ch-${String(tb.chapter).trim()}`
        : "";

      return [slNo, chapter].filter(Boolean).join(":");
    });
}

function hasRealModuleContent(mod) {
  if (!mod) return false;

  const hasContent =
    typeof mod.content === "string" &&
    mod.content.trim().length > 3;

  const hasTextbook =
    getTextbookDetails(mod).length > 0 ||
    hasValue(mod.textbook) ||
    hasValue(mod.chapter);

  const hasRBT = hasValue(mod.rbt);
  const hasWK = hasValue(mod.wkt);

  return hasContent || hasTextbook || hasRBT || hasWK;
}

function parseBoldText(text = "") {
  const parts = text.split(/(\*\*.*?\*\*)/g); 
  // splits but keeps **bold** parts

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return new TextRun({
        text: part.slice(2, -2), // remove **
        bold: true,
      });
    }

    return new TextRun({
      text: part,
    });
  });
}


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
    if (!hasRealModuleContent(mod)) return; // 🔥 THIS LINE FIXES EVERYTHING
    const textbookDetails = [
      ...getTextbookDetails(mod),
      ...(getTextbookDetails(mod).length === 0 &&
      (hasValue(mod.textbook) || hasValue(mod.chapter))
        ? [[
            hasValue(mod.textbook) ? String(mod.textbook).trim() : "",
            hasValue(mod.chapter) ? `Ch-${String(mod.chapter).trim()}` : "",
          ].filter(Boolean).join(":")]
        : []),
    ];
    const hasRBT = hasValue(mod.rbt);
    const hasWK = hasValue(mod.wkt);
    const metadataChildren = [];

    if (textbookDetails.length > 0) {
      metadataChildren.push(
        new TextRun({
          text: textbookDetails.join(" , "),
          bold: true,
        })
      );
    }
    if (textbookDetails.length > 0 && (hasRBT || hasWK)) {
      metadataChildren.push(new TextRun({ text: "\t" }));
    }
    if (hasRBT) {
      metadataChildren.push(
        new TextRun({
          text: `RBT: ${String(mod.rbt).trim()}`,
          bold: true,
        })
      );
    }
    if (hasWK) {
      if (hasRBT) {
        metadataChildren.push(new TextRun({ text: "\t" }));
      } else {
        metadataChildren.push(
          new TextRun({ text: "\t\t" })
        );
      }
      metadataChildren.push(
        new TextRun({
          text: `WK: ${String(mod.wkt).trim()}`,
          bold: true,
        })
      );
    }

    const rows = [
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
                children: parseBoldText(mod.content || ""),
              }),
            ],
            margins:{
                left:80,
                right:80,
            }
          }),
        ],
      }),
    ];

    if (metadataChildren.length > 0) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: BORDER,
              children: [
                new Paragraph({
                  children: metadataChildren,
                  tabStops: [
                    { type: "left", position: 0 },
                    { type: "center", position: 5200 },
                    { type: "right", position: 9020 },
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
      );
    }

    blocks.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      })
    );
  });

  return blocks;
}

module.exports = { buildModules };
