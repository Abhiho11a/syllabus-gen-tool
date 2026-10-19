import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./SyllabusPreview.css";
import logo from "../assets/images/logo.jpg";
import { Printer } from "lucide-react";
import '../index.css'

function asArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}


function clean(value) {
  return String(value ?? "")
    .replace(/\*\*/g, "")
    .replace(/__+/g, "")
    .replace(/^\s*[-•]\s*/, "")
    .trim();
}

function renderFormattedText(value) {
  const text = String(value ?? "");

  if (!text) return null;

  const parts = text.split(/(\*\*[\s\S]*?\*\*|__[\s\S]*?__)/g);

  return parts.map((part, index) => {
    if (
      part.startsWith("**") &&
      part.endsWith("**") &&
      part.length >= 4
    ) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (
      part.startsWith("__") &&
      part.endsWith("__") &&
      part.length >= 4
    ) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return (
      <React.Fragment key={index}>
        {part}
      </React.Fragment>
    );
  });
}


/* =========================================================
   DEFAULT / PLACEHOLDER CONTENT
========================================================= */

const DEFAULT_LINES = [
  "This course will enable the students to:",
  "At the end of the course, the student will be able to:",
  "In addition to the traditional chalk and talk method, ICT tools are adopted:",
  "Modern AI tools used for this course:",
  "Web Links:",
  "Activity based learning points:",
];


/* =========================================================
   REAL CONTENT CHECK
========================================================= */

function hasRealContent(value) {

  const items = asArray(value);

  return items.some((item) => {

    const text = clean(item);

    if (!text) return false;

    // Ignore "1.", "2.", etc.
    if (/^\d+\.?$/.test(text)) {
      return false;
    }

    // Ignore default instructional text
    if (
      DEFAULT_LINES.some(
        (line) =>
          line.toLowerCase() === text.toLowerCase()
      )
    ) {
      return false;
    }

    return true;
  });
}


