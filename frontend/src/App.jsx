import { useState } from "react";
import Header from "./Header";
import InputForm from "./InputForm";
import MergeFilesModal from "./MergeFilesModal";
import ModeSwitcher from "./ModeSwitcher";

export default function App(){
  const [mode, setMode] = useState("generator");

  return(
    <div>
      <Header/>
      <ModeSwitcher mode={mode} setMode={setMode} />
      {mode === "generator" && <InputForm />}
      {mode === "merge" && <MergeFilesModal onClose={()=>setMode("generator")}/>}
    </div>
  )
}