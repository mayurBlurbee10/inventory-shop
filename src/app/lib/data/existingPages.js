export const existingPages = [
  {
    title: "dashboard",
    description: "Overview of key metrics and activities.",
    sections: [
      { label: "Chart Section", visible: true },
      { label: "Header Section", visible: true },
      { label: "Top Stories", visible: true },
      { label: "Ticker Tape", visible: false },
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
      { label: "Top Stories", visible: false },
      { label: "Ticker Tape", visible: false },
      { label: "My Task Section", visible: true },
      { label: "Advisor Section", visible: true },
      { label: "Collaborator Section", visible: false },
      { label: "Messaging", visible: true },
    ],
    isCustomPage : false,
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
    title: "forms",
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
    { label: "Chart Section", visible: false },
    { label: "Top Stories", visible: true },
    { label: "Ticker Tape", visible: false },
    { label: "My Task Section", visible: true },
    { label: "Advisor Section", visible: false },
    { label: "Collaborator Section", visible: false },
    { label: "Messaging", visible: true },
  ],
};

export const tncPage = {
  title: "T&C",
  description:
    "<p><span><strong>Terms and Conditions for Reviewing Private Financial Statements</strong></span></p><p><span>By accessing these financial statements, you agree to the following terms:</span></p><p><span><strong>1.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Confidentiality</strong>: All documents are strictly confidential and may not be shared, distributed, or disclosed without prior written consent.</span></p><p><span><strong>2.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Authorized Use Only</strong>: Access is granted solely for the purpose of evaluating Universal Portals financial position for [e.g., investment, partnership, due diligence].</span></p><p><span><strong>3.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; No Distribution</strong>: You may not reproduce, copy, or forward any part of the material outside the authorized review team.</span></p><p><span><strong>4.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; No Warranty</strong>: Information is provided “as is” without any guarantees or representations of accuracy or completeness.</span></p><p><span><strong>5.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Return or Deletion</strong>: Upon request or conclusion of your review, you agree to delete or return all accessed documents.</span></p><p><span><strong>6.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Governing Law</strong>: These terms are governed by the laws of California.</span></p><p><span><strong>Acceptance Clause</strong>:<br><br>By clicking “Accept,” accessing the Virtual Data Room, or viewing the materials provided, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions.</span></p>",
};

