const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/", (req, res) => res.send("BashSearch API v1.8 - Diagnóstico Ativo"));

app.post("/search", async (req, res) => {
    const { prompt } = req.body;
    console.log(`🔍 Recebido: ${prompt}`);

    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ ERRO: GEMINI_API_KEY não configurada no Render!");
        return res.status(500).json({ error: "Configuração ausente no servidor." });
    }

    try {
        // Usando o modelo padrão estável
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "Você é o Sentinela-Bash IA. Forneça o comando Termux com $, explicação curta e pkg install. Use Markdown."
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("✅ IA respondeu com sucesso.");
        res.json({ resposta: text });

    } catch (error) {
        console.error("❌ ERRO DETALHADO NA IA:", error.message);
        res.status(500).json({ error: `Erro na IA: ${error.message}` });
    }
});

app.listen(PORT, () => console.log(`Servidor v1.8 online na porta ${PORT}`));

// Keep-alive
setInterval(() => {
    axios.get("https://bash-search-backend.onrender.com").catch(() => {});
}, 840000);
