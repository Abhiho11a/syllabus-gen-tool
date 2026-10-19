export const programStructure = {
  "BE/BTECH": {
    icon: "",
    departments: [
      {
        value: "AIML",
        label: "Artificial Intelligence and Machine Learning",
      },
      {
        value: "CSE",
        label: "Computer Science and Engineering",
      },
      {
        value: "CSE(IOT)",
        label:
          "Computer Science and Engineering (Internet of Things & Cyber Security including Blockchain Technology)",
      },
      {
        value: "CS(DS)",
        label: "Computer Science and Engineering (Data Science)",
      },
      {
        value: "ISE",
        label: "Information Science and Engineering",
      },
      {
        value: "ECE",
        label: "Electronics and Communication Engineering",
      },
      {
        value: "EEE",
        label: "Electrical and Electronics Engineering",
      },
      {
        value: "EIE",
        label: "Electronics and Instrumentation Engineering",
      },
      {
        value: "ETE",
        label: "Electronics and Telecommunication Engineering",
      },
      {
        value: "VLSI",
        label: "Electronics Engineering (VLSI Design & Technology)",
      },
      {
        value: "ME",
        label: "Mechanical Engineering",
      },
      {
        value: "CIVIL",
        label: "Civil Engineering",
      },
      {
        value: "RAI",
        label: "Robotics & Artificial Intelligence",
      },
    ],
  },

  MCA: {
    icon: "",
    departments: [
      {
        value: "MCA",
        label: "Master in Computer Applications (MCA)",
      },
    ],
  },

  MBA: {
    icon: "",
    departments: [
      {
        value: "MBA",
        label: "Master in Business Administration (MBA)",
      },
    ],
  },

  MTECH: {
    icon: "",
    departments: [
      {
        value: "CSE",
        label: "Computer Science & Engineering",
      },
      {
        value: "VLSI",
        label: "VLSI Design & Embedded System",
      },
      {
        value: "SE",
        label: "Software Engineering",
      },
      {
        value: "STRUCTURAL",
        label: "Structural Engineering",
      },
    ],
  },
};

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
  scheme_year: "2024",
  curriculum_focus: "",
  skill_enhancement: "",
  industry_alignment: "",

  rubrics:[],
  guidelines:[],

  course_objectives: `**This course will enable the students to:**\n${DEFAULT_4_POINTS}`,
  course_outcomes: `**At the end of the course, the student will be able to:**\n${DEFAULT_4_POINTS}`,
  teaching_learning: `**In addition to the traditional chalk and talk method, ICT tools are adopted:**\n${DEFAULT_4_POINTS}`,
  // modern_tools: `**Modern AI tools used for this course:**\n${DEFAULT_4_POINTS}`,
  modern_tools: `${DEFAULT_4_POINTS}`,
  referral_links: `${DEFAULT_4_POINTS}`,
  activity_based: `${DEFAULT_4_POINTS}`,

  textbooks: [],
  references:[],
  termWorkActivities: [],
  selfLearningActivities: [],

  modules: [
    {
      no: 1,
      title: "",
      content: "",
      textbooks: [],
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
  },
  cowkMapping: {
  headers: [
    "WK1",
    "WK2",
    "WK3",
    "WK4",
    "WK5",
    "WK6",
    "WK7",
    "WK8",
    "WK9",
  ],

  rows: [
    {
      co: "CO1",
      vals: [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    },
    {
      co: "CO2",
      vals: [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    },
    {
      co: "CO3",
      vals: [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    },
    {
      co: "CO4",
      vals: [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    },
    {
      co: "CO5",
      vals: [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    },
  ],
},

sdgs: [
  {
    goalNo: "",
    goalTitle: "",
    description: "",
  },
],
};
