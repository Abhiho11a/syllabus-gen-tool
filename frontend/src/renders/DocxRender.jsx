import React, { useEffect } from "react";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Header,
  TabStopType
} from "docx";
import { saveAs } from "file-saver";

const RED = "CC0000";
const GRAY_BORDER = "A0A0A0";
const LIGHT_GRAY_HEADER = "E6E6E6";

export default function DocxRender({ courseData,strtDownload }) {
  // Normalize weird math alphabets

  const now = new Date();

const formattedDate = now.toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

  function normalizeMathText(str) {
    if (!str) return "";
    try {
      return String(str)
        .normalize("NFKD")
        .replace(/[\u{1D400}-\u{1D7FF}]/gu, (ch) =>
          ch.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
        )
        .replace(/\u00B2/g, "^2")
        .replace(/\u00B3/g, "^3");
    } catch {
      return String(str);
    }
  }

  // Add spacing around math symbols
  function sanitizeModuleText(text) {
  if (!text) return "";
  return String(text)
    .replace(/([=+\-/^])/g, " $1 ") // ❌ removed *
    .replace(/([()])/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();
}



  function shouldRenderModule(mod) {
    if (!mod) return false;
    return (
      (mod.title && String(mod.title).trim()) ||
      (mod.content && String(mod.content).trim())
    );
  }

  function shouldRenderTextbooks(arr) {
    if (!Array.isArray(arr)) return false;
    return arr.some(
      (tb) =>
        tb.slNo?.trim() ||
        tb.author?.trim() ||
        tb.bookTitle?.trim() ||
        tb.publisher?.trim()
    );
  }


  function parseBoldRunsFromStars(text) {
  const runs = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // normal text before **
    if (match.index > lastIndex) {
      runs.push(
        new TextRun({
          text: text.slice(lastIndex, match.index),
        })
      );
    }

    // bold text inside **
    runs.push(
      new TextRun({
        text: match[1],
        bold: true,
      })
    );

    lastIndex = regex.lastIndex;
  }

  // remaining normal text
  if (lastIndex < text.length) {
    runs.push(
      new TextRun({
        text: text.slice(lastIndex),
      })
    );
  }

  return runs;
}

const NO_BORDER = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
};


  // create box for web links
  // create box for web links
