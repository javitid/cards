#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SOURCE_COLLECTION = process.env.SOURCE_COLLECTION || 'easy';
const TARGET_COLLECTIONS = (process.env.TARGET_COLLECTIONS || 'medium,hard')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const DOCS_PER_LEVEL = Number(process.env.DOCS_PER_LEVEL || 100);
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'cards-429a4';

function getServiceKeyPath() {
  if (process.env.FIREBASE_SERVICE_KEY) {
    return path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_KEY);
  }

  return path.join(__dirname, 'firebase-service-key.json');
}

function getFirebaseToolsConfigPath() {
  return path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
}

function getFirebaseToolsAccessToken() {
  const configPath = getFirebaseToolsConfigPath();

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Firebase CLI auth config not found at ${configPath}. ` +
      'Run firebase login or provide FIREBASE_SERVICE_KEY.'
    );
  }

  const firebaseToolsConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const accessToken = firebaseToolsConfig?.tokens?.access_token;

  if (!accessToken) {
    throw new Error('firebase-tools access token not found. Run firebase login again or provide FIREBASE_SERVICE_KEY.');
  }

  return accessToken;
}

function initializeFirestoreAdmin() {
  const serviceKeyPath = getServiceKeyPath();

  if (!fs.existsSync(serviceKeyPath)) {
    return null;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(FIREBASE_PROJECT_ID ? { projectId: FIREBASE_PROJECT_ID } : {})
  });

  return admin.firestore();
}

async function readSourceDocsAdmin(firestore) {
  const snapshot = await firestore.collection(SOURCE_COLLECTION).limit(DOCS_PER_LEVEL).get();

  if (snapshot.empty) {
    throw new Error(`Source collection "${SOURCE_COLLECTION}" returned no documents.`);
  }

  return snapshot.docs.map((docSnapshot) => docSnapshot.data());
}

async function writeCollectionAdmin(firestore, targetCollection, sourceDocs) {
  const maxBatchSize = 450;

  for (let i = 0; i < sourceDocs.length; i += maxBatchSize) {
    const chunk = sourceDocs.slice(i, i + maxBatchSize);
    const batch = firestore.batch();

    chunk.forEach((sourceDoc, chunkIndex) => {
      const docRef = firestore.collection(targetCollection).doc(`${targetCollection}-${i + chunkIndex + 1}`);
      batch.set(docRef, sourceDoc);
    });

    await batch.commit();
  }
}

async function readSourceDocsRest(accessToken) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${SOURCE_COLLECTION}?pageSize=${DOCS_PER_LEVEL}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Could not read source collection via REST (HTTP ${response.status}).`);
  }

  const data = await response.json();
  const documents = data.documents || [];

  if (!documents.length) {
    throw new Error(`Source collection "${SOURCE_COLLECTION}" returned no documents.`);
  }

  return documents.map((document) => document.fields || {});
}

async function writeCollectionRest(accessToken, targetCollection, sourceDocs) {
  const maxBatchSize = 200;

  for (let i = 0; i < sourceDocs.length; i += maxBatchSize) {
    const chunk = sourceDocs.slice(i, i + maxBatchSize);
    const writes = chunk.map((fields, chunkIndex) => ({
      update: {
        name: `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${targetCollection}/${targetCollection}-${i + chunkIndex + 1}`,
        fields
      }
    }));

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ writes })
      }
    );

    if (!response.ok) {
      throw new Error(`Could not write ${targetCollection} via REST (HTTP ${response.status}).`);
    }
  }
}

async function seedLevels() {
  const firestore = initializeFirestoreAdmin();

  try {
    if (firestore) {
      const sourceDocs = await readSourceDocsAdmin(firestore);

      for (const targetCollection of TARGET_COLLECTIONS) {
        process.stdout.write(`- ${targetCollection.padEnd(12)} `);
        await writeCollectionAdmin(firestore, targetCollection, sourceDocs);
        console.log(`OK (${sourceDocs.length})`);
      }
    } else {
      const accessToken = getFirebaseToolsAccessToken();
      const sourceDocs = await readSourceDocsRest(accessToken);

      for (const targetCollection of TARGET_COLLECTIONS) {
        process.stdout.write(`- ${targetCollection.padEnd(12)} `);
        await writeCollectionRest(accessToken, targetCollection, sourceDocs);
        console.log(`OK (${sourceDocs.length})`);
      }
    }

    console.log('\nFirestore level seeding completed.\n');
  } finally {
    if (admin.apps.length) {
      await admin.app().delete();
    }
  }
}

if (require.main === module) {
  seedLevels().catch((error) => {
    console.error('\nLevel seeding failed:', error.message);
    process.exit(1);
  });
}
