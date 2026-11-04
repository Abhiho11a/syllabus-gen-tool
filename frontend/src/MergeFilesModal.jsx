import { useState, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { renderAsync } from "docx-preview";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "xmldom";
import { X, Upload, Trash2, Merge, Loader2, AlertCircle, FileText } from "lucide-react";
import headerFull from "./assets/images/header_img.png";
import logo from "./assets/images/logo.jpg";

const DEPARTMENTS = [
  {
    group: "UG / Engineering",
    options: [
      "Civil Engineering",
      "Mechanical Engineering",
      "Electrical and Electronics Engineering",
      "Electronics and Communication Engineering",
      "Computer Science and Engineering",
      "Electronics and Instrumentation Engineering",
      "Electronics and Telecommunication Engineering",
      "Information Science and Engineering",
      "Artificial Intelligence and Machine Learning",
      "Computer Science and Engineering (Internet of Things & Cyber Security including Blockchain Technology)",
      "Computer Science and Engineering (Data Science)",
      "Robotics & Artificial Intelligence",
      "Electronics Engineering (VLSI Design & Technology)",
      "Physical Education And Sports"
    ],
  },

  {
    group: "M.Tech Programmes",
    options: [
      "Structural Engineering",
      "Computer Science & Engineering",
      "VLSI Design & Embedded System",
    ],
  },

  {
    group: "Postgraduate Programmes",
    options: [
      "Master in Computer Applications (MCA)",
      "Master in Business Administration (MBA)",
    ],
  },
];

export default function MergeFilesModal({onClose}) {
  const [files, setFiles] = useState([]);
  const [mergeWithPageNos, setMergeWithPageNos] = useState(false);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState("");
  const [addGeneratedOn, setAddGeneratedOn] = useState(false);
  const [operation, setOperation] = useState("merge");
  const [selectedDepartment, setSelectedDepartment] = useState(
  "Computer Science and Engineering"
);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
  setDepartments(DEPARTMENTS);
}, []);


