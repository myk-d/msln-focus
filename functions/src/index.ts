import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from './app.js';
import { firestoreStore } from './lib/firestore-store.js';

// Ключ для агентів: firebase functions:secrets:set FOCUS_API_KEY
const apiKey = defineSecret('FOCUS_API_KEY');
// uid власника (Firebase Console → Authentication → Users). Задається в functions/.env (не в git).
const ownerUid = defineString('FOCUS_OWNER_UID');

initializeApp();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

let app: ReturnType<typeof createApp> | undefined;

export const api = onRequest({ region: 'europe-west1', secrets: [apiKey], cors: false, maxInstances: 3 }, (req, res) => {
	app ??= createApp(firestoreStore(db, ownerUid.value()), () => apiKey.value());
	app(req, res);
});
