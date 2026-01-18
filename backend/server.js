const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")
require("dotenv").config();


const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true";
const isProduction = process.env.NODE_ENV === "production";


const app = express();
app.use(express.json());
app.use(cors());

let browserInstance = null;


const DEFAULT_SECTION_LINES = [
  "This course will enable the students to:",
  "At the end of the course, the student will be able to:",
  "In addition to the traditional chalk and talk method, ICT tools are adopted:",
  "Modern AI tools used for this course:",
  "Add Web Links:",
  "Add Activity based learning points:"
];

//Helper functions
function hasMeaningfulContent(input) {
  // ✅ Normalize input to array
  let arr = [];

  if (Array.isArray(input)) {
    arr = input;
  } else if (typeof input === "string") {
    arr = input.split("\n");
  } else {
    return false;
  }

  return arr
    .map(v => String(v || "").trim())
    .filter(v => {
      if (!v) return false;

      // ❌ ignore pure numbering like "1."
      if (/^\d+\.\s*$/.test(v)) return false;

      // ❌ ignore boilerplate default lines
      if (
        DEFAULT_SECTION_LINES.some(
          d => d.toLowerCase() === v.toLowerCase()
        )
      ) {
        return false;
      }

      return true; // ✅ REAL content
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
  // ✅ Normalize input into array
  let arr = [];

  if (Array.isArray(input)) {
    arr = input;
  } else if (typeof input === "string") {
    arr = input.split("\n");
  } else {
    return "";
  }

  return arr
    .map(v => String(v || "").trim())
    .filter(v => {
      if (!v) return false;

      // ❌ remove "2." or "3." only
      if (/^\d+\.\s*$/.test(v)) return false;

      return true;
    })
    .map(v => `<li>${boldToHTML(escapeHTML(v))}</li>`)
    .join("");
}

//FUnction to generate PDF
function generateSyllabusHTML(templateHTML, courseData) {
  let html = templateHTML;

  // ================= SIMPLE FIELDS =================
  const simpleFields = [
    "sem", "course_title", "course_code", "credits",
    "pedagogy", "ltps", "exam_hours", "cie", "see",
    "course_type", "exam_type"
  ];

  simpleFields.forEach(key => {
    html = html.replace(
      new RegExp(`{{${key}}}`, "g"),
      escapeHTML(courseData[key] || "")
    );
  });

  // ================= LIST SECTIONS =================
  if (hasMeaningfulContent(courseData.course_objectives)) {
  html = html.replace(
    /{{#each course_objectives}}[\s\S]*?{{\/each}}/g,
    listToHTML(courseData.course_objectives)
  );
} else {
  html = html.replace(
    /<!-- SECTION: COURSE_OBJECTIVES -->[\s\S]*?<!-- END: COURSE_OBJECTIVES -->/g,
    ""
  );
}

  
if (hasMeaningfulContent(courseData.teaching_learning)) {
  html = html.replace(
    /{{#each teaching_learning}}[\s\S]*?{{\/each}}/g,
    listToHTML(courseData.teaching_learning)
  );
} else {
  html = html.replace(
    /<!-- SECTION: TEACHING_LEARNING -->[\s\S]*?<!-- END: TEACHING_LEARNING -->/g,
    ""
  );
}

  
  if (hasMeaningfulContent(courseData.modern_tools)) {
  html = html.replace(
    /{{#each modern_tools}}[\s\S]*?{{\/each}}/g,
    listToHTML(courseData.modern_tools)
  );
} else {
  html = html.replace(
    /<!-- SECTION: MODERN_TOOLS -->[\s\S]*?<!-- END: MODERN_TOOLS -->/g,
    ""
  );
}

  if (hasMeaningfulContent(courseData.course_outcomes)) {
  html = html.replace(
    /{{#each course_outcomes}}[\s\S]*?{{\/each}}/g,
    listToHTML(courseData.course_outcomes)
  );
} else {
  html = html.replace(
    /<!-- SECTION: Outcomes -->[\s\S]*?<!-- END: Outcomes -->/g,
    ""
  );
}

if (hasMeaningfulContent(courseData.referral_links)) {
  html = html.replace(
  /{{#each referral_links}}[\s\S]*?{{\/each}}/g,
  listToHTML(courseData.referral_links)
  );
} else {
  html = html.replace(
    /<!-- SECTION: WebLinks -->[\s\S]*?<!-- END: WebLinks -->/g,
    ""
  );
}

if (hasMeaningfulContent(courseData.activity_based)) {
  html = html.replace(
    /{{#each activity_based}}[\s\S]*?{{\/each}}/g,
    listToHTML(courseData.activity_based)
  );
} else {
  html = html.replace(
    /<!-- SECTION: Activity-Based -->[\s\S]*?<!-- END: Activity-Based -->/g,
    ""
  );
}  

  // ================= MODULES =================
  const validModules = (courseData.modules || []).filter(mod =>
  mod &&
  String(mod.content || "").trim() !== ""
);
let modulesHTML = "";

if (validModules.length > 0) {
  modulesHTML = `
    <div class="u">
      ${validModules
        .map(
          (mod, idx) => `
          <div class="module">
            <div class="module-title">Module ${idx + 1}</div>

            <div class="module-content">
              ${boldToHTML(
                escapeHTML(mod.content || "")
              ).replace(/\n/g, "<br>")}
            </div>

            <div class="module-meta">
              <span>Textbook ${escapeHTML(mod.textbook || "")}</span>
              <span>RBT: ${escapeHTML(mod.rbt || "")}</span>
              <span>WK: ${escapeHTML(mod.wk || mod.wkt || "")}</span>
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;
}

  html = html.replace(
  /{{#each modules}}[\s\S]*?{{\/each}}/g,
  modulesHTML
);



  /* EXPERIMENTS */
let experimentsHTML = "";

const validExperiments = (courseData.experiments || []).filter(
  exp => exp && String(exp.cont || "").trim()
);

if (validExperiments.length > 0) {
  const rowsHTML = validExperiments
    .map(
      exp => `
        <tr>
          <td>${escapeHTML(exp.slno)}</td>
          <td style="text-align:left;">
            ${boldToHTML(escapeHTML(exp.cont || "")).replace(/\n/g, "<br>")}
          </td>
        </tr>
      `
    )
    .join("");

  experimentsHTML = `
    <div class="section">
      <div class="section-title">Practical Components</div>
      <table class="experiments">
        <tr>
          <th>Sl. No.</th>
          <th>Experiment</th>
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
  const rowsHTML = validTextbooks.map(tb => `
    <tr>
      <td>${escapeHTML(tb.slNo)}</td>
      <td>${escapeHTML(tb.author)}</td>
      <td>${escapeHTML(tb.bookTitle)}</td>
      <td>${escapeHTML(tb.publisher)}</td>
      <td>${escapeHTML(tb.year)}</td>
    </tr>
  `).join("");

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
  if (courseData.copoMapping) {
    const { headers = [], rows = [] } = courseData.copoMapping;

    const poHeaders = headers.map(h => `<th>${h}</th>`).join("");
    const psoCount = rows[0]?.pso?.length || 0;
    const psoHeaders = Array.from({ length: psoCount })
      .map((_, i) => `<th>PSO${i + 1}</th>`)
      .join("");

    html = html.replace(
      /{{#each copoMapping\.headers}}[\s\S]*?{{\/each}}/g,
      poHeaders
    );

    html = html.replace(
      /{{#each copoMapping\.rows\.\[0\]\.pso}}[\s\S]*?{{\/each}}/g,
      psoHeaders
    );

    const rowsHTML = rows.map(row => `
      <tr>
        <td>${row.co}</td>
        ${row.vals.map(v => `<td>${v || ""}</td>`).join("")}
        ${row.pso.map(v => `<td>${v || ""}</td>`).join("")}
      </tr>
    `).join("");

    html = html.replace(
      /{{#each copoMapping\.rows}}[\s\S]*?{{\/each}}/g,
      rowsHTML
    );
  }

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

app.post('/generate-pdf', async (req, res) => {

  try {
    const courseData = req.body;

    // console.log("COURSE :",courseData) 
    // console.log("Received course data:", JSON.stringify(courseData, null, 2));
    
    // Read HTML template
    const templatePath = path.join(__dirname, "pdf-template", "syllabus.html");
    
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


const PORT = 8000;
app.listen(PORT,()=>{
    console.log(`Listening to the PORT:${PORT}\nhttp://localhost:${PORT}/`)
})