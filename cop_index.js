const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");
const fs = require("fs");

// --- 1. CONFIGURAÇÃO DE MEMÓRIA SRE v2.2 ---
let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log("✅ [SRE] Firebase: Carregado via Variável de Ambiente.");
    } catch (e) {
        console.error("❌ [SRE] Erro ao parsear FIREBASE_SERVICE_ACCOUNT. Verifique o JSON.");
    }
} else if (fs.existsSync("./serviceAccountKey.json")) {
    serviceAccount = require("./serviceAccountKey.json");
    console.log("📱 [SRE] Firebase: Carregado via Arquivo Local.");
} else {
    console.error("🚨 [FALHA CRÍTICA] Nenhuma credencial Firebase encontrada!");
    console.error("DICA: Configure a variável FIREBASE_SERVICE_ACCOUNT no Render.");
}

// Inicialização segura
if (serviceAccount) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("🚀 [SRE] Firebase Admin inicializado com sucesso.");
    }
} else {
    console.error("⚠️ [SRE] O backend continuará sem persistência (Modo Degradado).");
}

const db = serviceAccount ? admin.firestore() : null;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/", (req, res) => res.send("BashSearch API v2.2 - SRE Resiliente Online"));
app.get("/ping", (req, res) => res.json({ status: "online", unit: "CLI-Unit", version: "2.3" }));

app.post("/search", async (req, res) => {
    const { prompt } = req.body;
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            systemInstruction: "Você é o Sentinela-Bash IA, a Unidade CLI do projeto Minha IA Memória. Retorne o comando Termux precedido por $, uma explicação simples e como instalar."
        });

        const result = await model.generateContent(prompt);
        const respostaTexto = result.response.text();

        // Persistência condicional (só se o DB estiver ativo)
        if (db) {
            await db.collection("historico").add({
                usuario_query: prompt,
                ia_resposta: respostaTexto,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                versao: "2.2-resiliente"
            }).catch(e => console.error("Erro ao salvar no Firestore:", e.message));
        }

        res.json({ resposta: respostaTexto });
    } catch (e) {
        console.error("❌ ERRO GEMINI:", e.message);
        res.status(500).json({ error: "Erro na Unidade de IA" });
    }
});

app.listen(PORT, () => console.log(`✅ Servidor v2.2 Rodando na porta ${PORT}`));

setInterval(() => {
    axios.get("https://bash-search-backend.onrender.com").catch(() => {});
}, 840000);