function handleFileSelect(e) {

  const selectedFiles =
    Array.from(e.target.files || []);

    if (operation === "headerFooter") {

      // Only one PDF is allowed
      if (files.length >= 1) {
        return;
      }

      const pdf = selectedFiles.find(file =>
        file.name.toLowerCase().endsWith(".pdf")
      );

      if (!pdf) {
        alert("Please select a PDF file.");
        return;
      }

      setFiles([pdf]);

      return;
    }

  // Merge mode
  setFiles(prev => [
    ...prev,
    ...selectedFiles
  ]);
}

  function removeFile(index) {
    setFiles(files.filter((_, i) => i !== index));
  }

  function getFileIcon(name) {
    if (/\.pdf$/i.test(name)) return "📄";
    if (/\.docx$/i.test(name)) return "📝";
    return "📁";
  }

  // ── HELPER: wait for next animation frame (ensures browser has painted) ──
  function nextFrame() {
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  // ── HELPER: fetch image → base64 data URL ────────────────────────────────
async function loadImageAsBase64(src) {
  try {
    const response = await fetch(src);
    const blob     = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader   = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("loadImageAsBase64 failed:", e);
    return src;
  }
}

async function generateHeaderImage(pageWidthPt, department) {
  const headerBase64 =
    await loadImageAsBase64(headerFull);

  const logoBase64 =
    await loadImageAsBase64(logo);

  const PX =
    Math.round(pageWidthPt * 1.333);

  const wrapper =
    document.createElement("div");

  Object.assign(wrapper.style, {
    position: "fixed",
    top: "-9999px",
    left: "0",

    width: `${PX}px`,

    background: "#ffffff",

    overflow: "hidden",

    pointerEvents: "none",
  });

  const div =
    document.createElement("div");

  Object.assign(div.style, {
    width: `${PX}px`,

    background: "#ffffff",

    boxSizing: "border-box",

    margin: "0",

    padding: "8px 0 0 0",

    fontFamily: "Times New Roman, serif",

    overflow: "hidden",
  });

  div.innerHTML = `
  <div
    style="
      width:100%;
      box-sizing:border-box;
      font-family:'Times New Roman', serif;
    "
  >

    <!-- ================= HEADER FLEX ROW ================= -->
    <div
      style="
        width:81.5%;
        margin:0 auto;
        display:flex;
        align-items:center;
        box-sizing:border-box;
        min-height:90px;
      "
    >

      <!-- BIT LOGO -->
      <div
        style="
          width:100px;
          flex:0 0 100px;
          height:65px;
          display:flex;
          align-items:center;
          justify-content:flex-start;
          box-sizing:border-box;
        "
      >
        <img
          src="${logoBase64}"
          style="
            width:100px;
            height:100px;
            display:block;
            object-fit:contain;
          "
        />
      </div>


      <!-- COLLEGE + DEPARTMENT DETAILS -->
      <div
        style="
          flex:1;
          min-width:0;
          text-align:center;
          box-sizing:border-box;
          padding:0 5px;
        "
      >

        <!-- COLLEGE NAME -->
        <div
          style="
            width:100%;
            font-size:21px;
            font-weight:800;
            color:#8b0000;
            line-height:1.15;
            margin:0;
            padding:0;
            text-align:center;
            white-space:nowrap;
          "
        >
          BANGALORE INSTITUTE OF TECHNOLOGY
        </div>


        <!-- AUTONOMOUS DESCRIPTION -->
        <div
          style="
            width:100%;
            font-size:13.5px;
            color:#333;
            line-height:1.3;
            margin-top:3px;
            padding:0;
            text-align:center;
            white-space:nowrap;
          "
        >
          An Autonomous Institution under-VTU, K R Road, V. V. Puram,
          Bengaluru – 560004
        </div>


        <!-- DEPARTMENT -->
        <div
          style="
            width:100%;
            font-size:18px;
            font-weight:800;
            color:#17365d;
            line-height:1.25;
            margin-top:2px;
            text-align:center;
            white-space:normal;
            overflow-wrap:break-word;
            word-break:normal;
            padding:0;
          "
        >
          Department of ${department}
        </div>

      </div>

    </div>


    <!-- ================= HORIZONTAL LINE ================= -->
    <div
      style="
        width:81%;
        height:2px;
        background:#17365d;
        margin-left:76px;
        margin-top:5px;
        box-sizing:border-box;
      "
    ></div>

  </div>
`;

  wrapper.appendChild(div);

  document.body.appendChild(wrapper);


  // =========================================================
  // WAIT FOR DOM + IMAGE RENDERING
  // =========================================================

  await new Promise(resolve =>
    requestAnimationFrame(() =>
      requestAnimationFrame(resolve)
    )
  );


  // =========================================================
  // ACTUAL DIMENSIONS
  // =========================================================

  const W =
    div.scrollWidth || PX;

  const H =
    div.scrollHeight || 100;


  // =========================================================
  // GENERATE PNG
  // =========================================================

  const dataUrl =
    await htmlToImage.toPng(
      div,
      {
        backgroundColor: "#ffffff",

        pixelRatio: 2,

        width: W,

        height: H,
      }
    );


  document.body.removeChild(wrapper);


  // =========================================================
  // CONVERT BASE64 → BYTES
  // =========================================================

  const base64 =
    dataUrl.split(",")[1];


  return {
    bytes: Uint8Array.from(
      atob(base64),
      c => c.charCodeAt(0)
    ),

    width: W,

    height: H,
  };
}

async function generateFooterImage(pageWidthPt) {
  const PX =
    Math.round(pageWidthPt * 1.333);

  const wrapper =
    document.createElement("div");

  Object.assign(wrapper.style, {
    position: "fixed",
    top: "-99999px",
    left: "-99999px",

    width: `${PX}px`,

    background: "#ffffff",

    overflow: "hidden",

    pointerEvents: "none",
  });

  const div =
    document.createElement("div");

  Object.assign(div.style, {
    width: `${PX}px`,

    background: "#ffffff",

    boxSizing: "border-box",

    padding: "0 28px 0 28px",

    margin: "0",

    fontFamily:
      "Times New Roman, serif",
  });

  div.innerHTML = `
    <div
      style="
        width:88%;
        border-top:1px solid #17365d;
        margin:0 0 5px 0;
        padding:0;
        margin-left:46px;
      "
    ></div>

    <div
      style="
        text-align:center;
        font-size:12px;
        color:#000;
        line-height:1.25;
        margin:0;
        padding:0;
      "
    >
      K R Road, V. V. Puram, Bengaluru–560004
    </div>

    <div
      style="
        text-align:center;
        font-size:11px;
        color:#000;
        line-height:1.25;
        margin:0;
        padding:0;
      "
    >
      Website: <a href = "https://www.bit-bangalore.edu.in" > www.bit-bangalore.edu.in </a>
    </div>
  `;

  wrapper.appendChild(div);

  document.body.appendChild(wrapper);

  await new Promise(resolve =>
    requestAnimationFrame(() =>
      requestAnimationFrame(resolve)
    )
  );

  const W =
    div.scrollWidth || PX;

  const H =
    div.scrollHeight || 40;

  const dataUrl =
    await htmlToImage.toPng(
      div,
      {
        backgroundColor: "#ffffff",

        pixelRatio: 2,

        width: W,
        height: H,
      }
    );

  document.body.removeChild(wrapper);

  const base64 =
    dataUrl.split(",")[1];

  return {
    bytes: Uint8Array.from(
      atob(base64),
      c => c.charCodeAt(0)
    ),

    width: W,
    height: H,
  };
}


async function addHeaderFooterToPages(pdf) {
  const pages = pdf.getPages();

  if (!pages.length) {
    throw new Error("PDF contains no pages.");
  }

  /*
   * Layout:
   *
   * ┌──────────────────────────────┐
   * │          FULL HEADER         │
   * ├──────────────────────────────┤
   * │                              │
   * │     ORIGINAL PDF CONTENT     │
   * │     ORIGINAL SIZE            │
   * │                              │
   * ├──────────────────────────────┤
   * │          FULL FOOTER         │
   * └──────────────────────────────┘
   *
   * IMPORTANT:
   * - Original PDF width stays unchanged.
   * - Original PDF content is NOT scaled.
   * - Header height is calculated from actual image ratio.
   * - Footer height is calculated from actual footer content.
   */

  const headerCache = new Map();
  const footerCache = new Map();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    const {
      width: originalWidth,
      height: originalHeight,
    } = page.getSize();

    const cacheKey =
      `${Math.round(originalWidth)}x${Math.round(originalHeight)}`;

    // =========================================================
    // HEADER
    // =========================================================

    setProgress(
      `Preparing header (${i + 1}/${pages.length})...`
    );

    let headerData =
      headerCache.get(cacheKey);

    if (!headerData) {
      const generatedHeader =
        await generateHeaderImage(originalWidth,selectedDepartment);

      /*
       * generateHeaderImage() returns:
       *
       * {
       *   bytes,
       *   width,
       *   height
       * }
       *
       * IMPORTANT:
       * Pass ONLY generatedHeader.bytes to embedPng().
       */

      const headerImage =
        await pdf.embedPng(
          generatedHeader.bytes
        );

      /*
       * Preserve the actual aspect ratio.
       */
      // const headerHeight =
      //   originalWidth *
      //   (
      //     generatedHeader.height /
      //     generatedHeader.width
      //   );

      // headerData = {
      //   image: headerImage,
      //   height: headerHeight,
      // };

      // =========================================================
      // HEADER DISPLAY SIZE
      // =========================================================

      const headerDrawWidth = originalWidth;

      const headerDrawHeight =
        headerDrawWidth *
        (
          generatedHeader.height /
          generatedHeader.width
        );

      headerData = {
        image: headerImage,
        width: headerDrawWidth,
        height: headerDrawHeight,
        horizontalPadding: 0,
      };

      headerCache.set(
        cacheKey,
        headerData
      );
    }

    // =========================================================
    // FOOTER
    // =========================================================

    setProgress(
      `Preparing footer (${i + 1}/${pages.length})...`
    );

    let footerData =
      footerCache.get(cacheKey);

    if (!footerData) {
      const generatedFooter =
        await generateFooterImage(originalWidth);

      /*
       * Same structure:
       *
       * {
       *   bytes,
       *   width,
       *   height
       * }
       */

      const footerImage =
        await pdf.embedPng(
          generatedFooter.bytes
        );

      /*
       * Calculate actual footer height.
       * This prevents the large empty area.
       */
      const footerHeight =
        originalWidth *
        (
          generatedFooter.height /
          generatedFooter.width
        );

      footerData = {
        image: footerImage,
        height: footerHeight,
      };

      footerCache.set(
        cacheKey,
        footerData
      );
    }

    // =========================================================
  // ACTUAL DIMENSIONS
  // =========================================================

  const headerHeight =
    headerData.height;

  const footerHeight =
    footerData.height;

  // =========================================================
  // PAGE SPACING
  // =========================================================

  // Space above the header.
  // Prevents the header from touching the page boundary.
  const headerTopGap = 13;

  // Small gap between header and original PDF content.
  const headerContentGap = -10;

  // Almost no empty space below footer.
  const footerGap = 0;

  // const topReserved =
  //   headerHeight +
  //   headerTopGap - 5;
  const topReserved =
  headerData.height +
  headerTopGap;

  const bottomReserved =
    footerHeight +
    footerGap - 10;

  // =========================================================
  // EXPAND PAGE
  // =========================================================

  const newPageHeight =
    originalHeight +
    topReserved +
    bottomReserved;

  /*
  * IMPORTANT:
  * Width remains EXACTLY unchanged.
  */
  page.setSize(
    originalWidth,
    newPageHeight
  );

  // =========================================================
  // MOVE ORIGINAL CONTENT
  // =========================================================

  page.translateContent(
    0,
    bottomReserved
  );

  // =========================================================
  // DRAW HEADER
  // =========================================================

  setProgress(
    `Adding header (${i + 1}/${pages.length})...`
  );

  page.drawImage(
    headerData.image,
    {
      x: headerData.horizontalPadding,

      y:
        bottomReserved +
        originalHeight +
        headerContentGap,

      width:
        headerData.width,

      height:
        headerData.height,
    }
  );

    // =========================================================
    // GENERATED ON
    // =========================================================

    if (addGeneratedOn) {
      const now = new Date();

      const formatted =
        now.toLocaleString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }
        );

      page.drawText(
        `Generated on: ${formatted}`,
        {
          x:
            originalWidth - 150,

          y:
            newPageHeight - 22,

          size: 7,

          color:
            rgb(0, 0, 0),
        }
      );
    }

    // =========================================================
    // DRAW FOOTER
    // =========================================================

    setProgress(
      `Adding footer (${i + 1}/${pages.length})...`
    );

    page.drawImage(
      footerData.image,
      {
        x: 0,

        y: footerGap,

        width:
          originalWidth,

        height:
          footerHeight,
      }
    );

    // =========================================================
    // PAGE NUMBER
    // =========================================================

    if (mergeWithPageNos) {
      page.drawText(
        `Page ${i + 1} of ${pages.length}`,
        {
          x:
            originalWidth - 95,

          y: 15,

          size: 8,

          color:
            rgb(0, 0, 0),
        }
      );
    }
  }
}

