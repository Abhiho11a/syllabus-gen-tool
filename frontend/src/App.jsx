import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import InputForm from "./InputForm";
import MergeFilesModal from "./MergeFilesModal";
import ModeSwitcher from "./ModeSwitcher";
import Analysis from "./Analysis";

function MainApp() {
  const [mode, setMode] = useState("generator");

  return (
    <div>
      <Header/>
      <ModeSwitcher mode={mode} setMode={setMode} />
      {mode === "generator" && <InputForm />}
      {mode === "merge" && <MergeFilesModal onClose={()=>setMode("generator")}/>}
    </div>
  );
}

export default function App(){
  return(
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/stats" element={<Analysis />} />
    </Routes>
  )
}