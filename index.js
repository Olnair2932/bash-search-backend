const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Keep-alive SRE
setInterval(async () => {
    try {
        const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        await axios.get(url);
        console.log("Ping Keep-alive: OK");
    } catch (e) { console.log("Ping Keep-alive: Silent"); }
}, 840000);

app.get("/", (req, res) => res.send("BashSearch API v1.5 [bash-eee21] Online"));

app.post("/search", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt vazio" });
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash-lite",
            systemInstruction: "Você é o Sentinela-Bash IA. Retorne o comando Termux precedido por $, uma explicação simples de uma linha e o comando de instalação 'pkg install'. Use Markdown estrito com blocos de código."
        });
        const result = await model.generateContent(prompt);
        res.json({ resposta: result.response.text() });
    } catch (e) {
        res.status(500).json({ error: "Erro na IA" });
    }
});

app.listen(PORT, () => console.log(`Backend online na porta ${PORT}`));
