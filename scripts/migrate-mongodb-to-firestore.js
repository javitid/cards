#!/usr/bin/env node

/**
 * MongoDB Realm/Data API -> Firestore migration.
 *
 * Usage:
 *   MONGODB_REALM_API_KEY='...' npm run migrate:mongodb-to-firestore
 *
 * Optional env vars:
 * - MONGODB_REALM_BEARER_URL
 * - MONGODB_REALM_FIND_URL
 * - MONGODB_DATABASE (default: cards)
 * - MONGO_COLLECTIONS (default: easy,prueba)
 * - MONGODB_DATASOURCE (default: Cluster0)
 * - FIREBASE_SERVICE_KEY (default: scripts/firebase-service-key.json)
 * - FIREBASE_PROJECT_ID
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const DEFAULT_COLLECTIONS = ['easy', 'prueba'];

function getConfig() {
  const apiKey = process.env.MONGODB_REALM_API_KEY;
  if (!apiKey) {
    throw new Error('Missing MONGODB_REALM_API_KEY');
  }

  const serviceKeyPath = process.env.FIREBASE_SERVICE_KEY
    ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_KEY)
    : path.join(__dirname, 'firebase-service-key.json');

  if (!fs.existsSync(serviceKeyPath)) {
    throw new Error(
      `Firebase service key not found at ${serviceKeyPath}. ` +
      'Set FIREBASE_SERVICE_KEY or place scripts/firebase-service-key.json.'
    );
  }

  const collections = process.env.MONGO_COLLECTIONS
    ? process.env.MONGO_COLLECTIONS.split(',').map((x) => x.trim()).filter(Boolean)
    : DEFAULT_COLLECTIONS;

  return {
    apiKey,
    urlBearerToken:
      process.env.MONGODB_REALM_BEARER_URL ||
      'https://eu-west-2.aws.realm.mongodb.com/api/client/v2.0/app/data-iuwtk/auth/providers/api-key/login',
    urlFind:
      process.env.MONGODB_REALM_FIND_URL ||
      'https://eu-west-2.aws.data.mongodb-api.com/app/data-iuwtk/endpoint/data/v1/action/find',
    dataSource: process.env.MONGODB_DATASOURCE || 'Cluster0',
    database: process.env.MONGODB_DATABASE || 'cards',
    collections,
    serviceKeyPath,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  };
}

function initializeFirebase(serviceKeyPath, projectId) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(projectId ? { projectId } : {}),
  });
  return admin.firestore();
}

async function getMongoDBToken(config) {
  const response = await fetch(config.urlBearerToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: config.apiKey }),
  });

  if (!response.ok) {
    throw new Error(`Could not get MongoDB token (HTTP ${response.status})`);
  }

  const data = await response.json();
  return `Bearer ${data.access_token}`;
}

async function downloadFromMongoDB(config, collectionName, token) {
  const requestBody = {
    dataSource: config.dataSource,
    database: config.database,
    collection: collectionName,
  };

  const response = await fetch(config.urlFind, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Download failed for ${collectionName} (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.documents || [];
}

async function writeInBatches(firestore, collectionName, docs) {
  if (!docs.length) {
    return 0;
  }

  const MAX_BATCH_SIZE = 450;
  let written = 0;

  for (let i = 0; i < docs.length; i += MAX_BATCH_SIZE) {
    const chunk = docs.slice(i, i + MAX_BATCH_SIZE);
    const batch = firestore.batch();

    for (const rawDoc of chunk) {
      const doc = { ...rawDoc };
      const mongoId = doc._id ? String(doc._id.$oid || doc._id) : undefined;
      const docId = mongoId || `${collectionName}_${i}_${written}`;
      delete doc._id;
      batch.set(firestore.collection(collectionName).doc(docId), doc);
      written += 1;
    }

    await batch.commit();
  }

  return written;
}

async function migrateMongoRealmToFirestore() {
  const config = getConfig();

  console.log('\nStarting MongoDB Realm -> Firestore migration\n');
  console.log(`MongoDB database: ${config.database}`);
  console.log(`Collections: ${config.collections.join(', ')}`);
  console.log('');

  const firestore = initializeFirebase(config.serviceKeyPath, config.firebaseProjectId);

  try {
    const token = await getMongoDBToken(config);
    let totalDocs = 0;
    let okCollections = 0;

    for (const collectionName of config.collections) {
      process.stdout.write(`- ${collectionName.padEnd(24)} `);
      try {
        const docs = await downloadFromMongoDB(config, collectionName, token);
        const count = await writeInBatches(firestore, collectionName, docs);
        totalDocs += count;
        okCollections += 1;
        console.log(`OK (${count})`);
      } catch (error) {
        console.log(`ERROR (${error.message})`);
      }
    }

    console.log('\nMigration finished');
    console.log(`Collections migrated: ${okCollections}/${config.collections.length}`);
    console.log(`Documents migrated: ${totalDocs}\n`);
  } finally {
    await admin.app().delete();
  }
}

if (require.main === module) {
  migrateMongoRealmToFirestore().catch((error) => {
    console.error('\nMigration failed:', error.message);
    process.exit(1);
  });
}

module.exports = { migrateMongoRealmToFirestore };
