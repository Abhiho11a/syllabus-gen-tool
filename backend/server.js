const express = require("express")

const app = express();

app.get("/",(req,res)=>{
    res.send("Hello From The Backend Server...")
})

app.post('/generate-pdf', async (req, res) => {

  try {
    const courseData = req.body;

    // console.log("COURSE :",courseData) 
    // console.log("Received course data:", JSON.stringify(courseData, null, 2));
    
    // Read HTML template
    const templatePath = path.join(__dirname, "templates", "syllabus.html");
    
    if (!fs.existsSync(templatePath)) {
      return res.status(500).send("Template file not found at: " + templatePath);
    }
    
    const templateHTML = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    const finalHTML = generateSyllabusHTML(templateHTML, courseData);
    
    console.log("Generated HTML (first 500 chars):", finalHTML.substring(0, 500));

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(finalHTML, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm"
      }
    });
    
    // await browser.close();
    await page.close(); // ✅ keep browser alive

    // console.log("PDF generated successfully, size:", pdfBuffer.length, "bytes");
    
    // ✅ Send PDF (Render-safe)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
    "Content-Disposition",
    "attachment; filename=syllabus.pdf"
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.end(pdfBuffer, "binary");    
} catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      message: error.message,
      stack: error.stack
    });
  }
});


const PORT = 8000;
app.listen(PORT,()=>{
    console.log(`Listening to the PORT:${PORT}`)
})