function createWebLinksBox(title, content) {
  const rawLines = String(content || "")
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  // 🔍 CLEAN COPY FOR CHECKING (same logic as PDF)
  const checkLines = rawLines.filter(line => {
    if (!line) return false;
    
    // Skip empty numbered lines like "1." "2."
    if (/^\d+\.\s*$/.test(line)) return false;
    
    // Skip "Add Web Links:" template
    if (/add web links/i.test(line)) return false;
    
    return true;
  });

  // 🚫 If no meaningful content → skip entire section
  if (checkLines.length === 0) {
    return [];
  }

  // 👇 DISPLAY LINES (filter same way)
  const displayLines = rawLines.filter(line => {
    if (!line) return false;
    if (/^\d+\.\s*$/.test(line)) return false;
    if (/add web links/i.test(line)) return false;
    return true;
  });

  if (displayLines.length === 0) {
    return [];
  }

  return [
    new Paragraph({
      spacing: { before: 200, after: 0 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 28,
        }),
      ],
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_BORDER,

      rows: [
        new TableRow({
          borders: NO_BORDER,

          children: [
            new TableCell({
              borders: NO_BORDER,

              children: displayLines.map(
                link =>
                  new Paragraph({
                    children: parseBoldRunsFromStars(link),
                    spacing: { before: 40, after: 40 },
                  })
              ),
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ spacing: { after: 300 } }),
  ];
}

  // ✨ CREATE BORDERED BOX (Objectives, TLP, Outcomes)
//   function createBorderedBox(title, content) {
//   const normalized = sanitizeModuleText(normalizeMathText(content || ""));

//   let lines = normalized
//     .split(/(?=\d+\.\s+)/)   // ✅ FIX
//     .map(s => s.trim())
//     .filter(Boolean);

//   return [
//     new Paragraph({
//       text: title,
//       alignment: AlignmentType.CENTER,
//       bold: true,
//       spacing: { before: 200, after: 200 },
//     }),

//     new Table({
//       width: { size: 100, type: WidthType.PERCENTAGE },
//       borders: {
//         top: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//         bottom: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//         left: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//         right: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//       },
//       rows: [
//         new TableRow({
//           children: [
//             new TableCell({
//               children: lines.map(
//                 line =>
//                   new Paragraph({
//                     children: parseBoldRuns(line),
//                     spacing: { before: 40, after: 40 }, // tighter spacing
//                   })
//               ),
//             }),
//           ],
//         }),
//       ],
//     }),

//     new Paragraph({ spacing: { after: 300 } }),
//   ];
// }

/////
// function createBorderedBox(title, content,defaultLine) {
//   const lines = String(content || "")
//   .split(/\n+/)
//   .map(s => s.trim())
//   .filter(line => {
//     if (!line) return false;                       // empty
//     if (/^\d+\.\s*$/.test(line)) return false;     // "1." "2."
// if (
//   defaultLine &&
//   line.replace(/\s+/g, " ").trim() ===
//   defaultLine.replace(/\s+/g, " ").trim()
// ) {
//   return false;
// }
//     return true;
//   });

// if (lines.length === 0) {
//   return []; // 🚀 NOTHING RENDERS
// }



//   return [
//     // 🔵 TITLE
//     // new Paragraph({
//     //   text: title,
//     //   bold: true,
//     //   // alignment: AlignmentType.CENTER,
//     //   spacing: { before: 100, after: 40 },
//     // }),
//     new Paragraph({
//   children: [
//     new TextRun({
//       text: title,
//       bold: true,
//       size: 28, // 👈 font size (28 = 14pt)
//     }),
//   ],
//   spacing: { before: 100, after: 40 },
// }),

//     // 🔼 TOP BORDER (THIS WAS MISSING)
//     // new Paragraph({
//     //   // border: {
//     //   //   top: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//     //   //   left: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//     //   //   right: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//     //   // },
//     //   spacing: { after: 0 },
//     // }),

//     // 📄 CONTENT
//     ...lines.map(line =>
//       new Paragraph({
//         children: parseBoldRuns(line),
//         spacing: { before: 0, after: 50 },
//         // border: {
//         //   left: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//         //   right: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//         // },
//       })
//     ),

//     // 🔽 BOTTOM BORDER
//     new Paragraph({
//       // border: {
//       //   bottom: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//       //   left: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//       //   right: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//       // },
//       spacing: { after: 30 },
//     }),
//   ];
// }

// const DEFAULT_TEMPLATES = [
//   "This course will enable the students to:",
//   "In addition to the traditional chalk and talk method, ICT tools are adopted:",
//   "Modern AI tools used for this course:",
//   "At the end of the course, the student will be able to:"
// ];


// function createBorderedBox(title, content) {
//   const rawLines = String(content || "")
//     .split(/\n+/)
//     .map(s => s.trim())
//     .filter(Boolean);

//   // 🔍 CLEAN COPY ONLY FOR CHECKING (PDF STYLE)
//   const checkLines = rawLines.filter(line => {
//     if (/^\d+\.\s*$/.test(line)) return false;

//     if (
//       DEFAULT_TEMPLATES.some(
//         tpl => line.toLowerCase() === tpl.toLowerCase()
//       )
//     ) {
//       return false;
//     }

//     return true;
//   });

//   // 🚫 IF NO MEANINGFUL CONTENT → SKIP EVERYTHING
//   if (checkLines.length === 0) {
//     return [];
//   }

//   // 👇 DISPLAY LINES (can still include defaults if you want)
//   const displayLines = rawLines.filter(
//     line => !/^\d+\.\s*$/.test(line)
//   );

//   return [
//     // 🔵 TITLE
//     new Paragraph({
//       children: [
//         new TextRun({
//           text: title+"ybh",
//           bold: true,
//           size: 28,
//         }),
//       ],
//       spacing: { before: 100, after: 40 },
//     }),

//     // 📄 CONTENT
//     ...displayLines.map(line =>
//       new Paragraph({
//         children: parseBoldRuns(line),
//         spacing: { before: 0, after: 50 },
//       })
//     ),

//     new Paragraph({ spacing: { after: 30 } }),
//   ];
// }

const DEFAULT_TEMPLATES = [
  "**This course will enable the students to:**",
  "**At the end of the course, the student will be able to:**",
  "**In addition to the traditional chalk and talk method, ICT tools are adopted:**",
  "**Modern AI tools used for this course:**",
  "**Add Web Links:**",
  "**Add Activity based learning points:**",
];

function createBorderedBox(title, content) {
  // Normalize content (same as PDF)
  content = normalizeMathText(String(content || ""));

  // 👇 USE ORIGINAL CONTENT FOR DISPLAY
  let parts = content
    .split("\n")
    .map(p => p.trim())
    .filter(Boolean);

  // 🔍 CLEAN COPY ONLY FOR CHECKING (exact same as PDF)
  const checkParts = content
    .split("\n")
    .map(p => p.trim())
    .filter(p => {
      if (!p) return false;

      // remove empty numbered points like "1."
      if (/^\d+\.\s*$/.test(p)) return false;

      // remove default template lines ONLY for checking
      if (
        DEFAULT_TEMPLATES.some(tpl =>
          p.toLowerCase() === tpl.toLowerCase()
        )
      ) {
        return false;
      }

      return true;
    });

  // 🚫 If no meaningful content → skip entire box
  if (checkParts.length === 0) {
    return [];
  }

  if (parts.length === 0) {
    return []; // 🚀 skip drawing box completely
  }

  // Filter out ONLY empty numbered lines from display (same as PDF)
  const displayLines = parts.filter(
    line => !/^\d+\.\s*$/.test(line)
  );

  if (displayLines.length === 0) {
    return [];
  }

  return [
    // 🔵 TITLE
    new Paragraph({
      children: [
        new TextRun({
          text: title, // removed "ybh"
          bold: true,
          size: 28,
        }),
      ],
      spacing: { before: 100, after: 40 },
    }),

    // 📄 CONTENT
    ...displayLines.map(line =>
      new Paragraph({
        children: parseBoldRunsFromStars(line),
        spacing: { before: 0, after: 50 },
      })
    ),

    new Paragraph({ spacing: { after: 30 } }),
  ];
}
  function parseBoldRuns(text) {
  const runs = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({
        text: text.slice(lastIndex, match.index),
      }));
    }

    runs.push(new TextRun({
      text: match[1],
      bold: true,
    }));

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({
      text: text.slice(lastIndex),
    }));
  }

  return runs;
}


