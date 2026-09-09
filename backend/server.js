const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")
require("dotenv").config();

const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const {generateSyllabusDocx} = require("./docx/generateSyllabusDocx");
const connectDB = require("./db");
const Stats = require("./models/Stats");

const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const mammoth = require("mammoth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed."));
    }
  },
});

process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true";
const isProduction = process.env.NODE_ENV === "production";

// Connect to MongoDB
connectDB();

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
  "**This course will enable the students to:**",
  "**At the end of the course, the student will be able to:**",
  "**In addition to the traditional chalk and talk method, ICT tools are adopted:**",
  "**Modern AI tools used for this course:**",
  "**Web Links:**",
  "**Activity based learning points:**"
];

//Helper functions
function hasMeaningfulContent(input) {
  let arr = [];

  if (Array.isArray(input)) {
    arr = input;
  } else if (typeof input === "string") {
    arr = input.split(/\r?\n/);
  } else {
    return false;
  }

  return arr.some((value) => {
    const line = String(value ?? "").trim();

    // Ignore completely empty lines
    if (!line) return false;

    // Ignore default/helper text
    if (
      DEFAULT_SECTION_LINES.some(
        (defaultLine) =>
          defaultLine.trim().toLowerCase() === line.toLowerCase()
      )
    ) {
      return false;
    }

    // Ignore empty numbered points:
    // "1.", "1. ", "2.", "10.    "
    if (/^\d+\.\s*$/.test(line)) {
      return false;
    }

    // Ignore other empty numbering formats if present:
    // "1)", "1 -", "1:"
    if (/^\d+\s*[\):\-]\s*$/.test(line)) {
      return false;
    }

    // Anything else is actual user content
    return true;
  });
}
const DEFAULT_MODERN_TOOLS_LINES = [
  "**Modern AI tools used for this course:**"
];

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

      // ignore numbering like "1." or "2"
      if (/^\d+\.?$/.test(v)) return false;

      // ignore default heading
      if (
        DEFAULT_MODERN_TOOLS_LINES.some(
          d => d.toLowerCase() === v.toLowerCase()
        )
      ) return false;

      return true; // ✅ real user content
    })
    .length > 0;
}

function is2025Scheme(courseData = {}) {
  return String(courseData?.scheme_year || "2024").trim() === "2025";
}

