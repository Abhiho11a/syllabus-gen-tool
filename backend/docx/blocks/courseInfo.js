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

function headerCell(text) {
  return new TableCell({
    shading: { fill: "E6E6E6", type: ShadingType.CLEAR },
    borders: BORDER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true })],
      }),
    ],
  });
}

function valueCell(text) {
  return new TableCell({
    borders: BORDER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: String(text || ""),
            color: "0066CC",
            bold: true,
          }),
        ],
      }),
    ],
  });
}
function getExamType(ct) {
  if (typeof ct !== "string") return "-";

  const upper = ct.toUpperCase();

  if (upper.includes("T+L")) return "Theory & Lab";
  if (upper.includes("(T)") || upper.endsWith("T")) return "Theory";
  if (upper.includes("(L)") || upper.endsWith("L")) return "Lab";

  return "-";
}

// function buildCourseInfoTable(data) {

  
//   data.exam_type = getExamType(data.course_type);
  
//   if (data.course_type === "MC (T)" || data.course_type === "MC (L)") {
//     data.credits = 0;
//     data.exam_type = "None";
//   }if(data.course_type === "HSMS (M)")
//   data.exam_type = "MCQ";

//   return new Table({
//     width: { size: 100, type: WidthType.PERCENTAGE },
//     rows: [
//       new TableRow({
//         children: [
//           "Sem","Title","Code","Credits","Pedagogy",
//           "L-T-P-S","Exam Hrs","CIE","SEE","Course Type","Exam Type"
//         ].map(headerCell),
//       }),
//       new TableRow({
//         children: [
//           data.sem,
//           data.course_title.toUpperCase(),
//           data.course_code,
//           data.credits,
//           data.pedagogy,
//           data.ltps,
//           data.exam_hours,
//           data.cie,
//           data.see,
//           data.course_type,
//           data.exam_type
//         ].map(valueCell),
//       }),
//     ],
//   });
// }


function buildCourseInfoTable(data = {}) {

  const courseType = String(
    data.course_type ?? ""
  ).trim();

  const courseTitle = String(
    data.course_title ?? ""
  ).trim();

  const courseCode = String(
    data.course_code ?? ""
  ).trim();

  const sem = String(
    data.sem ?? ""
  ).trim();

  const credits = String(
    data.credits ?? ""
  ).trim();

  const pedagogy = String(
    data.pedagogy ?? ""
  ).trim();

  const ltps = String(
    data.ltps ?? ""
  ).trim();

  const examHours = String(
    data.exam_hours ?? ""
  ).trim();

  const cie = String(
    data.cie ?? ""
  ).trim();

  const see = String(
    data.see ?? ""
  ).trim();


  // =========================================================
  // EXAM TYPE
  // =========================================================

  let examType = getExamType(courseType);


  // MC(T) / MC(L)
  if (
    courseType === "MC (T)" ||
    courseType === "MC (L)"
  ) {
    examType = "None";
  }


  // HSMS (M)
  if (
    courseType === "HSMS (M)"
  ) {
    examType = "MCQ";
  }


  return new Table({

    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },

    rows: [

      // =====================================================
      // HEADER
      // =====================================================

      new TableRow({

        children: [

          "Sem",
          "Title",
          "Code",
          "Credits",
          "Pedagogy",
          "L-T-P-S",
          "Exam Hrs",
          "CIE",
          "SEE",
          "Course Type",
          "Exam Type",

        ].map(headerCell),

      }),


      // =====================================================
      // VALUES
      // =====================================================

      new TableRow({

        children: [

          sem,

          courseTitle.toUpperCase(),

          courseCode,

          credits,

          pedagogy,

          ltps,

          examHours,

          cie,

          see,

          courseType,

          examType,

        ].map(valueCell),

      }),

    ],

  });
}

module.exports = { buildCourseInfoTable };