//   // ✨ MODULE BOX (Border + Content + Horizontal Table)
//   function createModuleBox(title, content, meta) {
//     const normalized = sanitizeModuleText(normalizeMathText(content || ""));
//     const lines = normalized
//       .split(/\.(?:\s+|\n)|\n/)
//       .map((s) => s.trim())
//       .filter(Boolean);

//     return [
//       // 🔵 Title
//       new Paragraph({
//         text: title,
//         alignment: AlignmentType.CENTER,
//         bold: true,
//         spacing: { before: 200, after: 200 },
//       }),

//       // 🔳 CONTENT BOX
//       new Table({
//         width: { size: 100, type: WidthType.PERCENTAGE },
//         borders: {
//           top: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//           bottom: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//           left: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//           right: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//         },
//         rows: [
//           new TableRow({
//             children: [
//               new TableCell({
//                 children: lines.map(
//   (line) =>
//     new Paragraph({
//       children: parseBoldRuns(line),
//       alignment: AlignmentType.JUSTIFIED,
// spacing: {
//   before: 20,
//   after: 20,
//   line: 240,        // 👈 controls line height
//   lineRule: "auto", // 👈 Word-friendly
// },
//     })
// ),

//               }),
//             ],
//           }),
//         ],
//       }),

//       new Paragraph({ text: "", spacing: { after: 200 } }),

//       // 🔥 HORIZONTAL META TABLE (matches PDF)
//       new Table({
//         width: { size: 100, type: WidthType.PERCENTAGE },
//         borders: {
//           top: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//           bottom: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//           left: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//           right: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
//           insideHorizontal: {
//             style: BorderStyle.SINGLE,
//             size: 6,
//             color: GRAY_BORDER,
//           },
//           insideVertical: {
//             style: BorderStyle.SINGLE,
//             size: 6,
//             color: GRAY_BORDER,
//           },
//         },

//         rows: [
//           // header
//           new TableRow({
//             children: ["Text Book","Chapter","RBT","WK"].map(
//               (label) =>
//                 new TableCell({
//                   shading: { fill: MODULE_GRAY, type: ShadingType.CLEAR },
//                   children: [
//                     new Paragraph({
//                       text: label,
//                       alignment: AlignmentType.CENTER,
//                       bold: true,
//                     }),
//                   ],
//                 })
//             ),
//           }),

//           // values
//           new TableRow({
//             children: [
//               new TableCell({
//                 children: [new Paragraph(meta.textbook || "")],
//               }),
//               new TableCell({
//                 children: [new Paragraph(meta.chapter || "")],
//               }),
//               new TableCell({
//                 children: [new Paragraph(meta.rbt || "")],
//               }),
//               new TableCell({
//                 children: [new Paragraph(meta.wkt || "")],
//               }),
//             ],
//           }),
//         ],
//       }),

//       new Paragraph({ text: "", spacing: { after: 300 } }),
//     ];
//   }

//Modulebox 2nd version
function createModuleBlock(title, content, meta) {
  const normalized = sanitizeModuleText(normalizeMathText(content || ""));
  // const lines = normalized
  //   .split(/\n+/)
  //   .map(s => s.trim())
  //   .filter(Boolean);

  function normalizeNumberedLines(lines) {
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const isNumbered = /^\d+\.\s+/.test(line);

    if (!isNumbered && result.length > 0) {
      // 👇 continuation of previous numbered point
      result[result.length - 1] += " " + line;
    } else {
      result.push(line);
    }
  }

  return result;
}


  let lines = normalized
  .split(/\n+/)
  .map(s => s.trim())
  .filter(Boolean);

// 🔥 FIX: merge continuation lines
lines = normalizeNumberedLines(lines);


  return [
    // ─────────────── TOP SEPARATOR ───────────────
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
      },
      spacing: { after: 0 },
    }),
    

    // ─────────────── MODULE TITLE ───────────────
    new Paragraph({
      children: [
        new TextRun({ text: title, bold: true ,size:28}),
      ],
      // alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
    }),
    // ✅ LINE AFTER MODULE TITLE
new Paragraph({
  border: {
    bottom: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
  },
  spacing: { after: 0 },
}),


    // ─────────────── CONTENT ───────────────
//     ...lines.map(
//       (line) =>
//         new Paragraph({
//           children: parseBoldRuns(line),
//           alignment: AlignmentType.JUSTIFIED,
//           spacing: {
//   before: 0,
//   after: 0,
//   line: 200,
//   lineRule: "auto",
// },

