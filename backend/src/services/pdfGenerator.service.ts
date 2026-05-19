import PDFDocument from "pdfkit";

interface BusinessFormData {
  businessNumber: string;
  businessDescription: string;
  ownershipPercentage: string;
  isControlledPrivateCorporation: string;
  yearsInBusiness: string;
  industry: string;
  totalEmployees: string;
  userId?: string;
  applicationId?: string;
  userEmail?: string;
  userName?: string;
}

export const generateBusinessFormPDF = (
  formData: BusinessFormData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        autoFirstPage: true,
      });

      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      /* ---------------- Header ---------------- */
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("Business Form", { align: "center" })
        .moveDown(0.4);

      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke()
        .moveDown(0.6);

      /* ---------------- Body ---------------- */
      doc.font("Helvetica").fontSize(11);

      // User Information
      if (formData.userName || formData.userEmail) {
        doc
          .font("Helvetica-Bold")
          .text("User Information")
          .moveDown(1);

        doc.font("Helvetica");

        if (formData.userName) doc.font("Helvetica-Bold").text(`Name:`, { continued: true }).font("Helvetica").text(`${formData.userName}`);
        doc.moveDown(0.3);

        if (formData.userEmail) doc.font("Helvetica-Bold").text(`Email:`, { continued: true }).font("Helvetica").text(`${formData.userEmail}`);
        doc.moveDown(0.3);

        doc.moveDown(0.5);
      }

      // Business Information
      doc
        .font("Helvetica-Bold")
        .text("Business Information")
        .moveDown(1);

      doc.font("Helvetica");

      const field = (label: string, value?: string) => {
        doc
          .font("Helvetica-Bold")
          .text(`${label}: `, { continued: true });
      
        doc
          .font("Helvetica")
          .text(value || "N/A");
      
        doc.moveDown(0.2);
      };

      field("Business Number", formData.businessNumber);
      doc.moveDown(0.3);
      field("Business Description", formData.businessDescription);
      doc.moveDown(0.3);
      field("Your ownership percentage", `${formData.ownershipPercentage}%`);
      doc.moveDown(0.3);
      field(
        "Is your company Controlled Private Corporation?",
        formData.isControlledPrivateCorporation
      );
      doc.moveDown(0.3);
      field("How many years has your company been in business?", formData.yearsInBusiness);
      doc.moveDown(0.3);
      field("What industry do you operate in?", formData.industry);
      doc.moveDown(0.3);
      field("Total Number of Employees", formData.totalEmployees);
      doc.moveDown(0.3);
      /* ---------------- Footer (SAFE) ---------------- */
      doc.save();

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("gray")
        .text(
          `Generated on: ${new Date().toLocaleString()}`,
          doc.page.margins.left,
          doc.page.height - doc.page.margins.bottom - 15,
          { align: "left" }
        );

      doc.restore();

      /* ---------------- End ---------------- */
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export interface GenericFormField {
  label: string;
  value: string;
}

export const generateGenericFormPDF = (
  formTitle: string,
  fields: GenericFormField[],
  userName?: string,
  userEmail?: string,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        autoFirstPage: true,
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      /* Header */
      doc.font("Helvetica-Bold").fontSize(18).text(formTitle, { align: "center" }).moveDown(0.4);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke()
        .moveDown(0.6);

      /* User info */
      if (userName || userEmail) {
        doc.font("Helvetica-Bold").fontSize(11).text("Submitted by").moveDown(0.3);
        if (userName) doc.font("Helvetica-Bold").text("Name: ", { continued: true }).font("Helvetica").text(userName);
        if (userEmail) doc.font("Helvetica-Bold").text("Email: ", { continued: true }).font("Helvetica").text(userEmail);
        doc.moveDown(0.6);
      }

      /* Fields */
      doc.font("Helvetica").fontSize(11);
      for (const f of fields) {
        const val = f.value !== undefined && f.value !== null && String(f.value).trim() !== ""
          ? String(f.value)
          : "N/A";
        doc.font("Helvetica-Bold").text(`${f.label}: `, { continued: true }).font("Helvetica").text(val);
        doc.moveDown(0.3);
      }

      /* Footer */
      doc.save();
      doc
        .font("Helvetica").fontSize(9).fillColor("gray")
        .text(
          `Generated on: ${new Date().toLocaleString()}`,
          doc.page.margins.left,
          doc.page.height - doc.page.margins.bottom - 15,
          { align: "left" },
        );
      doc.restore();

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
