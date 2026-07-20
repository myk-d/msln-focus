import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestoreDb = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Flat top-level collections, scoped per user via a `userId` field (see
// useFirestoreCollection) rather than per-user subcollection paths — this
// lets FirebaseFactory's existing `.query()` do the scoping unmodified.
// pomodoroSettings/pomodoroStats are singleton docs instead, keyed by uid.
export const firebaseCollections = {
	users: 'users',
	lists: 'lists',
	sections: 'sections',
	tasks: 'tasks',
	tags: 'tags',
	pomodoroPresets: 'pomodoroPresets',
	events: 'events',
	pomodoroSettings: 'pomodoroSettings',
	pomodoroStats: 'pomodoroStats',
};
