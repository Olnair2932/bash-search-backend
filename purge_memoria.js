const admin = require('firebase-admin');
const fs = require('fs');

// Validação Crítica de Credenciais
if (!fs.existsSync('./serviceAccountKey.json')) {
    console.error("[CRITICAL] serviceAccountKey.json ausente. Abortando operação SRE.");
    process.exit(1);
}

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function purge() {
  try {
    const snapshot = await db.collection('historico').orderBy('timestamp', 'asc').get();
    const docs = snapshot.docs;
    const RETENTION_LIMIT = 40; 

    if (docs.length > RETENTION_LIMIT) {
      const batch = db.batch();
      const toDelete = docs.slice(0, docs.length - RETENTION_LIMIT);
      toDelete.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`✅ [SRE] Purga concluída. ${toDelete.length} registros removidos.`);
    } else {
      console.log("✅ [SRE] Memória nominal. (Abaixo do limite de 40).");
    }
  } catch (e) {
    console.error("❌ [SRE] Erro no Firestore:", e.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

purge();
