import { ArrowDown, ArrowUp, RefreshCcw, Plus, Trash2, X, Edit2, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import './App.css'
import { DataSchema, programStructure } from "./config/appConfig";
import { resetFormData } from "./config/resetFormData";
import NumberedTextarea from "./NumberedTextArea";
import PdfRender from "./renders/PdfRender";
import DocxRender from "./renders/DocxRender";
import JsonRender from "./renders/JsonRender";
import Popup from "./Popup";
import ExperimentsSection from "./Experiments";
const apiUrl = import.meta.env.VITE_API_URL  

export default function InputForm(){

  const refs = {
    department:useRef(null),
    exam_hours:useRef(null),
    course_title: useRef(null),
    course_code: useRef(null),
    sem: useRef(null),
    course_type: useRef(null),
    credits: useRef(null),
    cie: useRef(null),
    see: useRef(null),
    course_objectives: useRef(null),
    modern_tools: useRef(null),
    course_outcomes: useRef(null),
    teaching_learning: useRef(null),
};

  // Check if we are in "Portal Submission Mode" by looking at the URL
  const searchParams = new URLSearchParams(window.location.search);
  const isFromPortal = searchParams.has("assignmentId") && searchParams.has("callbackUrl");


    {/* IF FormData doesnot contains COPO-Mapping Object then add to formData */}
    // const [formData,setFormData] = useState(DataSchema)
    const emptyModule = {
      title: "",
      content: "",
      textbook: "",
      chapter: "",
      rbt: "",
      wkt: ""
};
const DRAFT_KEY = "syllabus_form_draft";

const autosaveTimer = useRef(null);
const lastSavedDataRef = useRef(null);
const lastSavedTimeRef = useRef(0);
const [popupPosition, setPopupPosition] = useState("top");
useEffect(() => {
  const handleScroll = () => {
    const scrollY = window.scrollY;

    if (scrollY > 120) {
      setPopupPosition("floating");
    }
    else{
      setPopupPosition("top")
    }
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);
}, []);

function parseCourseType(courseType) {
  if (!courseType) return { base: "", nature: "" };
  const match = courseType.match(/^([A-Z]+)\s*\(([^)]+)\)$/);
  if (!match) return { base: courseType, nature: "" };
  return { base: match[1], nature: match[2] };
}


const [formData, setFormData] = useState(() => {
  const savedDraft = localStorage.getItem(DRAFT_KEY);

  if (savedDraft) {
    try {
      const parsedDraft = JSON.parse(savedDraft);

      // ✅ ADD THESE TWO LINES HERE
      lastSavedDataRef.current = parsedDraft;
      lastSavedTimeRef.current = Date.now();

      return {
  ...parsedDraft,
  course_type: parseCourseType(parsedDraft.course_type).base  // ✅ "PCCL (L)" → "PCCL"
};
    } catch (err) {
      console.error("Invalid draft data, falling back");
    }
  }

  return {
    ...DataSchema,
    modules: DataSchema.modules?.length
      ? DataSchema.modules
      : [{ ...emptyModule }]
  };
});

const hasSavedOnceRef = useRef(false);


useEffect(() => {
  if (autosaveTimer.current) {
    clearTimeout(autosaveTimer.current);
  }

  autosaveTimer.current = setTimeout(() => {
    const now = Date.now();
    const timeDiff = now - lastSavedTimeRef.current;

    const hasDataChanged =
      JSON.stringify(lastSavedDataRef.current) !==
      JSON.stringify(formData);

    if (
      hasDataChanged &&
      (!hasSavedOnceRef.current || timeDiff > 2000)
    ) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));

      lastSavedDataRef.current = formData;
      lastSavedTimeRef.current = now;
      hasSavedOnceRef.current = true;

      console.log("Draft auto-saved");
      setShowPopup("Data saved to localstorage")
    }
  }, 1500);

  return () => clearTimeout(autosaveTimer.current);
}, [formData]);


useEffect(() => {
  if (!formData.copoMapping) {
    setFormData(prev => ({
      ...prev,
      copoMapping: {
        headers: [
          "PO1","PO2","PO3","PO4","PO5","PO6",
          "PO7","PO8","PO9","PO10","PO11"
        ],
        rows: [
          { co: "CO1", vals: Array(11).fill(""), pso: ["", ""] },
          { co: "CO2", vals: Array(11).fill(""), pso: ["", ""] },
          { co: "CO3", vals: Array(11).fill(""), pso: ["", ""] },
          { co: "CO4", vals: Array(11).fill(""), pso: ["", ""] },
          { co: "CO5", vals: Array(11).fill(""), pso: ["", ""] },
        ]
      }
    }));
  }
}, []);

if(!formData.copoMapping) {
    setFormData({...formData,
        copoMapping: {
            headers: ["PO1","PO2","PO3","PO4","PO5","PO6","PO7","PO8","PO9","PO10","PO11"],
            rows: [
                { co: "CO1", vals: Array(11).fill(""), pso: ["", ""] },
                { co: "CO2", vals: Array(11).fill(""), pso: ["", ""] },
                { co: "CO3", vals: Array(11).fill(""), pso: ["", ""] },
                { co: "CO4", vals: Array(11).fill(""), pso: ["", ""] },
                { co: "CO5", vals: Array(11).fill(""), pso: ["", ""] },
            ]
            }
        });
}

{/* Dynamic AUTHOR Details and TEXTBOOK Details Adding */}
const authors = formData.textbooks || [];

const addAuthor = () => {
    const updated = [...authors, { slNo: "", author: "", bookTitle: "", publisher: "" }];
    setFormData({ ...formData, textbooks: updated });
};

const updateAuthor = (index, field, value) => {
    const updated = [...authors];
    updated[index][field] = value;
    setFormData({ ...formData, textbooks: updated });
};

const removeAuthor = (index) => {
    const updated = [...authors];
    updated.splice(index, 1);
    setFormData({ ...formData, textbooks: updated });
};

{/* Dynamic References Details and TEXTBOOK Details Adding */}
const references = formData.references || [];

const addReference = () => {
    const updated = [...references, { slNo: "", author: "", bookTitle: "", publisher: "" }];
    setFormData({ ...formData, references: updated });
};

const updateReference = (index, field, value) => {
    const updated = [...references];
    updated[index][field] = value;
    setFormData({ ...formData, references: updated });
};

const removeReference = (index) => {
    const updated = [...references];
    updated.splice(index, 1);
    setFormData({ ...formData, references: updated });
};


{/* DYNAMIC PSO Cols in COPO Mapping Table */}
function addPsoCol () {
  const updatedRows = formData.copoMapping.rows.map(row => ({
      ...row,
      pso: [...row.pso, ""]  // add one empty PSO column
  }));

  setFormData({
      ...formData,
      copoMapping: {
      ...formData.copoMapping,
      rows: updatedRows,
      }
  });                           
};

function removePsoCol () {
  const currentLength = formData.copoMapping.rows[0].pso.length;

  if (currentLength <= 2) {
      alert("At least two PSO columns are required.");
      return;
  }
  //Removing from last Using SLICE ARRAY SLICE Method
  const updatedRows = formData.copoMapping.rows.map(row => ({
      ...row,
      pso: row.pso.slice(0, -1)
  }));

  setFormData({
      ...formData,
      copoMapping: {
      ...formData.copoMapping,
      rows: updatedRows
      }
  });
};
/* ================== DYNAMIC CO ROWS ================== */
function addCoRow() {
  const { headers, rows } = formData.copoMapping;

  const poCount = headers.length;
  const psoCount = rows[0].pso.length;

  const newRowIndex = rows.length + 1;

  const newRow = {
  co: `CO${newRowIndex}`,
  vals: Array(poCount).fill(""),
  pso: Array(psoCount).fill("")
  };

  setFormData(prev => ({
  ...prev,
  copoMapping: {
    ...prev.copoMapping,
    rows: [...prev.copoMapping.rows, newRow]
  }
  }));
}

  function removeCoRow() {
  const currentRows = formData.copoMapping.rows;

  if (currentRows.length <= 1) {
  alert("At least one CO row is required.");
  return;
  }

  setFormData(prev => ({
  ...prev,
  copoMapping: {
    ...prev.copoMapping,
    rows: prev.copoMapping.rows.slice(0, -1)
  }
  }));
}