function hasRealContent(arr = []) {
  if (!Array.isArray(arr)) return false;

  return arr
    .slice(1) // 🔪 remove first heading element
    .some(item =>
      typeof item === "string" &&
      item.trim().length > 3 &&          // avoids "1.", "fg", etc
      !/^\d+\.?$/.test(item.trim())     // avoids "1." "2"
    );
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

function hasMeaningfulActivityRows(items = []) {
  return Array.isArray(items) && items.some(item => {
    const activity = String(item?.activity || "").trim();
    const hours = String(item?.hours || "").trim();
    return activity || hours;
  });
}

function buildActivityTableHTML(title, items = []) {
  const rows = (Array.isArray(items) ? items : [])
    .filter(item => {
      const activity = String(item?.activity || "").trim();
      const hours = String(item?.hours || "").trim();
      return activity || hours;
    })
    .map((item, index) => `
      <tr>
        <td class="expSl">${index + 1}</td>
        <td style="text-align:left;">${escapeHTML(item?.activity || "-")}</td>
        <td class="twslHours">${escapeHTML(item?.hours || "-")}</td>
      </tr>
    `)
    .join("");

  if (!rows) return "";

  return `
    <div class="section">
      <div class="section-title">${escapeHTML(title)}</div>
      <table class="experiments twsl-table">
        <thead>
          <tr>
            <th class="expSl">Sl. No.</th>
            <th>Activity</th>
            <th class="twslHours">Hours / Semester</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

  
                                                                                                                                                                                        
function buildTwSlTableHTML(termWork = [], selfLearning = []) {

    // Get only entries that contain at least activity OR hours
      const validTW = Array.isArray(termWork)
          ? termWork.filter(item =>
                  String(item?.activity || "").trim() ||
                          String(item?.hours || "").trim()
                                )
                                    : [];

                                      const validSL = Array.isArray(selfLearning)
                                          ? selfLearning.filter(item =>
                                                  String(item?.activity || "").trim() ||
                                                          String(item?.hours || "").trim()
                                                                )
                                                                    : [];


                                                                      // If neither TW nor SL has data,
                                                                        // don't display the table at all.
                                                                          if (validTW.length === 0 && validSL.length === 0) {
                                                                              return "";
                                                                                }


                                                                                  // =========================================================
                                                                                    // TERM WORK SECTION
                                                                                      // Only generated when TW has at least one entry
                                                                                        // =========================================================

                                                                                          let twSection = "";

                                                                                            if (validTW.length > 0) {

                                                                                                const twRows = validTW.map((item, index) => `
                                                                                                      <tr>
                                                                                                              <td class="twsl-slno">
                                                                                                                        ${index + 1}.
                                                                                                                                </td>

                                                                                                                                        <td class="twsl-activity">
                                                                                                                                                  ${escapeHTML(item.activity || "")}
                                                                                                                                                          </td>

                                                                                                                                                                  <td class="twsl-hours">
                                                                                                                                                                            ${escapeHTML(item.hours || "")}
                                                                                                                                                                                    </td>
                                                                                                                                                                                          </tr>
                                                                                                                                                                                              `).join("");


                                                                                                                                                                                                  twSection = `
                                                                                                                                                                                                  

                                                                                                                                                                                                              <tr class="twsl-column-header">

                                                                                                                                                                                                                      <th class="twsl-slno">
                                                                                                                                                                                                                                SL. NO
                                                                                                                                                                                                                                        </th>

                                                                                                                                                                                                                                                <th class="twsl-activity">
                                                                                                                                                                                                                                                          Term work (TW)
                                                                                                                                                                                                                                                                    (Assignment / Seminar / Micro projects /
                                                                                                                                                                                                                                                                              Industrial visit, with any other student activities, etc.)
                                                                                                                                                                                                                                                                                      </th>

                                                                                                                                                                                                                                                                                              <th class="twsl-hours">
                                                                                                                                                                                                                                                                                                        Number of hours / semester
                                                                                                                                                                                                                                                                                                                </th>

                                                                                                                                                                                                                                                                                                                      </tr>

                                                                                                                                                                                                                                                                                                                            <!-- TERM WORK DATA -->

                                                                                                                                                                                                                                                                                                                                  ${twRows}
                                                                                                                                                                                                                                                                                                                                      `;
                                                                                                                                                                                                                                                                                                                                        }


                                                                                                                                                                                                                                                                                                                                          // =========================================================
                                                                                                                                                                                                                                                                                                                                            // SELF LEARNING SECTION
                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                          

                                                                                                                                                                                                                                                                                                                                                  let slSection = "";

                                                                                                                                                                                                                                                                                                                                                    if (validSL.length > 0) {

                                                                                                                                                                                                                                                                                                                                                        const slRows = validSL.map((item, index) => `
                                                                                                                                                                                                                                                                                                                                                              <tr>
                                                                                                                                                                                                                                                                                                                                                                      <td class="twsl-slno">
                                                                                                                                                                                                                                                                                                                                                                                ${index + 1}.
                                                                                                                                                                                                                                                                                                                                                                                        </td>

                                                                                                                                                                                                                                                                                                                                                                                                <td class="twsl-activity">
                                                                                                                                                                                                                                                                                                                                                                                                          ${escapeHTML(item.activity || "")}
                                                                                                                                                                                                                                                                                                                                                                                                                  </td>

                                                                                                                                                                                                                                                                                                                                                                                                                          <td class="twsl-hours">
                                                                                                                                                                                                                                                                                                                                                                                                                                    ${escapeHTML(item.hours || "")}
                                                                                                                                                                                                                                                                                                                                                                                                                                            </td>
                                                                                                                                                                                                                                                                                                                                                                                                                                                  </tr>
                                                                                                                                                                                                                                                                                                                                                                                                                                                      `).join("");


                                                                                                                                                                                                                                                                                                                                                                                                                                                          slSection = `
                                                                                                                                                                                                                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <tr class="twsl-column-header">

                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <th class="twsl-slno">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        SL. NO
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </th>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <th class="twsl-activity">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  Self learning (SL)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            [MOOC / Spoken tutorials /
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      online educational resources etc.]
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </th>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <th class="twsl-hours">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                Number of hours / semester
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </th>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </tr>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ${slRows}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                }


                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  // =========================================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    // ONE TABLE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      // =========================================================

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        return `
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <div class="section">

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <div class="section-title">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          Term Work (TW) and Self Learning (SL)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  components in Number of hours / semester
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <table class="twsl-table">

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <tbody>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ${twSection}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ${slSection}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </tbody>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </table>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                              
                                                                                                                

                                                                                                                                    
                                                                                                                                        
                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                    
                                                                                                                                                          
                                                                                                                                                              
                                                                                                                                                                  
                                                                                                                                                                    
                                                                                                                                                  
                                                                                                                                                                            
                                                                                                                                                                                  
                                                                                                                                                                                    

                                                                                                                                                                                              
                                                                                                                                                                                                  
                                                                                                                                                                                                        

                                                                                                                                                                                                            
                                                                                                                                                                                                                          
                                                                                                                                                                                                                              
                                                                                                                                                                                                                                  
                                                                                                                                                                                  
                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                  

                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                          
                                                                                                                                                                                        
                                                                                                                                                                                                                                                                


                                                                                                                                                      
                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                


                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                  
function getTotalHours(ltps) {

  if (!ltps) return "";

  const nums = ltps
      .split(":")
      .map(Number)
      .filter(n => !isNaN(n));

  const total = nums.reduce((a,b)=>a+b,0);

  return `${ltps}=${total}`;
}


function OutcomeslistToHTML(input) {

  let arr = [];

  if (Array.isArray(input)) arr = input;
  else if (typeof input === "string") arr = input.split("\n");
  else return "";

  // Words to auto-bold
  const autoBoldWords = [
    "application",
    "applications",
    "apply",
    "applied",
    "important",
    "definition",
    "algorithm",
    "algorithms",
    "example",
    "understand"
  ];

  return arr
    .map(v => String(v || "").trim())

    .filter(v => {

      if (!v) return false;

      // Ignore empty numbering like "1."
      if (/^\d+\.\s*$/.test(v)) return false;

      return true;
    })

    .map(v => {

      // Escape HTML first
      let text = escapeHTML(v);

      // Convert **bold** syntax
      text = boldToHTML(text);

      // Auto-bold matching words
      autoBoldWords.forEach(word => {

        const regex = new RegExp(`\\b(${word})\\b`, "gi");

        text = text.replace(regex, "<strong>$1</strong>");
      });

      // ✅ Make first word bold
      text = text.replace(
  /^(\d+\.\s*)?(\S+)/,
  (match, numbering, firstWord) => {
    return `${numbering || ""}<strong>${firstWord}</strong>`;
  }
);

      return `<li>${text}</li>`;
    })

    .join("");
}

 function getExamType(ct = "") {
  if (!ct || typeof ct !== "string") return "-";

  const upper = ct.toUpperCase();

  if (upper.includes("T+L")) return "Theory & Lab";
  if (upper.includes("(T)") || upper.endsWith(" T")) return "Theory";
  if (upper.includes("(L)") || upper.endsWith(" L")) return "Lab";
  if (upper.includes("(M)") || upper.endsWith("M")) return "MCQ";

  return "-";
}
function removeFirstItem(arr = []) {
  return Array.isArray(arr) ? arr.slice(1) : [];
}

function splitExperimentContent(text, maxLines = 3) {
  if (!text) return [];

  const lines = text
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);

  const chunks = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    chunks.push(lines.slice(i, i + maxLines).join("<br>"));
  }

  return chunks;
}

// =========================================================
// RENDER HTML → PDF
// =========================================================

async function renderHTMLToPDF(html) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm"
      }
    });

    return pdfBuffer;
  } finally {
    await page.close();
  }
}

// =========================================================
// SPLIT GENERATED SYLLABUS HTML
// =========================================================
//
// The generated syllabus contains:
//
//   ... Rubrics table ...
//
//   <!-- RUBRIC_DOCUMENT_INSERT_POINT -->
//
//   ... CO-PO-PSO and remaining sections ...
//
// We split the document at that exact location.
// =========================================================

function splitHTMLAtRubricMarker(fullHTML) {
  const marker = "<!-- RUBRIC_DOCUMENT_INSERT_POINT -->";

  const markerIndex = fullHTML.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(
      "Rubric document insertion marker was not found in generated HTML."
    );
  }

  // -------------------------------------------------------
  // Find <head>...</head>
  // -------------------------------------------------------

  const headMatch = fullHTML.match(
    /<head[^>]*>([\s\S]*?)<\/head>/i
  );

  const headHTML = headMatch
    ? headMatch[1]
    : `
      <meta charset="UTF-8">
    `;

  // -------------------------------------------------------
  // Find <body>...</body>
  // -------------------------------------------------------

  const bodyOpenMatch = fullHTML.match(
    /<body[^>]*>/i
  );

  const bodyCloseMatch = fullHTML.match(
    /<\/body>/i
  );

  if (!bodyOpenMatch || !bodyCloseMatch) {
    throw new Error(
      "Could not find body tags in generated syllabus HTML."
    );
  }

  const bodyStart = bodyOpenMatch.index +
    bodyOpenMatch[0].length;

  const bodyEnd = bodyCloseMatch.index;

  const bodyHTML = fullHTML.substring(
    bodyStart,
    bodyEnd
  );

  // -------------------------------------------------------
  // Find marker relative to body
  // -------------------------------------------------------

  const relativeMarkerIndex =
    markerIndex - bodyStart;

  if (
    relativeMarkerIndex < 0 ||
    relativeMarkerIndex > bodyHTML.length
  ) {
    throw new Error(
      "Invalid rubric marker position."
    );
  }

  let beforeBody =
    bodyHTML.substring(
      0,
      relativeMarkerIndex
    );

  let afterBody =
    bodyHTML.substring(
      relativeMarkerIndex + marker.length
    );

  // -------------------------------------------------------
  // Remove the outer wrapper generated by
  // generateSyllabusHTML()
  //
  // Your current generator adds:
  //
  // <div style="padding-bottom: 120px;">
  //    ...
  // </div>
  //
  // We don't want to split that wrapper between PDFs.
  // -------------------------------------------------------

  // =========================================================
  // RUBRIC DOCUMENT HEADING
  // =========================================================

  beforeBody += `
    <div class="section rubric-document-section">
      <div class="section-title">
        Rubrics Document
      </div>
    </div>
  `;

  const wrapperStart =
    '<div style="padding-bottom: 120px;">';

  if (beforeBody.trim().startsWith(wrapperStart)) {
    beforeBody =
      beforeBody.trim().substring(
        wrapperStart.length
      );
  }

  const wrapperEnd =
    "</div>";

  if (afterBody.trim().endsWith(wrapperEnd)) {
    afterBody =
      afterBody.trim().substring(
        0,
        afterBody.trim().length -
          wrapperEnd.length
      );
  }

  // -------------------------------------------------------
  // Shared PDF styling
  // -------------------------------------------------------

  const sharedStyle = `
    <style>
      body {
        transform: scale(0.97);
        transform-origin: top;
      }

      tr {
        page-break-inside: avoid;
      }
    </style>
  `;

  // -------------------------------------------------------
  // Build two COMPLETE HTML documents
  // -------------------------------------------------------

  const beforeHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        ${headHTML}
        ${sharedStyle}
      </head>

      <body>
        <div style="padding-bottom: 120px;">
          ${beforeBody}
        </div>
      </body>
    </html>
  `;

  const afterHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        ${headHTML}
        ${sharedStyle}
      </head>

      <body>
        <div style="padding-bottom: 120px;">
          ${afterBody}
        </div>
      </body>
    </html>
  `;

  return {
    beforeHTML,
    afterHTML
  };
}

// =========================================================
// CONVERT UPLOADED RUBRIC DOCUMENT → PDF
// =========================================================

async function convertRubricDocumentToPDF(rubricFile) {

  // =======================================================
  // PDF
  // =======================================================

  if (rubricFile.mimetype === "application/pdf") {

    // Already PDF.
    // Keep the original PDF exactly as uploaded.
    return rubricFile.buffer;
  }

  // =======================================================
  // DOCX
  // =======================================================

  if (
    rubricFile.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {

    const result = await mammoth.convertToHtml({
      buffer: rubricFile.buffer
    });

    const docxHTML = `
      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="UTF-8">

          <style>

            @page {
              size: A4;
              margin: 20mm 15mm;
            }

            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: #111;
            }

            img {
              max-width: 100%;
              height: auto;
            }

            table {
              border-collapse: collapse;
              width: 100%;
            }

            td,
            th {
              border: 1px solid #999;
              padding: 5px;
            }

            h1 {
              font-size: 20px;
            }

            h2 {
              font-size: 17px;
            }

            h3 {
              font-size: 15px;
            }

            p {
              margin: 0 0 8px 0;
            }

            ul,
            ol {
              margin-top: 5px;
              margin-bottom: 8px;
            }

          </style>

        </head>

        <body>

          ${result.value}

        </body>

      </html>
    `;

    return await renderHTMLToPDF(docxHTML);
  }

  throw new Error(
    "Unsupported rubric document type."
  );
}

// =========================================================
// MERGE:
// SYLLABUS PART 1
// +
// RUBRIC DOCUMENT
// +
// SYLLABUS PART 2
// =========================================================

async function mergePDFBuffers(
  beforePdfBuffer,
  rubricPdfBuffer,
  afterPdfBuffer
) {
  const finalPdf = await PDFDocument.create();

  // =======================================================
  // PART 1
  // =======================================================

  if (beforePdfBuffer) {

    const beforePdf =
      await PDFDocument.load(beforePdfBuffer);

    const beforePages =
      await finalPdf.copyPages(
        beforePdf,
        beforePdf.getPageIndices()
      );

    beforePages.forEach(page => {
      finalPdf.addPage(page);
    });
  }

  // =======================================================
  // RUBRIC DOCUMENT
  // =======================================================

  if (rubricPdfBuffer) {

    const rubricPdf =
      await PDFDocument.load(rubricPdfBuffer);

    const rubricPages =
      await finalPdf.copyPages(
        rubricPdf,
        rubricPdf.getPageIndices()
      );

    rubricPages.forEach(page => {
      finalPdf.addPage(page);
    });
  }

  // =======================================================
  // PART 2
  // =======================================================

  if (afterPdfBuffer) {

    const afterPdf =
      await PDFDocument.load(afterPdfBuffer);

    const afterPages =
      await finalPdf.copyPages(
        afterPdf,
        afterPdf.getPageIndices()
      );

    afterPages.forEach(page => {
      finalPdf.addPage(page);
    });
  }

  return Buffer.from(
    await finalPdf.save()
  );
}
// ================= GUIDELINES & RUBRICS =================

function buildGuidelinesRubricsHTML(courseData) {

  const guidelines = Array.isArray(courseData.guidelines)
    ? courseData.guidelines
    : [];

  const validGuidelines = guidelines.filter(
    item => item && String(item.text || "").trim() !== ""
  );

  let html = "";

  // ================= GUIDELINES =================

  if (validGuidelines.length > 0) {

    const guidelineRows = validGuidelines
      .map((item, index) => `
        <tr>
          <td class="gr-label">
            Guideline ${index + 1}
          </td>

          <td class="gr-content">
            ${boldToHTML(
              escapeHTML(item.text || "")
            ).replace(/\n/g, "<br>")}
          </td>
        </tr>
      `)
      .join("");

    html += `
      <div class="section">
        <div class="section-title">
          Guidelines
        </div>

        <table class="guidelines-rubrics-table">
          <tbody>
            ${guidelineRows}
          </tbody>
        </table>
      </div>
    `;
  }

  return html;
}

//Function to generate PDF
function generateSyllabusHTML(templateHTML, courseData) {
  let html = templateHTML;
  const is2025 = is2025Scheme(courseData);
  const ltpLabel = is2025 ? "L:T:P" : "L:T:P:S";
  const totalHours = getTotalHours(courseData.pedagogy);

  // ================= SIMPLE FIELDS =================
  const simpleFields = [
    "sem", "course_title", "course_code", "credits",
    "pedagogy", "ltps", "exam_hours", "cie", "see",
    "course_type", "exam_type"
  ];

  // Set defaults if course_type is "MC"
  if (courseData.course_type === "MC") {
    // courseData.exam_type = courseData.exam_type;
    courseData.exam_type = "-";
    // courseData.credits = 0;
  }
  else if (courseData.course_type === "MC ([object Object])")
  {
    courseData.course_type = "NCMC";
    courseData.exam_type = "NO EXAM";
    courseData.credits = "NO CREDITS";
  }
  else if(courseData.course_type === "IPCC (T+L)") 
  courseData.exam_type = "Theory";
  else {
    courseData.exam_type = getExamType(courseData.course_type);
  }

  simpleFields.forEach(key => {
    const value = courseData[key] ?? "-";
    html = html.replace(
      new RegExp(`{{${key}}}`, "g"),
      escapeHTML(key === "course_title" ? String(value).toUpperCase() : value)
    );
  });

  html = html.replace(/{{LTP_LABEL}}/g, ltpLabel);
  html = html.replace(
  /{{PEDAGOGY_LABEL}}/g,
  is2025
    ? `
      <div><b>Pedagogy</b></div>
      <div style="
          font-size:8px;
          font-weight:normal;
          margin-top:2px;
          line-height:1.2;
      ">
        L:T:P:TW&SL = TH
      </div>
    `
    : "Pedagogy"
);
  html = html.replace(
    /{{PEDAGOGY_BLOCK}}/g,
    is2025
      ? `
          <div>${escapeHTML(totalHours)}</div>
        `
      : escapeHTML(courseData.pedagogy || "-")
);

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
  
  console.log("Ddd",courseData.teaching_learning)
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
  if (!is2025 && hasRealModernToolsContent(courseData.modern_tools)) {
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

  // ================= 2025 TOOLS + PREREQUISITES =================
  if (is2025) {
    const tools = Array.isArray(courseData.tools_ai_programming)
      ? courseData.tools_ai_programming
      : typeof courseData.tools_ai_programming === "string"
        ? courseData.tools_ai_programming.split("\n")
        : [];

    const prerequisites = Array.isArray(courseData.prerequisites)
      ? courseData.prerequisites
      : typeof courseData.prerequisites === "string"
        ? courseData.prerequisites.split("\n")
        : [];

    // Remove empty values and empty numbering
    const cleanTools = tools
      .map(item => String(item || "").trim())
      .filter(item => item && !/^\d+\.?\s*$/.test(item));

    const cleanPrerequisites = prerequisites
      .map(item => String(item || "").trim())
      .filter(item => item && !/^\d+\.?\s*$/.test(item));

    // Build numbered list
    const toolsHTML = cleanTools.length
      ? cleanTools
          .map((item, index) => `
            <div class="tools-prereq-item">
              <span class="tools-prereq-number">${index + 1}.</span>
              <span>${boldToHTML(escapeHTML(item))}</span>
            </div>
          `)
          .join("")
      : "";

    const prerequisitesHTML = cleanPrerequisites.length
      ? cleanPrerequisites
          .map((item, index) => `
            <div class="tools-prereq-item">
              <span class="tools-prereq-number">${index + 1}.</span>
              <span>${boldToHTML(escapeHTML(item))}</span>
            </div>
          `)
          .join("")
      : "";

    // Only display the section if at least one side has content
    if (cleanTools.length > 0 || cleanPrerequisites.length > 0) {
      const toolsPrerequisitesHTML = `
        <div class="section">
          <table class="tools-prerequisites-table">
            <tr>
              <th>
                TOOLS / AI TOOLS / PROGRAMMING LANGUAGES
              </th>
              <th>
                PREREQUISITES
              </th>
            </tr>

            <tr>
              <td class="tools-prereq-cell">
                ${toolsHTML}
              </td>

              <td class="tools-prereq-cell">
                ${prerequisitesHTML}
              </td>
            </tr>
          </table>
        </div>
      `;

      html = html.replace(
        "{{TOOLS_PREREQUISITES_SECTION}}",
        toolsPrerequisitesHTML
      );
    } else {
      html = html.replace(
        /<!-- SECTION: 2025_TOOLS_PREREQUISITES -->[\s\S]*?<!-- END: 2025_TOOLS_PREREQUISITES -->/,
        ""
      );
    }
  } else {
    // Remove this entire section for non-2025 schemes
    html = html.replace(
      /<!-- SECTION: 2025_TOOLS_PREREQUISITES -->[\s\S]*?<!-- END: 2025_TOOLS_PREREQUISITES -->/,
      ""
    );
  }

  // ================= COURSE OUTCOMES =================
  if (hasMeaningfulContent(courseData.course_outcomes)) {
    html = html.replace(
      /{{#each course_outcomes}}[\s\S]*?{{\/each}}/g,
      OutcomeslistToHTML(courseData.course_outcomes)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: Outcomes -->[\s\S]*?<!-- END: Outcomes -->/,
      ""
    );
  }

  // ================= WEB LINKS =================
  if (hasRealContent(courseData.referral_links)) {
        const cleanLinks = courseData.referral_links;


    html = html.replace(
      /{{#each referral_links}}[\s\S]*?{{\/each}}/g,
      listToHTML(cleanLinks)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: WebLinks -->[\s\S]*?<!-- END: WebLinks -->/,
      ""
    );
  }

  // ================= ACTIVITY-BASED =================
  if (!is2025 && (hasRealContent(courseData.activity_based) || hasMeaningfulContent(courseData.activity_based))) {
    const cleanActivity = courseData.activity_based;
    html = html.replace(
      /{{#each activity_based}}[\s\S]*?{{\/each}}/g,
      listToHTML(cleanActivity)
    );
  } else {
    html = html.replace(
      /<!-- SECTION: Activity-Based -->[\s\S]*?<!-- END: Activity-Based -->/,
      ""
    );
  }

  // html = html.replace(
  //   "{{TERM_WORK_SECTION}}",
  //   is2025 ? buildActivityTableHTML("Term Work (TW)", courseData.termWorkActivities) : ""
  // );
  // html = html.replace(
  //   "{{SELF_LEARNING_SECTION}}",
  //   is2025 ? buildActivityTableHTML("Self Learning (SL)", courseData.selfLearningActivities) : ""
  // );

//   html = html.replace(
//     "{{TERM_WORK_SECTION}}",
//     is2025
//       ? buildTwSlTableHTML(
//           courseData.termWorkActivities,
//           courseData.selfLearningActivities
//         )
//       : ""
// );

// html = html.replace("{{SELF_LEARNING_SECTION}}", "");

html = html.replace(
    "{{TERM_WORK_SECTION}}",
    is2025
        ? buildTwSlTableHTML(
              courseData.termWorkActivities,
              courseData.selfLearningActivities
          )
        : ""
);

html = html.replace("{{SELF_LEARNING_SECTION}}", "");



  // ================= MODULES =================
  const validModules = (courseData.modules || []).filter(mod =>
    mod && String(mod.content || "").trim() !== ""
  );
  
  let modulesHTML = "";

  if (validModules.length > 0) {

  modulesHTML = validModules
    .map((mod, idx) => {

      // Generate textbook string
      const textbookDetails = (mod.textbooks || [])
        .map(tb => {

          const slNo = escapeHTML(tb.slNo || "-");
          const chapter = escapeHTML(tb.chapter || "-");

          return `TB${slNo}:Ch-${chapter}`;
        })
        .join(" , ");

      return `
        <div class="module">

          <div class="module-title" >
            Module ${idx + 1}
          </div>

          <div class="module-content">
            ${boldToHTML(
              escapeHTML(mod.content || "-")
            ).replace(/\n/g, "<br>")}
          </div>

          <div class="module-meta">

            <span>
              <b>${textbookDetails}</b>
            </span>

            <span>
              RBT: ${escapeHTML(mod.rbt || "-")}
            </span>

            <span>
              WK: ${escapeHTML(mod.wk || mod.wkt || "-")}
            </span>

            ${is2025 ? `<span>
               ${escapeHTML(mod.teachingHours || "-")} hours
            </span>`:""}
          </div>

        </div>
      `;
    })
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

  // ✅ Detect parts from data itself — don't rely on hasParts flag
  const hasAnyPart = validExperiments.some(
    e => e.part === "A" || e.part === "B"
  );

  // ✅ Experiments with null/undefined part → treat as "no part" / fallback to Part A
  const partA = validExperiments.filter(e => e.part === "A");
  const partB = validExperiments.filter(e => e.part === "B");
  const noPart = validExperiments.filter(e => !e.part);

  function buildTable(exps) {
    if (exps.length === 0) return "";
    const rowsHTML = exps.flatMap(exp => {
      const parts = splitExperimentContent(
        boldToHTML(escapeHTML(exp.cont || "")),
        30
      );
      return parts.map((part, idx) => `
        <tr>
          <td>${idx === 0 ? escapeHTML(exp.slno) : ""}</td>
          <td style="text-align:left;">${part}</td>
        </tr>
      `);
    }).join("");

    return `
      <table class="experiments" >
        <thead>
          <tr>
            <th class="expSl">Sl. No.</th>
            <th class="expCont">List of Experiments</th>
          </tr>
        </thead>
        <tbody style="font-size:11px;">${rowsHTML}</tbody>
      </table>
    `;
  }

  

                      
                  
                          

                                  
                                  
                                                          
                                                                          
                                                                                      
                                                                                                          
                                                                                                              
                                                                                                                            
                                                                                        
                                                                                                                          
                                            
                                                                                                                              
                                                                                                                                              
                                                                                                                                                      

                                                                                                                                                    

                                                                                                                                                              
                                                                                                                                                                      
                                                                                                        
                                                                                                                                                                  
                                                                                                                                                                        
                                                                                                                                                                
                                                                                                                                                                                                                
                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                              

                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

                
              
                          
                                            
                                
          
              
                                                   
                    
                        
                                                                                                                    
                                                                                                                      
                                                                                                                                
                                                                                                                                

                                                                                                                                      
                                                                                                                                              
                                                                                                                                              
                                                                                                                                              
                                                                                                                                                              
                                                                                                                                                                    
                                                                                                                                                                                    
                                                                                                                    
                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                      

                                                                                                                                                                                                                                                                                                            

                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                

                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         


            

    
                    
                  
  
                                    
                                  
                              
                                                                        

                                                                                          
                                                                                        
                                                                                                          
                                                                                      
                                                                                          
                                                                                                                                                
                                                                                                                          
                                                                                                                                  
                                                                                                                    
                                                                                                                                
                                                                                          
                                                                          
                                                                                                                                                                                          
                                                                                                                                                                                                        
                                                                                                                                                                                                        
                                                                                                                                                                          
                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                              

                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                            

                                                                                                                                                                                                                                                                                                            

                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
if (hasAnyPart) {

    const effectivePartA = [...noPart, ...partA];

      const hasPartA = effectivePartA.length > 0;
        const hasPartB = partB.length > 0;

          // Show Part A / Part B headings only when BOTH exist
            const showPartHeadings = hasPartA && hasPartB;

              const buildRows = (experiments) => {
                  return experiments.map((exp) => `
                        <tr>
                                <td>
                                          ${escapeHTML(exp.slno || "")}
                                                  </td>

                                                          <td style="text-align:left;">
                                                                    ${escapeHTML(exp.cont || "")}
                                                                            </td>
                                                                                  </tr>
                                                                                      `).join("");
                                                                                        };

                                                                                          let rowsHTML = "";

                                                                                            // PART A
                                                                                              if (hasPartA) {

                                                                                                  if (showPartHeadings) {
                                                                                                        rowsHTML += `
                                                                                                                <tr>
                                                                                                                          <td colspan="2"
                                                                                                                                        style="font-weight:bold;
                                                                                                                                                             text-align:center;
                                                                                                                                                                                  padding:5px 10px;">
                                                                                                                                                                                              Part A
                                                                                                                                                                                                        </td>
                                                                                                                                                                                                                </tr>
                                                                                                                                                                                                                      `;
                                                                                                                                                                                                                          }

                                                                                                                                                                                                                              rowsHTML += buildRows(effectivePartA);
                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                  // PART B
                                                                                                                                                                                                                                    if (hasPartB) {

                                                                                                                                                                                                                                        if (showPartHeadings) {
                                                                                                                                                                                                                                              rowsHTML += `
                                                                                                                                                                                                                                                      <tr>
                                                                                                                                                                                                                                                                <td colspan="2"
                                                                                                                                                                                                                                                                              style="font-weight:bold;
                                                                                                                                                                                                                                                                                                   text-align:center;
                                                                                                                                                                                                                                                                                                                        padding:5px 10px;">
                                                                                                                                                                                                                                                                                                                                    Part B
                                                                                                                                                                                                                                                                                                                                              </td>
                                                                                                                                                                                                                                                                                                                                                      </tr>
                                                                                                                                                                                                                                                                                                                                                            `;
                                                                                                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                                                                                                    rowsHTML += buildRows(partB);
                                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                                        experimentsHTML = `
                                                                                                                                                                                                                                                                                                                                                                            <div class="section">
                                                                                                                                                                                                                                                                                                                                                                                  <div class="section-title">Practical Components</div>

                                                                                                                                                                                                                                                                                                                                                                                        <table class="experiments">
                                                                                                                                                                                                                                                                                                                                                                                                <thead>
                                                                                                                                                                                                                                                                                                                                                                                                          <tr>
                                                                                                                                                                                                                                                                                                                                                                                                                      <th class="expS1">Sl. No.</th>
                                                                                                                                                                                                                                                                                                                                                                                                                                  <th class="expCont">List of Experiments</th>
                                                                                                                                                                                                                                                                                                                                                                                                                                            </tr>
                                                                                                                                                                                                                                                                                                                                                                                                                                                    </thead>

                                                                                                                                                                                                                                                                                                                                                                                                                                                            <tbody>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ${rowsHTML}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </tbody>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </table>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
} else {
  experimentsHTML = `
    <div class="section">
      <div class="section-title">Practical Components</div>
      ${buildTable(validExperiments)}
    </div>
  `;
}
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
        <tr style="font-size:12px;">
          <td>${escapeHTML(tb.slNo)||'-'}</td>
          <td>${escapeHTML(tb.author)||'-'}</td>
          <td>${escapeHTML(tb.bookTitle)||'-'}</td>
          <td>${escapeHTML(tb.publisher)||'-'}</td>
          <td>${escapeHTML(tb.year)||'-'}</td>
        </tr>
      `)
      .join("");

    textbooksHTML = `
      <div class="section" >
        <div class="section-title">Textbooks</div>
        <table>
          <tr style="font-size:13px;">
            <th>Sl.No</th>
            <th>Author</th>
            <th>Title</th>
            <th>Publisher&Edition</th>
            <th>Year</th>
          </tr>
          ${rowsHTML}
        </table>
      </div>
    `;
  }

  html = html.replace("{{TEXTBOOKS_SECTION}}", textbooksHTML);

  // ================= REFERENCES =================
  let referencesHtml = "";

  const validReferences = (courseData.references || []).filter(tb =>
    tb &&
    (
      String(tb.author || "").trim() ||
      String(tb.bookTitle || "").trim() ||
      String(tb.publisher || "").trim() ||
      String(tb.year || "").trim()
    )
  );

  if (validReferences.length > 0) {
    const rowsHTML = validReferences
      .map(tb => `
        <tr style="font-size:12px;">
          <td>${escapeHTML(tb.slNo)||'-'}</td>
          <td>${escapeHTML(tb.author)||'-'}</td>
          <td>${escapeHTML(tb.bookTitle)||'-'}</td>
          <td>${escapeHTML(tb.publisher)||'-'}</td>
          <td>${escapeHTML(tb.year)||'-'}</td>
        </tr>
      `)
      .join("");

    referencesHtml = `
      <div class="section" >
        <div class="section-title">References</div>
        <table>
          <tr style="font-size:13px;">
            <th>Sl.No</th>
            <th>Author</th>
            <th>Title</th>
            <th>Publisher&Edition</th>
            <th>Year</th>
          </tr>
          ${rowsHTML}
        </table>
      </div>
    `;
  }

  html = html.replace("{{REFERENCES_SECTION}}", referencesHtml);


  // ================= GUIDELINES & RUBRICS =================

  html = html.replace("{{GUIDELINES_RUBRICS_SECTION}}",buildGuidelinesRubricsHTML(courseData));

  // ================= CO–PO–PSO =================
let copoHTML = "";

const copo = courseData.copoMapping;

if (copo && Array.isArray(copo.rows)) {
  const hasAnyValue = copo.rows.some(row =>
    [...(row.vals || []), ...(row.pso || [])].some(v => {
      const n = Number(v);
      return !isNaN(n) && n > 0;
    })
  );

  if (hasAnyValue) {
    const poHeaders = copo.headers || [];
    const psoCount = copo.rows[0]?.pso?.length || 0;

    const totalCols = poHeaders.length + psoCount;
const sums = Array(totalCols).fill(0);
const counts = Array(totalCols).fill(0);

const headerHTML = `
<tr style="font-size:11px;">
<th>CO</th>
        ${poHeaders.map(h => `<th>${escapeHTML(h)}</th>`).join("")}
        ${Array.from({ length: psoCount })
        .map((_, i) => `<th>PSO${i + 1}</th>`)
          .join("")}
          </tr>
    `;
    

    copo.rows.forEach(row => {
      const allVals = [...(row.vals || []), ...(row.pso || [])];
    
      allVals.forEach((v, idx) => {
        const n = Number(v);
        if (!isNaN(n) && n > 0) {
          sums[idx] += n;
          counts[idx] += 1;
        }
      });
    });

    const rowsHTML = copo.rows
      .map(row => `
        <tr style="font-size:11px;">
        <td>${escapeHTML(row.co)}</td>
          ${(row.vals || []).map(v => `<td>${v || ""}</td>`).join("")}
          ${(row.pso || []).map(v => `<td>${v || ""}</td>`).join("")}
        </tr>
      `)
      .join("");

      const avgRowHTML = `
  <tr class="avg-row" style="font-size:12px;">
    <td><b>AVG</b></td>
    ${sums.map((sum, i) => {
      if (counts[i] === 0) return `<td></td>`;
      return `<td><b>${(sum / counts[i]).toFixed(1)}</b></td>`;
    }).join("")}
  </tr>