function normalizeForComparison(value) {
  return String(value ?? "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isPlaceholderContent(value) {
  const normalized = normalizeForComparison(value);

  if (!normalized) return true;

  // Number-only entries: 1., 2., 3., etc.
  if (/^\d+\.?$/.test(normalized)) {
    return true;
  }

  const placeholderPatterns = [
    "this course will enable the students to:",
    "at the end of the course, the student will be able to:",
    "in addition to the traditional chalk and talk method, ict tools are adopted:",
    "modern ai tools used for this course:",
    "web links:",
    "activity based learning points:",
  ];

  return placeholderPatterns.includes(normalized);
}

function getRealContent(value) {
  return asArray(value).filter(
    (item) => !isPlaceholderContent(item)
  );
}

function getExamType(courseType) {

  const value = clean(courseType);

  if (!value) return "";

  const upper = value.toUpperCase();

  if (
    value === "MC (T)" ||
    value === "MC (L)"
  ) {
    return "None";
  }

  if (value === "HSMS (M)") {
    return "MCQ";
  }

  if (upper.includes("T+L")) {
    return "Theory & Lab";
  }

  if (
    upper.includes("(T)") ||
    upper.endsWith("T")
  ) {
    return "Theory";
  }

  if (
    upper.includes("(L)") ||
    upper.endsWith("L")
  ) {
    return "Lab";
  }

  return "";
}

function getModuleTextbooks(module) {
  if (!module) return [];

  // Actual structure used by the form/backend
  if (Array.isArray(module.textbooks)) {
    return module.textbooks.filter(
      (item) =>
        clean(item?.slNo) ||
        clean(item?.chapter)
    );
  }

  return [];
}

function hasRealModuleContent(module) {
  if (!module) return false;

  const textbooks = getModuleTextbooks(module);

  return Boolean(
    clean(module.title) ||
    clean(module.content) ||
    textbooks.length > 0 ||
    clean(module.rbt) ||
    clean(module.wkt) ||
    clean(module.teachingHours)
  );
}

function splitModuleContent(content) {
  const text = String(content ?? "").trim();

  if (!text) return [];

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function PreviewExperiments({ experiments }) {

  const validExperiments = experiments.filter(
  (item) => clean(item?.cont)
);

  if (!validExperiments.length) {
    return null;
  }

  const hasParts =
    validExperiments.some(
      (item) =>
        item.part === "A" ||
        item.part === "B"
    );

  const partA =
    validExperiments.filter(
      (item) =>
        item.part === "A" ||
        !item.part
    );

  const partB =
    validExperiments.filter(
      (item) => item.part === "B"
    );

  const renderRows = (items) =>
    items.map((item, index) => (
      <tr key={`${item.slno}-${index}`}>
        <td>
          {item.slno || index + 1}
        </td>
        <td>
          {item.cont || ""}
        </td>
      </tr>
    ));

  return (
    <PreviewSection title="Practical Components">

      <table className="experiments-table">

        <thead>
          <tr>
            <th>Sl. No.</th>
            <th>List of Experiments</th>
          </tr>
        </thead>

        <tbody>

          {hasParts && partA.length > 0 && (
            <tr className="experiment-part-row">
              <td colSpan="2">
                Part A
              </td>
            </tr>
          )}

          {hasParts
            ? renderRows(partA)
            : renderRows(validExperiments)}

          {hasParts && partB.length > 0 && (
            <tr className="experiment-part-row">
              <td colSpan="2">
                Part B
              </td>
            </tr>
          )}

          {hasParts && renderRows(partB)}

        </tbody>

      </table>

    </PreviewSection>
  );
}

function PreviewBooksTable({
  title,
  books,
  showHeader = true,
}) {
  const validBooks = books.filter((book) => {
    if (!book) return false;

    return (
      clean(book.slNo) ||
      clean(book.author) ||
      clean(book.bookTitle) ||
      clean(book.publisher) ||
      clean(book.year)
    );
  });

  if (!validBooks.length) {
    return null;
  }

  return (
    <PreviewSection title={title}>
      <table className="simple-table">
        {showHeader && (
          <thead>
            <tr>
              <th>Sl.No</th>
              <th>Author</th>
              <th>Title</th>
              <th>Publisher&Edition</th>
              <th>Year</th>
            </tr>
          </thead>
        )}

        <tbody>
          {validBooks.map((book, index) => (
            <tr key={index}>
              <td>{book.slNo || index + 1}</td>
              <td>{book.author || ""}</td>
              <td>{book.bookTitle || ""}</td>
              <td>{book.publisher || ""}</td>
              <td>{book.year || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PreviewSection>
  );
}

function hasCopoData(mapping) {
  if (!mapping || !Array.isArray(mapping.rows)) {
    return false;
  }

  return mapping.rows.some((row) => {
    const poValues = Array.isArray(row?.vals)
      ? row.vals
      : [];

    const psoValues = Array.isArray(row?.pso)
      ? row.pso
      : [];

    return [...poValues, ...psoValues].some((value) => {
      const text = String(value ?? "").trim();

      return text !== "";
    });
  });
}

function calculateAverage(values = []) {

  const valid = values
    .map(Number)
    .filter(
      (value) =>
        Number.isFinite(value) &&
        value > 0
    );

  if (!valid.length) {
    return "";
  }

  return (
    valid.reduce(
      (sum, value) => sum + value,
      0
    ) / valid.length
  ).toFixed(1);
}


function hasCowkData(mapping) {

  if (!mapping) return false;

  return (mapping.rows || []).some(
    (row) =>
      Array.isArray(row.vals) &&
      row.vals.some(
        (value) =>
          clean(value) !== ""
      )
  );
}

function PreviewHeader({ department }) {
  return (
    <div className="syllabus-header">

      <div className="syllabus-header-main">

        <div className="preview-logo-wrapper">
          <img
            src={logo}
            alt="Bangalore Institute of Technology"
            className="preview-college-logo"
          />
        </div>

        <div className="preview-header-text">

          <div className="preview-institute-name">
            BANGALORE INSTITUTE OF TECHNOLOGY
          </div>

          <div className="preview-institute-address">
            An Autonomous Institution under VTU, K R Road, V. V. Puram,
            Bengaluru – 560004
          </div>

          <div className="preview-department">
            Department of {department || "Computer Science and Engineering"}
          </div>

        </div>

      </div>

      <div className="preview-header-line" />

    </div>
  );
}
function PreviewFooter({ pageNumber, totalPages }) {
  return (
    <div className="syllabus-footer">

      <div className="syllabus-footer-line" />

      <div className="syllabus-footer-content">

        <div className="syllabus-footer-address">
          K R Road, V. V. Puram, Bengaluru–560004
        </div>

        <div className="syllabus-footer-website">
          Website: www.bit-bangalore.edu.in
        </div>

        <div className="syllabus-footer-page">
          Page {pageNumber} of {totalPages}
        </div>

      </div>

    </div>
  );
}

export default function SyllabusPreview({ formData, scheme, department, onPreviewPDF,onDownloadPDF, previewBtnText = "Preview PDF" }) {


   const isCustomCourse =
    String(formData.course_type || "")
      .trim()
      .toUpperCase() === "CUSTOM";

  // const displayCourseType =
  //   isCustomCourse
  //     ? String(formData.custom_course_type || "").trim() || "Custom"
  //     : formData.course_type;

  // const displayExamType =
  //   String(formData.exam_type || "").trim() ||
  //   getExamType(formData.course_type);

  const displayCourseType = (() => {
  const type = String(formData.course_type || "").trim();

  if (type.toUpperCase() === "CUSTOM") {
    return String(formData.custom_course_type || "").trim() || "Custom";
  }

  if (type === "IPCC") return "IPCC(T+L)";

  if (
    ["PCC", "OEC", "PEC", "UHV", "BSC", "HSMC", "ASC"].includes(type)
  ) {
    return `${type}(T)`;
  }

  if (type === "PCCL") return "PCCL(L)";

  if (type === "PI") return "PI(V)";
  if (type === "PIH") return "PIH(V)";

  if (type === "MC_EXAM_1") return "MC(M)";
  if (type === "MC_EXAM_2") return "MC(M)";

  if (type === "MC" || type === "MC_NO_EXAM") return "NCMC";

  return type;
})();

const displayExamType =
  String(formData.exam_type || "").trim() ||
  getExamType(formData.course_type);

  const objectives = getRealContent(formData.course_objectives);
  const teachingLearning = getRealContent(formData.teaching_learning);
  const modernTools = getRealContent(formData.modern_tools);
  const outcomes = getRealContent(formData.course_outcomes);
  const modules = Array.isArray(formData.modules) ? formData.modules.filter(hasRealModuleContent) : [];
  
  const experiments = Array.isArray(formData.experiments)
  ? formData.experiments : [];
  
  const textbooks = Array.isArray(formData.textbooks)
  ? formData.textbooks : [];
  
  const references = Array.isArray(formData.references)
  ? formData.references : [];

  const referralLinks = getRealContent(formData.referral_links);
  const toolsAI = getRealContent(formData.tools_ai_programming);
  const prerequisites = getRealContent(formData.prerequisites);
  // const examType = getExamType(formData.course_type);

  const termWorkActivities = Array.isArray(
  formData.termWorkActivities
)
  ? formData.termWorkActivities : [];
  
  const selfLearningActivities = Array.isArray(
  formData.selfLearningActivities
)
  ? formData.selfLearningActivities : [];
  const activityBased = getRealContent(formData.activity_based);
  const guidelines = Array.isArray(formData.guidelines)
  ? formData.guidelines.filter(
      (item) => clean(item?.text)
    )
  : [];
  const rubrics = Array.isArray(formData.rubrics)
  ? formData.rubrics.filter(
      (item) => clean(item?.text)
    )
  : [];
  const copoMapping = {
    headers: Array.isArray(formData?.copoMapping?.headers)
        ? formData.copoMapping.headers
        : [],

    rows: Array.isArray(formData?.copoMapping?.rows)
        ? formData.copoMapping.rows
        : [],
    };
    
  const hasCopo = hasCopoData(copoMapping);
  const hasCowk = hasCowkData(formData.cowkMapping);
  const sdgs = Array.isArray(formData.sdgs)
  ? formData.sdgs.filter(
      (item) =>
        clean(item?.goalNo) ||
        clean(item?.goalTitle) ||
        clean(item?.description)
    )
  : [];

  const [pageGroups, setPageGroups] = useState([]);

  const measurePageRef = useRef(null);
  const measureContentRef = useRef(null);
  const measureFooterRef = useRef(null);
  const previewBlocks = useMemo(() => {
  const blocks = [];

    // =========================================================
    // COURSE INFORMATION
    // =========================================================

    blocks.push({
      id: "course-info",

      render: () => (
        <table className="info-table">
          <thead>
            <tr>
              <th>Sem</th>
              <th>Course Title</th>
              <th>Code</th>
              <th>Credits</th>
              <th>Pedagogy</th>
              <th>L-T-P-S</th>
              <th>Exam Hrs</th>
              <th>CIE</th>
              <th>SEE</th>
              <th>Course Type</th>
              <th>Exam Type</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>{clean(formData.sem)}</td>

              <td>
                {clean(formData.course_title).toUpperCase()}
              </td>

              <td>
                {clean(formData.course_code)}
              </td>

              <td>
                {clean(formData.credits)}
              </td>

              <td>
                {clean(formData.pedagogy)}
              </td>

              <td>
                {clean(formData.ltps)}
              </td>

              <td>
                {clean(formData.exam_hours)}
              </td>

              <td>
                {clean(formData.cie)}
              </td>

              <td>
                {clean(formData.see)}
              </td>

              {/* <td>
                {clean(formData.course_type)}
              </td>

              <td>
                {examType}
              </td> */}
              <td>
                {clean(displayCourseType)}
              </td>

              <td>
                {clean(displayExamType)}
              </td>
            </tr>
          </tbody>
        </table>
      ),
    });


    // =========================================================
    // COURSE OBJECTIVES
    // =========================================================

    if (objectives.length > 0) {
      blocks.push({
        id: "objectives",

        render: () => (
          <PreviewSection title="Course Objectives">
            <ol>
              {objectives.map((item, index) => (
                <li key={index}>
                  {renderFormattedText(item)}
                </li>
              ))}
            </ol>
          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // TEACHING–LEARNING PROCESS
    // =========================================================

    if (teachingLearning.length > 0) {
      blocks.push({
        id: "teaching-learning",

        render: () => (
          <PreviewSection title="Teaching–Learning Process">
            <ul>
              {teachingLearning.map((item, index) => (
                <li key={index}>
                  {renderFormattedText(item)}
                </li>
              ))}
            </ul>
          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // 2024 - MODERN TOOLS
    // =========================================================

    if (
      scheme === "2024" &&
      modernTools.length > 0
    ) {
      blocks.push({
        id: "modern-tools",

        render: () => (
          <PreviewSection title="Modern Tools">
            <ul>
              {modernTools.map((item, index) => (
                <li key={index}>
                  {renderFormattedText(item)}
                </li>
              ))}
            </ul>
          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // 2025 - TOOLS / AI TOOLS / PROGRAMMING
    // + PREREQUISITES
    // =========================================================

    if (
      scheme === "2025" &&
      (
        toolsAI.length > 0 ||
        prerequisites.length > 0
      )
    ) {
      blocks.push({
        id: "tools-prerequisites",

        render: () => (
          <table className="tools-prerequisites-table">
            <thead>
              <tr>
                <th>
                  TOOLS / AI TOOLS / PROGRAMMING LANGUAGES
                </th>

                <th>
                  PREREQUISITES
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  {toolsAI.map((item, index) => (
                    <div
                      className="tools-prereq-item"
                      key={index}
                    >
                      <span className="tools-prereq-number">
                        {index + 1}.
                      </span>

                      <span>
                        {item}
                      </span>
                    </div>
                  ))}
                </td>

                <td>
                  {prerequisites.map((item, index) => (
                    <div
                      className="tools-prereq-item"
                      key={index}
                    >
                      <span className="tools-prereq-number">
                        {index + 1}.
                      </span>

                      <span>
                        {item}
                      </span>
                    </div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        ),
      });
    }

    // =======================================================
    // MODULES
    // =======================================================

    modules.forEach((module, index) => {
      const moduleTextbooks = getModuleTextbooks(module);

      const hasMeta =
        moduleTextbooks.length > 0 ||
        clean(module.rbt) ||
        clean(module.wkt) ||
        clean(module.teachingHours);

      blocks.push({
        id: `module-${index}`,

        render: () => (
          <div className="module">

            {/* MODULE TITLE */}
            <div className="module-title">
              Module {index + 1}
            </div>

            {/* MODULE CONTENT */}
            {clean(module.content) && (
              <div className="module-content">
                {splitModuleContent(module.content).map(
                  (line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                      {renderFormattedText(line)}
                      {lineIndex <
                        splitModuleContent(module.content).length - 1 && (
                        <br />
                      )}
                    </React.Fragment>
                  )
                )}
              </div>
            )}

            {/* MODULE METADATA */}
            {hasMeta && (
              <div className="module-meta">

                {/* TEXTBOOK */}
                {moduleTextbooks.length > 0 && (
                  <span>
                    {moduleTextbooks.map((book, bookIndex) => (
                      <React.Fragment key={bookIndex}>
                        {bookIndex > 0 && " , "}

                        TB{clean(book.slNo)}

                        {clean(book.chapter) &&
                          `:Ch-${clean(book.chapter)}`}
                      </React.Fragment>
                    ))}
                  </span>
                )}

                {/* RBT */}
                {clean(module.rbt) && (
                  <span>
                    RBT: {clean(module.rbt)}
                  </span>
                )}

                {/* WKT */}
                {clean(module.wkt) && (
                  <span>
                    WK: {clean(module.wkt)}
                  </span>
                )}

                {/* HOURS */}
                {clean(module.teachingHours) && (
                  <span>
                    Hours: {clean(module.teachingHours)}
                  </span>
                )}

              </div>
            )}

          </div>
        ),
      });
    });


    // =========================================================
    // PRACTICAL COMPONENTS
    // =========================================================

    if (experiments.length > 0) {
      blocks.push({
        id: "practical",

        render: () => (
          <PreviewExperiments
            experiments={experiments}
          />
        ),
      });
    }


    // =========================================================
    // TEXTBOOKS
    // =========================================================

    if (textbooks.length > 0) {
      blocks.push({
        id: "textbooks",
        render: () => (
          <PreviewBooksTable
            title="Textbooks"
            books={textbooks}
          />
        ),
      });
    }


    // =========================================================
    // REFERENCES
    // =========================================================

    if (references.length > 0) {
      blocks.push({
        id: "references",

        render: () => (
          <PreviewBooksTable
            title="References"
            books={references}
          />
        ),
      });
    }


    // =========================================================
    // COURSE OUTCOMES
    // =========================================================

    if (outcomes.length > 0) {
      blocks.push({
        id: "course-outcomes",

        render: () => (
          <PreviewSection title="Course Outcomes">
            <ol>
              {outcomes.map((item, index) => (
                <li key={index}>
                  {renderFormattedText(item)}
                </li>
              ))}
            </ol>
          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // WEB LINKS
    // =========================================================

    if (referralLinks.length > 0) {
      blocks.push({
        id: "web-links",

        render: () => (
          <PreviewSection title="Web Links">
            <ul>
              {referralLinks.map((link, index) => (
                <li key={index}>
                  {link}
                </li>
              ))}
            </ul>
          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // ACTIVITY BASED LEARNING
    // =========================================================

    if (activityBased.length > 0) {
      blocks.push({
        id: "activity-based",

        render: () => (
          <PreviewSection title="Activity-Based Learning">
            <ul>
              {activityBased.map((item, index) => (
                <li key={index}>
                  {renderFormattedText(item)}
                </li>
              ))}
            </ul>
          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // TERM WORK / SELF LEARNING
    // =========================================================

    if (
      termWorkActivities.length > 0 ||
      selfLearningActivities.length > 0
    ) {
      blocks.push({
        id: "term-work-self-learning",

        render: () => (
          <PreviewTwSlTable
            termWork={termWorkActivities}
            selfLearning={selfLearningActivities}
          />
        ),
      });
    }


    // =========================================================
    // GUIDELINES
    // =========================================================

    if (guidelines.length > 0) {
      blocks.push({
        id: "guidelines",

        render: () => (
          <PreviewSection title="Guidelines">
            <ol>
              {guidelines.map((item, index) => (
                <li key={index}>
                  {item.text}
                </li>
              ))}
            </ol>
          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // RUBRICS
    // =========================================================

    if (rubrics.length > 0) {
      blocks.push({
        id: "rubrics",

        render: () => (
          <PreviewSection title="Rubrics">
            <table className="simple-table">

              <thead>
                <tr>
                  <th>
                    Rubric
                  </th>

                  <th>
                    Description
                  </th>
                </tr>
              </thead>


              <tbody>
                {rubrics.map((item, index) => (
                  <tr key={index}>

                    <td>
                      Rubric {index + 1}
                    </td>

                    <td>
                      {item.text}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // CO – PO – PSO MAPPING
    // =========================================================

    if (hasCopo) {
      blocks.push({
        id: "co-po-pso",

        render: () => (
          <PreviewSection title="CO–PO–PSO Mapping">

            <table className="mapping-table">

              <thead>
                <tr>

                  <th>
                    CO
                  </th>


                  {copoMapping.headers.map(
                    (header, index) => (
                      <th key={`po-${index}`}>
                        {header}
                      </th>
                    )
                  )}


                  {(
                    copoMapping.rows[0]?.pso || []
                  ).map(
                    (_, index) => (
                      <th key={`pso-${index}`}>
                        PSO{index + 1}
                      </th>
                    )
                  )}

                </tr>
              </thead>


              <tbody>

                {/* CO ROWS */}

                {copoMapping.rows
                  .filter((row) => row)
                  .map((row, rowIndex) => (
                    <tr key={rowIndex}>

                      <td>
                        {row.co ||
                          `CO${rowIndex + 1}`}
                      </td>


                      {(row.vals || []).map(
                        (value, index) => (
                          <td
                            key={`po-${index}`}
                          >
                            {value}
                          </td>
                        )
                      )}


                      {(row.pso || []).map(
                        (value, index) => (
                          <td
                            key={`pso-${index}`}
                          >
                            {value}
                          </td>
                        )
                      )}

                    </tr>
                  ))}


                {/* AVERAGE ROW */}

                <tr>

                  <td className="mapping-average">
                    AVG
                  </td>


                  {copoMapping.headers.map(
                    (_, index) => (
                      <td
                        key={`avg-po-${index}`}
                      >
                        {calculateAverage(
                          copoMapping.rows.map(
                            (row) =>
                              row.vals?.[index]
                          )
                        )}
                      </td>
                    )
                  )}


                  {(
                    copoMapping.rows[0]?.pso ||
                    []
                  ).map(
                    (_, index) => (
                      <td
                        key={`avg-pso-${index}`}
                      >
                        {calculateAverage(
                          copoMapping.rows.map(
                            (row) =>
                              row.pso?.[index]
                          )
                        )}
                      </td>
                    )
                  )}

                </tr>

              </tbody>

            </table>

          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // CO – WK MAPPING
    // =========================================================

    if (hasCowk) {
      blocks.push({
        id: "co-wk",

        render: () => (
          <PreviewSection title="CO - WK Mapping">

            <table className="mapping-table">

              <thead>
                <tr>

                  <th>
                    CO
                  </th>


                  {(formData.cowkMapping.headers || [])
                    .map((header, index) => (
                      <th key={index}>
                        {header}
                      </th>
                    ))}

                </tr>
              </thead>


              <tbody>

                {(formData.cowkMapping.rows || [])
                  .filter(
                    (row) =>
                      row &&
                      clean(row.co)
                  )
                  .map(
                    (row, rowIndex) => (
                      <tr key={rowIndex}>

                        <td>
                          {row.co}
                        </td>


                        {(formData.cowkMapping.headers || [])
                          .map((_, index) => (
                            <td key={index}>
                              {row.vals?.[index] ?? ""}
                            </td>
                          ))}

                      </tr>
                    )
                  )}

              </tbody>

            </table>

          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // SUSTAINABLE DEVELOPMENT GOALS
    // =========================================================

    if (sdgs.length > 0) {
      blocks.push({
        id: "sdgs",

        render: () => (
          <PreviewSection
            title="Sustainable Development Goals (SDGs)"
          >

            <table className="sdg-table">

              <thead>
                <tr>

                  <th>
                    Goal No.
                  </th>

                  <th>
                    Goal Title
                  </th>

                  <th>
                    Description
                  </th>

                </tr>
              </thead>


              <tbody>

                {sdgs.map((sdg, index) => (
                  <tr key={index}>

                    <td>
                      {sdg.goalNo}
                    </td>

                    <td>
                      {sdg.goalTitle}
                    </td>

                    <td>
                      {sdg.description}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </PreviewSection>
        ),
      });
    }


    // =========================================================
    // RETURN ALL BLOCKS
    // =========================================================

    return blocks;

  }, [
    formData,
    scheme,

    objectives,
    teachingLearning,
    modernTools,

    modules,
    experiments,

    textbooks,
    references,

    outcomes,
    referralLinks,

    toolsAI,
    prerequisites,

    activityBased,

    termWorkActivities,
    selfLearningActivities,

    guidelines,
    rubrics,

    copoMapping,
    hasCopo,
    hasCowk,

    sdgs,

    examType,
  ]);

  useLayoutEffect(() => {
    let cancelled = false;

    const measure = async () => {
      if (
        !measurePageRef.current ||
        !measureContentRef.current ||
        !measureFooterRef.current
      ) {
        return;
      }

      // Wait until fonts are fully loaded
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Wait for browser layout to settle
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      if (cancelled) return;

      /*
      * IMPORTANT:
      * Do NOT use clientHeight here.
      *
      * Calculate the exact vertical space available
      * between the content area and the footer.
      */
      const footerRect =
        measureFooterRef.current.getBoundingClientRect();

      const contentRect =
        measureContentRef.current.getBoundingClientRect();

      const PAGE_BOTTOM_SAFETY = 6;

      const contentHeight = Math.max(
        0,
        footerRect.top -
          contentRect.top -
          PAGE_BOTTOM_SAFETY
      );

      if (contentHeight <= 0) {
        requestAnimationFrame(measure);
        return;
      }

      const elements =
        measureContentRef.current.querySelectorAll(
          "[data-preview-measure]"
        );

      const contentTop = contentRect.top;

      const measurements = Array.from(elements).map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          id: element.dataset.previewMeasure,
          top: rect.top - contentTop,
          bottom: rect.bottom - contentTop,
          height: rect.height,
        };
      });

      const pages = [];

      let currentPage = [];
      let pageStartTop = 0;

      measurements.forEach((item) => {
        const itemBottom = item.bottom;

        const fitsCurrentPage =
          itemBottom - pageStartTop <= contentHeight;

        if (
          currentPage.length > 0 &&
          !fitsCurrentPage
        ) {
          pages.push(currentPage);

          currentPage = [];
          pageStartTop = item.top;
        }

        currentPage.push(item.id);
      });

      if (currentPage.length > 0) {
        pages.push(currentPage);
      }

      if (!cancelled) {
        setPageGroups(pages);
      }


      // console.log("=== PAGINATION DEBUG ===");
      // console.log("page height:", measurePageRef.current.getBoundingClientRect().height);
      // console.log("content top:", contentRect.top);
      // console.log("content height:", contentRect.height);
      // console.log("footer top:", footerRect.top);

      // console.table(
      //   measurements.map((item) => ({
      //     id: item.id,
      //     height: Math.round(item.height),
      //   }))
      // );

      // console.log("pages:", pages);
    };

    measure();

    /*
    * Recalculate whenever the page dimensions change.
    */
    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    if (measurePageRef.current) {
      resizeObserver.observe(
        measurePageRef.current
      );
    }

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [previewBlocks]);

  const handlePrint = () => {
    if (onPreviewPDF) {
        onPreviewPDF();
    }
    };

  return (
    <div className="syllabus-preview-wrapper">

      {/* Preview toolbar */}
      <div className="preview-toolbar">

        <div className="preview-toolbar-left">
            <span className="preview-title">
            Live Document Preview
            </span>

            <span className="preview-status">
            ● Live
            </span>
        </div>

        <div className="preview-toolbar-right">

            <div className="preview-scheme">
            {scheme} Scheme
            </div>

            <button
            type="button"
            className="preview-print-button"
            onClick={handlePrint}
            title="Print / Download PDF"
            aria-label="Print / Download PDF"
            >
            <Printer size={17} strokeWidth={2} />
            <span>
                {previewBtnText === "Loading PDF.."
                ? "Loading PDF..."
                : "PDF"}
            </span>
            </button>

        </div>

        </div>
        
      {/* A4 DOCUMENT */}
      <div
        className="syllabus-measure-container"
        aria-hidden="true"
      >
        <div
          ref={measurePageRef}
          className="syllabus-page syllabus-measure-page"
        >

          <PreviewHeader
            department={formData.department}
          />

          <div
            ref={measureContentRef}
            className="syllabus-page-content"
          >

            {previewBlocks.map((block) => (
              <div
                key={block.id}
                data-preview-measure={block.id}
                className="preview-pagination-block"
              >
                {block.render()}
              </div>
            ))}

          </div>

          <div ref={measureFooterRef}>
            <PreviewFooter
              pageNumber={1}
              totalPages={1}
            />
          </div>

        </div>
      </div>
      
      <div className="syllabus-pages">

        {pageGroups.map((pageBlockIds, pageIndex) => (
          <div
            className="syllabus-page"
            key={`page-${pageIndex}`}
          >

            <PreviewHeader
              department={formData.department}
            />

            <div className="syllabus-page-content">

              {pageBlockIds.map((blockId) => {

                const block = previewBlocks.find(
                  (item) => item.id === blockId
                );

                if (!block) return null;

                return (
                  <div
                    key={block.id}
                    className="preview-pagination-block"
                  >
                    {block.render()}
                  </div>
                );
              })}

            </div>

            <PreviewFooter
              pageNumber={pageIndex + 1}
              totalPages={pageGroups.length}
            />

          </div>
        ))}

      </div>

    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function PreviewSection({ title, children }) {
  return (
    <section className="preview-section">

      <h3>
        {title}
      </h3>

      {children}

    </section>
  );
}


function PreviewTwSlTable({
  termWork = [],
  selfLearning = []
}) {

  const validTW = termWork.filter(
    (item) =>
      clean(item?.activity) ||
      clean(item?.hours)
  );

  const validSL = selfLearning.filter(
    (item) =>
      clean(item?.activity) ||
      clean(item?.hours)
  );

  if (!validTW.length && !validSL.length) {
    return null;
  }

  const renderRows = (items) =>
    items.map((item, index) => (
      <tr key={index}>
        <td>{index + 1}</td>
        <td>{item.activity || ""}</td>
        <td>{item.hours || ""}</td>
      </tr>
    ));

  return (
    <PreviewSection title="Term Work and Self Learning">

      <table className="twsl-table">

        <thead>
          <tr>
            <th>Sl.No.</th>
            <th>Activity</th>
            <th>Hours / Semester</th>
          </tr>
        </thead>

        <tbody>

          {validTW.length > 0 && (
            <tr className="twsl-section-row">
              <td colSpan="3">
                Term Work (TW)
              </td>
            </tr>
          )}

          {renderRows(validTW)}

          {validSL.length > 0 && (
            <tr className="twsl-section-row">
              <td colSpan="3">
                Self Learning (SL)
              </td>
            </tr>
          )}

          {renderRows(validSL)}

        </tbody>

      </table>

    </PreviewSection>
  );
}