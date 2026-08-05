const {
  Document,
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
} = require("docx");

const {
  buildCourseInfoTable,
} = require("./blocks/courseInfo");
const { buildModules } = require("./blocks/module");
const { buildCopoTable } = require("./blocks/copo");
const { buildPracticalTable } = require("./blocks/practicals");
const { buildTextbooksTable } = require("./blocks/textbooks");

const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 6 },
  bottom: { style: BorderStyle.SINGLE, size: 6 },
  left: { style: BorderStyle.SINGLE, size: 6 },
  right: { style: BorderStyle.SINGLE, size: 6 },
};


const DEFAULT_LINES = [
  "This course will enable the students to:",
  "At the end of the course, the student will be able to:",
  "In addition to the traditional chalk and talk method, ICT tools are adopted:",
  "Modern AI tools used for this course:",
  "Web Links:",
  "Activity based learning points:",
];

function hasMeaningfulContent(input) {
  let arr = [];

  if (Array.isArray(input)) arr = input;
  else if (typeof input === "string") arr = input.split("\n");
  else return false;

  return arr
    .map(v => String(v || "").trim())
    .filter(v => {
      if (!v) return false;
      if (/^\d+\.\s*$/.test(v)) return false;

      if (
        DEFAULT_LINES.some(
          d => d.toLowerCase() === v.toLowerCase()
        )
      ) {
        return false;
      }
      return true;
    }).length > 0;
}
function hasRealModernToolsContent(input) {
  const arr = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split("\n")
      : [];

  if (!arr.length) return false;

  return arr
    .map(v => String(v || "").trim())
    .filter(v => {
      if (!v) return false;

      // ignore numbering like "1." "2"
      if (/^\d+\.?$/.test(v)) return false;

      // ignore default heading
      if (
        DEFAULT_MODERN_TOOLS_LINES.some(
          d => d.toLowerCase() === v.toLowerCase()
        )
      ) return false;

      return true; // ✅ real user content
    }).length > 0;
}

const DEFAULT_MODERN_TOOLS_LINES = [
  "**Modern AI tools used for this course:**"
];

function is2025Scheme(courseData = {}) {
  return String(courseData?.scheme_year || "2024").trim() === "2025";
}


function parseBoldRunsFromStars(text = "") {
  const runs = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(
        new TextRun({
          text: text.slice(lastIndex, match.index),
        })
      );
    }

    runs.push(
      new TextRun({
        text: match[1],
        bold: true,
      })
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(
      new TextRun({
        text: text.slice(lastIndex),
      })
    );
  }

  return runs;
}
function renderBulletList(input) {
  // ✅ Normalize input
  const arr = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? [input]
      : [];

  return arr
    .map(v => String(v || "").trim())
    .filter(v => v && !/^\d+\.?\s*$/.test(v))
    .map(line =>
      new Paragraph({
        children: parseBoldRunsFromStars(line),
        spacing: { after: 80 },
      })
    );
}

function sectionTitle(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
      }),
    ],
    spacing: { before: 200, after: 50 },
  });
}
function hasRealContent(arr = []) {
  if (!Array.isArray(arr)) return false;

  return arr
    .slice(1) // remove heading element
    .some(item =>
      typeof item === "string" &&
      item.trim().length > 3 &&
      !/^\d+\.?$/.test(item.trim())
    );
}

function hasMeaningfulActivityRows(items = []) {
  return Array.isArray(items) && items.some(item => {
    const activity = String(item?.activity || "").trim();
    const hours = String(item?.hours || "").trim();
    return activity || hours;
  });
}

