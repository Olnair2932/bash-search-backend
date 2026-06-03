const admin = require('firebase-admin');
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
      console.log(`[SRE] Purga realizada. ${toDelete.length} documentos removidos.`);
    } else {
      console.log("[SRE] Memória dentro dos limites (limite de 40).");
    }
  } catch (error) {
    console.error("[SRE] Falha na purga:", error.message);
  } finally {
    process.exit();
  }
}
purge();