//         })
//     ),
...lines.map(line => {
  const match = line.match(/^(\d+)\.\s+(.*)$/);

  if (match) {
    const number = match[1];
    const text = match[2];

    return new Paragraph({
      children: [
        new TextRun({ text: `${number}. ` }),
        ...parseBoldRuns(text),
      ],
      indent: {
        left: 720,        // total indent
        firstLine: -360,  // 👈 THIS IS THE FIX
      },
      alignment: AlignmentType.JUSTIFIED,
      spacing: {
        before: 0,
        after: 0,
        line: 200,
        lineRule: "auto",
      },
    });
  }

  return new Paragraph({
    children: parseBoldRuns(line),
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: 0,
      after: 0,
      line: 200,
      lineRule: "auto",
    },
  });
}),



    // ─────────────── BOTTOM SEPARATOR ───────────────
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
      },
      spacing: { before: 0, after: 120 },
    }),


    new Paragraph({
  children: [
    // LEFT → Textbook + Chapter (can wrap)
    new TextRun({
      text: `Textbook ${meta.textbook || ""}: ${meta.chapter || ""}`,
      bold: true,
    }),

    // TAB → jump to RBT column
    new TextRun({ text: "\t" }),

    // CENTER → RBT
    new TextRun({
      text: `RBT: ${meta.rbt || ""}`,
      bold: true,
    }),

    // TAB → jump to WK column
    new TextRun({ text: "\t" }),

    // RIGHT → WK
    new TextRun({
      text: `WK: ${meta.wkt || ""}`,
      bold: true,
    }),
  ],

  tabStops: [
    {
      type: "left",
      position: 0,        // Textbook starts at left
    },
    {
      type: "center",
      position: 5200,     // RBT column (tune if needed)
    },
    {
      type: "right",
      position: 9020,     // WK column (right margin)
    },
  ],

  spacing: {
    before: 0,
    after: 0,   // 👈 reduced spacing (you asked earlier)
  },
})

  ];
}


function allBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 6 },
    bottom: { style: BorderStyle.SINGLE, size: 6 },
    left: { style: BorderStyle.SINGLE, size: 6 },
    right: { style: BorderStyle.SINGLE, size: 6 },
  };
}


//Experiments Table
function createExperimentsTable(experiments = []) {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },

    rows: [
      // 🔹 HEADER ROW
      new TableRow({
        tableHeader: true, // 👈 repeats on every page
        children: [
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: {
              fill: "F0F0F0", // light grey like PDF
              type: ShadingType.CLEAR,
            },
            borders: allBorders(),
            children: [
              new Paragraph({
                text: "Sl. No.",
                bold: true,
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            width: { size: 90, type: WidthType.PERCENTAGE },
            shading: {
              fill: "F0F0F0",
              type: ShadingType.CLEAR,
            },
            borders: allBorders(),
            children: [
              new Paragraph({
                text: "Experiments",
                bold: true,
                alignment: AlignmentType.LEFT,
              }),
            ],
          }),
        ],
      }),

      // 🔹 DATA ROWS
      ...experiments.map((exp) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              borders: allBorders(),
              children: [
                new Paragraph({
                  text: String(exp.slno || ""),
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),

            new TableCell({
              width: { size: 90, type: WidthType.PERCENTAGE },
              borders: allBorders(),
              children: exp.cont
                .split("\n")
                .filter(Boolean)
                .map(
                  (line) =>
                    new Paragraph({
                      text: line.trim(),
                      alignment: AlignmentType.JUSTIFIED,
                      spacing: { after: 120 },
                    })
                ),
            }),
          ],
        })
      ),
    ],
  });
}
// function createExperimentsFakeTable(experiments = []) {
//   const blocks = [];

//   // ---------- HEADER ROW ----------
//   blocks.push(
//     new Paragraph({
//       children: [
//         new TextRun({ text: "Sl. No", bold: true }),
//         new TextRun({ text: "\t" }),
//         new TextRun({ text: "Experiments", bold: true }),
//       ],

//       tabStops: [
//         { type: "left", position: 0 },      // Sl.No
//         { type: "left", position: 1200 },   // Experiments
//       ],

//       shading: {
//         fill: "F0F0F0",
//         type: ShadingType.CLEAR,
//       },

//       border: {
//         top: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//         bottom: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//         left: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//         right: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//       },

//       spacing: { before: 100, after: 100 },
//     })
//   );

//   // ---------- DATA ROWS ----------
//   experiments.forEach(exp => {
//     blocks.push(
//       new Paragraph({
//         children: [
//           new TextRun({ text: String(exp.slno || "") }),
//           new TextRun({ text: "\t" }),
//           new TextRun({ text: exp.cont || "" }),
//         ],

//         tabStops: [
//           { type: "left", position: 0 },
//           { type: "left", position: 1200 },
//         ],

//         border: {
//           bottom: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//           left: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//           right: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//         },

//         spacing: {
//           before: 80,
//           after: 80,
//         },
//       })
//     );
//   });

//   return blocks;
// }
// function createExperimentsFakeTable(experiments = []) {
//   const blocks = [];

