import React, { useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../assets/fonts/Calibri-normal.js";
import "../assets/fonts/Calibri-bold.js";
import headerFull from "../assets/images/header_img.png";


export default function PdfRender({ courseData ,strtDownload}) {

  // Convert unicode math alphabets to ASCII (robust approach)
  function normalizeMathText(str) {
    if (!str) return "";
    // Normalize and strip fancy math-letter codepoints
    try {
      // This reduces mathematical alphabets to base forms where possible
      return String(str)
        .normalize("NFKD")
        .replace(/[\u{1D400}-\u{1D7FF}]/gu, (ch) =>
          ch.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
        )
        .replace(/\u00B2/g, "^2") // superscript 2
        .replace(/\u00B3/g, "^3"); // superscript 3
    } catch (e) {
      return String(str);
    }
  }

  // Add spaces around math operators so splitTextToSize can wrap
  function sanitizeModuleText(text) {
    if (!text) return "";
    return String(text)
.replace(/([=+\-/^])/g, " $1 ")
      .replace(/([()])/g, " $1 ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Decide whether to render a module
  function shouldRenderModule(mod) {
    if (!mod) return false;
    const hasTitle = mod.title && String(mod.title).trim().length > 0;
    const hasContent = mod.content && String(mod.content).trim().length > 0;
    return hasTitle || hasContent;
  }

  // Decide whether to render textbook table
  function shouldRenderTextbooks(arr) {
    if (!Array.isArray(arr)) return false;
    return arr.some(
      (tb) =>
        (tb.slNo && String(tb.slNo).trim()) ||
        (tb.author && String(tb.author).trim()) ||
        (tb.bookTitle && String(tb.bookTitle).trim()) ||
        (tb.publisher && String(tb.publisher).trim())
    );
  }

  function getDeptName(dept){
    switch(dept){
      case "CSE":
        return "Computer Science and Engineering";
      case "ISE":
        return "Information Science and Engineering";
      case "EEE":
        return "Electrical and Electronics Engineering";
      case "ECE":
        return "Electronics and Communication Engineering";
      case "EIE":
        return "Electronics and Instrumentation Engineering";
      case "ETE":
        return "Electronics and Telecommunication Engineering";
      case "AIML":
        return "Artificial Intelligence and Machine Learning";
      case "CSE(IOT)":
        return "CSE (IOT & Cyber Security, Blockchain Technology)";
      case "RAI":
        return "Robotics & Artificial Intelligence";
      case "VLSI":
        return "Electronics Engineering (VLSI Design & Technology)";
      case "CIVIL":
        return "Civil Engineering";
      case "ME":
        return "Mechanical Engineering";
      default:
        return "Engineering"
    }
  }

  async function generateSyllabusPDF() {
    const data = courseData || {};
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // loadKannadaFont(doc)
    // Margins
    const M = { left: 55, right: 55, top: 38, bottom: 60 };
    let curY = M.top;

    doc.setFont("Calibri", "normal");
doc.setFontSize(9);

  

    const RED = [204, 0, 0];
    const BLUE = [0, 40, 180];
    const FOOTER_BLUE = [0, 0, 180];
    const GRAY_BORDER = [160, 160, 160];

    const centerX = () => pageWidth / 2;

    function addFooter(pageNum) {
  const footerTop = pageHeight - M.bottom + 2;
  const mid = centerX();

  // Red line
  doc.setDrawColor(...RED);
  doc.setLineWidth(1.6);
  doc.line(M.left - 4, footerTop - 6, pageWidth - M.right + 4, footerTop - 6);

  // LINE 1
  doc.setFont("Calibri", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    "K.R. Road, V. V. Pura, Bengaluru – 560 004",
    mid,
    footerTop + 10,
    { align: "center" }
  );

  // LINE 2
  doc.setFont("Calibri", "normal");
  doc.setFontSize(9);
  doc.text(
    "Phone: +91(080) 26613237, 26615865 | Website: www.bit-bangalore.edu.in",
    mid,
    footerTop + 24,
    { align: "center" }
  );

  // LINE 3 (email line in BLUE + bold)
  doc.setFont("Calibri", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 180);
  doc.text(
    "E-mail : principalbit4@gmail.com, principal@bit-bangalore.edu.in",
    mid,
    footerTop + 38,
    { align: "center" }
  );

  // LINE 4 (NBA line)
  doc.setFont("Calibri", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    "Accredited by NBA: 9 UG Programs, NAAC A+ and QS-I Gauge (Gold Rating)",
    mid,
    footerTop + 52,
    { align: "center" }
  );

  
  // Page number
  doc.setFont("Calibri", "normal");
  doc.setFontSize(10);
  doc.text(
    String(pageNum),
    pageWidth - M.right + 6,
    pageHeight - 10,
    { align: "right" }
  );
}

function addHeader() {
    curY = M.top;
    const pageWidth = doc.internal.pageSize.getWidth();

    // === HEADER IMAGE DETAILS ===
    const headerWidth = pageWidth - M.left - M.right+120;   // full width but respecting margins
    const headerHeight = (headerWidth * 110) / 1000;    // adjust this based on your image ratio

    const x = M.left -35;
    const y = M.top - 10;

    try {
      doc.addImage(headerFull, "PNG", x, y, headerWidth, headerHeight);
    }catch (e) {
      console.error("Header image error:", e);
    }

    curY = y + headerHeight + 5;

    //Header Font
    doc.setFont('Calibri', 'bold'); 
    doc.setFontSize(8);
    doc.setTextColor(0, 102, 200);
    doc.text("An Autonomous Institution Under VTU, Belagavi", centerX()+22, curY-9, { align: "center" });
    
    //Generated Date
    // Generated Date (Header - top right)
    doc.setFont("Calibri", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    
const now = new Date();
const formatted = now.toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

doc.text(
  `Generated on: ${formatted}`,
  pageWidth - M.right +7,  // align with right margin
  97,                   // Y-position above red line
  { align: "right" }
);


    //Red Line under Header
    doc.setDrawColor(204, 0, 0);
    doc.setLineWidth(2.8);
    doc.line(M.left - 4, curY, pageWidth - M.right + 4, curY );

    // Reset Y and text color for body content
    // Reset text color
    doc.setTextColor(0, 0, 0);
  }
  
  // auto add header on new page
  // doc.internal.events.subscribe("addPage", () => {
  //   addHeader();
  //   curY = M.top + 70;
  // });
  
  // addHeader();
  
  // curY += 90;
  // doc.setFont('Calibri', 'bold'); 
  // doc.setFontSize(14);
  // doc.setTextColor(0, 0, 0);
  // doc.text(`Department of ${getDeptName(courseData.department)}`, centerX(), curY, { align: "center" });
  
    // --- TOP HORIZONTAL COURSE INFO TABLE (unchanged) ---
    // curY += 18  ;
    // doc.setTextColor(0, 102, 200);

    
    autoTable(doc, {
      startY: curY-25,
      head: [
        [
          "Sem",
          "Title",
          "Code",
          "Credits",
          "Hours of Pedagogy",
          "L-T-P-S",
          "Exam Hours",
          "CIE",
          "SEE",
          "Course Type",
          "Exam Type"
        ],
      ],
      body: [
        [
          data.sem|| '-',
          data.course_title || "-",
          data.course_code || "-",
          data.credits || "-",
          data.pedagogy || "-",
          data.ltps || "-",
          data.exam_hours || "-",
          data.cie || "-",
          data.see || "-",
          data.course_type || "-",
          data.course_type.includes("T+L")?"Theory & Lab":data.course_type.includes("T")?"Theory":data.course_type.includes("L")?"Lab":"-"
        ],
      ],
      theme: "grid",
      bodyStyles: {
    textColor: [0, 102, 200], // 👈 ONLY body text blue,
    fontStyle: "bold",
  },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: "bold" },
      styles: { fontSize: 8, halign: "center", valign: "middle" ,lineWidth:0.8,lineColor:GRAY_BORDER},
      margin: { left: M.left, right: M.right },
      tableWidth: pageWidth - M.left - M.right,
    });

    curY = doc.lastAutoTable.finalY + 12;

    

    const DEFAULT_TEMPLATES = [
  "**This course will enable the students to:**",
  "**At the end of the course, the student will be able to:**",
  "**In addition to the traditional chalk and talk method, ICT tools are adopted:**",
  "**Modern AI tools used for this course:**",
  "**Add Web Links:**",
  "**Add Activity based learning points:**",
];

function extractMeaningfulLines(content = "") {
  return String(content)
    .split("\n")
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false;

      // ❌ remove empty numbered points: "1." / "2. "
      if (/^\d+\.\s*$/.test(line)) return false;

      // ❌ remove default template sentences
      if (
        DEFAULT_TEMPLATES.some(tpl =>
          line.toLowerCase() === tpl.toLowerCase()
        )
      ) {
        return false;
      }

      return true; // ✅ real content
    });
}


    // --- Objectives box (bullet points) ---
    function drawLabeledBox(title, content, yStart) {
  const left = M.left;
  const width = pageWidth - M.left - M.right;
  const pad = 10;
  let y = Number(yStart) || M.top;

  // 👉 PAGE BREAK CHECK
  const spaceLeft = pageHeight - M.bottom - y;
  if (spaceLeft < 50) {
    doc.addPage();
    y = M.top + 20; // reset Y on new page
  }



  // Normalize + sanitize
  content = normalizeMathText(String(content || ""));
  // content = sanitizeModuleText(content);

  // Split into points
// const parts = extractMeaningfulLines(content);

// 👇 USE ORIGINAL CONTENT FOR DISPLAY
let parts = content
  .split("\n")
  .map(p => p.trim())
  .filter(Boolean);

// 🔍 CLEAN COPY ONLY FOR CHECKING
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
  return yStart;
}


if (parts.length === 0) {
  return yStart; // 🚀 skip drawing box completely
}


  // Title
  doc.setFont('Calibri', 'bold');
  doc.setFontSize(12);
  title = String(title || "");
  ////////////////////////////////////
  doc.text(title, left, y);

  // Body font
  doc.setFont("Calibri", "normal");
  doc.setFontSize(9);

  y += 0;

  
let bulletLines = [];
// 🔒 fixed number column width (supports up to 99.)
doc.setFont("Calibri", "normal");
const MAX_NUMBER_WIDTH = doc.getTextWidth("99. ");


parts.forEach(p => {
const match = p.match(/^(\d+)\.\s*(.*)$/);

  if (match) {
const number = match[1] + "."; // "3."
    const text = match[2];         // actual content
    const numberWidth = MAX_NUMBER_WIDTH;

const wrapped = doc.splitTextToSize(
  text,
  width - pad * 2 - numberWidth
);


    wrapped.forEach((line, i) => {
      bulletLines.push({
        number: i === 0 ? number : "",
        text: line,
        textOffset: numberWidth
      });
    });
  } else {
    // non-numbered fallback
    const wrapped = doc.splitTextToSize(
      p,
      width - pad * 2
    );

    wrapped.forEach(line => {
      bulletLines.push({
        number: "",
        text: line,
        textOffset: 0
      });
    });
  }
});




  // const boxHeight = Math.max(30, bulletLines.length * 12 + pad + 2);
  // const lineHeight = 13; // keep consistent with ty increment
// const boxHeight =
//   bulletLines.length * lineHeight +
//   pad * .5;


  // 👉 SECOND SAFETY CHECK (for tall boxes)
  // if (y + boxHeight > pageHeight - M.bottom) {
  //   doc.addPage();
  //   y = M.top + 60;
  // }

  // Draw box
  // doc.setDrawColor(...GRAY_BORDER);
  // doc.setLineWidth(1.1);
  // doc.rect(left, y, width, boxHeight);

  // Draw text
//   bulletLines.forEach(line => {
//   const cleanLine = line.trim();

//   // 🚫 skip empty lines
//   if (!cleanLine) return;

//   // 🚫 skip lines like "1." or "2."
//   if (/^\d+\.\s*$/.test(cleanLine)) return;

//   let tx = left + pad;
//   const segments = parseBoldText(cleanLine);

//   segments.forEach(seg => {
//     doc.setFont("Calibri", seg.bold ? "bold" : "normal");
//     doc.text(seg.text, tx, ty);
//     tx += doc.getTextWidth(seg.text);
//   });

//   ty += 13;
// });
let ty = y + pad + 2;

bulletLines.forEach(item => {
  const hasText = item.text && item.text.trim().length > 0;

  // 🚫 skip "4." / "8." only numbers
  if (item.number && !hasText) return;

  // 🚫 skip empty junk
  if (!item.number && !hasText) return;

  let tx = left + pad;

  // draw number ONLY on first line
  if (item.number) {
  const numWidth = doc.getTextWidth(item.number);

// right-align inside fixed column
const numX = tx + item.textOffset - numWidth;

// draw number
doc.text(item.number, numX, ty);

// add ONE space gap after number
tx += item.textOffset;

}
 else {
    tx += item.textOffset;
  }

  const segments = parseBoldText(item.text.trim());

  segments.forEach(seg => {
    doc.setFont("Calibri", seg.bold ? "bold" : "normal");
    doc.text(seg.text, tx, ty);
    tx += doc.getTextWidth(seg.text);
  });

  ty += 13;
});

   //0 padding for contents below TITLE 
//    bulletLines.forEach(item => {
//   const hasText = item.text && item.text.trim().length > 0;

//   if (item.number && !hasText) return;
//   if (!item.number && !hasText) return;

//   // ✅ key change here
//   let tx = item.number ? left + pad : left;

//   if (item.number) {
//     const numWidth = doc.getTextWidth(item.number);
//     const numX = tx + item.textOffset - numWidth;

//     doc.text(item.number, numX, ty);
//     tx += item.textOffset;
//   }

//   const segments = parseBoldText(item.text.trim());

//   segments.forEach(seg => {
//     doc.setFont("Calibri", seg.bold ? "bold" : "normal");
//     doc.text(seg.text, tx, ty);
//     tx += doc.getTextWidth(seg.text);
//   });

//   ty += 13;
// });







  // return y + boxHeight -30;
const AFTER_BOX_GAP = 5;
return ty + AFTER_BOX_GAP;


}


  function drawLabeledBoxWebLinks(title, content, yStart) {
  const left = M.left;
  const width = pageWidth - M.left - M.right;
  const pad = 10;
  let y = Number(yStart) + 5 || M.top;

 let rawLinks = [];

if (Array.isArray(content)) {
  rawLinks = content;
} else {
  rawLinks = String(content || "").split("\n");
}

// 🔍 CHECK LIST (only to decide if section should render)
const checkLinks = rawLinks
  .map(l => String(l).trim())
  .filter(l => {
    if (!l) return false;
    if (/^\d+\.\s*$/.test(l)) return false;     // "2."
    if (/add web links/i.test(l)) return false; // template junk
    return true;
  });

// 🚫 nothing meaningful → skip entire section
if (checkLinks.length === 0) return yStart;

// ✅ DISPLAY LIST
const links = rawLinks
  .map(l => String(l).trim())
  .filter(l => {
    if (!l) return false;
    if (/^\d+\.\s*$/.test(l)) return false;
    if (/add web links/i.test(l)) return false;
    return true;
  });


  // 👉 PAGE BREAK CHECK
  if (pageHeight - M.bottom - y < 50) {
    doc.addPage();
    y = M.top + 70;
  }

  // TITLE
  doc.setFont("Calibri", "bold");
  doc.setFontSize(12);
  doc.text(String(title || ""), left, y);

  doc.setFont("Calibri", "normal");
  doc.setFontSize(9);
  y += 0;

  let ty = y + pad + 4;
  // let count = 1;

  links.forEach(ln => {
    doc.setTextColor(0, 0, 255);
doc.text(ln, left + pad, ty, {
      maxWidth: width - pad * 2,
      underline: true,
    });

if (/^(https?:\/\/|www\.)/i.test(ln)) {
  doc.link(left + pad, ty - 6, doc.getTextWidth(ln), 10, { url: ln });
}

    doc.setTextColor(0, 0, 0);
    ty += 12;
    // count++;
  });

  return ty + 10;
}



    // Prepare objectives and TLP using safeList (works if string or array)
    const objectivesArr = Array.isArray(data.course_objectives)
      ? data.course_objectives
      : data.course_objectives
      ? [data.course_objectives]
      : [];
    const objectivesText = objectivesArr.map((s) => String(s)).join("\n");

    if (objectivesText.trim().length > 0) {
      curY = drawLabeledBox(
        "Course Objectives",
        objectivesText,
        curY+5
      );
    }

    const tlArr = Array.isArray(data.teaching_learning)
      ? data.teaching_learning
      : data.teaching_learning
      ? [data.teaching_learning]
      : [];
    const tlText = tlArr.map((s) => String(s)).join("\n");

    if (tlText.trim().length > 0) {
      curY = drawLabeledBox("Teaching-Learning Process", tlText, curY );
    }
    const toolsArr = Array.isArray(data.modern_tools)
      ? data.modern_tools
      : data.modern_tools
      ? [data.modern_tools]
      : [];
    const toolsTxt = toolsArr.map((s) => String(s)).join("\n");

    if (tlText.trim().length > 0) {
      curY = drawLabeledBox("Modern AI Tools Used", toolsTxt, curY );
    }

    // --- Modules (Option B: module content as bullet points) ---
    function drawExperimentsTable(doc, yStart, experiments) {
  const rows = experiments.map(exp => {
    return [
      exp.slno.toString(),
      exp.cont // Multi-line cell
    ];
  });

  autoTable(doc, {
    startY: yStart-10,
    head: [
      ["Sl. No.", "Experiments"]
    ],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 10,
      valign: "top",
      cellPadding: 4,
      textColor: [0, 0, 0],
      font: "Calibri",
      lineWidth: 0.8,
  lineColor: GRAY_BORDER,
    // overflow: "linebreak" // IMPORTANT

    },
    headStyles: {
      fillColor: [240, 240, 240],
      fontStyle: "bold",
      textColor: 0,
        halign: "center" ,
        fontSize:12  // ✅ header centered
        

    },
    columnStyles: {
      0: { cellWidth: 40, halign: "center" },
      1: { cellWidth: "auto" } // auto-wrap text
    },
    margin: { 
      left: M.left, 
      right: M.right,
      top: M.top + 80,
      bottom: M.bottom + 10 // IMPORTANT: Reserve space for footer
    },
    tableLineWidth: 0.8,
tableLineColor: GRAY_BORDER,
    tableWidth: "auto",
    // ✅ Add header on new pages if table spans multiple pages
    showHead: 'everyPage', // Show header on every page
    
    // ✅ KEY FIX: Add header AND footer on each page
    didDrawPage: function(data) {
      // If this is NOT the first page of the table, add header
      if (data.pageNumber > 1 || doc.internal.getCurrentPageInfo().pageNumber > 1) {
        // addHeader(); // Add your header
        curY = M.top + 100; // Start table below header

      }
      
      // Always add footer
      // addFooter(doc.getNumberOfPages());
      
      // Update curY after the table on each page
      curY = data.cursor.y;
    }
    
    
  });

  return doc.lastAutoTable.finalY +10;
}

function parseBoldText(text) {
  const regex = /\*\*(.*?)\*\*/g;
  let result = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // normal text before **
    if (match.index > lastIndex) {
      result.push({
        text: text.slice(lastIndex, match.index),
        bold: false
      });
    }

    // bold text inside **
    result.push({
      text: match[1],
      bold: true
    });

    lastIndex = regex.lastIndex;
  }

  // remaining normal text
  if (lastIndex < text.length) {
    result.push({
      text: text.slice(lastIndex),
      bold: false
    });
  }

  return result;
}