`;


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
}

// html = html.replace("{{COPO_TABLE}}", copoHTML);
  html = html.replace(
    "{{COPO_TABLE}}",
    `
      ${copoHTML}

      ${buildCowkMappingHTML(courseData)}

      ${buildSDGTableHTML(courseData)}

      <!-- RUBRIC_DOCUMENT_INSERT_POINT -->
    `
  );
html = `
<style>
  body {
    transform: scale(0.97);
    transform-origin: top;
  }

  tr {
    page-break-inside: avoid;
  }
</style>

<div style="padding-bottom: 120px;">
  ${html}
</div>
`;

  return html;
}


async function mergeRubricDocument(
  syllabusPdfBuffer,
  rubricFile
) {
  // No uploaded file
  if (!rubricFile) {
    return syllabusPdfBuffer;
  }

  let rubricPdfBuffer;

  // ============================================
  // PDF
  // ============================================

  if (rubricFile.mimetype === "application/pdf") {
    rubricPdfBuffer = rubricFile.buffer;
  }

  // ============================================
  // DOCX
  // ============================================

  else if (
    rubricFile.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {

    const result = await mammoth.convertToHtml({
      buffer: rubricFile.buffer,
    });

    const browser = await launchBrowser();
    const page = await browser.newPage();

    const docxHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">

        <style>

          @page {
            size: A4;
            margin: 20mm 15mm;
          }

          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #111;
          }

          img {
            max-width: 100%;
            height: auto;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          td,
          th {
            border: 1px solid #999;
            padding: 5px;
          }

          h1 {
            font-size: 20px;
          }

          h2 {
            font-size: 17px;
          }

          h3 {
            font-size: 15px;
          }

          p {
            margin: 0 0 8px 0;
          }

        </style>

      </head>

      <body>
        ${result.value}
      </body>

      </html>
    `;

    await page.setContent(
      docxHTML,
      {
        waitUntil: "networkidle0",
      }
    );

    rubricPdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
    });

    await page.close();
  }

  else {
    throw new Error(
      "Unsupported rubric document type."
    );
  }

  // ============================================
  // Merge
  // ============================================

  const finalPdf =
    await PDFDocument.load(syllabusPdfBuffer);

  const rubricPdf =
    await PDFDocument.load(rubricPdfBuffer);

  const rubricPageIndices =
    rubricPdf.getPageIndices();

  const copiedPages =
    await finalPdf.copyPages(
      rubricPdf,
      rubricPageIndices
    );

  /*
    For the first version we insert the
    uploaded pages immediately before
    the CO–PO–PSO section.

    We'll create a marker in the generated
    syllabus to determine the exact position.
  */

  const insertIndex =
    findRubricInsertPage(finalPdf);

  copiedPages.forEach((page, index) => {
    finalPdf.insertPage(
      insertIndex + index,
      page
    );
  });

  return Buffer.from(
    await finalPdf.save()
  );
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

