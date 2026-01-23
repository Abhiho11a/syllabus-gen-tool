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

function buildCourseInfoTable(data) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          "Sem","Title","Code","Credits","Pedagogy",
          "L-T-P-S","Exam Hrs","CIE","SEE","Course Type"
        ].map(headerCell),
      }),
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
        ].map(valueCell),
      }),
    ],
  });
}

module.exports = { buildCourseInfoTable };