//     function drawModuleBox(title, content, meta, yStart) {
//   // content normalization + sanitize
//   content = normalizeMathText(String(content || ""));
//   content = sanitizeModuleText(content);

//   const left = M.left;
//   const width = pageWidth - M.left - M.right;
//   const pad = 5;

//   // Split content into points by full stop OR newline
//   let parts = content
//     .replace(/\n+/g, "\n")
//     .split(/\.(?:\s+|\n)|\n/)
//     .map((p) => p.trim())
//     .filter((p) => p.length > 0);

//   if (parts.length === 0) {
//     parts = [];
//   }

//   // Helper function to wrap text with word breaking and hyphenation
//   function wrapTextWithHyphenation(text, maxWidth) {
//     const words = text.split(' ');
//     const lines = [];
//     let currentLine = '';

//     words.forEach((word) => {
//       const testLine = currentLine ? currentLine + ' ' + word : word;
//       const testWidth = doc.getTextWidth(testLine);

//       if (testWidth <= maxWidth) {
//         currentLine = testLine;
//       } else {
//         // Check if single word is too long
//         const wordWidth = doc.getTextWidth(word);
        
//         if (wordWidth > maxWidth && currentLine === '') {
//           // Break the long word with hyphen
//           let remainingWord = word;
//           while (remainingWord.length > 0) {
//             let fitLength = remainingWord.length;
            