// app.post('/generate-pdf', async (req, res) => {

//   try {
//     const courseData = req.body;

//     // console.log("COURSE :",courseData) 
//     // console.log("Received course data:", JSON.stringify(courseData, null, 2));
    
//     // Read HTML template
//     const templatePath = path.join(__dirname, "template", "pdf-template.html");
    
//     if (!fs.existsSync(templatePath)) {
//       return res.status(500).send("Template file not found at: " + templatePath);
//     }
    
//     const templateHTML = fs.readFileSync(templatePath, 'utf8');
    
//     // Replace placeholders
//     const finalHTML = generateSyllabusHTML(templateHTML, courseData);
    
//     // console.log("Generated HTML (first 500 chars):", finalHTML.substring(0, 500));

//     const browser = await launchBrowser();
//     const page = await browser.newPage();
//     await page.setContent(finalHTML, { waitUntil: "networkidle0" });
//     const pdfBuffer = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       margin: {
//         top: "20mm",
//         bottom: "20mm",
//         left: "15mm",
//         right: "15mm"
//       }
//     });
    
//     // await browser.close();
//     await page.close(); // ✅ keep browser alive

//     // console.log("PDF generated successfully, size:", pdfBuffer.length, "bytes");
    
//     // ✅ Send PDF (Render-safe)
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//     "Content-Disposition",
//     "attachment; filename=syllabus.pdf"
//     );
//     res.setHeader("Content-Length", pdfBuffer.length);

