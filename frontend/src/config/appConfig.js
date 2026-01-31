export const programStructure = {
    "BE/BTECH": {
      icon: "",
      departments: ["AIML", "CSE", "CSE(IOT)", "CS(DS)", "ISE", "ECE", "EEE", "EIE", "ETE", "VLSI", "ME", "CIVIL", "RAI"]
    },
    "MCA": {
      icon: "",
      departments: ["MCA"]
    },
    "MBA": {
      icon: "",
      departments: ["MBA"]
    },
    "MTECH": {
      icon: "",
      departments: ["CSE", "VLSI", "STRUCTURAL"]
    }
}



const DEFAULT_4_POINTS = `1. 
2. 
3. 
4. 
5.`;

// 🎓💻📊🔬
export const DataSchema = {
  department:"",
  sem: "",
  course_title: "",
  course_code: "",
  course_type: "",
  credits: "",
  pedagogy: "",
  cie: "",
  see: "",
  ltps: "",
  exam_hours: "",

  course_objectives: `**This course will enable the students to:**\n${DEFAULT_4_POINTS}`,
  course_outcomes: `**At the end of the course, the student will be able to:**\n${DEFAULT_4_POINTS}`,
  teaching_learning: `**In addition to the traditional chalk and talk method, ICT tools are adopted:**\n${DEFAULT_4_POINTS}`,
  modern_tools: `**Modern AI tools used for this course:**\n${DEFAULT_4_POINTS}`,
  referral_links: `${DEFAULT_4_POINTS}`,
  activity_based: `${DEFAULT_4_POINTS}`,

  textbooks: [],

  modules: [
    {
      no: 1,
      title: "",
      content: "",
      textbook: "",
      chapter: "",
      rbt: "",
      wkt:""
    }
    // {
    //   no: 2,
    //   title: "",
    //   content: "",
    //   textbook: "",
    //   chapter: "",
    //   rbt: "",
    //   wkt:""
    // },
    // {
    //   no: 3,
    //   title: "",
    //   content: "",
    //   textbook: "",
    //   chapter: "",
    //   rbt: "",
    //   wkt:""
    // },
    // {
    //   no: 4,
    //   title: "",
    //   content: "",
    //   textbook: "",
    //   chapter: "",
    //   rbt: "",
    //   wkt:""
    // },
    // {
    //   no: 5,
    //   title: "",
    //   content: "",
    //   textbook: "",
    //   chapter: "",
    //   rbt: "",
    //   wkt:""
    // }
  ],

  copoMapping: {
    headers: ["PO1","PO2","PO3","PO4","PO5","PO6","PO7","PO8","PO9","PO10","PO11"],
    rows: [
      { co: "CO1", vals: Array(11).fill(""), pso: ["", ""] },
      { co: "CO2", vals: Array(11).fill(""), pso: ["", ""] },
      { co: "CO3", vals: Array(11).fill(""), pso: ["", ""] },
      { co: "CO4", vals: Array(11).fill(""), pso: ["", ""] },
      { co: "CO5", vals: Array(11).fill(""), pso: ["", ""] }
    ]
  }
};