//             // Find how many characters fit with hyphen
//             for (let i = 1; i <= remainingWord.length; i++) {
//               const chunk = remainingWord.substring(0, i) + '-';
//               if (doc.getTextWidth(chunk) > maxWidth) {
//                 fitLength = Math.max(1, i - 1);
//                 break;
//               }
//             }
            
//             const chunk = remainingWord.substring(0, fitLength);
//             lines.push(chunk + '-');
//             remainingWord = remainingWord.substring(fitLength);
//           }
          
//           // Remove hyphen from last chunk
//           if (lines.length > 0) {
//             lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
//           }
//         } else {
//           // Push current line and start new one
//           if (currentLine) {
//             lines.push(currentLine);
//           }
          
//           // Check if new word itself is too long
//           if (wordWidth > maxWidth) {
//             let remainingWord = word;
//             while (remainingWord.length > 0) {
//               let fitLength = remainingWord.length;
              
//               for (let i = 1; i <= remainingWord.length; i++) {
//                 const chunk = remainingWord.substring(0, i) + '-';
//                 if (doc.getTextWidth(chunk) > maxWidth) {
//                   fitLength = Math.max(1, i - 1);
//                   break;
//                 }
//               }
              
//               const chunk = remainingWord.substring(0, fitLength);
//               if (remainingWord.length > fitLength) {
//                 lines.push(chunk + '-');
//               } else {
//                 currentLine = chunk;
//               }
//               remainingWord = remainingWord.substring(fitLength);
//             }
//           } else {
//             currentLine = word;
//           }
//         }
//       }
//     });

