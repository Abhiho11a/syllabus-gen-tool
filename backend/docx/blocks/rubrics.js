const {
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
} = require("docx");

const fs = require("fs");
const os = require("os");
const path = require("path");
const { pdf } = require("pdf-to-img");
const mammoth = require("mammoth");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");


// =========================================================
// RUBRICS TABLE
// =========================================================

function buildRubricsTable(rubrics = []) {
  if (!Array.isArray(rubrics)) {
    return [];
  }

  const validRubrics = rubrics.filter(item =>
    item &&
    String(item.text || "").trim() !== ""
  );

  if (validRubrics.length === 0) {
    return [];
  }

  const {
    Table,
    TableRow,
    TableCell,
    ShadingType,
    WidthType,
    BorderStyle,
  } = require("docx");

  const BORDER = {
    top: { style: BorderStyle.SINGLE, size: 6 },
    bottom: { style: BorderStyle.SINGLE, size: 6 },
    left: { style: BorderStyle.SINGLE, size: 6 },
    right: { style: BorderStyle.SINGLE, size: 6 },
  };

  const rows = validRubrics.map((item, index) =>
    new TableRow({
      children: [

        new TableCell({
          borders: BORDER,
          width: {
            size: 20,
            type: WidthType.PERCENTAGE,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Rubric ${index + 1}`,
                  bold: true,
                  size: 20,
                }),
              ],
            }),
          ],
        }),

        new TableCell({
          borders: BORDER,
          width: {
            size: 80,
            type: WidthType.PERCENTAGE,
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: String(item.text || ""),
                  size: 20,
                }),
              ],
            }),
          ],
        }),

      ],
    })
  );

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 300,
        after: 150,
      },
      children: [
        new TextRun({
          text: "Rubrics",
          bold: true,
          size: 28,
        }),
      ],
    }),

    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },

      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: BORDER,
              shading: {
                fill: "E6E6E6",
                type: ShadingType.CLEAR,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "Rubric",
                      bold: true,
                      size: 20,
                    }),
                  ],
                }),
              ],
            }),

            new TableCell({
              borders: BORDER,
              shading: {
                fill: "E6E6E6",
                type: ShadingType.CLEAR,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "Description",
                      bold: true,
                      size: 20,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        ...rows,
      ],
    }),
  ];
}


// =========================================================
// CREATE BROWSER
// =========================================================

async function launchBrowser() {
  return await puppeteer.launch({
    args: chromium.args,
    defaultViewport: {
      width: 1240,
      height: 1754,
    },
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}


// =========================================================
// DOCX → PDF
// =========================================================

async function convertDocxToPdfBuffer(buffer) {

  const result = await mammoth.convertToHtml({
    buffer,
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

@page {
  size: A4;
  margin: 20mm 15mm;
}

body {
  font-family: Arial, sans-serif;
  font-size: 12px;
  line-height: 1.4;
}

table {
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #000;
  padding: 5px;
}

img {
  max-width: 100%;
}

</style>

</head>

<body>

${result.value}

</body>
</html>
`;

  const browser = await launchBrowser();

  try {

    const page = await browser.newPage();

    await page.setContent(
      html,
      {
        waitUntil: "networkidle0",
      }
    );

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
    });

  } finally {

    await browser.close();

  }
}


// =========================================================
// PDF → PNG IMAGES
// =========================================================

async function convertPdfToImages(pdfBuffer) {
  const tempDir = path.join(os.tmpdir(), `rubric-images-${Date.now()}`);

  fs.mkdirSync(tempDir, { recursive: true });

  const pdfPath = path.join(tempDir, "rubric.pdf");
  fs.writeFileSync(pdfPath, pdfBuffer);

  const images = [];

  try {
    const { pdf } = await import("pdf-to-img");

    // Higher resolution for clearer text
    const document = await pdf(pdfPath, {
      scale: 5,
      format: "png",
    });

    let pageNumber = 1;

    for await (const image of document) {
      const imagePath = path.join(
        tempDir,
        `rubric-page-${pageNumber}.png`
      );

      fs.writeFileSync(imagePath, Buffer.from(image));

      images.push(imagePath);

      pageNumber++;
    }

    return {
      images,
      tempDir,
    };
  } catch (error) {
    console.error("PDF → image conversion error:", error);
    throw error;
  }
}


// =========================================================
// BUILD RUBRIC DOCUMENT PAGES
// =========================================================

async function buildRubricDocument(
  rubricFile
) {

  if (!rubricFile) {
    return [];
  }

  let pdfBuffer;

  // =======================================================
  // PDF
  // =======================================================

  if (
    rubricFile.mimetype ===
    "application/pdf"
  ) {

    pdfBuffer = rubricFile.buffer;

  }

  // =======================================================
  // DOCX
  // =======================================================

  else if (
    rubricFile.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {

    pdfBuffer =
      await convertDocxToPdfBuffer(
        rubricFile.buffer
      );

  }

  else {

    throw new Error(
      "Unsupported rubric document format."
    );

  }


  // =======================================================
  // PDF → IMAGES
  // =======================================================

  const {
    images,
    tempDir,
  } = await convertPdfToImages(
    pdfBuffer
  );

  const children = [];

  // =======================================================
  // HEADING
  // =======================================================

  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,

      spacing: {
        before: 300,
        after: 200,
      },

      children: [
        new TextRun({
          text: "Rubrics Document",
          bold: true,
          size: 28,
        }),
      ],
    })
  );


  // =======================================================
  // INSERT EACH PAGE AS IMAGE
  // =======================================================

  for (
    let i = 0;
    i < images.length;
    i++
  ) {

    const imageBuffer =
      fs.readFileSync(
        images[i]
      );

    children.push(

      new Paragraph({
        alignment: AlignmentType.CENTER,

        spacing: {
          before: 100,
          after: 100,
        },

        children: [

          new ImageRun({
            data: imageBuffer,

            transformation: { 
            width: 700, 
            height: 849, 
            },

            type: "png",
          }),

        ],
      })

    );

  }


  // =======================================================
  // CLEAN TEMP FILES
  // =======================================================

  fs.rmSync(
    tempDir,
    {
      recursive: true,
      force: true,
    }
  );


  return children;
}


module.exports = {
  buildRubricsTable,
  buildRubricDocument,
};