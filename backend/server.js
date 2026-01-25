const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")
require("dotenv").config();


const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const {generateSyllabusDocx} = require("./docx/generateSyllabusDocx");

process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true";
const isProduction = process.env.NODE_ENV === "production";

const app = express();
app.use(express.json());
app.use(cors());

let browserInstance = null;

app.use((req, res, next) => {
  const log = {
    time: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  };

  console.log("USAGE_LOG:", JSON.stringify(log));
  next();
});


const DEFAULT_SECTION_LINES = [
  "This course will enable the students to:",
  "At the end of the course, the student will be able to:",
  "In addition to the traditional chalk and talk method, ICT tools are adopted:",
  "Modern AI tools used for this course:",
  "Web Links:",
  "Activity based learning points:"
];

//Helper functions
function hasMeaningfulContent(input) {
  let arr = [];

  if (Array.isArray(input)) arr = input;
  else if (typeof input === "string") arr = input.split("\n");
  else return false;

  return arr
    .map(v => String(v || "").trim())
    .filter(v => {
      if (!v) return false;

      // ignore empty numbering
      if (/^\d+\.\s*$/.test(v)) return false;

      // 🚫 IGNORE DEFAULT LINES FOR CHECK ONLY
      if (
        DEFAULT_SECTION_LINES.some(
          d => d.toLowerCase() === v.toLowerCase()
        )
      ) {
        return false;
      }

      return true; // ✅ REAL USER CONTENT
    }).length > 0;
}