//     if (currentLine) {
//       lines.push(currentLine);
//     }

//     return lines;
//   }

//   // Wrap each point with hyphenation support
//   let bulletLines = [];
//   const maxTextWidth = width - (pad * 4) - 20;
  
//   parts.forEach((p) => {
//     const bulletText = "• " + p;
    
//     // Use custom wrapping with hyphenation
//     const wrapped = wrapTextWithHyphenation(bulletText, maxTextWidth);
    
//     wrapped.forEach((line, index) => {
//       if (index === 0) {
//         bulletLines.push({ text: line, hasBullet: true });
//       } else {
//         bulletLines.push({ text: line.trim(), hasBullet: false });
//       }
//     });
//   });

//   const lineHeight = 14;
//   const contentHeight = Math.max(30, bulletLines.length * lineHeight + pad * 2);

//   // Page-break guard
//   const approxTableHeight = 90;
//   if (yStart + contentHeight + approxTableHeight > pageHeight - M.bottom) {
//     // addFooter(doc.getNumberOfPages());
//     doc.addPage();
//     yStart = M.top + 80;
//   }

//   // Module title (centered)
//   doc.setFont('Calibri', 'bold');
//   doc.setFontSize(12);
//   doc.text(title, centerX(), yStart, { align: "center" });
  
//   yStart += 16;
  
//   doc.setFont("Calibri", "normal");
//   doc.setFontSize(9);
  
