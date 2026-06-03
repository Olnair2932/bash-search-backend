const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");

// --- 1. CONFIGURAÇÃO DE MEMÓRIA (SRE CORE) ---
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 2. ENDPOINT DE SAÚDE ---
app.get("/", (req, res) => res.send("BashSearch API v2.0 - SRE Stateful Online"));

// --- 3. NÚCLEO DE BUSCA E PERSISTÊNCIA ---
app.post("/search", async (req, res) => {
    const { prompt } = req.body;
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            systemInstruction: "Você é o Sentinela-Bash IA, a Unidade CLI do projeto Minha IA Memória. Sua missão é fornecer comandos Termux precisos precedidos por $, seguidos de explicação técnica e método de instalação. Você opera sob protocolos SRE de alta performance."
        });

        const result = await model.generateContent(prompt);
        const respostaTexto = result.response.text();

        // SALVAMENTO ATÔMICO NO FIRESTORE
        await db.collection("historico").add({
            usuario_query: prompt,
            ia_resposta: respostaTexto,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            versao: "2.0-stateful"
        });

        res.json({ resposta: respostaTexto });
    } catch (e) {
        console.error("❌ ERRO CRÍTICO SRE:", e.message);
        res.status(500).json({ error: "Erro na IA ou Falha na Persistência de Dados" });
    }
});

app.listen(PORT, () => console.log(`✅ Servidor v2.0 Rodando na porta ${PORT}`));

// Keep-alive (Evitar Hibernação do Render)
setInterval(() => {
    axios.get("https://bash-search-backend.onrender.com").catch(() => {});
}, 840000);
