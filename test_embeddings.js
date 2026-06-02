const { GoogleGenerativeAI } = require("@google/generative-ai");

async function runTest() {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    console.log("--- INICIANDO DIAGNÓSTICO SRE ---");
    console.log("Status da API Key:", apiKey ? "Presente (Primeiros 4 chars: " + apiKey.substring(0,4) + "...)" : "AUSENTE");

    if (!apiKey) {
        console.error("ERRO: Variável GOOGLE_API_KEY não configurada no shell.");
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        console.log("Enviando requisição para text-embedding-004...");
        const result = await model.embedContent("Sentinela Core teste de prontidão");

        if (result && result.embedding) {
            console.log("✅ SUCESSO!");
            console.log("Dimensões do vetor:", result.embedding.values.length);
            console.log("Dados do vetor:", result.embedding.values.slice(0, 3), "...");
        } else {
            console.error("ERRO: Estrutura de resposta inesperada:", JSON.stringify(result, null, 2));
        }

    } catch (err) {
        console.error("❌ FALHA NA COMUNICAÇÃO COM API:");
        if (err.errorDetails) {
            console.error("Detalhes:", JSON.stringify(err.errorDetails, null, 2));
        } else {
            console.error("Mensagem:", err.message);
        }
    }
}

runTest();