//   const SLNO_WIDTH = 1000; // width of Sl.No column (DXA-like feel)

//   // ---------- HEADER ----------
//   blocks.push(
//     new Paragraph({
//       children: [
//         new TextRun({ text: "Sl. No", bold: true }),
//         new TextRun({ text: "   Experiments", bold: true }),
//       ],

//       indent: {
//         left: 0,
//         hanging: SLNO_WIDTH,
//       },

//       border: {
//         top: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//         bottom: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//         left: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//         right: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//       },

//       shading: {
//         fill: "F0F0F0",
//         type: ShadingType.CLEAR,
//       },

//       spacing: { before: 120, after: 120 },
//     })
//   );

//   // ---------- ROWS ----------
//   experiments.forEach(exp => {
//     blocks.push(
//       new Paragraph({
//         children: [
//           new TextRun({ text: String(exp.slno || "") + "   " }),
//           new TextRun({ text: exp.cont || "" }),
//         ],

//         indent: {
//           left: 0,
//           hanging: SLNO_WIDTH, // 👈 forces experiment text to align in 2nd column
//         },

//         border: {
//           left: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//           right: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//           bottom: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//         },

//         // 👇 THIS IS THE MIDDLE VERTICAL LINE
//         paragraphBorders: {
//           left: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
//         },

//         spacing: { before: 80, after: 80 },
//       })
//     );
//   });

//   return blocks;
// }
// function createExperimentsTable(experiments = []) {
//   if (!experiments || experiments.length === 0) return [];

//   const tableChildren = [];

//   // Header Row
//   tableChildren.push(
//     new TableRow({
//       children: [
//         new TableCell({
//           children: [
//             new Paragraph({
//               text: "Sl. No.",
//               bold: true,
//               alignment: AlignmentType.CENTER,
//             }),
//           ],
//           width: { size: 15, type: WidthType.PERCENTAGE },
//           shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
//           borders: {
//             top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//           },
//         }),
//         new TableCell({
//           children: [
//             new Paragraph({
//               text: "Experiments",
//               bold: true,
//               alignment: AlignmentType.CENTER,
//             }),
//           ],
//           width: { size: 85, type: WidthType.PERCENTAGE },
//           shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
//           borders: {
//             top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//           },
//         }),
//       ],
//     })
//   );

//   // Data Rows
//   experiments.forEach((exp) => {
//     tableChildren.push(
//       new TableRow({
//         children: [
//           new TableCell({
//             children: [
//               new Paragraph({
//                 text: String(exp.slno || ""),
//                 alignment: AlignmentType.CENTER,
//               }),
//             ],
//             width: { size: 15, type: WidthType.PERCENTAGE },
//             borders: {
//               top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//               bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//               left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//               right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             },
//             verticalAlign: AlignmentType.CENTER,
//           }),
//           new TableCell({
//             children: [
//               new Paragraph({
//                 text: exp.cont || "",
//                 spacing: { before: 100, after: 100 },
//               }),
//             ],
//             width: { size: 85, type: WidthType.PERCENTAGE },
//             borders: {
//               top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//               bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//               left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//               right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             },
//           }),
//         ],
//       })
//     );
//   });

//   const table = new Table({
//     width: { size: 100, type: WidthType.PERCENTAGE },
//     rows: tableChildren,
//     borders: {
//       top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//       bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//       left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//       right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//       insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//       insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//     },
//   });

//   return [table];
// }