const handleModuleChange = (idx, e) => {
  const { name, value } = e.target;

  setFormData(prev => {
    const updated = [...prev.modules];
    updated[idx] = { ...updated[idx], [name]: value };
    return { ...prev, modules: updated };
  });
};

const addModule = () => {
  setFormData(prev => ({
    ...prev,
    modules: [...prev.modules, { ...emptyModule }]
  }));
};

const removeModule = (index) => {
  setFormData(prev => ({
    ...prev,
    modules: prev.modules.filter((_, i) => i !== index)
  }));
};


const [newExpNo, setNewExpNo] = useState("");
const [newExpCont, setNewExpCont] = useState("");
const [editingExpIndex, setEditingExpIndex] = useState(null);
const [editExpNo, setEditExpNo] = useState("");
const [editExpCont, setEditExpCont] = useState("");

//Adding new Experiment
const addNewExperiment = () => {
  if (!newExpNo || !newExpCont) {
    alert("Please fill all the details");
    return;
  }

  setFormData(prev => {
    const updatedExps = [
      ...(prev.experiments || []),
      {
        slno: parseInt(newExpNo),
        cont: newExpCont
      }
    ].sort((a, b) => a.slno - b.slno);

    return {
      ...prev,
      experiments: updatedExps
    };
  });

  setNewExpNo("");
  setNewExpCont("");
};

//Delete Experiment
const handleDeleteExperiment = (index) => {
  if (!window.confirm("Are you sure you want to delete this experiment?"))
    return;

  setFormData(prev => ({
    ...prev,
    experiments: prev.experiments.filter((_, i) => i !== index)
  }));
};

    
// Start Edit
const startEditExperiment = (index) => {
  const exp = formData.experiments[index];
  setEditingExpIndex(index);
  setEditExpNo(exp.slno);
  setEditExpCont(exp.cont);
};

    
// Edit Experiment
const saveEditExperiment = () => {
  if (!editExpNo || !editExpCont) {
    alert("Please fill all fields");
    return;
  }

  setFormData(prev => {
    const updatedExps = [...prev.experiments];
    updatedExps[editingExpIndex] = {
      slno: parseInt(editExpNo),
      cont: editExpCont
    };

    updatedExps.sort((a, b) => a.slno - b.slno);

    return {
      ...prev,
      experiments: updatedExps
    };
  });

  setEditingExpIndex(null);
  setEditExpNo("");
  setEditExpCont("");
};

    
const cancelEditExperiment = () => {
  setEditingExpIndex(null);
  setEditExpNo("");
  setEditExpCont("");
};



const [inputMode, setInputMode] = useState("manual"); 
// "manual" | "json"

const [jsonText, setJsonText] = useState("");
const [jsonError, setJsonError] = useState("");

function parseCourseType(courseType) {
  if (!courseType) return { base: "", nature: "" };

  const match = courseType.match(/^([A-Z]+)\s*\(([^)]+)\)$/);

  if (!match) {
    return { base: courseType, nature: "" };
  }

  return {
    base: match[1],   // PCC
    nature: match[2]  // T
  };
}



function handleLoadJson() {
  try {
    const parsed = JSON.parse(jsonText);

    setFormData({
      ...parsed,
      modules: parsed.modules?.length
        ? parsed.modules
        : [{ ...emptyModule }],
      course_type: parseCourseType(parsed.course_type).base
    });

    setJsonError("");
    setShowPopup("Data Loaded from JSON")
  } catch {
    setJsonError("Invalid JSON structure");
  }
}


const [jsonType,setJsonType] = useState("text")
const [selectedFileName, setSelectedFileName] = useState("");
const fileInputRef = useRef(null);

const [generateBtnText,setGenenerateBtnText] = useState("Generate Course Document")
const [showDownloads,setShowDownloads] = useState(false);
const [isgen,setIsGen] = useState(false)
const [docGen,setDocGen] = useState(false)

function handleJsonFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type !== "application/json") {
    alert("Please upload a valid JSON file");
    return;
  }

  setSelectedFileName(file.name)

  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const text = event.target.result;
      JSON.parse(text); // validation check
      setJsonText(text); // 🔥 load into textarea
    } catch (err) {
      alert("Invalid JSON file");
    }
  };

  reader.readAsText(file);
}

function handleRemoveFile() {
  setSelectedFileName("");
  setJsonText("");          // optional if you have textarea
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
}

function askCourseNature(question, theory, lab, theoryLab, mc) {
  let type = window.prompt(question);
  if (type === null) return null;

  type = type.trim().toLowerCase();

  // 👉 MC logic
  if (mc) {
    if (type === "1") return "MCQ";
    else if (type === "2")
      return "NONE";
  }

  // 👉 Normal course types
  if (theory && type === "t") return "T";
  if (lab && type === "l") return "L";
  if (theoryLab && type === "tl") return "T+L";
  if (type === "m") return "M";

  alert("Invalid input. Please enter valid option.");
  return askCourseNature(question, theory, lab, theoryLab, mc); // ✅ fixed
}

function askExamType() {
  let type = window.prompt(
    "Enter exam type:\n1 → MCQ\n2 → No Exam"
  );

  if (type === null) return null;

  type = type.trim();

  if (type === "1") return "MCQ";
  if (type === "2") return "NO_EXAM";

  alert("Invalid input. Try again.");
  return askExamType();
}
const DEFAULT_TEMPLATES = [
  "this course will enable the students to",
  "at the end of the course, the student will be able to",
  "in addition to the traditional chalk and talk method, ict tools are adopted",
  "modern ai tools used for this course",
  "add web links",
  "add activity based learning points"
];
function normalizeLine(line = "") {
  return line
    .toLowerCase()
    .replace(/\*\*/g, "")     // remove markdown **
    .replace(/:/g, "")        // remove colons
    .replace(/\s+/g, " ")     // normalize spaces
    .trim();
}

function hasRealUserContent(value) {
  if (!value) return false;

  const lines = Array.isArray(value)
    ? value
    : String(value).split("\n");

  const meaningfulLines = lines.filter(line => {
    const raw = String(line || "").trim();
    if (!raw) return false;

    // ❌ ignore "1." / "2."
    if (/^\d+\.\s*$/.test(raw)) return false;

    const normalized = normalizeLine(raw);

    // ❌ ignore default template lines (robust match)
    if (
      DEFAULT_TEMPLATES.some(tpl =>
        normalized.startsWith(tpl)
      )
    ) {
      return false;
    }

    return true; // ✅ actual user-written content
  });

  return meaningfulLines.length > 0;
}

function resetGenerateState() {
  setIsGen(false);
  setDocGen(false);
  setGenenerateBtnText("Generate Course Document");
}



