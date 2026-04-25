#!/usr/bin/env node

/**
 * Validate credentials and connectivity before migration.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function getConfig() {
  return {
    apiKey: process.env.MONGODB_REALM_API_KEY || '',
    urlBearerToken:
      process.env.MONGODB_REALM_BEARER_URL ||
      'https://eu-west-2.aws.realm.mongodb.com/api/client/v2.0/app/data-iuwtk/auth/providers/api-key/login',
    urlFind:
      process.env.MONGODB_REALM_FIND_URL ||
      'https://eu-west-2.aws.data.mongodb-api.com/app/data-iuwtk/endpoint/data/v1/action/find',
    database: process.env.MONGODB_DATABASE || 'cards',
    dataSource: process.env.MONGODB_DATASOURCE || 'Cluster0',
    testCollection: process.env.MONGO_TEST_COLLECTION || 'easy',
    serviceKeyPath: process.env.FIREBASE_SERVICE_KEY
      ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_KEY)
      : path.join(__dirname, 'firebase-service-key.json'),
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  };
}

async function validateFirebase(config) {
  console.log('Validating Firebase...');

  if (!fs.existsSync(config.serviceKeyPath)) {
    console.log('ERROR: firebase-service-key.json not found');
    console.log('Set FIREBASE_SERVICE_KEY or place scripts/firebase-service-key.json\n');
    return false;
  }

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(config.serviceKeyPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      ...(config.firebaseProjectId ? { projectId: config.firebaseProjectId } : {}),
    });

    const firestore = admin.firestore();
    await firestore.collection('_test_').doc('_test_').set({ test: true });
    await firestore.collection('_test_').doc('_test_').delete();

    console.log('OK Firebase');
    await admin.app().delete();
    return true;
  } catch (error) {
    console.log(`ERROR Firebase: ${error.message}`);
    return false;
  }
}

async function validateMongoRealm(config) {
  console.log('Validating MongoDB Realm/Data API...');

  if (!config.apiKey) {
    console.log('ERROR: Missing MONGODB_REALM_API_KEY\n');
    return false;
  }

  try {
    const tokenResponse = await fetch(config.urlBearerToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: config.apiKey }),
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      if (tokenResponse.status === 410 || body.includes('have reached EOL')) {
        console.log('ERROR: MongoDB Realm EOL detected');
        console.log('Use: npm run migrate:atlas-to-firestore\n');
        return false;
      }
      throw new Error(`HTTP ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const token = `Bearer ${tokenData.access_token}`;

    const findResponse = await fetch(config.urlFind, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        dataSource: config.dataSource,
        database: config.database,
        collection: config.testCollection,
      }),
    });

    if (!findResponse.ok) {
      throw new Error(`HTTP ${findResponse.status}`);
    }

    const data = await findResponse.json();
    const count = (data.documents || []).length;
    console.log(`OK MongoDB Realm (${count} docs in ${config.testCollection})`);
    return true;
  } catch (error) {
    console.log(`ERROR MongoDB Realm: ${error.message}`);
    return false;
  }
}

async function validate() {
  const config = getConfig();
  console.log('\nMigration validation\n');

  const firebaseOk = await validateFirebase(config);
  const mongoOk = await validateMongoRealm(config);

  console.log('');
  if (firebaseOk && mongoOk) {
    console.log('All good. Run: npm run migrate:mongodb-to-firestore');
    process.exit(0);
  }

  console.log('Validation failed. Fix the errors above.');
  process.exit(1);
}

if (require.main === module) {
  validate().catch((error) => {
    console.error('Validation crashed:', error.message);
    process.exit(1);
  });
}