//     // Update Stats in DB
//     await Stats.findOneAndUpdate(
//       { type: "global" },
//       { $inc: { totalGenerated: 1, pdfCount: 1 } },
//       { new: true, upsert: true }
//     );

//     res.end(pdfBuffer, "binary");    
// } catch (error) {
//     console.error("Error generating PDF:", error);
//     res.status(500).json({
//       error: "Failed to generate PDF",
//       message: error.message,
//       stack: error.stack
//     });
//   }
// });

// =========================================================
// GENERATE PDF
// =========================================================

app.post(
  "/generate-pdf",
  upload.single("rubricDocument"),
  async (req, res) => {

    try {

      // =====================================================
      // READ COURSE DATA
      // =====================================================

      let courseData = {};

      try {

        courseData = JSON.parse(
          req.body.courseData || "{}"
        );

      } catch (parseError) {

        return res.status(400).json({
          error: "Invalid course data.",
          message: parseError.message
        });

      }

      // =====================================================
      // UPLOADED RUBRIC DOCUMENT
      // =====================================================

      const rubricFile =
        req.file || null;

      console.log(
        "Rubric document:",
        rubricFile
          ? {
              originalname: rubricFile.originalname,
              mimetype: rubricFile.mimetype,
              size: rubricFile.size
            }
          : "No document uploaded"
      );

      // =====================================================
      // READ TEMPLATE
      // =====================================================

      const templatePath = path.join(
        __dirname,
        "template",
        "pdf-template.html"
      );

      if (!fs.existsSync(templatePath)) {

        return res.status(500).send(
          "Template file not found at: " +
          templatePath
        );
      }

      const templateHTML =
        fs.readFileSync(
          templatePath,
          "utf8"
        );

      // =====================================================
      // GENERATE NORMAL SYLLABUS HTML
      // =====================================================

      const finalHTML =
        generateSyllabusHTML(
          templateHTML,
          courseData
        );

      // =====================================================
      // CASE 1:
      // NO RUBRIC DOCUMENT
      //
      // Keep your original one-pass PDF generation.
      // =====================================================

      if (!rubricFile) {

        const pdfBuffer =
          await renderHTMLToPDF(finalHTML);

        await Stats.findOneAndUpdate(
          { type: "global" },
          {
            $inc: {
              totalGenerated: 1,
              pdfCount: 1
            }
          },
          {
            new: true,
            upsert: true
          }
        );

        res.setHeader(
          "Content-Type",
          "application/pdf"
        );

        res.setHeader(
          "Content-Disposition",
          "attachment; filename=syllabus.pdf"
        );

        res.setHeader(
          "Content-Length",
          pdfBuffer.length
        );

        return res.end(
          pdfBuffer,
          "binary"
        );
      }

      // =====================================================
      // CASE 2:
      // RUBRIC DOCUMENT EXISTS
      // =====================================================

      console.log(
        "📎 Processing uploaded rubric document..."
      );

      // -----------------------------------------------------
      // Split syllabus at:
      //
      // RUBRICS
      //       ↓
      // INSERT MARKER
      //       ↓
      // CO-PO-PSO
      // -----------------------------------------------------

      const {
        beforeHTML,
        afterHTML
      } = splitHTMLAtRubricMarker(
        finalHTML
      );

      // -----------------------------------------------------
      // Render syllabus parts
      // -----------------------------------------------------

      console.log(
        "📄 Rendering syllabus part 1..."
      );

      const beforePdfBuffer =
        await renderHTMLToPDF(
          beforeHTML
        );

      console.log(
        "📄 Rendering syllabus part 2..."
      );

      const afterPdfBuffer =
        await renderHTMLToPDF(
          afterHTML
        );

      // -----------------------------------------------------
      // Convert uploaded PDF/DOCX to PDF
      // -----------------------------------------------------

      console.log(
        "📎 Converting rubric document..."
      );

      const rubricPdfBuffer =
        await convertRubricDocumentToPDF(
          rubricFile
        );

      // -----------------------------------------------------
      // Merge
      //
      // BEFORE
      // ↓
      // RUBRIC DOCUMENT
      // ↓
      // AFTER
      // -----------------------------------------------------

      console.log(
        "🔗 Merging syllabus and rubric document..."
      );

      const finalPdfBuffer =
        await mergePDFBuffers(
          beforePdfBuffer,
          rubricPdfBuffer,
          afterPdfBuffer
        );

      // =====================================================
      // UPDATE STATS
      // =====================================================

      await Stats.findOneAndUpdate(
        { type: "global" },
        {
          $inc: {
            totalGenerated: 1,
            pdfCount: 1
          }
        },
        {
          new: true,
          upsert: true
        }
      );

      // =====================================================
      // SEND FINAL PDF
      // =====================================================

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=syllabus.pdf"
      );

      res.setHeader(
        "Content-Length",
        finalPdfBuffer.length
      );

      console.log(
        "✅ Final PDF generated successfully."
      );

      return res.end(
        finalPdfBuffer,
        "binary"
      );

    } catch (error) {

      console.error(
        "Error generating PDF:",
        error
      );

      return res.status(500).json({
        error: "Failed to generate PDF",
        message: error.message,
        stack: error.stack
      });
    }
  }
);

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
      ${poHeaders.map(h => `<th >${h}</th>`).join("")}
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
function buildCowkMappingHTML(courseData) {
  const mapping = courseData.cowkMapping || {};

  const headers = Array.isArray(mapping.headers)
    ? mapping.headers
    : [];

  const rows = Array.isArray(mapping.rows)
    ? mapping.rows
    : [];

  if (headers.length === 0 || rows.length === 0) {
    return "";
  }

  const validRows = rows.filter(
    (row) => row && row.co
  );

  if (validRows.length === 0) {
    return "";
  }

  const headerHTML = headers
    .map(
      (header) => `
        <th class="mapping-header">
          ${escapeHTML(header || "")}
        </th>
      `
    )
    .join("");

  const rowsHTML = validRows
    .map(
      (row) => {
        const values = Array.isArray(row.vals)
          ? row.vals
          : [];

        return `
          <tr>

            <td class="mapping-co">
              ${escapeHTML(row.co || "")}
            </td>

            ${headers
              .map(
                (_, index) => `
                  <td class="mapping-value">
                    ${escapeHTML(
                      values[index] ?? ""
                    )}
                  </td>
                `
              )
              .join("")}

          </tr>
        `;
      }
    )
    .join("");

  return `
    <div class="section cowk-section">

      <div class="section-title">
        CO - WK Mapping
      </div>

      <table class="mapping-table cowk-table">

        <thead>
          <tr style="font-size:11px;">

            <th class="mapping-header">
              CO
            </th>

            ${headerHTML}

          </tr>
        </thead>

        <tbody>
          ${rowsHTML}
        </tbody>

      </table>

    </div>
  `;
}