function createCopoTable(copoMapping) {
  if (!copoMapping || !Array.isArray(copoMapping.rows)) return [];

  const hasAnyValue = copoMapping.rows.some(row =>
    [...(row.vals || []), ...(row.pso || [])].some(v => Number(v) > 0)
  );

  if (!hasAnyValue) return [];

  const psoHeaders = copoMapping.rows[0].pso?.map((_, i) => `PSO${i + 1}`) || [];
  const headers = ["CO's", ...copoMapping.headers, ...psoHeaders];

  // Header row
  const headerRow = new TableRow({
    children: headers.map(h =>
      new TableCell({
        shading: { fill: LIGHT_GRAY_HEADER, type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            text: h,
            bold: true,
            alignment: AlignmentType.CENTER,
          }),
        ],
      })
    ),
  });

  // CO rows
  const coRows = copoMapping.rows.map(row =>
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: row.co, alignment: AlignmentType.CENTER })],
        }),
        ...[...(row.vals || []), ...(row.pso || [])].map(v =>
          new TableCell({
            children: [
              new Paragraph({
                text: String(v || ""),
                alignment: AlignmentType.CENTER,
              }),
            ],
          })
        ),
      ],
    })
  );

  // AVG row (same logic as PDF)
  const avgRow = new TableRow({
    children: [
      new TableCell({
        children: [
          new Paragraph({
            text: "AVG",
            bold: true,
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
      ...headers.slice(1).map((_, colIdx) => {
        let sum = 0;
        let count = 0;

        copoMapping.rows.forEach(r => {
          const val = Number(
            [...(r.vals || []), ...(r.pso || [])][colIdx]
          );
          if (!isNaN(val) && val > 0) {
            sum += val;
            count++;
          }
        });

        return new TableCell({
          children: [
            new Paragraph({
              text: count ? (sum / count).toFixed(1) : "",
              alignment: AlignmentType.CENTER,
            }),
          ],
        });
      }),
    ],
  });

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
        text: "CO–PO–PSO Mapping",
        bold: true,
        size: 28,        // ✅ 14Pt font
      }),
    ],
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...coRows, avgRow],
    }),

    new Paragraph({ spacing: { after: 300 } }),
  ];
}

  async function generateSyllabusDocx() {
    const data = courseData || {};
    // const children = [];

    const firstPageChildren = [];
const remainingChildren = [];


function hasMeaningfulContent(content, defaultLine) {
  const lines = String(content || "")
    .split(/\n+/)
    .map(s => s.replace(/\s+/g, " ").trim())
    .filter(line => {
      if (!line) return false;
      if (/^\d+\.\s*$/.test(line)) return false;

      if (
        defaultLine &&
        line === defaultLine.replace(/\s+/g, " ").trim()
      ) {
        return false;
      }

      return true;
    });

  return lines.length > 0;
}




    // 🔥 COURSE INFO TABLE (with light gray header)
    firstPageChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
          insideHorizontal: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: "000000",
          },
          insideVertical: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: "000000",
          },
        },
        rows: [
          // HEADER (colored)
          new TableRow({
            children: ["Sem","Title","Code","Credits","Hours of Pedagogy","L-T-P-S","Exam Hours","CIE","SEE","Course Type","Exam Type"].map(
              (label) =>
                new TableCell({
                  shading: { fill: LIGHT_GRAY_HEADER, type: "clear" },
                  children: [
                    new Paragraph({
                      text: label,
                      bold: true,
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                })
            ),
          }),

          // ROW 2
          new TableRow({
            children: [
  data.sem,
  data.course_title,
  data.course_code,
  data.credits,
  data.pedagogy,
  data.ltps,
  data.exam_hours,
  data.cie,
  data.see,
  data.course_type,
(data.course_type || "").includes("T+L")
  ? "Theory & Lab"
  : (data.course_type || "").includes("T")
  ? "Theory"
  : "-"
].map(
              (val) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      text: String(val || "-"),
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                })
            ),
          }),
        ],
      })
    );

    firstPageChildren.push(new Paragraph({ text: "", spacing: { after: 300 } }));

    // 🔥 OBJECTIVES
//     const objectivesArr = Array.isArray(data.course_objectives)
//       ? data.course_objectives
//       : [data.course_objectives];
//     if (objectivesArr[0]) {
//       remainingChildren.push(
//         ...createBorderedBox(
//           "Course Objectives",
// objectivesArr.join("\n"),
// "This course will enable the students to:"
//         )
//       );
//     }
const objectivesText = Array.isArray(data.course_objectives)
  ? data.course_objectives.join("\n")
  : data.course_objectives;

if (
  hasMeaningfulContent(
    objectivesText,
    "This course will enable the students to:"
  )
) {
  remainingChildren.push(
    ...createBorderedBox(
      "Course Objectives",
      objectivesText,
      "This course will enable the students to:"
    )
  );
}


    // 🔥 TLP
    const tlText = Array.isArray(data.teaching_learning)
  ? data.teaching_learning.join("\n")
  : data.teaching_learning;

if (
  hasMeaningfulContent(
    tlText,
    "In addition to the traditional chalk and talk method, ICT tools are adopted:"
  )
) {
  remainingChildren.push(
    ...createBorderedBox(
      "Teaching-Learning Process",
      tlText,
      "In addition to the traditional chalk and talk method, ICT tools are adopted:"
    )
  );
}


    const toolsText = Array.isArray(data.modern_tools)
  ? data.modern_tools.join("\n")
  : data.modern_tools;

if (
  hasMeaningfulContent(
    toolsText,
    "Modern AI tools used for this course:"
  )
) {
  remainingChildren.push(
    ...createBorderedBox(
      "Modern AI Tools Used",
      toolsText,
      "Modern AI tools used for this course:"
    )
  );
}


    //Modules 2nd version
    if (Array.isArray(data.modules)) {
  const moduleBlocks = [];

  data.modules.forEach((mod, idx) => {
    if (shouldRenderModule(mod)) {
      moduleBlocks.push(
        ...createModuleBlock(
          `Module ${idx + 1}`,
          mod.content,
          mod
        )
      );
    }
  });

  if (moduleBlocks.length > 0) {
    remainingChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
          left: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
          right: { style: BorderStyle.SINGLE, size: 6, color: GRAY_BORDER },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: moduleBlocks,
              }),
            ],
          }),
        ],
      })
    );
  }
}

    if (Array.isArray(data.experiments) && data.experiments.length > 0) {


      remainingChildren.push(
  new Paragraph({
    text: "PRACTICAL COMPONENT OF IPCC",
    bold: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 300, after: 200 },
  })
);

  remainingChildren.push(
    createExperimentsTable(data.experiments)
    // createExperimentsDocxTable(data.experiments)
  );
}

