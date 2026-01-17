import { Download } from 'lucide-react';
import React, { useEffect } from 'react'

export const JsonRender = ({courseData,strtDownload}) => {

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

    function downloadJSON(data, filename = `${fileName}.json`) {
  const jsonStr = JSON.stringify(data, null, 2); // pretty formatting

  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

useEffect(() => {
  if (strtDownload !== "json") return;

      downloadJSON(courseData)  // 👈 your existing logic


  }, [strtDownload]);
  return null;
}