// ── PDF MERGE ────────────────────────────────────────────────
async function mergePDFs(pdfFiles) {

  const mergedPdf = await PDFDocument.create();

  for (const file of pdfFiles) {

    const bytes = await file.arrayBuffer();

    const pdf = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
    });

    const pages = await mergedPdf.copyPages(
      pdf,
      pdf.getPageIndices()
    );

    pages.forEach(page => {
      mergedPdf.addPage(page);
    });
  }

  const now = new Date();

  const date = now
    .toLocaleDateString("en-GB")
    .replace(/\//g, "-");

  const time = now
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/:/g, "-");

  const blob = new Blob(
    [await mergedPdf.save()],
    {
      type: "application/pdf",
    }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = `merged_${date}_${time}.pdf`;

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);
}
async function convertDOCXtoPDF(docxFile) {
  const buf = await docxFile.arrayBuffer();

  const wrapper = document.createElement("div");

  Object.assign(wrapper.style, {
    position: "fixed",
    top: "-99999px",
    left: "-99999px",
    width: "900px",
    background: "#ffffff",
  });

  wrapper.className = "docx-wrapper";

  document.body.appendChild(wrapper);

  try {
    await renderAsync(buf, wrapper);

    const pdf = new jsPDF("p", "pt", "a4");

    const pdfW =
      pdf.internal.pageSize.getWidth();

    const pages =
      wrapper.querySelectorAll("section.docx");

    if (!pages.length) {
      throw new Error(
        `Could not render ${docxFile.name} into pages.`
      );
    }

    for (let i = 0; i < pages.length; i++) {

      const img = await htmlToImage.toPng(
        pages[i],
        {
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        }
      );

      const imageProps =
        await pdf.getImageProperties(img);

      if (i !== 0) {
        pdf.addPage();
      }

      const imageHeight =
        (imageProps.height * pdfW) /
        imageProps.width;

      pdf.addImage(
        img,
        "PNG",
        0,
        0,
        pdfW,
        imageHeight
      );
    }

    return new File(
      [
        pdf.output("blob")
      ],
      docxFile.name.replace(
        /\.docx$/i,
        ".pdf"
      ),
      {
        type: "application/pdf",
      }
    );

  } finally {
    wrapper.remove();
  }
}

  // ── DOCX MERGE ───────────────────────────────────────────────────────────
  async function mergeDOCX(docxFiles) {
  const zipMain = new JSZip();
  await zipMain.loadAsync(await docxFiles[0].arrayBuffer());

  let mainXML = await zipMain.file("word/document.xml").async("string");

  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  let xMain = parser.parseFromString(mainXML, "text/xml");
  let bMain = xMain.getElementsByTagName("w:body")[0];

  for (let i = 1; i < docxFiles.length; i++) {
    const zipNext = new JSZip();
    await zipNext.loadAsync(await docxFiles[i].arrayBuffer());

    let xml2 = await zipNext.file("word/document.xml").async("string");

    const xNext = parser.parseFromString(xml2, "text/xml");
    const bNext = xNext.getElementsByTagName("w:body")[0];

    // 👉 ADD PAGE BREAK BEFORE MERGING
    const pageBreak = xMain.createElement("w:p");
    const run = xMain.createElement("w:r");
    const br = xMain.createElement("w:br");
    br.setAttribute("w:type", "page");

    run.appendChild(br);
    pageBreak.appendChild(run);
    bMain.appendChild(pageBreak);

    // 👉 IMPORT NODES SAFELY
    const children = Array.from(bNext.childNodes);

    children.forEach(node => {
      const imported = xMain.importNode(node, true);
      bMain.appendChild(imported);
    });
  }

  const updatedXML = serializer.serializeToString(xMain);
  zipMain.file("word/document.xml", updatedXML);

  const blob = await zipMain.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return new File([blob], "Merged_File.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

// ── ADD HEADER & FOOTER TO SINGLE PDF ─────────────────────────────
async function handleHeaderFooter() {

  if (files.length !== 1) {
    alert("Please select exactly one PDF file.");
    return;
  }

  const file = files[0];

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    alert("Please select a PDF file.");
    return;
  }

  try {

    setMerging(true);
    setProgress("Loading PDF...");

    const bytes = await file.arrayBuffer();

    const pdf = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
    });

    setProgress("Adding header and footer...");

    await addHeaderFooterToPages(pdf);

    setProgress("Generating final PDF...");

    const outputBytes = await pdf.save();

    const blob = new Blob(
      [outputBytes],
      { type: "application/pdf" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    const baseName = file.name
      .replace(/\.pdf$/i, "");

    a.download = `${baseName}_header_footer.pdf`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);

    setProgress("Completed");

  } catch (error) {

    console.error(
      "Header/Footer processing failed:",
      error
    );

    alert(
      "Failed to add header and footer to the PDF."
    );

  } finally {

    setMerging(false);

  }
}


