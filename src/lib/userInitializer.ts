import { doc, getDoc, setDoc, where } from 'firebase/firestore';
import { firestoreDb, firebaseCollections } from '../config/firebase.config';
import { FirebaseFactory } from '../config/firebase.factory';
import i18n from '../i18n';
import { genId } from './utils';
import type { TaskList, Section, PomodoroPreset } from '../types';

type WithUser<T> = T & { userId: string };

export async function ensureUserInitialized(uid: string): Promise<void> {
  const userDocRef = doc(firestoreDb, firebaseCollections.users, uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    // User already exists in DB — skip seed data execution
    return;
  }

  // Backwards compatibility check for existing users created prior to the `users` collection:
  const listsFactory = new FirebaseFactory<WithUser<TaskList>>(firestoreDb, firebaseCollections.lists);
  const existingLists = await listsFactory.query(where('userId', '==', uid));

  if (existingLists.length > 0) {
    await setDoc(userDocRef, { createdAt: Date.now(), isInitialized: true });
    return;
  }

  const presetsFactory = new FirebaseFactory<WithUser<PomodoroPreset>>(firestoreDb, firebaseCollections.pomodoroPresets);
  const existingPresets = await presetsFactory.query(where('userId', '==', uid));

  if (existingPresets.length > 0) {
    await setDoc(userDocRef, { createdAt: Date.now(), isInitialized: true });
    return;
  }

  // User does NOT exist in DB — FIRST LOGIN! Execute seed data creation.
  const now = Date.now();
  const listId = genId();
  const sectionId = genId();

  const sectionsFactory = new FirebaseFactory<WithUser<Section>>(firestoreDb, firebaseCollections.sections);

  const seedList: WithUser<TaskList> = {
    id: listId,
    name: i18n.t('tasks.defaultListName'),
    isDefault: true,
    createdAt: now,
    groupBy: 'sequence',
    sortBy: 'sequence',
    userId: uid,
  };

  const seedSection: WithUser<Section> = {
    id: sectionId,
    listId,
    name: i18n.t('tasks.defaultSectionName'),
    order: 0,
    createdAt: now,
    userId: uid,
  };

  const seedPresetsList: WithUser<PomodoroPreset>[] = [
    {
      id: 'preset-classic',
      name: i18n.t('pomodoro.classicPresetName'),
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
      autoStartNext: true,
      createdAt: 0,
      userId: uid,
    },
    {
      id: 'preset-deep-work',
      name: i18n.t('pomodoro.deepWorkPresetName'),
      focusMinutes: 50,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      sessionsBeforeLongBreak: 3,
      autoStartNext: true,
      createdAt: 0,
      userId: uid,
    },
  ];

  await Promise.all([
    listsFactory.create(seedList),
    sectionsFactory.create(seedSection),
    ...seedPresetsList.map((p) => presetsFactory.create(p)),
  ]);

  await setDoc(userDocRef, { createdAt: now, isInitialized: true });
}