function generateDocument() {
  setIsGen(true)
  setDocGen(true)

  console.log(formData)

  setGenenerateBtnText("Validating course details…")

  const checks = [
    { key: "course_title", msg: "Please enter Course Title" },
    // { key: "department", msg: "Please select Department" },
    { key: "course_code", msg: "Please enter Course Code" },
    { key: "sem", msg: "Please select Semester" },
    { key: "course_type", msg: "Please select Course Type" },
    { key: "credits", msg: "Please enter Credits" },
    { key: "cie", msg: "Please enter CIE marks" },
    { key: "exam_hours", msg: "Please enter Exam duration" },
    { key: "see", msg: "Please enter SEE marks" },
    { key: "course_objectives", msg: "Please fill Course Objectives" },
    { key: "course_outcomes", msg: "Please fill Course Outcomes" },
    { key: "teaching_learning", msg: "Please fill Teaching & Learning" },
    { key: "modern_tools", msg: "Please fill details regarding modern AI tools" },
  ];

  for (const item of checks) {
    const value = formData[item.key];

    const empty =
      value === "" ||
      value == null ||
      (Array.isArray(value) && value.length === 0);

    if (empty) {
      alert(item.msg);
      scrollTo(refs[item.key]);   // 🎯 MAGIC LINE
      setIsGen(false)
      setGenenerateBtnText("Generate Course Document")
      setDocGen(false)
      return;
    }
  }

// ===== COURSE OBJECTIVES VALIDATION =====
if (!hasRealUserContent(formData.course_objectives)) {
  alert("Please add at least one meaningful Course Objective");
  scrollTo(refs.course_objectives);
  resetGenerateState();
  return;
}

// ===== COURSE OUTCOMES =====
if (!hasRealUserContent(formData.course_outcomes)) {
  alert("Please add at least one meaningful Course Outcome");
  scrollTo(refs.course_outcomes);
  resetGenerateState();
  return;
}

// ===== TEACHING & LEARNING =====
if (!hasRealUserContent(formData.teaching_learning)) {
  alert("Please add at least one Teaching–Learning point");
  scrollTo(refs.teaching_learning);
  resetGenerateState();
  return;
}
// ===== Modern AI tools =====
// if (!hasRealUserContent(formData.modern_tools)) {
//   alert("Please add at least one Modern AI Tool");
//   scrollTo(refs.modern_tools);
//   resetGenerateState();
//   return;
// }


  
  // if (
  //     !formData.course_title ||
  //     !formData.course_code ||
  //     !formData.credits ||
  //     !formData.course_type ||
  //     !formData.ltps ||
  //     !formData.see ||
  //     !formData.cie ||
  //     !formData.sem ||
  //   !formData.exam_hours
  // ) {
  //   setTimeout(()=>{
  //         setIsGen(false)
  //               setGenenerateBtnText("Generate Course Document")
  //   },1400)
  //   setTimeout(()=>{
  //           alert("Please fill all fields");
  //         },1500)
  //   return;
  //   }
   
  const baseType = formData.course_type;
  let user_res = null;

  if (baseType === "AEC") {
    user_res = askCourseNature(
      "Enter course type:\nT → Theory\nL → Lab\n",
      true, true, false, false
    );
  }
  else if(baseType === "MC"){
    formData.course_type = "NCMC";
    // formData.credits = 0;
    formData.exam_type = "-";

    let credits = 0;
    let exam_type = "-" 

    user_res = {
    course_type: "NCMC",
    credits,
    exam_type
  }
  }
  else if (baseType.startsWith("MC_")) {
  const value = formData.course_type;

  let credits = 0;
  let exam_type = "";

  if (value === "MC_EXAM_1") {
    credits = 1;
    exam_type = "MCQ";
  } 
  else if (value === "MC_EXAM_2") {
    credits = 2;
    exam_type = "MCQ";
  } 
  else if (value === "MC_NO_EXAM") {
    credits = 0;
    exam_type = "NONE";
  }

  // ✅ update formData
  formData.course_type = "MC";
  formData.credits = credits;
  formData.exam_type = exam_type;

  user_res = {
    course_type: "MC",
    credits,
    exam_type
  };

}
  else if (baseType === "ESC") {
    user_res = askCourseNature(
      "Enter course type:\nT → Theory\nTL → Theory + Lab",
      true, false, true,false
    );
  } 
  else if (baseType === "HSMS") {
    user_res = askCourseNature(
      "Enter course type:\nT → Theory\nM → Objectives(MCQ)",
      true, false, true, false
    );
  } 
  else if (baseType === "IPCC") user_res = "T+L";
  else if (["OEC", "PEC", "PCC", "UHV","BSC","HSMC"].includes(baseType)) user_res = "T";
  else if (baseType === "PCCL") user_res = "L";

  if (!user_res) 
  {
    setDocGen(false)
    return;
  }

  console.log(user_res)
  const updatedType = user_res.course_type === "MC"?`MC`:`${baseType} (${user_res})`;

  setFormData({
    ...formData,
    course_type: updatedType,
    
  });

   setTimeout(()=>{
      setGenenerateBtnText("Structuring syllabus data…")
    },3000)

  // alert(updatedType);
  setTimeout(()=>{
    setGenenerateBtnText("Finalizing documents…")
  },4000)

  setTimeout(()=>{
    setGenenerateBtnText("Done!!...")
    setIsGen(false)
  },6000)
  
  setTimeout(()=>{
    setShowDownloads(true)  
    setDocGen(true)
},7500)

}

function resetForm(){
  
  if(confirm("Are u sure want to reset form Data...Remember...u won't get back ur entered data once reset is done.."))
  {
    setInputMode("manual")
    setJsonType("text")
    handleRemoveFile()
    resetFormData(setFormData)

    setFormData({
      ...DataSchema,          // reset everything else
      modules: [{ ...emptyModule }], // 👈 FORCE ONLY ONE MODULE
    });
    localStorage.removeItem(DRAFT_KEY);
    lastSavedDataRef.current = null;
    lastSavedTimeRef.current = 0;
    setShowPopup("Data Reset Successfull")
  }
}


function scrollTo(ref) {
  if (!ref?.current) return;

  ref.current.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  ref.current.focus();
}



const [downloadAll,setDownloadAll] = useState(null)
const [downloadBtnText,setDownloadBtnText] = useState("Download All")
const topRef = useRef(null);
const bottomRef = useRef(null);

const [downloadOptions,setDownloadOptions] = useState({pdf:false,docx:false,json:false});

function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}


useEffect(() => { 
  const ping = async () => 
    { 
      try { 
      await fetch("https://syllabus-gen-tool.onrender.com/health"); 
      console.log("🔁 Backend pinged"); 
    } catch (err) { 
      console.error("Ping failed", err); 
    } 
  }; 
  // ping immediately 
  ping(); 
  
  // ping every 5 minutes 
  const interval = setInterval(ping, 5 * 60 * 1000); 
  return () => clearInterval(interval); 
}, []);

