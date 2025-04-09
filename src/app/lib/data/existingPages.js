export const existingPages = [
  {
    title: "dashboard",
    description: "Overview of key metrics and activities.",
    sections: [
      { label: "Chart Section", visible: true },
      { label: "Header Section", visible: true },
      { label: "Top Stories", visible: true },
      { label: "Ticker Tape", visible: true },
      // { label: "Links Section", visible: false },
      { label: "My Task Section", visible: true },
      { label: "Collaborator Section", visible: true },
      { label: "Messaging", visible: true },
    ],
    isCustomPage : false,
  },
  {
    title: "shared-docs",
    description: "Store and collaborate on documents.",
    sections: [
      { label: "My Task Section", visible: false },
      { label: "Advisor Section", visible: false },
      { label: "Collaborator Section", visible: false },
      { label: "Messaging", visible: true },
    ],
    isCustomPage : false,
  },
  {
    title: "Trading",
    description: `<h1><span style="color: rgb(29, 28, 29)">Page to add trading strategies to execute.</span></h1><p></p><p><a target="_blank" rel="noopener noreferrer nofollow" href="https://www.mstrategygroup.com">www.mstrategygroup.com</a></p><p><br><a target="_blank" rel="noopener noreferrer nofollow" href="https://www.schwab.com/client-home">https://www.schwab.com/client-home</a><br><br></p>`,
    sections: [
      { label: "Chart Section", visible: false },
      { label: "Top Stories", visible: true },
      { label: "Ticker Tape", visible: true },
      { label: "My Task Section", visible: true },
      { label: "Advisor Section", visible: false },
      { label: "Collaborator Section", visible: false },
      { label: "Messaging", visible: true },
    ],
    isCustomPage : true,
  },
  {
    title: "advisor dashboard",
    description: "Overview of key metrics and activities.",
    sections: [
      { label: "Activity Section", visible: true },
      { label: "My Task Section", visible: true },
      { label: "Messaging", visible: true },
      { label: "Your Clients Section", visible: true}
    ],
    isCustomPage : false,
  },
  {
    title: "advisor shared-docs",
    description: "Store and collaborate on documents.",
    sections: [
      { label: "My Task Section", visible: true },
      { label: "Advisor Section", visible: true },
      { label: "Messaging", visible: true },
    ],
    isCustomPage : false,
  },
  {
    title: "loans",
    description: "Track and manage loan details.",
    sections: [],
    isCustomPage : false,
  },
  {
    title: "esignature",
    description: "Digitally sign and manage agreements.",
    sections: [],
    isCustomPage : false,
  },
];


export const customPageSectionTemplate = {
  title: "",
  description: "",
  sections: [
    { label: "Top Stories", visible: true },
    { label: "Ticker Tape", visible: true },
    { label: "Chart Section", visible: false },
    { label: "My Task Section", visible: true },
    { label: "Advisor Section", visible: true },
    { label: "Messaging", visible: true },
  ],
};