async function handleMerge() {
  const pdfFiles = files.filter(
    file => /\.pdf$/i.test(file.name)
  );

  const docxFiles = files.filter(
    file => /\.docx$/i.test(file.name)
  );

  if (files.length < 2) {
    alert("Add at least 2 files to merge.");
    return;
  }

  try {
    setMerging(true);

    const converted = [];

    for (let i = 0; i < docxFiles.length; i++) {
      setProgress(
        `Converting ${docxFiles[i].name} (${i + 1}/${docxFiles.length})...`
      );

      const convertedFile =
        await convertDOCXtoPDF(docxFiles[i]);

      converted.push(convertedFile);
    }

    const filesToMerge = [
      ...pdfFiles,
      ...converted,
    ];

    if (filesToMerge.length < 2) {
      throw new Error("Not enough valid files to merge.");
    }

    setProgress("Merging files...");

    await mergePDFs(filesToMerge);

    setProgress("Completed");

    onClose();

  } catch (error) {

    console.error("Merge failed:", error);

    alert(
      error?.message ||
      "Failed to merge the selected files."
    );

  } finally {

    setMerging(false);
  }
}

  const pdfCount =
    files.filter(f => /\.pdf$/i.test(f.name)).length;

  const docxCount =
    files.filter(f => /\.docx$/i.test(f.name)).length;

  function resetTool() {
    setFiles([]);
    setMergeWithPageNos(false);
    setAddGeneratedOn(false);
    setSelectedDepartment("Computer Science and Engineering");
    // setCustomDepartment("");
    setMerging(false);
    setProgress("");
    setOperation("merge");
  }

  function switchOperation(nextOperation) {
    setOperation(nextOperation);
    setFiles([]);
    setMergeWithPageNos(false);
    setAddGeneratedOn(false);
    setSelectedDepartment("Computer Science and Engineering");
    // setCustomDepartment("");
    setProgress("");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
         style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)", animation:"fadeIn .15s ease" }}>
      <div
        className="
          bg-white
          w-full max-w-xl
          rounded-[28px]
          shadow-[0_24px_80px_rgba(15,39,68,0.22)]
          border border-slate-200/70
          overflow-hidden
          max-h-[90vh]
          flex flex-col
        "
        style={{ animation: "slideUp .2s ease" }}
      >

        {/* ── HEADER ── */}
        <div className="px-6 pt-6 pb-2 border-b border-slate-100 relative"
             style={{ background:"linear-gradient(135deg,#f8fafc,white)" }}>
          <button onClick={() => { resetTool(); onClose(); }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100
                             flex items-center justify-center hover:bg-slate-200 cursor-pointer
                             transition-colors">
            <X size={14} className="text-slate-500" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200
                          flex items-center justify-center mb-3">
            <Merge size={22} className="text-slate-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">
            PDF Tools
          </h2>

          <p className="text-sm text-slate-400 mt-0.5">
            Choose an operation for your document
          </p>

          <div className="grid grid-cols-2 gap-2 mt-2">

            {/* MERGE */}
            <button
              type="button"
              onClick={() => {
                switchOperation("merge");
              }}
              className={`
                text-left rounded-xl border p-3 transition-all
                ${
                  operation === "merge"
                    ? "border-[#0f2744] bg-slate-50 ring-1 ring-[#0f2744]"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }
              `}
            >
              <div className="flex items-center gap-2">

                <div
                  className={`
                    w-7 h-7 rounded-lg flex items-center justify-center
                    ${
                      operation === "merge"
                        ? "bg-[#0f2744] text-white"
                        : "bg-slate-100 text-slate-500"
                    }
                  `}
                >
                  <Merge size={14} />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Merge Files
                  </p>

                  <p className="text-[10px] text-slate-400 mt-0.5">
                    2+ documents
                  </p>
                </div>

              </div>
            </button>


            {/* HEADER / FOOTER */}
            <button
              type="button"
              onClick={() => {
                switchOperation("headerFooter");
              }}
              className={`
                text-left rounded-xl border p-3 transition-all
                ${
                  operation === "headerFooter"
                    ? "border-[#0f2744] bg-slate-50 ring-1 ring-[#0f2744]"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }
              `}
            >
              <div className="flex items-center gap-2">

                <div
                  className={`
                    w-7 h-7 rounded-lg flex items-center justify-center
                    ${
                      operation === "headerFooter"
                        ? "bg-[#0f2744] text-white"
                        : "bg-slate-100 text-slate-500"
                    }
                  `}
                >
                  <FileText size={14} />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Header & Footer
                  </p>

                  <p className="text-[10px] text-slate-400 mt-0.5">
                    1 PDF
                  </p>
                </div>

              </div>
            </button>

          </div>

          {files.length > 0 && (
            <div className="flex gap-2 mt-1 -mb-3">
              {pdfCount  > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border
                                 bg-slate-100 text-slate-600 border-slate-200">
                  {pdfCount} PDF
                </span>
              )}
              {docxCount > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border
                                 bg-blue-50 text-blue-700 border-blue-200">
                  {docxCount} DOCX
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="px-7 py-5 flex flex-col gap-4 overflow-y-auto">

          {operation === "headerFooter" && (
            <>
            {/* DEPARTMENT */}

            <div
              className="
                bg-slate-50
                border border-slate-200
                rounded-xl
                px-4 py-3
              "
            >
              <div className="flex items-center justify-between gap-4">

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Department
                  </label>

                  <p className="text-xs text-slate-500 mb-2.5">
                    This department name will appear in the PDF header.
                  </p>

                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="
                      w-full
                      h-11
                      px-3.5
                      rounded-xl
                      border border-slate-200
                      bg-white
                      text-sm font-medium text-slate-700
                      outline-none
                      transition-all
                      hover:border-slate-300
                      focus:border-[#0f2744]
                      focus:ring-4
                      focus:ring-[#0f2744]/10
                    "
                  >
                    {departments.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.options.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

              </div>
            </div>

              {/* PAGE NUMBERS */}
              <div
                className="
                  flex items-center justify-between
                  bg-slate-50
                  border border-slate-200
                  rounded-xl
                  px-4 py-1
                "
              >
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Add Page Numbers
                  </p>

                  <p className="text-xs text-slate-400">
                    Show page number at the bottom
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMergeWithPageNos(p => !p)
                  }
                  className={`
                    relative inline-flex h-6 w-11
                    items-center rounded-full
                    transition-colors duration-300
                    cursor-pointer
                    ${
                      mergeWithPageNos
                        ? "bg-[#0f2744]"
                        : "bg-slate-300"
                    }
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4
                      rounded-full bg-white shadow
                      transition-transform
                      ${
                        mergeWithPageNos
                          ? "translate-x-6"
                          : "translate-x-1"
                      }
                    `}
                  />
                </button>
              </div>


              {/* GENERATED ON */}
              <div
                className="
                  flex items-center justify-between
                  bg-slate-50
                  border border-slate-200
                  rounded-xl
                  px-4 py-1
                "
              >
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Add Generated On
                  </p>

                  <p className="text-xs text-slate-400">
                    Show generation date and time in the header
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAddGeneratedOn(p => !p)
                  }
                  className={`
                    relative inline-flex h-6 w-11
                    items-center rounded-full
                    transition-colors duration-300
                    cursor-pointer
                    ${
                      addGeneratedOn
                        ? "bg-[#0f2744]"
                        : "bg-slate-300"
                    }
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4
                      rounded-full bg-white shadow
                      transition-transform
                      ${
                        addGeneratedOn
                          ? "translate-x-6"
                          : "translate-x-1"
                      }
                    `}
                  />
                </button>
              </div>
            </>
          )}

          {/* Upload drop zone */}
          <div
            className={`
              border-2 border-dashed rounded-2xl
              px-6 py-6
              text-center
              transition-all
              ${
                operation === "headerFooter" && files.length >= 1
                  ? "border-slate-200 bg-slate-100/70 cursor-not-allowed opacity-70"
                  : "border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-[#0f2744]/30 cursor-pointer"
              }
            `}
          >
            <input
              type="file"
              id="pdfToolFileInput"
              className="hidden"
              multiple={operation === "merge"}
              accept={
                operation === "merge"
                  ? ".pdf,.docx"
                  : ".pdf"
              }
              disabled={operation === "headerFooter" && files.length >= 1}
              onChange={handleFileSelect}
            />

            <label
              htmlFor="pdfToolFileInput"
              className={`
                block
                ${
                  operation === "headerFooter" && files.length >= 1
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }
              `}
            >
              <div
                className={`
                  w-12 h-11 rounded-xl
                  border
                  mx-auto flex items-center justify-center mb-1
                  ${
                    operation === "headerFooter" && files.length >= 1
                      ? "bg-slate-200 border-slate-300"
                      : "bg-slate-100 border-slate-200"
                  }
                `}
              >
                {operation === "headerFooter" && files.length >= 1 ? (
                  <FileText size={18} className="text-slate-400" />
                ) : (
                  <Upload size={18} className="text-slate-500" />
                )}
              </div>

              <p
                className={`
                text-sm font-semibold
                ${
                  operation === "headerFooter" && files.length >= 1
                    ? "text-slate-500"
                    : "text-slate-800"
                }
              `}
            >
              {operation === "merge"
                ? "Choose files to upload"
                : files.length >= 1
                  ? "PDF already selected"
                  : "Choose a PDF to upload"}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              {operation === "merge"
                ? "PDF or DOCX • Minimum 2 files"
                : files.length >= 1
                  ? "Only one PDF is allowed"
                  : "PDF • One file"}
            </p>
            </label>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="max-h-25 overflow-y-auto space-y-2 pr-1">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="
                    group
                    flex items-center gap-3
                    border border-slate-200
                    bg-white
                    rounded-xl
                    px-3.5 py-3
                    hover:border-slate-300
                    hover:shadow-sm
                    transition-all
                  "
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <FileText size={16} className="text-slate-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {file.name}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>

                  <button
                    onClick={() => removeFile(i)}
                    className="
                      w-8 h-8
                      rounded-lg
                      flex items-center justify-center
                      text-slate-400
                      hover:text-red-500
                      hover:bg-red-50
                      transition-colors
                    "
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {merging && progress && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200
                            rounded-xl px-4 py-3">
              <Loader2 size={14} className="text-slate-500 animate-spin flex-shrink-0" />
              <p className="text-xs font-semibold text-slate-600">{progress}</p>
            </div>
          )}

          {/* Mixed files warning */}
          {pdfCount > 0 && docxCount > 0 && !merging && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200
                            rounded-xl px-4 py-3 -mt-10 -mb-1">
              <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-semibold">
                DOCX files will be converted to PDF before merging
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">

            <button
              onClick={onClose}
              disabled={merging}
              className="flex-1 py-2.5 rounded-xl border border-slate-200
                        text-sm font-bold text-slate-500
                        hover:bg-slate-50 transition-colors
                        cursor-pointer
                        disabled:opacity-50
                        disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              onClick={
                operation === "merge"
                  ? handleMerge
                  : handleHeaderFooter
              }
              disabled={
                merging ||
                (
                  operation === "merge"
                    ? files.length < 2
                    : files.length !== 1
                )
              }
              className="flex-1 py-2.5 rounded-xl
                        text-sm font-bold text-white
                        flex items-center justify-center gap-2
                        transition-all cursor-pointer
                        bg-[#0f2744]
                        hover:bg-[#1e3a5f]
                        disabled:opacity-50
                        disabled:cursor-not-allowed"
            >

              {merging ? (
                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                  Processing...
                </>
              ) : operation === "merge" ? (
                <>
                  <Merge size={14} />
                  Merge Files
                </>
              ) : (
                <>
                  <FileText size={14} />
                  Add Header & Footer
                </>
              )}

            </button>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  );
} 