if (shouldRenderTextbooks(data.textbooks || [])) {
  remainingChildren.push(
  new Paragraph({
    // alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 150 },
    children: [
    new TextRun({
      text: "Textbooks",
      bold: true,
      size: 28,        // ✅ 28pt font
    }),
  ],
  })
);

remainingChildren.push(
  ...createTextbooksTable(data.textbooks || [])
);

remainingChildren.push(
  new Paragraph({ spacing: { after: 350 } })
);


}



    


    // // 🔥 MODULES
    // if (Array.isArray(data.modules)) {
    //   data.modules.forEach((mod, idx) => {
    //     if (shouldRenderModule(mod)) {
    //       remainingChildren.push(
    //         ...createModuleBox(
    //           `Module ${idx + 1}: ${mod.title}`,
    //           mod.content,
    //           mod
    //         )
    //       );
    //     }
    //   });
    // }

    


    // 🔥 TEXTBOOKS (dark PDF header)
//     if (shouldRenderTextbooks(data.textbooks || [])) {
//       remainingChildren.push(
//         new Paragraph({
//           text: "Textbooks",
//           alignment: AlignmentType.CENTER,
//           bold: true,
//           spacing: { before: 200, after: 150 },
//         })
//       );

//       remainingChildren.push(
//         new Table({
//           width: { size: 100, type: WidthType.PERCENTAGE },
//           borders: {
//             top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
//             insideHorizontal: {
//               style: BorderStyle.SINGLE,
//               size: 6,
//               color: "000000",
//             },
//             insideVertical: {
//               style: BorderStyle.SINGLE,
//               size: 6,
//               color: "000000",
//             },
//           },
//           rows: [
//             // Header dark
//             new TableRow({
//   children: ["Sl.No", "Author", "Book Title", "Publisher"].map(
//     (h) =>
//       new TableCell({
//         shading: { fill: DARK_HEADER, type: ShadingType.CLEAR },
//         children: [
//           new Paragraph({
//             text: h,
//             bold: true,
//             alignment: AlignmentType.CENTER,
//             color: "FFFFFF",
//           }),
//         ],
//       })
//   ),
// }),


//             // Rows
//             ...data.textbooks
//               .filter(
//                 (tb) =>
//                   tb.slNo ||
//                   tb.author ||
//                   tb.bookTitle ||
//                   tb.publisher
//               )
//               .map(
//                 (tb) =>
//                   new TableRow({
//                     children: [
//                       tb.slNo,
//                       tb.author,
//                       tb.bookTitle,
//                       tb.publisher,
//                     ].map(
//                       (v) =>
//                         new TableCell({
//                           children: [
//                             new Paragraph({
//                               text: String(v || ""),
//                             }),
//                           ],
//                         })
//                     ),
//                   })
//               ),
//           ],
//         })
//       );

//       remainingChildren.push(new Paragraph({ text: "", spacing: { after: 350 } }));
//     }

//     // 🔵 Outcomes
    // const outArr = Array.isArray(data.course_outcomes)
    //   ? data.course_outcomes
    //   : [data.course_outcomes];
    // if (outArr[0]) {
    //   remainingChildren.push(
    //     ...createBorderedBox(
    //       "Course Outcomes",
    //         outArr.join("\n")
    //     )
    //   );
    // }
    const outcomesText = Array.isArray(data.course_outcomes)
  ? data.course_outcomes.join("\n")
  : data.course_outcomes;

if (
  hasMeaningfulContent(
    outcomesText,
    "At the end of the course, the student will be able to:"
  )
) {
  remainingChildren.push(
    ...createBorderedBox(
      "Course Outcomes",
      outcomesText,
      "At the end of the course, the student will be able to:"
    )
  );
}

    // 🔵 Web links
    const linksArr = Array.isArray(data.referral_links)
      ? data.referral_links
      : [data.referral_links];
    if (linksArr[0]) {
      remainingChildren.push(
        ...createWebLinksBox("Web Links", linksArr.join("\n"))

      );
    }

    // 🔵 Activity-Based Learning
const activityText = Array.isArray(data.activity_based)
  ? data.activity_based.join("\n")
  : data.activity_based;

if (
  hasMeaningfulContent(
    activityText,
    "Add Activity based learning points:"
  )
) {
  remainingChildren.push(
    ...createBorderedBox(
      "Activity-Based Learning/Practical-Based Learning",
      activityText,
      "Add Activity based learning points:"
    )
  );
}


    if (data.copoMapping) {
  remainingChildren.push(...createCopoTable(data.copoMapping));
}

function headerCell(text, widthPercent) {
  return new TableCell({
    width: {
      size: widthPercent,
      type: WidthType.PERCENTAGE,
    },
    shading: {
      fill: "333333",
      type: ShadingType.CLEAR,
    },
    borders: allBorders(),
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: true,
            color: "FFFFFF",
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });
}

function bodyCell(text) {
  return new TableCell({
    shading: {
      fill: "FFFFFF", // 👈 dark row background
      type: ShadingType.CLEAR,
    },
    borders: allBorders(),
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text ? String(text) : "",
            color: "000000",
          }),
        ],
      }),
    ],
  });
}