const triggerAllDownloads = async() => {

  //Getting date&Day info
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");


  if(downloadOptions.pdf === false && downloadOptions.docx === false && downloadOptions.json === false )
  {
    alert("Please Select Downloadable options");
    return;
  }
  // lock button
  setDownloadAll(null);
  setDownloadBtnText("Downloading...");

  // trigger downloads
  if (downloadOptions.pdf)
  {
    console.log(apiUrl)
    const res = await fetch(
    `${apiUrl}/generate-pdf`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    }
  );

  console.log("PDF status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));

  if (!res.ok) {
    throw new Error("PDF generation failed");
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/pdf")) {
    const text = await res.text();
    console.error("Expected PDF, got:", text);
    alert("Server did not return a PDF");
    return;
  }

  const blob = await res.blob();
  const courseCode = (formData.course_code || "COURSE").replace(/\s+/g, "");

  downloadFile(blob, `${courseCode}_${day}-${month}-${year}_${hours}-${minutes}.pdf`);

  // setTimeout(() => setDownloadAll("pdf"),200);
  
  }
  // if(downloadOptions.docx)
  //   setTimeout(() => setDownloadAll("docx"), 300);
  if (downloadOptions.docx) {
    const downloadDocx = async () => {
  try {
    const res = await fetch(
      `${apiUrl}/generate-docx`,
       {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    if (!res.ok) throw new Error("DOCX generation failed");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const courseCode = (formData.course_code || "COURSE").replace(/\s+/g, "");
    a.download = `${courseCode}_${day}-${month}-${year}_${hours}-${minutes}.docx`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error: DOCX generation failed", err);
  }
};
  setTimeout(() => {
    downloadDocx();
  }, 300);
}

  if(downloadOptions.json)
  {
    const downloadJSON = async () => {
  try {
    const res = await fetch(
      `${apiUrl}/generate-json`,
      {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) throw new Error("JSON generation failed");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;

    const courseCode = (formData.course_code || "COURSE").replace(/\s+/g, "");
    a.download = `${courseCode}_${day}-${month}-${year}_${hours}-${minutes}.json`;

    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("JSON download error:", err);
  }
};

setTimeout(() => {
    downloadJSON();
  }, 900);
  }
  // setTimeout(() => setDownloadAll("json"), 600);

  // ✅ SHOW SUCCESS AFTER ALL DOWNLOADS
  setTimeout(() => {
    setDownloadBtnText("Downloaded Successfully");
  }, 2000);

  // ✅ RESET AFTER USER CAN SEE IT
  setTimeout(() => {
    setDownloadAll(null);
    setDownloadBtnText("Download All");
    setDownloadOptions({
      pdf: false,
      json: false,
      docx: false
    })
  }, 2200); // 👈 longer delay = visible success


  
};

const [showDownArrow, setShowDownArrow] = useState(true);

useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;

    // if user scrolled past 60% of page → show UP arrow
    if (scrollTop > (docHeight - winHeight) * 0.6) {
      setShowDownArrow(false);
    } else {
      setShowDownArrow(true);
    }
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll(); // run once on mount

  return () => window.removeEventListener("scroll", handleScroll);
}, []);


      const [showSections,setShowSections] = useState({
        objectives:false,
        tl:false,
        tools:false,
        outcomes:false,
        links:false,
        activity:false
      })

  //       useEffect(() => {
  //   setShowSections({
  //     objectives:
  //       Array.isArray(formData.course_objectives) &&
  //       formData.course_objectives.length > 0,

  //     tl:
  //       Array.isArray(formData.teaching_learning) &&
  //       formData.teaching_learning.length > 0,

  //     tools:
  //       Array.isArray(formData.modern_tools) &&
  //       formData.modern_tools.length > 0,

  //     outcomes:
  //       Array.isArray(formData.course_outcomes) &&
  //       formData.course_outcomes.length > 0,

  //     activity:
  //       typeof formData.activity_based_learning === "string" &&
  //       formData.activity_based.trim() !== "",
  //   });
  // }, [formData]);


const toggleSection = (key) => {
  setShowSections(prev => ({
    ...prev,
    [key]: !prev[key],
  }));
};


const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
const [showPreview, setShowPreview] = useState(false);
const [previewBtnText,setpreviewBtnText] = useState("Preview PDF")


const previewPDF = async () => {
  try {

    setpreviewBtnText("Loading PDF..")
    const res = await fetch(
          `${apiUrl}/generate-pdf`,
       {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) throw new Error("PDF generation failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    setPdfPreviewUrl(url);
    setShowPreview(true);
  } catch (err) {
    console.error("Preview error:", err);
  }
};

async function downloadPdf(){

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const res = await fetch(
    `${apiUrl}/generate-pdf`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    }
  );

  console.log("PDF status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));

  if (!res.ok) {
    throw new Error("PDF generation failed");
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/pdf")) {
    const text = await res.text();
    console.error("Expected PDF, got:", text);
    alert("Server did not return a PDF");
    return;
  }

  const blob = await res.blob();
  const courseCode = (formData.course_code || "COURSE").replace(/\s+/g, "");

  downloadFile(blob, `${courseCode}_${day}-${month}-${year}_${hours}-${minutes}.pdf`);
}

const [showPopup,setShowPopup] = useState(null)


const [hasParts, setHasParts] = useState(false);
// const [newExpNo, setNewExpNo] = useState("");
// const [newExpCont, setNewExpCont] = useState("");
const [newExpPart, setNewExpPart] = useState("A");
// const [editingExpIndex, setEditingExpIndex] = useState(null);
// const [editExpNo, setEditExpNo] = useState("");
// const [editExpCont, setEditExpCont] = useState("");
const [editExpPart, setEditExpPart] = useState("A");

// useEffect(() => {
//   if (formData.course_type === "MC") {
//     setFormData(prev => ({ ...prev, credits: 0 }));
//   }
// }, [formData.course_type]);

// ── Put this ABOVE the InputForm export, outside the component ────────────
function ModuleTextbookForm({ onAdd }) {

  const empty = {
    slNo: "",
    chapter: ""
  };

  const [tb, setTb] = useState(empty);

  function handleAdd() {

    if (!tb.slNo || !tb.chapter) {
      alert("Please fill TB No and Chapter/Article");
      return;
    }

    onAdd({ ...tb });

    setTb(empty);
  }
  return (

    <div className="border border-dashed border-slate-300 rounded-2xl p-5 bg-white">

      <p className="text-sm font-semibold text-slate-600 mb-4">
        Add Textbook Details
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

        {/* TB No */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            TB No *
          </label>

          <input
            type="text"
            value={tb.slNo}
            onChange={(e) =>
              setTb((p) => ({
                ...p,
                slNo: e.target.value
              }))
            }
            placeholder="1"
            className="w-full p-3 py-2 bg-gray-100 border border-gray-300
                       rounded-xl outline-none focus:ring-2
                       focus:ring-slate-400"
          />
        </div>

        {/* Chapter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chapter / Article
          </label>

          <input
            type="text"
            value={tb.chapter}
            onChange={(e) =>
              setTb((p) => ({
                ...p,
                chapter: e.target.value
              }))
            }
            placeholder="24.1, 24.4..."
            className="w-full p-3 py-2 bg-gray-100 border border-gray-300
                       rounded-xl outline-none focus:ring-2
                       focus:ring-slate-400"
          />
        </div>

        {/* Button */}
        <button
          type="button"
          onClick={handleAdd}
          className="h-[48px] px-6 text-sm bg-slate-700 hover:bg-slate-800
                     text-white rounded-xl font-semibold transition-all"
        >
          Add Details
        </button>

      </div>
    </div>
  );
}
 const [submitBtnText, setSubmitButtonText] = useState("Submit to Portal");
async function uploadFileToCloud() {
  const params       = new URLSearchParams(window.location.search);
  const assignmentId = params.get("assignmentId");
  const callbackUrl  = params.get("callbackUrl");

  try {
    setSubmitButtonText("Generating PDF…");

    const pdfRes = await fetch(`${apiUrl}/generate-pdf`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(formData),
    });

    if (!pdfRes.ok) throw new Error("PDF generation failed");
    const pdfBlob = await pdfRes.blob(); 
    setSubmitButtonText("Uploading…");

    const fd = new FormData();
    const timestamp = Date.now(); 
    
    // Using a unique timestamp so Cloudinary accepts the Unsigned Upload
    const pdfFile = new File([pdfBlob], `syllabus_${assignmentId}_${timestamp}.pdf`, { type: "application/pdf" });
    
    fd.append("file",          pdfFile);         
    fd.append("upload_preset", "v1conote");
    fd.append("folder",        "syllabi");
    fd.append("public_id",     `syllabus_${assignmentId}_${timestamp}`); 

    const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dxsgtzp7i/image/upload", { method: "POST", body: fd });
    const cloudData = await cloudRes.json();
    if (!cloudData.secure_url) throw new Error("Cloudinary upload failed");

    let pdfUrl = cloudData.secure_url;
    
    // Redirect back to portal
    const redirect = new URL(callbackUrl);
    redirect.searchParams.set("pdf_url", pdfUrl);
    redirect.searchParams.set("assignmentId", assignmentId);
    window.location.href = redirect.toString();

  } catch (err) {
    alert("❌ " + (err.message || "Something went wrong"));
    setSubmitButtonText("Submit to Portal");
  }
}

    return (
        <div ref={topRef} className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-8 border border-gray-200 mt-10">
          {showPopup && (
            <Popup
              position={popupPosition}
              message={showPopup}
              duration={3000}
              onClose={() => setShowPopup(null)}
            />
        )}
            {/* Heading */}
            <div className="flex w-full justify-between">
                <h2 className="text-2xl font-semibold text-slate-700 mb-6">Add / Edit Course Details</h2>
                {/* <X size={40} className="rounded-lg cursor-pointer hover:scale-110 bg-gray-100 p-1" onClick={()=>closeForm()}/> */}
            </div>


            {/* ===== INPUT MODE SELECTION ===== */}
        <div onClick={()=>{resetForm()
        }

        } className="flex gap-2 w-30 text-center justify-center text-white items-center bg-gray-600 rounded-md cursor-pointer my-2 p-1 hover:bg-gray-800"><RefreshCcw size={18}/> <button className="cursor-pointer">Reset Form</button> </div>
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold text-slate-700 mb-3">
            How do you want to provide course data?
          </h3>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={inputMode === "manual"}
                onChange={() => setInputMode("manual")}
              />
              Manual Entry
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={inputMode === "json"}
                onChange={() => setInputMode("json")}
              />
              Load from JSON
            </label>
          </div>


        {inputMode === "json" && <div className="flex gap-9 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={jsonType === "text"}
                onChange={() => setJsonType("text")}
              />
              Paste JSON
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={jsonType === "file"}
                onChange={() => setJsonType("file")}
              />
              Upload JSON file
            </label>
        </div>}


        </div>

        {inputMode === "json" && <button 
        className="flex bg-gray-600 mb-1 cursor-pointer hover:bg-gray-800 px-5 items-center gap-2 text-white py-1 rounded-md"
        onClick={() => {
          setJsonText("")
          handleRemoveFile()
        }}>

          <RefreshCcw size={18}/>
          <h2>Reset JSON Data</h2>
        </button>}



        {inputMode === "json" && jsonType === "text" && (
          <div className="mb-4 p-4 border rounded-lg bg-blue-50">
            <label className="text-sm font-semibold text-slate-600">
              Paste Course JSON
            </label>

            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full mt-2 p-3 bg-white border rounded-lg font-mono text-sm"
              placeholder="Paste JSON downloaded earlier..."
            />

            {jsonError && (
              <p className="text-red-600 text-sm mt-2">{jsonError}</p>
            )}

          </div>
        )}

        

        {inputMode === "json" && jsonType === "file" && <div className="mt-6 mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-5">
  
  <p className="text-center text-sm font-medium text-slate-700">
    Import course data from JSON
  </p>

  <div className="mt-4 flex items-center justify-center gap-4">
    <label
      htmlFor="jsonUpload"
      className="inline-flex items-center gap-2
                 rounded-lg bg-slate-700 px-5 py-2
                 text-sm font-medium text-white
                 cursor-pointer hover:bg-slate-800 transition"
    >
      Choose JSON file
    </label>

    <span className="text-sm text-slate-500">
      { selectedFileName || "No file chosen"}
    </span>

    <input
      ref={fileInputRef}
      id="jsonUpload"
      type="file"
      accept=".json,application/json"
      onChange={handleJsonFileUpload}
      className="hidden"
    />
  </div>

  <p className="mt-3 text-center text-xs text-slate-500">
    Uploading a file will replace the JSON above
  </p>

  
</div>


}

{inputMode === "json" && <button
    onClick={handleLoadJson}
    className="mb-6 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
  >
    Load JSON into Form
  </button>}





            {/* ======== Course and sem ======== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                {/* Course Title */}
                <div>
                    <label className="text-sm font-semibold text-slate-600">Department</label>
                    <select
                    ref={refs.department}
                    name="" id="" value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                focus:ring-2 focus:ring-slate-400 outline-none w-full"
                    >
                      <option value="" disabled hidden>Select</option>
                      {programStructure["BE/BTECH"].departments.map(dept => <option value={dept}>{dept}</option>)}
                    </select>
                </div>
                {/* Course Code */}
                <div>
                     <div className="w1/2">
                    <label className="text-sm font-semibold text-slate-600">Semester</label>
                    <select
                      ref={refs.sem}            // ✅ ADD

                        value={formData.sem}
                        onChange={e => setFormData({ ...formData, sem: e.target.value })}
                        className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                focus:ring-2 focus:ring-slate-400 outline-none w-full"
                    >
                        <option value="" hidden>Select</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                    </select>
                    </div>
                </div>
            </div>
            {/* ======== BASIC DETAILS (GRID) ======== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                {/* Course Title */}
                <div>
                    <label className="text-sm font-semibold text-slate-600">Course Title</label>
                    <input
  ref={refs.course_title}   // ✅ ADD THIS
  type="text"
  value={formData.course_title}
  onChange={e =>
    setFormData({ ...formData, course_title: e.target.value })
  }
  className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                focus:ring-2 focus:ring-slate-400 outline-none w-full"
                    placeholder="Course Title"
/>

                </div>
                {/* Course Code */}
                <div>
                    <label className="text-sm font-semibold text-slate-600">Course Code</label>
                    <input
  ref={refs.course_code}    // ✅ ADD
  type="text"
  value={formData.course_code}
  onChange={e =>
    setFormData({ ...formData, course_code: e.target.value })
  }
  className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                focus:ring-2 focus:ring-slate-400 outline-none w-full"
/>

                </div>
            </div>

            {/* ======== SEM + COURSE TYPE + CREDITS + MARKS ======== */}
            <div className="w-full flex flex-col md:flex-row md:justify-between gap-2 mt-6">
                {/* Course Type */}
                <div className="md:w-1/4 w-full flex gap-2">
                    {/* <div className="w-1/2">
                    <label className="text-sm font-semibold text-slate-600">Semester</label>
                    <select
                        value={formData.sem}
                        onChange={e => setFormData({ ...formData, sem: e.target.value })}
                        className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                focus:ring-2 focus:ring-slate-400 outline-none w-full"
                    >
                        <option value="" hidden>Select</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                    </select>
                    </div> */}
                    <div className="w-1/2">
                    <label className="text-sm font-semibold text-slate-600">Course Type</label>
                    <select
                      ref={refs.course_type}    // ✅ ADD

                        value={formData.course_type}
                        onChange={e => setFormData({...formData,course_type: e.target.value})}
                        className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                focus:ring-2 focus:ring-slate-400 outline-none w-full"
                    >
                        <option value="" hidden>Select</option>
                        <option value="IPCC">IPCC</option>
                        <option value="PCC">PCC</option>
                        <option value="AEC">AEC</option>
                        <option value="OEC">OEC</option>
                        <option value="PEC">PEC</option>
                        <option value="ESC">ESC</option>
                        <option value="PCCL">PCCL</option>
                        <option value="UHV">UHV</option>
                        <option value="BSC">BSC</option>
                        <option value="HSMS">HSMS</option>
                        <option value="HSMC">HSMC</option>
                        <option value="MC">NCMC</option>
                        <option value="MC_EXAM_1">MC with exam (1 credit)</option>
                        <option value="MC_EXAM_2">MC with exam (2 credits)</option>
                        <option value="MC_NO_EXAM">MC without exam</option>
                    </select>
                    </div>
                </div>
                <div className="md:w-1/5 w-full">
                    <label className="text-sm font-semibold text-slate-600">L-T-P-S</label>
                    <input
                    type="text"
                    value={formData.ltps}
                    onChange={e => setFormData({ ...formData, ltps: e.target.value })}
                    className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                focus:ring-2 focus:ring-slate-400 outline-none w-full"
                    placeholder="4:2:1:0"
                    />
                </div>

                {/* Course Credits */}
                <div className="md:w-1/4   flex w-full gap-2">
                    <div>
                        <label className="text-sm font-semibold text-slate-600"> Credits</label>
                        <input
                        type="number"
                          ref={refs.credits}      

                        value={formData.credits}
                        onChange={e => setFormData({ ...formData, credits: e.target.value })}
                        className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                    focus:ring-2 focus:ring-slate-400 outline-none w-full"
                        />
                    </div>
                    <div className="">
                        <label className="text-sm font-semibold text-slate-600">Exam hrs</label>
                        <input
                        type="text"
                        ref={refs.exam_hours}
                        value={formData.exam_hours}
                        onChange={e => setFormData({ ...formData, exam_hours: e.target.value })}
                        className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                    focus:ring-2 focus:ring-slate-400 outline-none w-full"
                        placeholder="3"
                        />
                    </div>    
                </div>

                <div className="md:w-1/8 w-full">
                    <label className="text-sm font-semibold text-slate-600">Pedagogy</label>
                    <input
                    type="text"
                    value={formData.pedagogy}
                    onChange={e => setFormData({ ...formData, pedagogy: e.target.value })}
                    className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                focus:ring-2 focus:ring-slate-400 outline-none w-full"
                        placeholder="40+20"
                    />
                </div>

                <div className="md:w-1/4 w-full flex gap-2">
                    {/* CIE Marks */}
                    <div className="">
                        <label className="text-sm font-semibold text-slate-600">CIE Marks</label>
                        <input
                          ref={refs.cie}            // ✅ ADD

                            type="number"
                            value={formData.cie}
                            onChange={e => setFormData({ ...formData, cie: e.target.value })}
                            className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                    focus:ring-2 focus:ring-slate-400 outline-none w-full"
                        />
                    </div>
                    {/* SEE Marks */}
                    <div className="">
                    <label className="text-sm font-semibold text-slate-600">SEE Marks</label>
                    <input
                        type="number"
                          ref={refs.see}            // ✅ ADD

                        value={formData.see}
                        onChange={e => setFormData({ ...formData, see: e.target.value })}
                        className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg 
                                focus:ring-2 focus:ring-slate-400 outline-none w-full"
                    />
                    </div>
                </div>
            </div>


            {/* ======== COURSE OBJECTIVES ======== */}
            <div className="mt-8">

                <div className="mt-8 flex items-center justify-between">
  <label className="text-sm font-semibold text-slate-600">
Course Objectives</label>

  <button
    type="button"
    onClick={() => toggleSection("objectives")}
    className="text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
  >
    {showSections.objectives ? "Hide" : "Show"}
  </button>
</div>

                {showSections.objectives && <NumberedTextarea
                isGen={docGen}
  inputRef={refs.course_objectives}
  value={
    Array.isArray(formData.course_objectives)
      ? formData.course_objectives.join("\n")
      : formData.course_objectives || ""
  }
  onChange={(val) =>
    setFormData(prev => ({
      ...prev,
      course_objectives: val.split("\n").filter(Boolean)
    }))
  }
  placeholder="Enter course objectives"
/>}


            </div>

            {/* ======== TEACHING LEARNING ======== */}
            <div className="mt-6">
                <div className="mt-8 flex items-center justify-between">
  <label className="text-sm font-semibold text-slate-600">
    Teaching & Learning
  </label>

  <button
    type="button"
    onClick={() => toggleSection("tl")}
    className="text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
  >
    {showSections.tl ? "Hide" : "Show"}
  </button>
</div>

                {showSections.tl && <NumberedTextarea
                isGen={docGen}
  inputRef={refs.teaching_learning}
  value={
    Array.isArray(formData.teaching_learning)
      ? formData.teaching_learning.join("\n")
      : formData.teaching_learning || ""
  }
  onChange={(val) =>
    setFormData(prev => ({
      ...prev,
      teaching_learning: val.split("\n").filter(Boolean)
    }))
  }
  placeholder="Teaching & Learning Process"
/>}



            </div>
            {/* MODERN AI TOOL USED */}
            <div className="mt-8">
                <div className="mt-8 flex items-center justify-between">
  <label className="text-sm font-semibold text-slate-600">
    Modern tools
  </label>

  <button
    type="button"
    onClick={() => toggleSection("tools")}
    className="text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
  >
    {showSections.tools ? "Hide" : "Show"}
  </button>
</div>

                {showSections.tools && <NumberedTextarea
                isGen={docGen}
  inputRef={refs.modern_tools}
  value={
    Array.isArray(formData.modern_tools)
      ? formData.modern_tools.join("\n")
      : formData.modern_tools || ""
  }
  onChange={(val) =>
    setFormData(prev => ({
      ...prev,
      modern_tools: val.split("\n").filter(Boolean)
    }))
  }
  placeholder="Enter details regarding modern AI tools..."
/>}



            </div>

            {/* Modules Details */}
            {formData.course_type !== "PCCL" &&<div className="flex flex-col gap-10 mt-5">
  <div className="flex justify-between items-center">
    <h2 className="text-sm font-semibold text-slate-600">
      Modules Details
    </h2>

    <button
      type="button"
      onClick={addModule}
      className="px-3 py-1.5 text-sm font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
    >
      + Add Module
    </button>
  </div>

  {formData.modules.map((mod, idx) => (
  <div key={idx} className="border-2 p-4 border-gray-200 space-y-4 relative">
    <h2 className="text-center text-lg font-semibold">Module {idx + 1}</h2>

    {formData.modules.length > 1 && (
      <button
        type="button"
        onClick={() => removeModule(idx)}
        className="absolute top-3 right-3 text-sm font-semibold bg-red-500
                   hover:bg-red-600 rounded-md text-white py-1.5 px-3">
        Remove
      </button>
    )}

    {/* CONTENT */}
    <div>
      <p className="text-red-600 text-xs">
        Wrap words inside <b>** **</b> for bold text in PDF
      </p>
      <label className="block text-sm font-medium text-gray-700">Topics Covered</label>
      <textarea
        name="content"
        value={mod.content}
        onChange={(e) => handleModuleChange(idx, e)}
        rows={5}
        className="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-lg
                   resize-none focus:ring-2 focus:ring-slate-400 outline-none"
      />
    </div>

    {/* ── TEXTBOOK DETAILS — dynamic list ─────────────────────────── */}
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-700">
          Textbooks
        </label>
        <span className="text-xs text-gray-400">
          {(mod.textbooks || []).length} added
        </span>
      </div>

      {/* Added textbooks list */}
      {(mod.textbooks || []).length > 0 && (
        <div className="space-y-2 mb-4">
          {(mod.textbooks || []).map((tb, tbIdx) => (
            <div key={tbIdx}
                 className="flex items-start justify-between gap-3
                            bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700">
                  TB-{tb.slNo} 
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {tb.author} · {tb.publisher}{tb.year ? ` · ${tb.year}` : ""}
                </p>
                {tb.chapter && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ch: {tb.chapter}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => {
                    const updated = [...prev.modules];
                    updated[idx] = {
                      ...updated[idx],
                      textbooks: updated[idx].textbooks.filter((_, i) => i !== tbIdx)
                    };
                    return { ...prev, modules: updated };
                  });
                }}
                className="text-red-400 hover:text-red-600 flex-shrink-0
                           w-6 h-6 flex items-center justify-center
                           bg-red-50 rounded-md hover:bg-red-100 transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new textbook form */}
      <ModuleTextbookForm
        onAdd={(tb) => {

          setFormData((prev) => {

            const updated = [...prev.modules];

            updated[idx] = {
              ...updated[idx],

              textbooks: [
                ...(updated[idx].textbooks || []),
                tb
              ]
            };

            return {
              ...prev,
              modules: updated
            };
          });

        }}
      />
    </div>

    {/* <div>
      <label className="text-sm font-medium">Chapter Article No.</label>
      <input
        name="chapter"
        value={mod.chapter}
        onChange={(e) => handleModuleChange(idx, e)}
        className="w-full mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg
                   resize-none focus:ring-2 focus:ring-slate-400 outline-none"
      />
    </div> */}

    <div>
      <label className="text-sm font-medium">RBT Level(s)</label>
      <input
        name="rbt"
        value={mod.rbt}
        onChange={(e) => handleModuleChange(idx, e)}
        className="w-full mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg
                   resize-none focus:ring-2 focus:ring-slate-400 outline-none"
      />
    </div>

    <div>
      <label className="text-sm font-medium">WKT</label>
      <input
        name="wkt"
        value={mod.wkt}
        onChange={(e) => handleModuleChange(idx, e)}
        className="w-full mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg
                   resize-none focus:ring-2 focus:ring-slate-400 outline-none"
      />
    </div>
  </div>
))}
</div>}

      

            {/* Experiments */}            
            {(formData.course_type === "PCCL"||formData.course_type === "IPCC" || formData.course_type === "AEC" || formData.course_type === "ESC" || formData.experiments) && (
   <ExperimentsSection  formData = {formData}
  setFormData = {setFormData}
  hasParts = {hasParts}
  setHasParts = {setHasParts}
  newExpNo = {newExpNo}
  setNewExpNo = {setNewExpNo}
  newExpCont = {newExpCont}
  setNewExpCont = {setNewExpCont}
  newExpPart = {newExpPart}
  setNewExpPart = {setNewExpPart}
  editingExpIndex = {editingExpIndex}
  setEditingExpIndex = {setEditingExpIndex}
  editExpNo = {editExpNo}
  setEditExpNo = {setEditExpNo}
  editExpCont = {editExpCont}
  setEditExpCont = {setEditExpCont}
  editExpPart = {editExpPart}
  setEditExpPart = {setEditExpPart}/>
)}

            
            {/* ======== COURSE OUTCOMES ======== */}
            {/* <div className="mt-8">
                <label className="text-sm font-semibold text-slate-600">Course Outcomes</label>
                <textarea
                    value={formData.course_outcomes}
                    onChange={e => setFormData({ ...formData, course_outcomes: e.target.value })}
                    className="w-full mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg h-32 resize-none
                            focus:ring-2 focus:ring-slate-400 outline-none"
                />
            </div> */}



             {/* ======== TEXTBOOK AUTHORS (DYNAMIC) ======== */}
            <div className="mt-10">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex justify-between">
                    Textbooks 
                    <button
                    onClick={addAuthor}
                    className="px-3 py-1 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-700"
                    >
                    + Add Author
                    </button>
                </h3>

                {authors.length === 0 && (
                    <p className="text-gray-500 mb-4">No authors added yet.</p>
                )}
                {authors.map((item, index) => (
                    <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg relative"
                    >
                    {/* Remove Button */}
                    <button
                        onClick={() => removeAuthor(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                    >
                        ✕
                    </button>

                    {/* Sl No */}
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Sl. No</label>
                        <input
                        type="text"
                        value={item.slNo}
                        onChange={e => updateAuthor(index, "slNo", e.target.value)}
                        className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg
                                    focus:ring-2 focus:ring-slate-400 outline-none"
                        />
                    </div>

                    {/* Author */}
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Author</label>
                        <input
                        type="text"
                        value={item.author}
                        onChange={e => updateAuthor(index, "author", e.target.value)}
                        className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg
                                    focus:ring-2 focus:ring-slate-400 outline-none"
                        />
                    </div>

                    {/* Book Title */}
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Book Title</label>
                        <input
                        type="text"
                        value={item.bookTitle}
                        onChange={e => updateAuthor(index, "bookTitle", e.target.value)}
                        className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg
                                    focus:ring-2 focus:ring-slate-400 outline-none"
                        />
                    </div>

                    {/* Publisher */}
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Publisher&Edition</label>
                        <input
                        type="text"
                        value={item.publisher}
                        onChange={e => updateAuthor(index, "publisher", e.target.value)}
                        className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg
                                    focus:ring-2 focus:ring-slate-400 outline-none"
                        />
                    </div>
                    {/* Year */}
<div>
  <label className="text-sm font-semibold text-slate-600">Year</label>
  <input
    type="number"
    value={item.year}
    onChange={e => updateAuthor(index, "year", e.target.value)}
    className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-slate-400 outline-none"
    placeholder="e.g. 2021"
  />
</div>

                    </div>
                ))}
            </div>

            <div className="mt-10">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex justify-between">
                    References
                    <button
                    onClick={addReference}
                    className="px-3 py-1 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-700"
                    >
                    + Add Author
                    </button>
                </h3>

                {references.length === 0 && (
                    <p className="text-gray-500 mb-4">No authors added yet.</p>
                )}
                {references.map((item, index) => (
                    <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg relative"
                    >
                    {/* Remove Button */}
                    <button
                        onClick={() => removeReference(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                    >
                        ✕
                    </button>

                    {/* Sl No */}
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Sl. No</label>
                        <input
                        type="text"
                        value={item.slNo}
                        onChange={e => updateReference(index, "slNo", e.target.value)}
                        className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg
                                    focus:ring-2 focus:ring-slate-400 outline-none"
                        />
                    </div>

                    {/* Author */}
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Author</label>
                        <input
                        type="text"
                        value={item.author}
                        onChange={e => updateReference(index, "author", e.target.value)}
                        className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg
                                    focus:ring-2 focus:ring-slate-400 outline-none"
                        />
                    </div>

                    {/* Book Title */}
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Book Title</label>
                        <input
                        type="text"
                        value={item.bookTitle}
                        onChange={e => updateReference(index, "bookTitle", e.target.value)}
                        className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg
                                    focus:ring-2 focus:ring-slate-400 outline-none"
                        />
                    </div>

                    {/* Publisher */}
                    <div>
                        <label className="text-sm font-semibold text-slate-600">Publisher&Edition</label>
                        <input
                        type="text"
                        value={item.publisher}
                        onChange={e => updateReference(index, "publisher", e.target.value)}
                        className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg
                                    focus:ring-2 focus:ring-slate-400 outline-none"
                        />
                    </div>
                    {/* Year */}
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Year</label>
                      <input
                        type="number"
                        value={item.year}
                        onChange={e => updateReference(index, "year", e.target.value)}
                        className="w-full mt-2 p-3 bg-white border border-gray-300 rounded-lg
                                  focus:ring-2 focus:ring-slate-400 outline-none"
                        placeholder="e.g. 2021"
                      />
                    </div>

                    </div>
                ))}
            </div>

            <div className="mt-8">
                <div className="mt-8 flex items-center justify-between">
  <label className="text-sm font-semibold text-slate-600">
    Course Outcomes
  </label>

  <button
    type="button"
    onClick={() => toggleSection("outcomes")}
    className="text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
  >
    {showSections.outcomes ? "Hide" : "Show"}
  </button>
</div>

               {showSections.outcomes && <NumberedTextarea
               isGen={docGen}
                 inputRef={refs.course_outcomes}     // ✅ ADD

  value={
    Array.isArray(formData.course_outcomes)
      ? formData.course_outcomes.join("\n")
      : formData.course_outcomes
  }
  onChange={(val) =>
    setFormData({
      ...formData,
      course_outcomes: val.split("\n").filter(Boolean)
    })
  }
  placeholder="Enter course outcomes"
/>}


            </div>
            

           

            {/* ======== WEB LINKS ======== */}
            <div className="mt-10">
                

  <div className="mt-8 flex items-center justify-between">
  <label className="text-sm font-semibold text-slate-600">
Web Links & Video Lectures      </label>

  <button
    type="button"
    onClick={() => toggleSection("links")}
    className="text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
  >
    {showSections.links ? "Hide" : "Show "}
  </button>
</div>

                {showSections.links && <NumberedTextarea
                isGen={docGen}
    inputRef={refs.links}

    value={
      Array.isArray(formData.referral_links)
        ? formData.referral_links.join("\n")
        : formData.referral_links || ""
    }

    onChange={(val) =>
      setFormData(prev => ({
        ...prev,
        referral_links: val.split("\n").filter(Boolean)
      }))
    }

    placeholder="Enter Web Links"
  />}
            </div>

            {/* ======== ACTIVITIES ======== */}
            <div className="mt-10">

                <div className="mt-8 flex items-center justify-between">
  <label className="text-sm font-semibold text-slate-600">
Activity-Based Learning  </label>

  <button
    type="button"
    onClick={() => toggleSection("activity")}
    className="text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
  >
    {showSections.activity ? "Hide" : "Show"}
  </button>
</div>

                {showSections.activity && (
  <NumberedTextarea
  isGen={docGen}
    inputRef={refs.activity_based}

    value={
      Array.isArray(formData.activity_based)
        ? formData.activity_based.join("\n")
        : formData.activity_based || ""
    }

    onChange={(val) =>
      setFormData(prev => ({
        ...prev,
        activity_based: val.split("\n").filter(Boolean)
      }))
    }

    placeholder="Enter activity-based learning methods"
  />
)}


            </div>

            {/* ======== CO-PO MAPPING TABLE ======== */}
            <div className="mt-10">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">
                    CO - PO - PSO Mapping Table
                </h3>

                {/* Add and remove btn for PSO Cols (DYNAMIC) */}
                      <div className="flex flex-col md:flex-row gap-5 my-4 justify-between text-xs">
                        <div className="flex gap-3">
                          <div className="group">
                            <button
                              onClick={addCoRow}
                        className="border rounded-md cursor-pointer border-white px-4 py-2 text-white bg-slate-500 "    >
                          <h2 className="hidden group-hover:block absolute backdrop-blur-3xl text-black -mt-10 -ml-10 px-2 py-1 ">Add CO Row</h2>
                              Add CO 
                            </button>
                          </div>

                          <div className="group">
                            <button
                              onClick={removeCoRow}
                              className="border rounded-md cursor-pointer border-white px-4 py-2 text-white bg-red-500 "    >
                                <h2 className="hidden group-hover:block absolute backdrop-blur-3xl text-black -mt-10 -ml-10 px-2 py-1">Add CO Row</h2>

                              Remove CO
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="group"> 
                          <button onClick={()=>addPsoCol()} className="border rounded-md cursor-pointer border-white px-4 py-2 text-white bg-slate-500 "><h2 className="hidden group-hover:block absolute backdrop-blur-3xl text-black -mt-10 -ml-10 px-2 py-1">Add PSO Column</h2> Add PSO</button>
                          </div>
                          <div className="group">
                          <button onClick={()=>removePsoCol()} className="border rounded-md cursor-pointer border-white px-4 py-2 text-white bg-red-500"><h2 className="hidden group-hover:block absolute backdrop-blur-3xl text-black -mt-10 -ml-10 px-2 py-1">Remove Last PSO Column</h2> Remove PSO</button>
                          </div>
                        </div>
                </div>


                <div className="overflow-x-auto border rounded-lg shadow-sm">
                    <table className="w-full text-center border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                            <th className="border p-2 font-semibold">CO</th>

                            {/* PO HEADERS */}
                            {formData.copoMapping.headers.map((h, idx) => (
                                <th key={idx} className="border p-2 font-semibold">
                                {h}
                                </th>
                            ))}

                            {/* NEW PSO HEADERS */}
                            {formData.copoMapping.rows[0].pso.map((_, i) => (
                            <th key={i} className="border p-2 font-semibold">PSO{i + 1}</th>
                            ))}
                            </tr>
                        </thead>

                        <tbody>
                            {formData.copoMapping.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-gray-50">
                                {/* CO Column */}
                                <td className="border p-2 font-semibold">{row.co}</td>

                                {/* PO Values */}
                                {row.vals.map((val, cIdx) => (
                                <td key={cIdx} className="border p-1">
                                    <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    className="w-12 md:w-16 text-center border outline-none rounded-md p-1 focus:ring-2 focus:ring-slate-400"
                                    value={val}
                                    onChange={(e) => {
                                        const updated = { ...formData };
                                        updated.copoMapping.rows[rIdx].vals[cIdx] = e.target.value;
                                        setFormData(updated);
                                    }}
                                    />
                                </td>
                                ))}

                                {/* PSO Cols */}
                                {row.pso.map((val, pIdx) => (
                                    <td className="border p-1" key={pIdx}>
                                        <input
                                        type="number"
                                        min="0"
                                        max="3"
                                        className="w-12 md:w-16 text-center border outline-none rounded-md p-1 focus:ring-2 focus:ring-slate-400"
                                        value={val}
                                        onChange={(e) => {
                                            const updated = { ...formData };
                                            updated.copoMapping.rows[rIdx].pso[pIdx] = e.target.value;
                                            setFormData(updated);
                                        }}
                                        />
                                    </td>
                                ))}
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ======== SUBMIT BUTTON ======== */}
            {/* <button
            onClick={onSubmit}
            className="mt-10 w-full bg-slate-600 text-white py-3 rounded-lg hover:bg-slate-700 transition"
            >
            Save Course Details
            </button> */}

            {/* ======== ACTION SECTION ======== */}
{/* ======== ACTION SECTION ======== */}
<div ref={bottomRef} className="mt-8 border-t border-slate-200 pt-6">

  {/* 1. INITIAL GENERATE BUTTON */}
  {!showDownloads && (
    <button
      disabled={isgen}
      onClick={() => generateDocument()}
      className={`mx-auto flex items-center justify-center gap-3 rounded-xl 
                  bg-indigo-600 px-8 py-3 text-white font-semibold text-lg
                  transition-all duration-200 shadow-md hover:bg-indigo-700 hover:shadow-lg
                  ${isgen ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {isgen && <div className="spinner-segmented"></div>}
      <span>{generateBtnText}</span>
    </button>
  )}

  {/* 2. DOWNLOAD, PREVIEW & SUBMIT OPTIONS (After Generation) */}
  {showDownloads && (
    <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
      
      {/* Checkboxes Row (Always visible) */}
      <div className="flex gap-6 bg-slate-50 px-8 py-4 rounded-xl border border-slate-200 mb-6">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            checked={downloadOptions.pdf}
            onChange={() => setDownloadOptions(prev => ({ ...prev, pdf: !prev.pdf }))}
          />
          <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">PDF</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group border-l pl-6 border-slate-300">
          <input
            type="checkbox"
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            checked={downloadOptions.docx}
            onChange={() => setDownloadOptions(prev => ({ ...prev, docx: !prev.docx }))}
          />
          <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">DOCX</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group border-l pl-6 border-slate-300">
          <input
            type="checkbox"
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            checked={downloadOptions.json}
            onChange={() => setDownloadOptions(prev => ({ ...prev, json: !prev.json }))}
          />
          <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">JSON</span>
        </label>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <button
          onClick={() => {
            const baseType = formData.course_type.split(" ")[0];
            setFormData(prev => ({ ...prev, course_type: baseType }));
            setDocGen(false);
            setShowDownloads(false);
            setGenenerateBtnText("Generate Course Document");
            setDownloadOptions({ pdf: false, json: false, docx: false });
          }}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Edit2 size={16} /> Edit & Regenerate
        </button>

        <button
          disabled={downloadBtnText === "Downloading..."}
          onClick={triggerAllDownloads}
          className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-semibold text-white shadow-sm transition-all
            ${downloadBtnText === "Downloading..."
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 hover:shadow"}`}
        >
          <ArrowDown size={18} />
          {downloadBtnText === "Download All" ? "Download Selected" : downloadBtnText} 
        </button>

        <button
          onClick={previewPDF}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors
            ${previewBtnText === "Preview PDF" 
              ? "bg-slate-700 hover:bg-slate-800 text-white cursor-pointer" 
              : "bg-slate-400 text-white cursor-not-allowed"}`}
        >
          {previewBtnText}
        </button>

        <button
          onClick={() => {
            setDocGen(false);
            resetForm();
            setShowDownloads(false);
            setGenenerateBtnText("Generate Course Document");
            handleRemoveFile();
            setDownloadAll(false);
            setDownloadOptions({ pdf: false, json: false, docx: false });
            localStorage.removeItem(DRAFT_KEY);
            lastSavedDataRef.current = null;
            lastSavedTimeRef.current = 0;
            setShowPopup("Data Reset Successful");
          }}
          className="flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={16} /> Generate New
        </button>
      </div>

      {/* ── PORTAL SUBMISSION BUTTON (Only visible if from portal) ── */}
      {isFromPortal && (
        <div className="w-full max-w-lg mt-2 pt-6 border-t border-slate-200 flex flex-col items-center">
          {/* <p className="text-sm font-medium text-slate-500 mb-3">
            Satisfied with the generated syllabus?
          </p> */}
          <button
            onClick={uploadFileToCloud}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
          >
            <Check size={22} />
            {submitBtnText}
          </button>
        </div>
      )}

    </div>
  )}
</div>


{showPreview && pdfPreviewUrl && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1000">
    <div className="bg-white w-[90%] h-[90%] rounded-lg shadow-lg flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b">
        <h2 className="font-semibold">PDF Preview</h2>
        <button
          onClick={() => {
            setShowPreview(false);
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
            setpreviewBtnText("Preview PDF")
          }}
          className="text-red-500 font-bold cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* PDF */}
      <iframe
        src={pdfPreviewUrl}
        className="flex-1 w-full"
        title="PDF Preview"
      />

      {/* Footer */}
      <div className="p-3 border-t flex justify-end gap-3">
        <button
          onClick={downloadPdf}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md cursor-pointer hover:bg-indigo-500"
        >
          Download PDF
        </button>
      </div>

    </div>
  </div>
)}


            {showDownloads && <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 justify-between mt-5">
              <PdfRender courseData={formData} strtDownload={downloadAll}/>
              <DocxRender courseData={formData} strtDownload={downloadAll}/>
              <JsonRender courseData={formData} strtDownload={downloadAll}/>

{/* <button
  disabled={downloadBtnText === "Downloading..."}
  onClick={triggerAllDownloads}
  className={`px-6 py-2 rounded-md text-white
    ${downloadBtnText === "Downloading..."
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-indigo-600 hover:bg-indigo-800"}
  `}
>
  {downloadBtnText}
</button> */}

            </div>}

            <button
  onClick={() => {
    if (showDownArrow) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else {
      topRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }}
  className="fixed cursor-pointer right-5 bottom-5 z-50 xl:right-60
             bg-slate-700 text-white
             p-3 rounded-full shadow-lg
             hover:bg-slate-900 transition"
>
  {showDownArrow ? <ArrowDown/> : <ArrowUp/>}
</button>



        </div>
);
}