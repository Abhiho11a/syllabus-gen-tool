import { useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { renderAsync } from "docx-preview";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "xmldom";
import { X, Upload, Trash2, Merge, Loader2, AlertCircle } from "lucide-react";
import headerFull from "./assets/images/header_img.png";
import logo from "./assets/images/logo.png";

export default function MergeFilesModal({onClose}) {
  const [files,            setFiles]           = useState([]);
  const [mergeWithPageNos, setMergeWithPageNos] = useState(false);
  const [merging,          setMerging]          = useState(false);
  const [progress,         setProgress]         = useState("");
  const [mergeWithHeaderFooter,setMergeWithHeaderFooter] = useState(false)


  function handleFileSelect(e) {
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  }

  function removeFile(index) {
    setFiles(files.filter((_, i) => i !== index));
  }

  function getFileIcon(name) {
    if (name.endsWith(".pdf"))  return "📄";
    if (name.endsWith(".docx")) return "📝";
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

// ── HELPER: generate header PNG bytes ────────────────────────────────────
async function generateHeaderImage(pageWidthPt) {
  const now = new Date();
  const formatted = now.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const PX = Math.round(pageWidthPt * 1.333);
  const headerBase64 = await loadImageAsBase64(headerFull);
  const logoBase64 = await loadImageAsBase64(logo);

  const wrapper = document.createElement("div");
  Object.assign(wrapper.style, {
    position:      "fixed",
    top:           "-99999px",
    left:          "-99999px",
    width:         `${PX}px`,
    height:        "200px",
    overflow:      "hidden",
    pointerEvents: "none",
  });

  const div = document.createElement("div");
  Object.assign(div.style, {
    width:      `${PX}px`,
    background: "#ffffff",
    padding:    "8px 28px 6px 28px",   // tighter padding
    boxSizing:  "border-box",
    fontFamily: "Arial, sans-serif",
    opacity:    "1",
  });

  div.innerHTML = `
  <div style="
    position:relative;
    width:100%;
    margin-top:-10px;
  ">

    <!-- HEADER ROW -->
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      gap:${PX * 0.02}px;
    ">

      <!-- LOGO -->
      <img src="${logoBase64}" 
           style="
             width:${PX * 0.20}px;
             height:auto;
             margin-top:-2px;
             margin-left:-180px;
             padding:15px
           " />

      <!-- TEXT BLOCK -->
      <div style="
        text-align:center;
        margin-left:80px;
        margin-top:-10px;
        line-height:1.2;
      ">
        
        <div style="
          color:#d10000;
          font-weight:900;
          font-size:${PX * 0.02}px;
          font-family:'Times New Roman', serif;
        ">
          ಬೆಂಗಳೂರು ತಾಂತ್ರಿಕ ಮಹಾವಿದ್ಯಾಲಯ
        </div>

        <div style="
          color:#1a5fd0;
          font-weight:900;
          font-size:${PX * 0.017}px;
          margin-top:2px;
          font-family:'Georgia','Times New Roman',serif;
          letter-spacing:1px;
          text-shadow:0.4px 0 0 #1a5fd0;
        ">
          BANGALORE INSTITUTE OF TECHNOLOGY
        </div>

      </div>

    </div>

    <!-- DATE (absolute, outside flow) -->
    <div style="
      position:absolute;
      right:10px;
      top:2px;
      font-size:${PX * 0.015}px;
      font-family:'Times New Roman', serif;
    ">
      Generated on: ${formatted}
    </div>

    <!-- SUBTEXT (aligned with SAME CENTER BLOCK) -->
    <div style="
      display:flex;
      justify-content:center;
      margin-left:42px;
      margin-top:-13px;
              margin-bottom:-7px;
    ">
      <div style="
        margin-left:42px;
        margin-top:-50px;
        margin-bottom:-7px;
        font-size:${PX * 0.013}px;
        color:#0066c8;
        font-weight:600;
        letter-spacing:0.1px;
        font-family:'Times New Roman', serif;
      ">
        An Autonomous Institution Under VTU, Belagavi
      </div>
    </div>

    <!-- RED LINE -->
    <div style="
      border-top:2.5px solid #cc0000;
      margin-top:5px;
    "></div>

  </div>
`;

  wrapper.appendChild(div);
  document.body.appendChild(wrapper);

  // await new Promise((resolve) => {
  //   const img = div.querySelector("#hdrImg");
  //   if (img.complete && img.naturalWidth > 0) { resolve(); return; }
  //   img.onload  = resolve;
  //   img.onerror = resolve;
  // });

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const W = div.scrollWidth  || PX;
  const H = div.scrollHeight || 120;

  const dataUrl = await htmlToImage.toPng(div, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    width: W,
    height: H,
  });

  document.body.removeChild(wrapper);
  const base64 = dataUrl.split(",")[1];
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

// ── HELPER: generate footer PNG bytes ────────────────────────────────────
async function generateFooterImage(pageWidthPt, pageNum) {
  const PX = Math.round(pageWidthPt * 1.333);

  const wrapper = document.createElement("div");
  Object.assign(wrapper.style, {
    position:      "fixed",
    top:           "-99999px",
    left:          "-99999px",
    width:         `${PX}px`,
    height:        "200px",
    overflow:      "hidden",
    pointerEvents: "none",
  });

  const div = document.createElement("div");
  Object.assign(div.style, {
    width:      `${PX}px`,
    background: "#ffffff",
    padding:    "8px 28px 10px 28px",
    boxSizing:  "border-box",
    fontFamily: "Arial, sans-serif",
    opacity:    "1",           // ✅ fully visible to canvas renderer
  });

  div.innerHTML = `
    <div style="border-top:2.5px solid #cc0000;;margin-bottom:5px;"></div>
    <div style="text-align:center;font-size:9px;font-weight:bold;
                color:#000;">
      K.R. Road, V. V. Pura, Bengaluru – 560 004
    </div>
    <div style="text-align:center;font-size:9px;color:#000;">
      Phone: +91(080) 26613237, 26615865 | Website: www.bit-bangalore.edu.in
    </div>
    <div style="text-align:center;font-size:9px;font-weight:bold;
                color:#0000b4;">
      E-mail : principalbit4@gmail.com, principal@bit-bangalore.edu.in
    </div>
    <div style="text-align:center;font-size:9px;color:#000;margin-bottom:10px;">
      Accredited by NBA: 8 UG Programs, NAAC A+ and QS-I Gauge (Gold Rating)
    </div>
    <div style="text-align:right;font-size:13px;color:#000;margin-top:-16px">${mergeWithPageNos?pageNum:""}</div>
  `;

  wrapper.appendChild(div);
  document.body.appendChild(wrapper);

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const W = div.scrollWidth  || PX;
  const H = div.scrollHeight || 100;

  const dataUrl = await htmlToImage.toPng(div, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    width:  W,
    height: H,
  });

  document.body.removeChild(wrapper);

  const base64 = dataUrl.split(",")[1];
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

  // ── PDF MERGE - updated with page content shift ───────────────────────────
async function mergePDFs(pdfFiles) {
  const mergedPdf = await PDFDocument.create();

  for (const file of pdfFiles) {
    const bytes = await file.arrayBuffer();
    const pdf   = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(p => mergedPdf.addPage(p));
  }

  const now = new Date();
  const formatted = now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  

  const allPages  = mergedPdf.getPages();
  const firstPage = allPages[0];
  const lastPage  = allPages[allPages.length - 1];
  const { width: pageW, height: pageH } = firstPage.getSize();
  

  const headerHeightPt = 95;
  const shiftDown      = headerHeightPt + 10;

  
  const firstFileBytes  = await pdfFiles[0].arrayBuffer();
  const firstFilePdf    = await PDFDocument.load(firstFileBytes, { ignoreEncryption: true });

  const [embeddedPage]  = await mergedPdf.embedPdf(firstFilePdf, [0]);

  
  const availableHeight = pageH - shiftDown;  // space below header
  const scaleY          = availableHeight / pageH;  // scale content to fit
  
  // ── HEADER on first page (drawn last so it's on top) ─────────────────────
  if(mergeWithHeaderFooter)
  {
  firstPage.drawRectangle({
    x: 0, y: 0, width: pageW, height: pageH,
    color: rgb(1, 1, 1),
  });
  
  firstPage.drawPage(embeddedPage, {
    x:      0,
    y:      0,                    // anchor to bottom of page
    width:  pageW,
    height: availableHeight+20,      // only fill the non-header area
  });
  
    setProgress("Generating header…");
    const headerBytes = await generateHeaderImage(pageW);
    const headerImg   = await mergedPdf.embedPng(headerBytes);
    firstPage.drawImage(headerImg, {
      x:      0,
      y:      pageH - headerHeightPt,
      width:  pageW,
      height: headerHeightPt,
    });

    // ── FOOTER on last page ───────────────────────────────────────────────────
    setProgress("Generating footer…");
    const footerHeightPt = 90;
    const footerBytes    = await generateFooterImage(pageW, allPages.length);
    const footerImg      = await mergedPdf.embedPng(footerBytes);
    lastPage.drawImage(footerImg, {
      x:      0,
      y:      0,
      width:  pageW,
      height: footerHeightPt,
    });
  }

  if (mergeWithPageNos) {
  const pages = mergedPdf.getPages();

  const now = new Date();
  const formatted = now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  pages.forEach((page, i) => {
    const { width } = page.getSize();

    // white background strip
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 25,
      color: rgb(1, 1, 1)
    });

    // LEFT → Generated date
    page.drawText(`Generated on:${formatted}`, {
      x: 20,
      y: 8,
      size: 9,
      color: rgb(0, 0, 0),
    });

    // RIGHT → Page number
    page.drawText(`${i + 1} / ${pages.length}`, {
      x: width - 50,
      y: 8,
      size: 10,
      color: rgb(0, 0, 0),
    });
  });
}


  const date = now.toLocaleDateString("en-GB").replace(/\//g, "-"); 
  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).replace(/:/g, "-");


  const blob = new Blob([await mergedPdf.save()], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `merged_${date}_${time}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
  // ── DOCX → PDF ───────────────────────────────────────────────────────────
  async function convertDOCXtoPDF(docxFile) {
    return new Promise(async (resolve) => {
      const buf     = await docxFile.arrayBuffer();
      const wrapper = document.createElement("div");
      Object.assign(wrapper.style, {
        position:"fixed", top:"-99999px", left:"-99999px",
        width:"900px", background:"#ffffff",
      });
      wrapper.className = "docx-wrapper";
      document.body.appendChild(wrapper);
      await renderAsync(buf, wrapper);

      const pdf  = new jsPDF("p", "pt", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pages = wrapper.querySelectorAll("section.docx");

      for (let i = 0; i < pages.length; i++) {
        const img = await htmlToImage.toPng(pages[i], { backgroundColor:"#ffffff", pixelRatio:2 });
        const p   = await pdf.getImageProperties(img);
        if (i !== 0) pdf.addPage();
        pdf.addImage(img, "PNG", 0, 0, pdfW, (p.height * pdfW) / p.width);
      }
      document.body.removeChild(wrapper);
      resolve(new File([pdf.output("blob")], docxFile.name.replace(".docx", ".pdf"), { type:"application/pdf" }));
    });
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

  // ── MAIN HANDLER ─────────────────────────────────────────────────────────
  async function handleMerge() {
    const pdfFiles  = files.filter(f => f.name.endsWith(".pdf"));
    const docxFiles = files.filter(f => f.name.endsWith(".docx"));

    if (pdfFiles.length === 0) {
  setMerging(true);

  const converted = [];

  for (let i = 0; i < docxFiles.length; i++) {
    setProgress(`Converting ${docxFiles[i].name}...`);
    converted.push(await convertDOCXtoPDF(docxFiles[i]));
  }

  setProgress("Merging PDFs...");
  await mergePDFs(converted);  // 🔥 IMPORTANT

  setMerging(false);
  onClose();
  return;
}

    if (files.length < 2) { alert("Add at least 2 files to merge!"); return; }

    setMerging(true);
    const converted = [];
    for (let i = 0; i < docxFiles.length; i++) {
      setProgress(`Converting ${docxFiles[i].name} (${i+1}/${docxFiles.length})…`);
      converted.push(await convertDOCXtoPDF(docxFiles[i]));
    }
    setProgress("Merging PDFs…");
    await mergePDFs([...pdfFiles, ...converted]);
    setMerging(false);
    onClose();
  }

  const pdfCount  = files.filter(f => f.name.endsWith(".pdf")).length;
  const docxCount = files.filter(f => f.name.endsWith(".docx")).length;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
         style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)", animation:"fadeIn .15s ease" }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[640px]"
           style={{ animation:"slideUp .2s ease" }}>

        {/* ── HEADER ── */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 relative"
             style={{ background:"linear-gradient(135deg,#f8fafc,white)" }}>
          <button onClick={() => { setMergeWithPageNos(false); onClose(); }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100
                             flex items-center justify-center hover:bg-slate-200 cursor-pointer
                             transition-colors">
            <X size={14} className="text-slate-500" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200
                          flex items-center justify-center mb-3">
            <Merge size={22} className="text-slate-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Merge Files</h2>
          <p className="text-sm text-slate-400 mt-0.5">Combine PDF and DOCX files into one document</p>
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
        <div className="px-6 py-2 flex flex-col gap-2 ">

          {/* Page numbers toggle */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200
                          rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-700">Add Page Numbers</p>
              <p className="text-xs text-slate-400">Print page numbers at the bottom of each page</p>
            </div>
            <button type="button" onClick={() => setMergeWithPageNos(p => !p)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full
                               transition-colors duration-300 cursor-pointer flex-shrink-0
                               ${mergeWithPageNos ? "bg-[#0f2744]" : "bg-slate-300"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow
                               transition-transform duration-300
                               ${mergeWithPageNos ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200
                          rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-700">Add Header and Footer</p>
              <p className="text-xs text-slate-400">Add Header and Footer for the first and last page after merging</p>
            </div>
            <button type="button" onClick={() => setMergeWithHeaderFooter (p => !p)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full
                               transition-colors duration-300 cursor-pointer flex-shrink-0
                               ${mergeWithHeaderFooter ? "bg-[#0f2744]" : "bg-slate-300"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow
                               transition-transform duration-300
                               ${mergeWithHeaderFooter ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Upload drop zone */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-2 text-center
                          hover:border-slate-300 hover:bg-slate-50 transition-colors">
            <input type="file" id="mergeFileInput" className="hidden"
                   multiple accept=".pdf,.docx" onChange={handleFileSelect} />
            <label htmlFor="mergeFileInput" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200
                              mx-auto flex items-center justify-center mb-3">
                <Upload size={20} className="text-slate-500" />
              </div>
              <p className="text-sm font-bold text-slate-700">Click to upload files</p>
              <p className="text-xs text-slate-400 mt-1">Supports .pdf and .docx</p>
            </label>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="max-h-25 overflow-y-auto space-y-2 pr-1">
              {files.map((file, i) => (
                <div key={i}
                     className="flex items-center gap-3 bg-slate-50 border border-slate-200
                                rounded-xl px-4 py-2.5">
                  <span className="text-base flex-shrink-0">{getFileIcon(file.name)}</span>
                  <span className="text-sm text-slate-700 font-semibold flex-1 truncate">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button onClick={() => removeFile(i)}
                          className="w-6 h-6 rounded-lg bg-red-50 border border-red-100
                                     flex items-center justify-center text-red-400
                                     hover:bg-red-100 transition-colors cursor-pointer flex-shrink-0">
                    <Trash2 size={11} />
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
            <button onClick={onClose} disabled={merging}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold
                               text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer
                               disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button onClick={handleMerge} disabled={merging || files.length < 2}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white
                               flex items-center justify-center gap-2 transition-all cursor-pointer
                               bg-[#0f2744] hover:bg-[#1e3a5f]
                               disabled:opacity-50 disabled:cursor-not-allowed">
              {merging
                ? <><Loader2 size={14} className="animate-spin" />Processing…</>
                : <><Merge size={14} />Merge Files</>
              }
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