function buildSDGTableHTML(courseData) {
  const sdgs = Array.isArray(courseData.sdgs)
    ? courseData.sdgs
    : [];

  const validSDGs = sdgs.filter(
    (item) =>
      item &&
      (
        String(item.goalNo || "").trim() !== "" ||
        String(item.goalTitle || "").trim() !== "" ||
        String(item.description || "").trim() !== ""
      )
  );

  if (validSDGs.length === 0) {
    return "";
  }

  const rowsHTML = validSDGs
    .map(
      (item) => `
        <tr>

          <td class="sdg-goal-no">
            ${escapeHTML(item.goalNo || "")}
          </td>

          <td class="sdg-goal-title">
            ${escapeHTML(item.goalTitle || "")}
          </td>

          <td class="sdg-description">
            ${boldToHTML(
              escapeHTML(item.description || "")
            ).replace(/\n/g, "<br>")}
          </td>

        </tr>
      `
    )
    .join("");

  return `
    <div class="section sdg-section">

      <div class="section-title">
        COURSE SUSTAINABLE DEVELOPMENT GOALS (SDGs)
      </div>

      <table class="sdg-table">

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
          ${rowsHTML}
        </tbody>

      </table>

    </div>
  `;
}


function generateSyllabusHTML_DOCX(templateHTML, courseData) {
  function getExamType({ course_type = "", ltps = "" } = {}) {
  const ct = String(course_type).toUpperCase();

  // 1️⃣ Prefer explicit course_type
  if (ct.includes("T+L")) return "Theory & Lab";
  if (ct === "T") return "Theory";
  if (ct === "L") return "Lab";
  if(ct === "M") return "MCQ";

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


// console.log(courseData)
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
  // html = html.replace("{{COPO_TABLE}}", buildCopoTableWord(courseData));

  html = html.replace(
  "{{COPO_TABLE}}",
  `
    ${buildCopoTableWord(courseData)}

    ${buildCowkMappingHTML(courseData)}

    ${buildSDGTableHTML(courseData)}
  `
);

  return html;
}

app.post("/generate-docx", async (req, res) => {
  try {
    const buffer = await generateSyllabusDocx(req.body);

    // Update Stats in DB
    await Stats.findOneAndUpdate(
      { type: "global" },
      { $inc: { totalGenerated: 1, docxCount: 1 } },
      { new: true, upsert: true }
    );

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
app.post("/generate-json", async (req, res) => {
  try {
    const courseData = req.body;

    const courseCode = (courseData.course_code || "COURSE")
      .replace(/\s+/g, "");

    const now = new Date();

    const day = String(now.getDate()).padStart(2, "0");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const fileName = `${courseCode}_${day}-${month}-${year}_${hours}-${minutes}.json`;

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    // Update Stats in DB
    await Stats.findOneAndUpdate(
      { type: "global" },
      { $inc: { totalGenerated: 1, jsonCount: 1 } },
      { new: true, upsert: true }
    );

    res.status(200).send(JSON.stringify(courseData, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "JSON generation failed" });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    let stats = await Stats.findOne({ type: "global" });
    if (!stats) {
      stats = { totalGenerated: 0, pdfCount: 0, docxCount: 0, jsonCount: 0 };
    }
    res.json(stats);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

const PORT = 8000;
app.listen(PORT,()=>{
    console.log(`Listening to the PORT:${PORT}\nhttp://localhost:${PORT}/`)
})