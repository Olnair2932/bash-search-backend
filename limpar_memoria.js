const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function purgeOldLogs() {
    const colRef = db.collection('historico');
    const snapshot = await colRef.orderBy('timestamp', 'asc').get();
    const docs = snapshot.docs;
    const LIMIT = 50; 

    if (docs.length > LIMIT) {
        const toDelete = docs.slice(0, docs.length - LIMIT);
        console.log(`[SRE] Purga iniciada: Removendo ${toDelete.length} registros antigos...`);
        const batch = db.batch();
        toDelete.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log("✅ Purga concluída.");
    } else {
        console.log("✅ Memória estável.");
    }
}
purgeOldLogs().catch(console.error);