//   // Draw outer box for content
//   doc.setDrawColor(...GRAY_BORDER);
//   doc.setLineWidth(1.1);
//   doc.rect(left, yStart, width, contentHeight);

//   // Draw content lines with proper indentation
//   let ty = yStart + pad + 4;
//   const bulletIndent = 15;
  
// bulletLines.forEach((item) => {
//   let tx = item.hasBullet ? left + pad : left + pad + bulletIndent;

//   const segments = parseBoldText(item.text);

//   segments.forEach(seg => {
//     if (seg.bold) {
//       doc.setFont("Calibri", "bold");     // ✅ CORRECT
//     } else {
//       doc.setFont("Calibri", "normal"); // ✅ CORRECT
//     }

//     doc.text(seg.text, tx, ty);
//     tx += doc.getTextWidth(seg.text);
//   });

//   ty += lineHeight;
// });



//   // ========== HORIZONTAL TABLE FOR METADATA ==========
//   autoTable(doc, {
//     startY: yStart + contentHeight + 6,
//     margin: { left: left + 4, right: M.right + 4},
//     theme: "grid",
//     head: [["Text Book", "Chapter", "RBT","WKT"]],
//     body: [
//       [meta.textbook || "", meta.chapter || "", meta.rbt || "",meta.wkt || ""]
//     ],
//     styles: {
//       fontSize: 9,
//       cellPadding: 6,
//       font: "Calibri",
//       halign: "center",
//       valign: "middle",
//     },
//     headStyles: {
//       fillColor: [230, 230, 230],
//       fontStyle: "bold",
//       textColor: 0,
//       halign: "center",
//     },
//     columnStyles: {
//       0: { cellWidth: (width - 8) / 4 },
//       1: { cellWidth: (width - 8) / 4 },
//       2: { cellWidth: (width - 8) / 4 },
//       3: { cellWidth: (width - 8) / 4 },
//     },
//     tableWidth: width - 8,
//   });

//   // Draw final outer border including table bottom
//   const bottom = doc.lastAutoTable.finalY + 6;
//   doc.setDrawColor(...GRAY_BORDER);
//   doc.setLineWidth(1.2);
//   doc.rect(left, yStart, width, bottom - yStart);

//   return bottom + 18;
// }

// function estimateModuleHeight(text) {
//   const lines = text.split(/\n|\./).length;
//   return 40 + lines * 6 + 40; 
// }


// function drawModuleBox(title, content, meta, yStart) {
//   content = normalizeMathText(String(content || ""));
//   content = sanitizeModuleText(content);

//   const left = M.left;
//   const width = pageWidth - M.left - M.right;
//   const pad = 4;
//   const maxTextWidth = width - pad * 2;
//   const lineHeight = 10;

//   // ✅ Split into PARAGRAPHS (not sentences)
//   const paragraphs = content
//     .split(/\n\s*\n/)
//     .map(p => p.trim())
//     .filter(Boolean);

//   // === WRAP ALL PARAGRAPHS ===
//   let lines = [];

//   function wrapTextWithHyphenation(text, maxWidth) {
//     const words = text.split(' ');
//     const lines = [];
//     let currentLine = '';

//     words.forEach((word) => {
//       const testLine = currentLine ? currentLine + ' ' + word : word;
//       const testWidth = doc.getTextWidth(testLine);

//       if (testWidth <= maxWidth) {
//         currentLine = testLine;
//       } else {
//         const wordWidth = doc.getTextWidth(word);
        
//         if (wordWidth > maxWidth && currentLine === '') {
//           let remainingWord = word;
//           while (remainingWord.length > 0) {
//             let fitLength = remainingWord.length;
            
//             for (let i = 1; i <= remainingWord.length; i++) {
//               const chunk = remainingWord.substring(0, i) + '-';
//               if (doc.getTextWidth(chunk) > maxWidth) {
//                 fitLength = Math.max(1, i - 1);
//                 break;
//               }
//             }
            
//             const chunk = remainingWord.substring(0, fitLength);
//             lines.push(chunk + '-');
//             remainingWord = remainingWord.substring(fitLength);
//           }
          
//           if (lines.length > 0) {
//             lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
//           }
//         } else {
//           if (currentLine) {
//             lines.push(currentLine);
//           }
          
//           if (wordWidth > maxWidth) {
//             let remainingWord = word;
//             while (remainingWord.length > 0) {
//               let fitLength = remainingWord.length;
              
//               for (let i = 1; i <= remainingWord.length; i++) {
//                 const chunk = remainingWord.substring(0, i) + '-';
//                 if (doc.getTextWidth(chunk) > maxWidth) {
//                   fitLength = Math.max(1, i - 1);
//                   break;
//                 }
//               }
              
//               const chunk = remainingWord.substring(0, fitLength);
//               if (remainingWord.length > fitLength) {
//                 lines.push(chunk + '-');
//               } else {
//                 currentLine = chunk;
//               }
//               remainingWord = remainingWord.substring(fitLength);
//             }
//           } else {
//             currentLine = word;
//           }
//         }
//       }
//     });

//     if (currentLine) {
//       lines.push(currentLine);
//     }

//     return lines;
//   }

//   paragraphs.forEach((para, pIndex) => {
//     const wrapped = wrapTextWithHyphenation(para, maxTextWidth);
//     lines.push(...wrapped);

//     if (pIndex !== paragraphs.length - 1) {
//       lines.push("");
//     }
//   });

//   const contentHeight = lines.length * lineHeight + pad + 2;


//   if (yStart + contentHeight + 90 > pageHeight - M.bottom) {
//     doc.addPage();
//     yStart = M.top + 80;
//   }

//   // === TITLE ===
//   doc.setFont("Calibri", "bold");
//   doc.setFontSize(12);
//   doc.text(title, centerX(), yStart, { align: "center" });
//   yStart += 10;

//   // === BOX ===
//   doc.setDrawColor(...GRAY_BORDER);
//   doc.setLineWidth(1.1);
//   doc.rect(left, yStart, width, contentHeight);

//   // === TEXT WITH BOLD SUPPORT + JUSTIFICATION ===
//   let ty = yStart + pad + 4;

//   lines.forEach((line, lineIndex) => {
//     if (!line.trim()) {
//       ty += lineHeight;
//       return;
//     }
    

//     // Parse bold segments
//     const segments = parseBoldText(line);
    
//     // Calculate total text width
//     let totalTextWidth = 0;
//     segments.forEach(seg => {
//       doc.setFont("Calibri", seg.bold ? "bold" : "normal");
//       doc.setFontSize(7.5);
//       totalTextWidth += doc.getTextWidth(seg.text);
//     });

//     // ✅ JUSTIFICATION: Calculate extra space to distribute
//     const isLastLineInParagraph = (lineIndex === lines.length - 1 || lines[lineIndex + 1] === "");
//     const extraSpace = isLastLineInParagraph ? 0 : maxTextWidth - totalTextWidth;
    
//     // Count spaces in line for distribution
//     const spaceCount = (line.match(/ /g) || []).length;
//     const spaceAdjustment = spaceCount > 0 ? extraSpace / spaceCount : 0;

//     // Draw segments with adjusted spacing
//     let tx = left + pad;
//     segments.forEach(seg => {
//       doc.setFont("Calibri", seg.bold ? "bold" : "normal");
//       doc.setFontSize(7.5);
      
//       // Draw each word and add adjusted space
//       const words = seg.text.split(' ');
//       words.forEach((word, wIndex) => {
//         doc.text(word, tx, ty);
//         tx += doc.getTextWidth(word);
        
//         // Add space with justification adjustment
//         if (wIndex < words.length - 1) {
//           tx += doc.getTextWidth(' ') + spaceAdjustment;
//         }
//       });
//     });

//     ty += lineHeight;
//   });

//   // === METADATA TABLE ===
//   autoTable(doc, {
// startY: yStart + contentHeight + 3,
//     margin: { left: left + 4, right: M.right + 4 },
//     theme: "grid",
//     head: [["Text Book", "Chapter", "RBT", "WK"]],
//     body: [[
//       meta.textbook || "-",
//       meta.chapter || "-",
//       meta.rbt || "-",
//       meta.wkt || "-"
//     ]],
//     styles: {
//       fontSize: 9,
//       cellPadding: 1,
//       font: "Calibri",
//       halign: "center",
//       valign: "middle",
//     },
//     headStyles: {
//       fillColor: [230, 230, 230],
//       fontStyle: "bold",
//       textColor: 0,
//     },
//     tableWidth: width - 8,
//   });

//   const bottom = doc.lastAutoTable.finalY + 6;
//   doc.rect(left, yStart, width, bottom - yStart);