function allBorders() {
  return {
    top:    { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    left:   { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    right:  { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  };
}


function createTextbooksTable(textbooks = []) {
  if (!textbooks.length) return [];

  return [
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },

      rows: [
        // ───────── HEADER ROW ─────────
        new TableRow({
          tableHeader: true,
          children: [
            headerCell("Sl.No", 8),
            headerCell("Author", 20),
            headerCell("Book Title", 32),
            headerCell("Publisher", 22),
            headerCell("Year", 10),
          ],
        }),

        // ───────── DATA ROWS ─────────
        ...textbooks.map(tb =>
          new TableRow({
            children: [
              bodyCell(tb.slNo),
              bodyCell(tb.author),
              bodyCell(tb.bookTitle),
              bodyCell(tb.publisher),
              bodyCell(tb.year),
            ],
          })
        ),
      ],
    }),
  ];
}


function createTextbooksFakeTable(textbooks = []) {
  const blocks = [];

  // 🔹 column positions
const COLS = [0, 1100, 3000, 5500, 7600, 9200];

// text starts
const textTabs = COLS.slice(0, -1).map(pos => ({
  type: "left",
  position: pos,
}));

// vertical lines BETWEEN columns
const barTabs = COLS.slice(1).map(pos => ({
  type: TabStopType.BAR,
  position: pos,
}));


  // ---------- HEADER ----------
  blocks.push(
  new Paragraph({
    children: [
      new TextRun({ text: "Sl.No", bold: true }),
      new TextRun("\t"),
      new TextRun({ text: "Author", bold: true }),
      new TextRun("\t"),
      new TextRun({ text: "Book Title", bold: true }),
      new TextRun("\t"),
      new TextRun({ text: "Publisher", bold: true }),
      new TextRun("\t"),
      new TextRun({ text: "Year", bold: true }),
    ],

    tabStops: [...textTabs, ...barTabs],

    border: {
      top:    { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
      left:   { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
      right:  { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
    },

    shading: {
      fill: "333333",
      type: ShadingType.CLEAR,
    },

    run: { color: "FFFFFF" },
    spacing: { before: 80, after: 0 },
  })
);



  // ---------- DATA ROWS ----------
  textbooks.forEach(tb => {
  blocks.push(
    new Paragraph({
      children: [
        new TextRun(String(tb.slNo || "")),
        new TextRun("\t"),
        new TextRun(tb.author || ""),
        new TextRun("\t"),
        new TextRun(tb.bookTitle || ""),
        new TextRun("\t"),
        new TextRun(tb.publisher || ""),
        new TextRun("\t"),
        new TextRun(String(tb.year || "")),
      ],

      tabStops: [...textTabs, ...barTabs],

      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
        left:   { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
        right:  { style: BorderStyle.SINGLE, size: 6, color: "FFFFFF" },
      },

      run: { color: "FFFFFF" },
      spacing: { before: 0, after: 0 },
    })
  );
});



  return blocks;
}


    
    // ================= FOOTER (COLOR MATCHES PDF) =================
    const doc = new DocxDocument({
      styles: {
  default: {
    document: {
      run: {
        font: "Calibri",
        size: 20,
      },
    },
  },
},

  sections: [
  // 🔥 SECTION 1 → FIRST PAGE ONLY (WITH HEADER)
  {
    headers: {
      default: new Header({
        children: [
  new Paragraph({
    children: [
      new TextRun({
        text: "Bangalore Institute of Technology",
        bold: true,
        size: 22,
      }),
    ],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    text: `Generated on: ${formattedDate}`,
    alignment: AlignmentType.RIGHT,
    size: 16,
  }),
  new Paragraph({
    border: {
      bottom: {
        color: RED,
        size: 28,
        style: BorderStyle.SINGLE,
      },
    },
    spacing: { after: 200 },
  }),

   // your existing header table
          new Paragraph({
            border: {
              bottom: {
                color: RED,
                size: 28,
                style: BorderStyle.SINGLE,
              },
            },
            spacing: { after: 200 },
          }),
        ],
      }),
    },

    properties: {
      page: {
        margin: { top: 1800, right: 1440, bottom: 1440, left: 1440 },
      },
    },

    children: firstPageChildren,
  },

  // 🔥 SECTION 2 → ALL OTHER PAGES (NO HEADER, NO FOOTER)
{
  headers: {
    default: new Header({
      children: [], // break header inheritance
    }),
  },

  properties: {
    type: "continuous", // ⭐ THIS IS THE MAGIC LINE ⭐
    page: {
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
    },
  },

  children: remainingChildren,
},


],

});


    // SAVE DOC
    const now = new Date();

const date = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-");

  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(":", "-");


    // Save
    const fileName = `${courseData.course_code}` +'_'+date+'_'+time
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, fileName + ".docx");
    });
  }
  
  useEffect(()=>{


  if (strtDownload !== "docx") return;
  
          generateSyllabusDocx()


  },[strtDownload])

  return null;
}
