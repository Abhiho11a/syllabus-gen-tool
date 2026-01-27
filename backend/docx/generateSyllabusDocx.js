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
if (hasMeaningfulContent(courseData.modern_tools)) {
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
  pushCleanSection(children, "Activity-Based Learning", courseData.activity_based);

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
