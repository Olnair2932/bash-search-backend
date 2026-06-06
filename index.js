const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");
const fs = require("fs");

// --- 1. CONFIGURAÇÃO DE MEMÓRIA SRE v2.3 ---
let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log("✅ [SRE] Firebase: Carregado via Variável de Ambiente.");
    } catch (e) {
        console.error("❌ [SRE] Erro no JSON da variável FIREBASE_SERVICE_ACCOUNT.");
    }
} else if (fs.existsSync("./serviceAccountKey.json")) {
    serviceAccount = require("./serviceAccountKey.json");
    console.log("📱 [SRE] Firebase: Carregado via Arquivo Local.");
}

// Inicialização segura do Firebase
if (serviceAccount) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("🚀 [SRE] Firebase Admin inicializado.");
    }
} else {
    console.warn("⚠️ [SRE] Backend rodando sem persistência (Modo Degradado).");
}

const db = serviceAccount ? admin.firestore() : null;

const app = express();
app.use(cors());
app.use(express.json());
// Servir a pasta public (frontend) pelo backend também
app.use(express.static("public"));

const PORT = process.env.PORT || 10000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rotas de Status
app.get("/ping", (req, res) => res.json({
    status: "online",
    unit: "CLI-Unit",
    version: "2.3",
    db_active: !!db
}));

// Rota Principal de Busca (IA)
app.post("/search", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt vazio" });

    try {
        // AJUSTE NA PERSONALIDADE: RESPOSTA DIRETA (COMANDO + EXPLICAÇÃO)
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite", // Versão estável recomendada
            systemInstruction: `Você é o Sentinela-Bash IA. 
            Sua resposta deve ser estritamente curta:
            1. O comando Bash em um bloco de código markdown.
            2. Uma explicação simples de uma única linha logo abaixo.
            Não use introduções, conclusões ou explicações detalhadas de parâmetros.`
        });

        const result = await model.generateContent(prompt);
        const respostaTexto = result.response.text();

        // Salvar no Firestore se disponível
        if (db) {
            db.collection("historico").add({
                usuario_query: prompt,
                ia_resposta: respostaTexto,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                versao: "2.3-sentinela"
            }).catch(e => console.error("Erro Firestore:", e.message));
        }

        res.json({ resposta: respostaTexto });
    } catch (e) {
        console.error("❌ ERRO GEMINI:", e.message);
        res.status(500).json({ error: "Erro na Unidade de Processamento de IA" });
    }
});

app.listen(PORT, () => console.log(`✅ Sentinela-Bash v2.3 rodando na porta ${PORT}`));

// Keep-alive: Evita que o Render hiberne (ping a cada 14 min)
setInterval(() => {
    axios.get(`https://bash-search-backend.onrender.com/ping`).catch(() => {});
}, 840000);

// Listener em tempo real (Debug no Console)
if (db) {
    db.collection("historico")
      .orderBy("timestamp", "desc")
      .limit(1)
      .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
              if (change.type === "added") {
                  const data = change.doc.data();
                  console.log(`\n🤖 [SENTINELA] Nova interação registrada: "${data.usuario_query.substring(0, 30)}..."`);
              }
          });
      });
}
