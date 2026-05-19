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

export const NDAPage = [
  {
    title: "Confidential Data Access Agreement",
    description: `<p><span><strong>Confidential  Data Access Agreement</strong></span></p>
<p><span>Access to these materials is conditional upon your agreement to the following:</span></p>
<p><span><strong>1. Non-Disclosure Obligation</strong>: You shall maintain strict confidentiality and prevent unauthorized access or disclosure.</span></p>
<p><span><strong>2. Limited Authorization</strong>: Access is restricted solely to authorized individuals for approved evaluation purposes.</span></p>
<p><span><strong>3. Prohibited Actions</strong>: Reproduction, duplication, or dissemination of the documents is strictly forbidden.</span></p>
<p><span><strong>4. No Liability</strong>: The provider disclaims all liability arising from the use or reliance on the information.</span></p>
<p><span><strong>5. Mandatory Disposal</strong>: All copies must be destroyed or returned upon request or completion of review.</span></p>
<p><span><strong>6. Applicable Law</strong>: This agreement is governed by California law.</span></p>
<p><span><strong>Acceptance Clause</strong>:<br><br>
Accessing these materials constitutes your binding agreement to these terms.</span></p>`,
  },

  {
    title: "Terms of Use for Document Review",
    description: `<p><span><strong>Terms of Use for Document Review</strong></span></p>
<p><span>Please review and agree to the following terms before accessing the documents:</span></p>
<p><span><strong>1. Confidentiality</strong>: These documents are private and must not be shared outside the authorized team.</span></p>
<p><span><strong>2. Intended Use</strong>: Use this information only for evaluation purposes such as investment or due diligence.</span></p>
<p><span><strong>3. No Sharing</strong>: Copying, forwarding, or distributing content is strictly prohibited.</span></p>
<p><span><strong>4. Disclaimer</strong>: Information is provided “as is” without any guarantees of accuracy or completeness.</span></p>
<p><span><strong>5. Data Deletion</strong>: All materials must be deleted or returned after the review is complete.</span></p>
<p><span><strong>6. Governing Law</strong>: These terms are governed by California law.</span></p>
<p><span><strong>Acceptance Clause</strong>:<br><br>
By accessing these documents, you agree to comply with these terms.</span></p>`,
  },

  {
    title: "Confidential Information Review Agreement",
    description: `<p><span><strong>Confidential Information Review Agreement</strong></span></p>
<p><span>By accessing these statements, you agree to the following conditions:</span></p>
<p><span><strong>1. Confidential Handling</strong>: All documents must be treated as confidential and protected from unauthorized disclosure.</span></p>
<p><span><strong>2. Authorized Access</strong>: Access is granted only for approved individuals and defined evaluation purposes.</span></p>
<p><span><strong>3. Usage Restrictions</strong>: You may not reproduce, copy, or distribute any part of these materials.</span></p>
<p><span><strong>4. No Warranty</strong>: The information is provided without warranties of any kind.</span></p>
<p><span><strong>5. Return Policy</strong>: Documents must be deleted or returned upon request or after use.</span></p>
<p><span><strong>6. Legal Jurisdiction</strong>: This agreement is governed under California law.</span></p>
<p><span><strong>Acceptance Clause</strong>:<br><br>
Your access confirms that you have read, understood, and accepted these terms.</span></p>`,
  },
];