function buildActivitySection(title, items = []) {
  const rows = (Array.isArray(items) ? items : [])
    .filter(item => {
      const activity = String(item?.activity || "").trim();
      const hours = String(item?.hours || "").trim();
      return activity || hours;
    })
    .map((item, index) =>
      new TableRow({
        children: [
          new TableCell({
            borders: BORDER,
            width: { size: 14, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(index + 1), size: 22 })],
              }),
            ],
          }),
          new TableCell({
            borders: BORDER,
            width: { size: 66, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: String(item?.activity || "-"), size: 22 })],
              }),
            ],
          }),
          new TableCell({
            borders: BORDER,
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(item?.hours || "-"), size: 22 })],
              }),
            ],
          }),
        ],
      })
    );

  if (!rows.length) return [];

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 150 },
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
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: BORDER,
              width: { size: 14, type: WidthType.PERCENTAGE },
              shading: { fill: "E6E6E6", type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Sl.No", bold: true, size: 22 })],
                }),
              ],
            }),
            new TableCell({
              borders: BORDER,
              width: { size: 66, type: WidthType.PERCENTAGE },
              shading: { fill: "E6E6E6", type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Activity", bold: true, size: 22 })],
                }),
              ],
            }),
            new TableCell({
              borders: BORDER,
              width: { size: 20, type: WidthType.PERCENTAGE },
              shading: { fill: "E6E6E6", type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Hours / Semester", bold: true, size: 22 })],
                }),
              ],
            }),
          ],
        }),
        ...rows,
      ],
    }),
  ];
}

function cleanList(arr = []) {
  return Array.isArray(arr) ? arr.slice(1) : [];
}

function pushCleanSection(children, title, data) {
  if (!hasRealContent(data)) return;
  children.push(
    sectionTitle(title),
    ...renderBulletList(cleanList(data))
  );
}


async function generateSyllabusDocx(courseData) {
  const children = [];
  const is2025 = is2025Scheme(courseData);

  // 1️⃣ COURSE INFO TABLE
  children.push(buildCourseInfoTable(courseData));

  // 2️⃣ OBJECTIVES
  // Course Objectives
if (hasMeaningfulContent(courseData.course_objectives)) {
  children.push(
    sectionTitle("Course Objectives"),
    ...renderBulletList(courseData.course_objectives)
  );
}

// Teaching–Learning Process
if (hasMeaningfulContent(courseData.teaching_learning)) {
  children.push(
    sectionTitle("Teaching–Learning Process"),
    ...renderBulletList(courseData.teaching_learning)
  );
}

// 🔥 Modern AI Tools (FIXED)
// if (hasMeaningfulContent(courseData.modern_tools)) {
//   children.push(
//     sectionTitle("Modern AI Tools Used"),
//     ...renderBulletList(courseData.modern_tools)
//   );
// }

if (!is2025 && hasRealModernToolsContent(courseData.modern_tools)) {
  children.push(
    sectionTitle("Modern AI Tools Used"),
    ...renderBulletList(courseData.modern_tools)
  );
}

  // 4️⃣ MODULES
  children.push(...buildModules(courseData.modules));

  //Practical components
  children.push(
    ...buildPracticalTable(courseData.experiments || [])
  );
  
  
  //Textbooks
  children.push(
  ...buildTextbooksTable(courseData.textbooks || [])
);


  // Course Outcomes
  if (hasMeaningfulContent(courseData.course_outcomes)) {
    children.push(
      sectionTitle("Course Outcomes"),
      ...renderBulletList(courseData.course_outcomes)
    );
  }
  pushCleanSection(children, "Web Links", courseData.referral_links);
  if (!is2025 && (hasRealContent(courseData.activity_based) || hasMeaningfulContent(courseData.activity_based))) {
    children.push(
      sectionTitle("Activity-Based Learning"),
      ...renderBulletList(courseData.activity_based)
    );
  }

  if (is2025 && hasMeaningfulActivityRows(courseData.termWorkActivities)) {
    children.push(...buildActivitySection("Term Work (TW)", courseData.termWorkActivities));
  }

  if (is2025 && hasMeaningfulActivityRows(courseData.selfLearningActivities)) {
    children.push(...buildActivitySection("Self Learning (SL)", courseData.selfLearningActivities));
  }

  // 5️⃣ CO–PO–PSO
  children.push(...buildCopoTable(courseData.copoMapping));

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 800, bottom: 800, left: 1000, right: 1000 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateSyllabusDocx };
