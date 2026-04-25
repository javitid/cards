#!/usr/bin/env node

/**
 * Direct migration from MongoDB Atlas to Firestore.
 *
 * Usage (A):
 * MONGODB_URI='mongodb+srv://...' \
 * MONGODB_DB='cards' \
 * FIREBASE_SERVICE_KEY='./scripts/firebase-service-key.json' \
 * npm run migrate:atlas-to-firestore
 *
 * Usage (B):
 * MONGODB_USER='your_user' \
 * MONGODB_PASSWORD='your_password' \
 * npm run migrate:atlas-to-firestore
 */

const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const DEFAULT_COLLECTIONS = ['easy', 'prueba'];

function getConfig() {
  const serviceKeyPath = process.env.FIREBASE_SERVICE_KEY
    ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_KEY)
    : path.join(__dirname, 'firebase-service-key.json');

  const collections = process.env.MONGO_COLLECTIONS
    ? process.env.MONGO_COLLECTIONS.split(',').map((x) => x.trim()).filter(Boolean)
    : DEFAULT_COLLECTIONS;

  const config = {
    mongodbUri: buildMongoUri(),
    mongodbDb: process.env.MONGODB_DB || 'cards',
    collections,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    serviceKeyPath,
  };

  if (!config.mongodbUri) {
    throw new Error('Missing MongoDB config. Set MONGODB_URI or set MONGODB_USER and MONGODB_PASSWORD.');
  }

  if (!fs.existsSync(config.serviceKeyPath)) {
    throw new Error(
      `Firebase service key not found at ${config.serviceKeyPath}. ` +
      'Set FIREBASE_SERVICE_KEY or place scripts/firebase-service-key.json.'
    );
  }

  return config;
}

function buildMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const user = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;

  if (!user || !password) {
    return '';
  }

  const host = process.env.MONGODB_HOST || 'cluster0.fzaja.mongodb.net';
  const options = process.env.MONGODB_OPTIONS || 'appName=Cluster0';
  const safeUser = encodeURIComponent(user);
  const safePassword = encodeURIComponent(password);

  return `mongodb+srv://${safeUser}:${safePassword}@${host}/?${options}`;
}

function initializeFirebase(serviceKeyPath, projectId) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(projectId ? { projectId } : {}),
  });
  return admin.firestore();
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
      const doc = rawDoc && typeof rawDoc.toObject === 'function' ? rawDoc.toObject() : { ...rawDoc };
      const mongoId = doc && doc._id ? String(doc._id) : undefined;
      const docId = mongoId || `${collectionName}_${i}_${written}`;
      delete doc._id;
      batch.set(firestore.collection(collectionName).doc(docId), doc);
      written += 1;
    }

    await batch.commit();
  }

  return written;
}

async function migrateAtlasToFirestore() {
  const config = getConfig();

  console.log('\nStarting Atlas -> Firestore migration\n');
  console.log(`MongoDB DB: ${config.mongodbDb}`);
  console.log(`Collections: ${config.collections.join(', ')}`);
  console.log('');

  const firestore = initializeFirebase(config.serviceKeyPath, config.firebaseProjectId);
  const mongoClient = new MongoClient(config.mongodbUri);

  let totalDocs = 0;
  let okCollections = 0;

  try {
    await mongoClient.connect();
    const db = mongoClient.db(config.mongodbDb);

    for (const collectionName of config.collections) {
      process.stdout.write(`- ${collectionName.padEnd(24)} `);
      try {
        const collection = db.collection(collectionName);
        const docs = await collection.find({}).toArray();
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
    await mongoClient.close();
    await admin.app().delete();
  }
}

if (require.main === module) {
  migrateAtlasToFirestore().catch((error) => {
    console.error('\nMigration failed:', error.message);
    process.exit(1);
  });
}

module.exports = { migrateAtlasToFirestore };
