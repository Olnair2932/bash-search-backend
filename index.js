const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const express = require("express");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Sentinela v3.2 - Servidor Ativo"));

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
  setInterval(() => {
    https.get("https://sentinela-v3.onrender.com/", (res) => {
      console.log("Keep-Alive ok");
    }).on('error', (e) => console.log("Erro ping"));
  }, 480000);
});

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://minhaiamemoria-default-rtdb.firebaseio.com"
});

const db = admin.database();
const fs = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function processarComFailover(texto, historico, instrucao) {
  const modelos = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-lite"];
  
  for (const nome of modelos) {
    try {
      console.log("Tentando modelo: " + nome);
      const model = genAI.getGenerativeModel({ model: nome, systemInstruction: instrucao });

      if (historico && historico.length > 0) {
        const chat = model.startChat({ history: historico });
        const result = await chat.sendMessage(texto);
        return result.response.text();
      } else {
        const result = await model.generateContent(texto);
        return result.response.text();
      }
    } catch (erro) {
      console.log("Erro no modelo " + nome + ": " + erro.message);
      if (nome === "gemini-2.0-flash-lite") throw erro;
    }
  }
}

db.ref("fila_entrada").on("child_added", async (snapshot) => {
  const data = snapshot.val();
  const id = snapshot.key;
  if (!data || !data.texto) { await snapshot.ref.remove(); return; }

  try {
    const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const instrucao = "Voce e o Sentinela v3.2, assistente de Olnair Pereira. Hoje e " + agora;

    const historySnap = await db.ref("memoria/olnair_fixed").limitToLast(15).once("value");
    const history = [];
    historySnap.forEach(snap => {
      const m = snap.val();
      history.push({ role: m.role === "assistant" ? "model" : m.role, parts: [{ text: m.texto }] });
    });

    const resposta = await processarComFailover(data.texto, history, instrucao);

    await db.ref("memoria/olnair_fixed").push({ role: "user", texto: data.texto, timestamp: Date.now() });
    await db.ref("memoria/olnair_fixed").push({ role: "model", texto: resposta, timestamp: Date.now() });
    await db.ref("respostas/" + id).set({ texto: resposta, data: Date.now() });
    await snapshot.ref.remove();

    await fs.collection("historico").add({ pergunta: data.texto, resposta: resposta, data: admin.firestore.FieldValue.serverTimestamp() });
  } catch (err) {
    console.log("Erro geral Sentinela");
    await snapshot.ref.remove();
  }
});

db.ref("fila_comandos").on("child_added", async (snapshot) => {
  const data = snapshot.val();
  const id = snapshot.key;
  if (!data || !data.texto) { await snapshot.ref.remove(); return; }

  try {
    const resposta = await processarComFailover(data.texto, [], "Voce e especialista em Bash.");
    await db.ref("respostas_comandos/" + id).set({ texto: resposta, data: Date.now() });
    await snapshot.ref.remove();
  } catch (e) {
    await snapshot.ref.remove();
  }
});