//   return bottom + 12;
// }
function drawModuleBox(title, content, meta, yStart) {
  content = normalizeMathText(String(content || ""));
  content = sanitizeModuleText(content);

  const left = M.left;
  const width = pageWidth - M.left - M.right;
  const pad = 4;                 // ✅ half padding
  const lineHeight = 11;
  const maxTextWidth = width - pad * 2;

  // -------- WRAP CONTENT --------
  const words = content.split(" ");
  let lines = [];
  let line = "";

  words.forEach(word => {
    const test = line ? line + " " + word : word;
    if (doc.getTextWidth(test) <= maxTextWidth) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);

  const contentHeight = lines.length * lineHeight;
  const textbookRowHeight = 15;
  const headerRowHeight = 22;

  const totalHeight =
    pad +                   // top padding
    contentHeight +
    pad +                   // bottom padding (EQUAL)
    textbookRowHeight +
    headerRowHeight;

  // -------- PAGE BREAK --------
  if (yStart + totalHeight > pageHeight - M.bottom) {
    doc.addPage();
    yStart = M.top + 10;
  }

  // -------- OUTER BOX --------
  // doc.setDrawColor(...GRAY_BORDER);
  // doc.setLineWidth(1.1);
  // doc.rect(left, yStart+1, width, totalHeight);

  // -------- CONTENT START Y --------
  let y = yStart + pad +2;
  doc.setFontSize(10); // before title
  
  
  
  //   doc.setFont("Calibri", "bold");
  // doc.text(title, left + pad, y);
  // doc.text(meta.co || "", left + width / 2, y, { align: "center" });
  // doc.text(`CL: ${meta.cl || ""}`, left + width - pad, y, { align: "right" });
  doc.line(left, y-6, left + width, y-6);
  y+=5

  doc.setFontSize(12)
doc.setFont("Calibri", "bold");
doc.text(title, left+3,y); // ✅ centered title


y += 5;
doc.line(left, y, left + width, y);
y += 8;

  doc.setFontSize(9);

  // -------- JUSTIFIED TEXT + **BOLD** --------
  lines.forEach((l, idx) => {
    const segments = parseBoldText(l);

    let textWidth = 0;
    segments.forEach(seg => {
      doc.setFont("Calibri", seg.bold ? "bold" : "normal");
      textWidth += doc.getTextWidth(seg.text);
    });

    const isLastLine = idx === lines.length - 1;
    const extraSpace = isLastLine ? 0 : maxTextWidth - textWidth;
    const spaceCount = (l.match(/ /g) || []).length;
    const spaceAdjust = spaceCount > 0 ? extraSpace / spaceCount : 0;

    let x = left + pad;

    segments.forEach(seg => {
      doc.setFont("Calibri", seg.bold ? "bold" : "normal");
      const words = seg.text.split(" ");

      words.forEach((w, i) => {
        doc.text(w, x, y);
        x += doc.getTextWidth(w);
        if (i < words.length - 1) {
          x += doc.getTextWidth(" ") + spaceAdjust;
        }
      });
    });

    y += lineHeight;   // ✅ move DOWN (this was missing earlier)
  });

  // -------- SEPARATOR --------
  doc.line(left, y-5, left + width, y-5);
  y += 10;

  // -------- TEXTBOOK LINE --------
  doc.setFont("Calibri", "bold");
  const textbookText = `Textbook ${meta.textbook || ""}: ${meta.chapter || ""}`;

// 👇 limit textbook to LEFT HALF only
const maxLeftWidth = width / 2 - 20;

// split into multiple lines if needed
const textbookLines = doc.splitTextToSize(textbookText, maxLeftWidth);

// LEFT → Textbook (can be multi-line)
doc.text(
  textbookLines,
  left + pad,
  y - 5,
  { align: "left" }
);

// CENTER → RBT (always single line)
doc.text(
  `RBT: ${meta.rbt || ""}`,
  left + width / 2,
  y - 5,
  { align: "center" }
);

// RIGHT → WK (always single line)
doc.text(
  `WK: ${meta.wkt || ""}`,
  left + width - pad,
  y - 5,
  { align: "right" }
);

// 🧠 IMPORTANT: adjust Y if textbook wrapped
y += (textbookLines.length - 1) * 10;

  

  // -------- SEPARATOR --------
  // doc.line(left, y, left + width, y);
  // y += 10;

  // // -------- MODULE HEADER ROW --------
  // doc.text(title, left + pad, y);
  // doc.text(meta.co || "", left + width / 2, y, { align: "center" });
  // doc.text(`CL: ${meta.cl || ""}`, left + width - pad, y, { align: "right" });

  // return yStart + totalHeight + 6;

  const finalHeight = y - yStart + pad-6;

doc.setDrawColor(...GRAY_BORDER);
doc.setLineWidth(1.1);
// doc.rect(left, yStart, width, finalHeight);


  return yStart + finalHeight + 6;

}

function drawTableBorders(startY, endY, isFirstPage, isLastPage) {
  const left = M.left;
  const width = pageWidth - M.left - M.right;

  doc.setDrawColor(...GRAY_BORDER);
  doc.setLineWidth(1.1);

  // LEFT border
  doc.line(left, startY, left, endY);

  // RIGHT border
  doc.line(left + width, startY, left + width, endY);

  // TOP border → ONLY on first page
  if (isFirstPage) {
    doc.line(left, startY, left + width, startY);
  }

  // BOTTOM border → ONLY on last page
  if (isLastPage) {
    doc.line(left, endY+3, left + width, endY+3);
  }
}


function drawModulesTable(modules, startY) {
  let y = startY-6;
  let pageStartY = startY-6;

  let isFirstPage = true;

  modules.forEach((mod, idx) => {
    const estimatedHeight = estimateModuleHeight(mod.content);
    const remainingSpace = pageHeight - y - M.bottom;

    if (estimatedHeight > remainingSpace+100) {
      // Close borders on PREVIOUS page
      drawTableBorders(pageStartY, y, isFirstPage, false);

      doc.addPage();

      y = M.top + 10;
      pageStartY = y;
      isFirstPage = false;
    }

    y = drawModuleBox(`Module ${idx + 1}`, mod.content || "", mod, y);
  });

  // Close borders on LAST page
  drawTableBorders(pageStartY, y - 6, isFirstPage, true);

  return y + 8;
}




function estimateModuleHeight(content) {
  const pad = 4;
  const lineHeight = 11;
  const titleHeight = 16;
  const metaTableHeight = 32;
  const bottomGap = 14;

  content = normalizeMathText(String(content || ""));
  content = sanitizeModuleText(content);

  const paragraphs = content
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  let lines = 0;

  paragraphs.forEach(p => {
    const words = p.split(" ");
    let line = "";

    words.forEach(w => {
      const test = line ? line + " " + w : w;
      if (doc.getTextWidth(test) <= pageWidth - M.left - M.right - 8) {
        line = test;
      } else {
        lines++;
        line = w;
      }
    });

    if (line) lines++;
    lines++; // paragraph spacing
  });

  const contentHeight =
    lines * lineHeight + pad ;

  return (
    titleHeight +
    contentHeight +
    metaTableHeight +
    bottomGap
  );
}

    curY += 8;


//     function estimateModulesTableHeight(modules) {
//   let height = 0;
//   modules.forEach(mod => {
//     height += estimateModuleHeight(mod.content);
//     height += 20; // separators + padding
//   });
//   return height;
// }


// Render modules only if present AND not empty
if (Array.isArray(data.modules) && data.modules.length > 0) {

  // OPTIONAL: filter empty modules first
  const validModules = data.modules.filter(shouldRenderModule);

  if (validModules.length > 0) {

    // Page-break safety (rough estimate for entire table)
    // const estimatedHeight = estimateModulesTableHeight(validModules);
    // const remainingSpace = pageHeight - curY - M.bottom;

    // if (estimatedHeight > remainingSpace) {
    //   doc.addPage();
    //   curY = M.top + 10;
    // }

    // ✅ SINGLE CALL — THIS IS THE FIX
    curY = drawModulesTable(validModules, curY);
  }
}





    //Experiments
    if (Array.isArray(data.experiments) && data.experiments.length > 0) {
    const spaceLeft = pageHeight - M.bottom - curY;
    
    // If not enough space for title + some rows, move to new page
    if (spaceLeft < 40) {
        // addFooter(doc.getNumberOfPages());
        doc.addPage();
        // addHeader(); // ✅ Add header on new page
        curY = M.top + 0; // Start below header
    }

    // Title
    if(data.course_type === "IPCC")
    {
      doc.setFont('Calibri', 'bold');
      doc.setFontSize(12);
      doc.text("PRACTICAL COMPONENTS", centerX(), curY + 3, { align: "center" });
      curY += 15;
    }

    // Table will handle its own page breaks with headers
    curY = drawExperimentsTable(doc, curY+5, data.experiments);
}

    // --- Textbooks
    if (shouldRenderTextbooks(data.textbooks || [])) {

  const TEXTBOOK_TITLE_HEIGHT = 18;
  const TABLE_HEADER_HEIGHT = 18;
  const ONE_ROW_HEIGHT = 14;
  const GAP_BEFORE = 10;

  const MIN_REQUIRED_HEIGHT =
    GAP_BEFORE +
    TEXTBOOK_TITLE_HEIGHT +
    TABLE_HEADER_HEIGHT +
    ONE_ROW_HEIGHT;

  const spaceLeft = pageHeight - curY - M.bottom;

  // 🚫 Prevent orphan header
  if (spaceLeft < MIN_REQUIRED_HEIGHT) {
    doc.addPage();
    curY = M.top ;
  }

  // ---- TITLE ----
  curY += 5;
  doc.setFont("Calibri", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Textbooks", M.left, curY);

  curY += 5;

  // ---- TABLE ----
  autoTable(doc, {
    startY: curY,
    head: [["Sl.No", "Author", "Book Title", "Publisher&Edition", "Year"]],
    body: (data.textbooks || [])
      .filter(tb =>
        tb.slNo || tb.author || tb.bookTitle || tb.publisher || tb.year
      )
      .map(tb => [
        tb.slNo || "",
        tb.author || "",
        tb.bookTitle || "",
        tb.publisher || "",
        tb.year || ""
      ]),
    theme: "grid",
    headStyles: { fillColor: [210, 210, 210], textColor: 0 ,fontSize:11,font:"Calibri"},
    styles: { fontSize: 9 ,lineWidth: 0.8, font:"Calibri",lineColor: GRAY_BORDER},
    margin: { left: M.left, right: M.right },
    tableWidth: pageWidth - M.left - M.right,
    showHead: "everyPage", // ✅ continuation pages get header
  });

  curY = doc.lastAutoTable.finalY + 15;
}


    const outComes = Array.isArray(data.course_outcomes)
      ? data.course_outcomes
      : data.course_outcomes
      ? [data.course_outcomes]
      : [];
    const outComes_text = outComes.map((s) => String(s)).join("\n");

    if (outComes_text.trim().length > 0) {
      // const te = "At the end of the course, the student will be able to:\n"
      curY = drawLabeledBox("Course Outcomes", outComes_text, curY);

    }

    //Web Links Section
    const weblinks = Array.isArray(data.referral_links)
      ? data.referral_links
      : data.referral_links
      ? [data.referral_links]
      : [];
    const weblinks_text = weblinks.map((s) => String(s)).join("\n");

    if (weblinks_text.trim().length > 0) {
      curY = drawLabeledBoxWebLinks("Web Links", weblinks_text, curY);
    }



    const activity_based = Array.isArray(data.activity_based)
      ? data.activity_based
      : data.activity_based
      ? [data.activity_based]
      : [];
    const activity_text = activity_based.map((s) => String(s)).join("\n");

    const spaceLeft = pageHeight - M.bottom - curY;
    
    // If not enough space for title + some rows, move to new page
    if (spaceLeft < 40) {
        // addFooter(doc.getNumberOfPages());
        doc.addPage();
        // addHeader(); // ✅ Add header on new page
        curY = M.top + 10; // Start below header
    }
  

    if (activity_text.trim().length > 0) {
      curY = drawLabeledBox("Activity-Based Learning/Practical-Based Learning", activity_text, curY);
    }
    // ================== CO–PO MAPPING TABLE ==================
if (data.copoMapping && Array.isArray(data.copoMapping.rows)) {

  const hasAnyCopoValue = data.copoMapping.rows.some(row =>
    [...row.vals, ...row.pso].some(v => {
      const num = Number(v);
      return !isNaN(num) && num > 0;
    })
  );

  if (hasAnyCopoValue) {
    
    // ✅ ONLY draw table if values exist

    // const spaceLeft = pageHeight - M.bottom - curY;
    // if (spaceLeft < 100) {
    //   doc.addPage();
    //   curY = M.top + 10;
    // }

    doc.setFont('Calibri', 'bold');
    doc.setFontSize(12);
    doc.text("CO–PO–PSO Mapping", centerX(), curY + 12, { align: "center" });
    curY += 13;

    doc.setFont("Calibri", "normal");

    const psoHeaders = data.copoMapping.rows[0].pso.map((_, i) => `PSO${i + 1}`) || [];

    const poHeaders = ["CO's", ...data.copoMapping.headers, ...psoHeaders];

    const copoRows = data.copoMapping.rows.map(row => [
      row.co,
      ...row.vals,
      ...row.pso
    ]);

    // const totalRow = [
    //   "Total",
    //   ...Array(poHeaders.length - 1).fill(0).map((_, colIndex) =>
    //     copoRows.reduce((sum, row) => {
    //       const val = Number(row[colIndex + 1]);
    //       return sum + (isNaN(val) ? 0 : val);
    //     }, 0)
    //   )
    // ];

   const avgRow = [
  "AVG",
  ...Array(poHeaders.length - 1).fill("").map((_, colIndex) => {
    let sum = 0;
    let count = 0;

    copoRows.forEach(row => {
      const val = Number(row[colIndex + 1]);

      if (!isNaN(val) && val > 0) {
        sum += val;
        count++;
      }
    });

    return count > 0 ? (sum / count).toFixed(1) : "";
  })
];

    autoTable(doc, {
      startY: curY + 10,
      head: [poHeaders],
      body: [...copoRows, avgRow],
      theme: "grid",
      styles: {
        fontSize: 9,
        halign: "center",
        valign: "middle",
        lineWidth:0.5,
            lineColor: [0, 0, 0],  // 🔥 PURE BLACK

      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 0,
        fontStyle: "bold",
      },
      margin: { left: M.left, right: M.right },
      tableWidth: pageWidth - M.left - M.right,
    });

    curY = doc.lastAutoTable.finalY + 20;
  }
}



//FOOTER
    // addFooter(doc.getNumberOfPages());


    // ================= HEADER & FOOTER: FIRST + LAST PAGE ONLY =================
const totalPages = doc.getNumberOfPages();

// for (let i = 1; i <= totalPages; i++) {
//   // if (i === 1 || i === totalPages) {
//   //   doc.setPage(i);
//   //   addHeader();
//   //   addFooter(i);
//   // }
//   if (i === 1 ) {
//     doc.setPage(i);
//     addHeader();
//     // addFooter(i);
//   }
// }

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
    doc.save((fileName || "syllabus") + ".pdf");
  }

 useEffect(() => {
  if (strtDownload !== "pdf") return;

  generateSyllabusPDF();   // 👈 your existing logic

  }, [strtDownload]);

  return null;
}