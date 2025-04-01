export const existingPages = [
  {
    title: "dashboard",
    description: "Overview of key metrics and activities.",
    sections: [
      { label: "Chart Section", visible: true },
      { label: "Header Section", visible: true },
      { label: "Statistics Section", visible: true },
      { label: "Statistics Header", visible: true },
      { label: "Links Section", visible: false },
      { label: "My Task Section", visible: true },
      { label: "Collaborator Section", visible: true },
      { label: "Messaging", visible: true },
    ],
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
  },
  {
    title: "advisor shared-docs",
    description: "Store and collaborate on documents.",
    sections: [
      { label: "My Task Section", visible: true },
      { label: "Advisor Section", visible: true },
      { label: "Messaging", visible: true },
    ],
  },
  {
    title: "loans",
    description: "Track and manage loan details.",
    sections: [],
  },
  {
    title: "esignature",
    description: "Digitally sign and manage agreements.",
    sections: [],
  },
];


export const customPageSectionTemplate = {
  title: "",
  description: "",
  sections: [
    { label: "My Task Section", visible: true },
    { label: "Advisor Section", visible: true },
    { label: "Messaging", visible: true },
  ],
};