function escapeHTML(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function boldToHTML(text = "") {
  return String(text).replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
}
function listToHTML(input) {
  let arr = [];

  if (Array.isArray(input)) arr = input;
  else if (typeof input === "string") arr = input.split("\n");
  else return "";

  return arr
    .map(v => String(v || "").trim())
    .filter(v => {
      if (!v) return false;

      // ignore empty numbering
      if (/^\d+\.\s*$/.test(v)) return false;

      // ✅ DO NOT remove default lines here
      return true;
    })
    .map(v => `<li>${boldToHTML(escapeHTML(v))}</li>`)
    .join("");
}

 function getExamType(ct) {
    console.log("type:",typeof(ct),ct)
    let s = ct.split(" ")[1]

    if(s.includes("(T+L)"))
      return("Theory & Lab")
    else if(s.includes("T"))
      return("Theory")
    else if(s.includes("L"))
      return("Lab")

  return "-";
}

//Function to generate PDF
function generateSyllabusHTML(templateHTML, courseData) {
  let html = templateHTML;

  // ================= SIMPLE FIELDS =================
  const simpleFields = [
    "sem", "course_title", "course_code", "credits",
    "pedagogy", "ltps", "exam_hours", "cie", "see",
    "course_type", "exam_type"
  ];

  courseData.exam_type = getExamType(courseData.course_type);

  simpleFields.forEach(key => {
    html = html.replace(
      new RegExp(`{{${key}}}`, "g"),
      escapeHTML(courseData[key] || "")
    );
  });

  // ================= COURSE OBJECTIVES =================
  if (hasMeaningfulContent(courseData.course_objectives)) {
    html = html.replace(
      /{{#each course_objectives}}[\s\S]*?{{\/each}}/g,
      listToHTML(courseData.course_objectives)
    );
  } else {
    // ✅ FIX: Use proper regex with dot-star to match everything
    html = html.replace(
      /<!-- SECTION: COURSE_OBJECTIVES -->[\s\S]*?<!-- END: COURSE_OBJECTIVES -->/,
      ""
    );
  }

  // ================= TEACHING-LEARNING =================
  if (hasMeaningfulContent(courseData.teaching_learning)) {
    html = html.replace(
      /{{#each teaching_learning}}[\s\S]*?{{\/each}}/g,
      listToHTML(courseData.teaching_learning)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: TEACHING_LEARNING -->[\s\S]*?<!-- END: TEACHING_LEARNING -->/,
      ""
    );
  }

  // ================= MODERN TOOLS =================
  if (hasMeaningfulContent(courseData.modern_tools)) {
    html = html.replace(
      /{{#each modern_tools}}[\s\S]*?{{\/each}}/g,
      listToHTML(courseData.modern_tools)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: MODERN_TOOLS -->[\s\S]*?<!-- END: MODERN_TOOLS -->/,
      ""
    );
  }

  // ================= COURSE OUTCOMES =================
  if (hasMeaningfulContent(courseData.course_outcomes)) {
    html = html.replace(
      /{{#each course_outcomes}}[\s\S]*?{{\/each}}/g,
      listToHTML(courseData.course_outcomes)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: Outcomes -->[\s\S]*?<!-- END: Outcomes -->/,
      ""
    );
  }

  // ================= WEB LINKS =================
  if (hasMeaningfulContent(courseData.referral_links)) {
    html = html.replace(
      /{{#each referral_links}}[\s\S]*?{{\/each}}/g,
      listToHTML(courseData.referral_links)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: WebLinks -->[\s\S]*?<!-- END: WebLinks -->/,
      ""
    );
  }

  // ================= ACTIVITY-BASED =================
  if (hasMeaningfulContent(courseData.activity_based)) {
    html = html.replace(
      /{{#each activity_based}}[\s\S]*?{{\/each}}/g,
      listToHTML(courseData.activity_based)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: Activity-Based -->[\s\S]*?<!-- END: Activity-Based -->/,
      ""
    );
  }

  // ================= MODULES =================
  const validModules = (courseData.modules || []).filter(mod =>
    mod && String(mod.content || "").trim() !== ""
  );
  
  let modulesHTML = "";

  if (validModules.length > 0) {
    modulesHTML = validModules
      .map((mod, idx) => `
        <div class="module">
          <div class="module-title">Module ${idx + 1}</div>
          <div class="module-content">
            ${boldToHTML(escapeHTML(mod.content || "-")).replace(/\n/g, "<br>")}
          </div>
          <div class="module-meta">
            <span>Textbook ${escapeHTML(mod.textbook || "-")}</span>
            <span>RBT: ${escapeHTML(mod.rbt || "-")}</span>
            <span>WK: ${escapeHTML(mod.wk || mod.wkt || "-")}</span>
          </div>
        </div>
      `)
      .join("");
  }

  html = html.replace(
    /{{#each modules}}[\s\S]*?{{\/each}}/g,
    modulesHTML
  );

  // ================= EXPERIMENTS =================
  let experimentsHTML = "";

  const validExperiments = (courseData.experiments || []).filter(
    exp => exp && String(exp.cont || "").trim()
  );

  if (validExperiments.length > 0) {
    const rowsHTML = validExperiments
      .map(exp => `
        <tr>
          <td>${escapeHTML(exp.slno)}</td>
          <td style="text-align:left;">
            ${boldToHTML(escapeHTML(exp.cont || "")).replace(/\n/g, "<br>")}
          </td>
        </tr>
      `)
      .join("");

    experimentsHTML = `
      <div class="section">
        <div class="section-title">Practical Components</div>
        <table class="experiments">
          <tr>
            <th class="expSl">Sl. No.</th>
            <th class="expCont">Experiment</th>
          </tr>
          ${rowsHTML}
        </table>
      </div>
    `;
  }

  html = html.replace(
    /{{#each experiments}}[\s\S]*?{{\/each}}/g,
    experimentsHTML
  );

  // ================= TEXTBOOKS =================
  let textbooksHTML = "";

  const validTextbooks = (courseData.textbooks || []).filter(tb =>
    tb &&
    (
      String(tb.author || "").trim() ||
      String(tb.bookTitle || "").trim() ||
      String(tb.publisher || "").trim() ||
      String(tb.year || "").trim()
    )
  );

  if (validTextbooks.length > 0) {
    const rowsHTML = validTextbooks
      .map(tb => `
        <tr>
          <td>${escapeHTML(tb.slNo)||'-'}</td>
          <td>${escapeHTML(tb.author)||'-'}</td>
          <td>${escapeHTML(tb.bookTitle)||'-'}</td>
          <td>${escapeHTML(tb.publisher)||'-'}</td>
          <td>${escapeHTML(tb.year)||'-'}</td>
        </tr>
      `)
      .join("");

    textbooksHTML = `
      <div class="section">
        <div class="section-title">Textbooks</div>
        <table>
          <tr>
            <th>Sl.No</th>
            <th>Author</th>
            <th>Title</th>
            <th>Publisher</th>
            <th>Year</th>
          </tr>
          ${rowsHTML}
        </table>
      </div>
    `;
  }

  html = html.replace("{{TEXTBOOKS_SECTION}}", textbooksHTML);

  // ================= CO–PO–PSO =================
// let copoHTML = "";

// const copo = courseData.copoMapping;

// if (copo && Array.isArray(copo.rows)) {
//   const hasAnyValue = copo.rows.some(row =>
//     [...(row.vals || []), ...(row.pso || [])].some(v => {
//       const n = Number(v);
//       return !isNaN(n) && n > 0;
//     })
//   );

//   if (hasAnyValue) {
//     const poHeaders = copo.headers || [];
//     const psoCount = copo.rows[0]?.pso?.length || 0;

//     const headerHTML = `
//       <tr>
//         <th>CO</th>
//         ${poHeaders.map(h => `<th>${escapeHTML(h)}</th>`).join("")}
//         ${Array.from({ length: psoCount })
//           .map((_, i) => `<th>PSO${i + 1}</th>`)
//           .join("")}
//       </tr>
//     `;

//     const rowsHTML = copo.rows
//       .map(row => `
//         <tr>
//           <td>${escapeHTML(row.co)}</td>
//           ${(row.vals || []).map(v => `<td>${v || ""}</td>`).join("")}
//           ${(row.pso || []).map(v => `<td>${v || ""}</td>`).join("")}
//         </tr>
//       `)
//       .join("");

//     copoHTML = `
//       <div class="section">
//         <div class="section-title" style="text-align:center;">
//           CO–PO–PSO Mapping
//         </div>
//         <table class="copo">
//           ${headerHTML}
//           ${rowsHTML}
//         </table>
//       </div>
//     `;
//   }
// }

// html = html.replace("{{COPO_TABLE}}", copoHTML);

let copoHTML = "";

const copo = courseData.copoMapping;

if (copo && Array.isArray(copo.rows)) {

  // ---------- STEP 1: FILTER VALID ROWS ----------
  const validRows = copo.rows.filter(row =>
    [...(row.vals || []), ...(row.pso || [])].some(v => {
      const n = Number(v);
      return !isNaN(n) && n > 0;
    })
  );

  if (validRows.length === 0) {
    html = html.replace("{{COPO_TABLE}}", "");
    return html;
  }

  // ---------- STEP 2: FILTER PO COLUMNS ----------
  const poHeaders = copo.headers || [];

  const validPOIndexes = poHeaders
    .map((_, idx) =>
      validRows.some(r => Number(r.vals?.[idx]) > 0)
    )
    .map((keep, idx) => keep ? idx : -1)
    .filter(idx => idx !== -1);

  // ---------- STEP 3: FILTER PSO COLUMNS ----------
  const psoCount = validRows[0]?.pso?.length || 0;

  const validPSOIndexes = Array.from({ length: psoCount })
    .map((_, idx) =>
      validRows.some(r => Number(r.pso?.[idx]) > 0)
    )
    .map((keep, idx) => keep ? idx : -1)
    .filter(idx => idx !== -1);

  if (validPOIndexes.length === 0 && validPSOIndexes.length === 0) {
    html = html.replace("{{COPO_TABLE}}", "");
    return html;
  }

  // ---------- STEP 4: HEADER ----------
  const headerHTML = `
    <tr>
      <th>CO</th>
      ${validPOIndexes.map(i => `<th>${escapeHTML(poHeaders[i])}</th>`).join("")}
      ${validPSOIndexes.map(i => `<th>PSO${i + 1}</th>`).join("")}
    </tr>
  `;

  // ---------- STEP 5: DATA ROWS ----------
  const rowsHTML = validRows.map(row => `
    <tr>
      <td>${escapeHTML(row.co)}</td>
      ${validPOIndexes.map(i => `<td>${row.vals?.[i] || ""}</td>`).join("")}
      ${validPSOIndexes.map(i => `<td>${row.pso?.[i] || ""}</td>`).join("")}
    </tr>
  `).join("");

  // ---------- STEP 6: AVG ROW (🔥 NEW PART) ----------
  const avgRowHTML = `
    <tr>
      <td><strong>AVG</strong></td>

      ${validPOIndexes.map(i => {
        let sum = 0, count = 0;

        validRows.forEach(row => {
          const val = Number(row.vals?.[i]);
          if (!isNaN(val) && val > 0) {
            sum += val;
            count++;
          }
        });

        return `<td>${count ? (sum / count).toFixed(1) : ""}</td>`;
      }).join("")}

      ${validPSOIndexes.map(i => {
        let sum = 0, count = 0;

        validRows.forEach(row => {
          const val = Number(row.pso?.[i]);
          if (!isNaN(val) && val > 0) {
            sum += val;
            count++;
          }
        });

        return `<td>${count ? (sum / count).toFixed(1) : ""}</td>`;
      }).join("")}
    </tr>
  `;

  // ---------- STEP 7: FINAL TABLE ----------
  copoHTML = `
    <div class="section">
      <div class="section-title" style="text-align:center;">
        CO–PO–PSO Mapping
      </div>

      <table class="copo">
        ${headerHTML}
        ${rowsHTML}
        ${avgRowHTML}
      </table>
    </div>
  `;
}


html = html.replace("{{COPO_TABLE}}", copoHTML);


  return html;
}



//Function to run CHROME Browser
async function launchBrowser() {
  if (browserInstance) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch(
    isProduction
      ? {
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
      : {
          executablePath:
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          headless: true,
        }
  );

  console.log("🚀 Browser launched");
  return browserInstance;
}

app.get("/",(req,res)=>{
    res.send("Hello From The Backend Server...")
})
app.get("/health", (_, res) => {
  res.status(200).send("OK");
});

app.post('/generate-pdf', async (req, res) => {

  try {
    const courseData = req.body;

    // console.log("COURSE :",courseData) 
    // console.log("Received course data:", JSON.stringify(courseData, null, 2));
    
    // Read HTML template
    const templatePath = path.join(__dirname, "template", "pdf-template.html");
    
    if (!fs.existsSync(templatePath)) {
      return res.status(500).send("Template file not found at: " + templatePath);
    }
    
    const templateHTML = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    const finalHTML = generateSyllabusHTML(templateHTML, courseData);
    
    console.log("Generated HTML (first 500 chars):", finalHTML.substring(0, 500));

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(finalHTML, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm"
      }
    });
    
    // await browser.close();
    await page.close(); // ✅ keep browser alive

    // console.log("PDF generated successfully, size:", pdfBuffer.length, "bytes");
    
    // ✅ Send PDF (Render-safe)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
    "Content-Disposition",
    "attachment; filename=syllabus.pdf"
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.end(pdfBuffer, "binary");    
} catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      message: error.message,
      stack: error.stack
    });
  }
});


function buildCopoTableWord(courseData) {
  const copo = courseData.copoMapping;
  if (!copo || !Array.isArray(copo.rows)) return "";

  const validRows = copo.rows.filter(row =>
    [...(row.vals || []), ...(row.pso || [])].some(v => Number(v) > 0)
  );

  if (!validRows.length) return "";

  const poHeaders = copo.headers || [];
  const psoCount = validRows[0]?.pso?.length || 0;

  let header = `
    <tr>
      <th>CO</th>
      ${poHeaders.map(h => `<th>${h}</th>`).join("")}
      ${Array.from({ length: psoCount }).map((_, i) => `<th>PSO${i + 1}</th>`).join("")}
    </tr>
  `;

  let rows = validRows.map(row => `
    <tr>
      <td>${row.co}</td>
      ${(row.vals || []).map(v => `<td>${v || ""}</td>`).join("")}
      ${(row.pso || []).map(v => `<td>${v || ""}</td>`).join("")}
    </tr>
  `).join("");

  return `
    <p><strong>CO–PO–PSO Mapping</strong></p>
    <table border="1" cellpadding="4" cellspacing="0">
      ${header}
      ${rows}
    </table>
  `;
}

function generateSyllabusHTML_DOCX(templateHTML, courseData) {
  function getExamType({ course_type = "", ltps = "" } = {}) {
  const ct = String(course_type).toUpperCase();

  // 1️⃣ Prefer explicit course_type
  if (ct.includes("T+L")) return "Theory & Lab";
  if (ct === "T") return "Theory";
  if (ct === "L") return "Lab";

  // 2️⃣ Fallback to LTPS
  const [L, T, P] = String(ltps).split(":").map(Number);

  if (L > 0 && P > 0) return "Theory & Lab";
  if (L > 0) return "Theory";
  if (P > 0) return "Lab";

  return "-";
}


  let html = templateHTML;

  const simpleFields = [
    "sem", "course_title", "course_code", "credits",
    "pedagogy", "ltps", "exam_hours", "cie", "see",
    "course_type","exam_type"
  ];


console.log(courseData)
  simpleFields.forEach(key => {
    html = html.replace(
      new RegExp(`{{${key}}}`, "g"),
      escapeHTML(courseData[key] || "")
    );
  });

  // ---------- LIST HELPERS ----------
  const listToWord = (arr = []) =>
    arr
      .map(v => `<li>${escapeHTML(v)}</li>`)
      .join("");

  // ---------- COURSE OBJECTIVES ----------
  if (hasMeaningfulContent(courseData.course_objectives)) {
    html = html.replace(
      /{{#each course_objectives}}[\s\S]*?{{\/each}}/g,
      listToWord(courseData.course_objectives)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: COURSE_OBJECTIVES -->[\s\S]*?<!-- END: COURSE_OBJECTIVES -->/,
      ""
    );
  }

  // ---------- TEACHING ----------
  if (hasMeaningfulContent(courseData.teaching_learning)) {
    html = html.replace(
      /{{#each teaching_learning}}[\s\S]*?{{\/each}}/g,
      listToWord(courseData.teaching_learning)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: TEACHING_LEARNING -->[\s\S]*?<!-- END: TEACHING_LEARNING -->/,
      ""
    );
  }

  // ---------- OUTCOMES ----------
  if (hasMeaningfulContent(courseData.course_outcomes)) {
    html = html.replace(
      /{{#each course_outcomes}}[\s\S]*?{{\/each}}/g,
      listToWord(courseData.course_outcomes)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: Outcomes -->[\s\S]*?<!-- END: Outcomes -->/,
      ""
    );
  }

  // ---------- CO–PO TABLE ----------
  html = html.replace("{{COPO_TABLE}}", buildCopoTableWord(courseData));

  return html;
}

app.post("/generate-docx", async (req, res) => {
  try {
    const buffer = await generateSyllabusDocx(req.body);

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=syllabus.docx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.send(buffer);
  } catch (err) {
    console.error("DOCX ERROR:", err);
    res.status(500).json({ error: "DOCX generation failed" });
  }
});

const PORT = 8000;
app.listen(PORT,()=>{
    console.log(`Listening to the PORT:${PORT}\nhttp://localhost:${PORT}/`)
})