const express = require("express")

const app = express();

app.get("/",(req,res)=>{
    res.send("Hello From The Backend Server...")
})

const PORT = 8000;
app.listen(PORT,()=>{
    console.log(`Listening to the PORT:${PORT}`)
})