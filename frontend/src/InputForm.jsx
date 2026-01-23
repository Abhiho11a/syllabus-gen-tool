import { ArrowDown, ArrowUp, RefreshCcw, Plus, Trash2, X, Edit2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import './App.css'
import { DataSchema, programStructure } from "./config/appConfig";
import { resetFormData } from "./config/resetFormData";
import NumberedTextarea from "./NumberedTextArea";
import PdfRender from "./renders/PdfRender";
import DocxRender from "./renders/DocxRender";
import JsonRender from "./renders/JsonRender";


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

const [formData, setFormData] = useState({
  ...DataSchema,
  modules: DataSchema.modules?.length
    ? DataSchema.modules
    : [{ ...emptyModule }]
});


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

function askCourseNature(question, theory, lab, theoryLab) {
  let type = window.prompt(question);
  if (type === null) return null;

  type = type.trim().toLowerCase();

  if (theory && type === "t") return "T";
  if (lab && type === "l") return "L";
  if (theoryLab && type === "tl") return "T+L";

  alert("Invalid input. Please enter valid option.");
  return askCourseNature(question, theory, lab, theoryLab);
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
if (!hasRealUserContent(formData.modern_tools)) {
  alert("Please add at least one Modern AI Tool");
  scrollTo(refs.modern_tools);
  resetGenerateState();
  return;
}


  
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
      "Enter course type:\nT → Theory\nL → Lab",
      true, true, false
    );
  } 
  else if (baseType === "ESC") {
    user_res = askCourseNature(
      "Enter course type:\nT → Theory\nTL → Theory + Lab",
      true, false, true
    );
  } 
  else if (baseType === "IPCC") user_res = "T+L";
  else if (["OE", "PE", "PCC", "UHV","BSC"].includes(baseType)) user_res = "T";
  else if (baseType === "PCCL") user_res = "L";

  if (!user_res) 
  {
    setDocGen(false)
    return;
  }

  const updatedType = `${baseType} (${user_res})`;

  setFormData({
    ...formData,
    course_type: updatedType
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
    const res = await fetch(
    "http://localhost:8000/generate-pdf",
    // " https://syllabus-gen-tool.onrender.com/generate-pdf",
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
      "http://localhost:8000/generate-docx",
      // "https://syllabus-gen-tool.onrender.com/generate-docx",
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
  setTimeout(() => setDownloadAll("json"), 600);

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






    return (
        <div ref={topRef} className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-8 border border-gray-200 mt-10">
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





            {/* ======== COurse and sem ======== */}
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
                        <option value="OE">OE</option>
                        <option value="PE">PE</option>
                        <option value="ESC">ESC</option>
                        <option value="PCCL">PCCL</option>
                        <option value="UHV">UHV</option>
                        <option value="BSC">BSC</option>
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
                          ref={refs.credits}        // ✅ ADD

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
    {showSections.objectives ? "Hide" : "Add"}
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
    {showSections.tl ? "Hide" : "Add"}
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
    Modern AI tools
  </label>

  <button
    type="button"
    onClick={() => toggleSection("tools")}
    className="text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300"
  >
    {showSections.tools ? "Hide" : "Add"}
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
    <div
      key={idx}
      className="border-2 p-4 border-gray-200 space-y-4 relative"
    >
      <h2 className="text-center text-lg font-semibold">
        Module {idx + 1}
      </h2>

      {formData.modules.length > 1 && (
        <button
          type="button"
          onClick={() => removeModule(idx)}
          className="absolute top-3 right-3 text-sm font-semibold bg-red-500  hover:bg-red-600 rounded-md text-white py-1.5 px-3"
        >
          Remove
        </button>
      )}

      {/* CONTENT */}
      <div>
        <p className="text-red-600 text-xs">
          Wrap words inside <b>** **</b> for bold text in PDF
        </p>
        <label className="block text-sm font-medium text-gray-700">
          Topics Covered
        </label>
        <textarea
          name="content"
          value={mod.content}
          onChange={(e) => handleModuleChange(idx, e)}
          rows={5}
          className=" w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-lg
                 resize-none focus:ring-2 focus:ring-slate-400 outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Text Book No.</label>
        <input
          name="textbook"
          value={mod.textbook}
          onChange={(e) => handleModuleChange(idx, e)}
          className="w-full mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg
                 resize-none focus:ring-2 focus:ring-slate-400 outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Chapter Article No.</label>
        <input
          name="chapter"
          value={mod.chapter}
          onChange={(e) => handleModuleChange(idx, e)}
          className="w-full mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg
                 resize-none focus:ring-2 focus:ring-slate-400 outline-none"
        />
      </div>

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
  <div className="my-10 py-3 px-5 border-2 border-gray-200 bg-white">
                        <label className="text-sm font-semibold text-slate-600">Experiments</label> 

    {/* Add Experiment Form */}
    <div className="mt-2 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-sm font-semibold text-blue-900 mb-3">
        Add New Experiment
      </h3>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="number"
          placeholder="Sl No."
          value={newExpNo}
          onChange={(e) => setNewExpNo(Number(e.target.value))}
          className="w-full md:w-24 px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:border-blue-500 transition"
        />

        <input
          type="text"
          placeholder="Enter Experiment Description..."
          value={newExpCont}
          onChange={(e) => setNewExpCont(e.target.value)}
          className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:border-blue-500 transition"
        />

        <button
          type="button"
          onClick={addNewExperiment}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium whitespace-nowrap"
        >
          <Plus size={18} />
          Add
        </button>
      </div>
    </div>

    {/* Experiments Table */}
    {(!formData.experiments || formData.experiments.length === 0) ? (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No experiments added yet</p>
        <p className="text-sm mt-2">
          Add your first experiment using the form above
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-700 text-white">
              <th className="px-4 py-3 text-left font-semibold w-20 border-r border-slate-500">
                Sl No
              </th>
              <th className="px-4 py-3 text-left font-semibold border-r border-slate-500">
                Experiment
              </th>
              <th className="px-4 py-3 text-center font-semibold w-32">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {formData.experiments.map((exp, idx) => (
              <tr
                key={exp.slno ?? idx}
                className={`border-b border-gray-200 transition ${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                {editingExpIndex === idx ? (
                  <>
                    {/* EDIT MODE */}
                    <td className="px-4 py-3 border-r border-gray-200">
                      <input
                        type="number"
                        value={editExpNo}
                        onChange={(e) =>
                          setEditExpNo(Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 border-2 border-blue-400 rounded focus:outline-none"
                      />
                    </td>

                    <td className="px-4 py-3 border-r border-gray-200">
                      <textarea
                        value={editExpCont}
                        onChange={(e) =>
                          setEditExpCont(e.target.value)
                        }
                        rows={2}
                        className="w-full px-2 py-1 border-2 border-blue-400 rounded focus:outline-none resize-none"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={saveEditExperiment}
                          className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition font-medium"
                          title="Save"
                        >
                          <Check size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditExperiment}
                          className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition font-medium"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    {/* VIEW MODE */}
                    <td className="px-4 py-3 text-center font-semibold text-gray-700 border-r border-gray-200">
                      {exp.slno}
                    </td>

                    <td className="px-4 py-3 text-gray-700 leading-relaxed border-r border-gray-200">
                      {exp.cont}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditExperiment(idx)}
                          className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition font-medium"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteExperiment(idx)}
                          className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition font-medium"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
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
                    Textbooks / References
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
    {showSections.outcomes ? "Hide" : "Add"}
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
    {showSections.links ? "Hide" : "Add "}
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
    {showSections.activity ? "Hide" : "Add"}
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

            {!showDownloads && 
            <div ref={bottomRef}>
  {!showDownloads && (
    <button 
            disabled={isgen}

            onClick={()=>generateDocument()}
  className={`mx-auto mt-6
             flex items-center justify-center gap-2
             rounded-xl bg-indigo-600 px-8 py-2
             text-white font-medium hover:bg-indigo-800 ${isgen?"cursor-no-drop":"cursor-pointer"}`}
>
  {isgen&&<div className="spinner-segmented"></div>}
  <span className="text-ms ">{generateBtnText}</span>
</button>
  )}
</div>
            
            }

{showDownloads && 
<div className="flex flex-col justify-center items-center">
  <div className="flex gap-5 mt-5">
  <label className="flex items-center gap-2 text-md font-semibold text-slate-600">
    <span>PDF</span>
    <input
      type="checkbox"
      checked={downloadOptions.pdf}
      onChange={() => setDownloadOptions(prev => ({ ...prev, pdf: !prev.pdf }))}
    />
  </label>

  <label className="flex items-center gap-2 text-md font-semibold text-slate-600">
    <span>DOCX</span>
    <input
      type="checkbox"
      checked={downloadOptions.docx}
      onChange={() => setDownloadOptions(prev => ({ ...prev, docx: !prev.docx }))}
    />
  </label>

  <label className="flex items-center gap-2 text-md font-semibold text-slate-600">
    <span>JSON</span>
    <input
      type="checkbox"
      checked={downloadOptions.json}
      onChange={() => setDownloadOptions(prev => ({ ...prev, json: !prev.json }))}
    />
  </label>
 </div>

  <div className="flex gap items-center justify-center gap-5 mt-5">
    <button onClick={() => {
      const baseType = formData.course_type.split(" ")[0]; // 👈 MAGIC

    setFormData(prev => ({
      ...prev,
      course_type: baseType
    }));
    setDocGen(false)
      setShowDownloads(false);
      setGenenerateBtnText("Generate Course Document")
      setDownloadOptions({
        pdf: false,
        json: false,
        docx: false
      })  }} 
    className="flex bg-slate-700 cursor-pointer hover:bg-slate-800 text-white px-5 py-2 rounded-md text-md">Edit & Regenerate</button>
    <button
    disabled={downloadBtnText === "Downloading..."}
    onClick={triggerAllDownloads}
    className={`px-6 py-2 cursor-pointer rounded-md text-white
      ${downloadBtnText === "Downloading..."
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-indigo-600 hover:bg-indigo-800"}
    `}
  >
    {downloadBtnText}
  </button>


    <button onClick={()=> {
          setDocGen(false)

      resetForm()
      setShowDownloads(false)
      setGenenerateBtnText("Generate Course Document")
      handleRemoveFile()
      setDownloadAll(false)
      setDownloadOptions({
        pdf: false,
        json: false,
        docx: false
      })
    }} className="flex bg-green-700 cursor-pointer hover:bg-green-800 text-white px-5 py-2 rounded-md text-md">Generate New</button>
  </div>
</div>}


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