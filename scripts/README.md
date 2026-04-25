# Migration Scripts (MongoDB -> Firestore)

These scripts are reused from `awstests` and adapted for `cards`.

## Scripts

- `npm run migrate:validate`
  - Validates Firebase service key + MongoDB Realm/Data API access.
- `npm run migrate:mongodb-to-firestore`
  - Migrates collections from MongoDB Realm/Data API to Firestore.
- `npm run migrate:atlas-to-firestore`
  - Migrates directly from MongoDB Atlas using `mongodb+srv`.

## Prerequisites

1. Place Firebase service account key in:
   - `scripts/firebase-service-key.json`
   - Or set `FIREBASE_SERVICE_KEY=/absolute/path/key.json`
2. Install dependencies:
   - `npm install`

## Common environment variables

- `FIREBASE_SERVICE_KEY`
- `FIREBASE_PROJECT_ID`
- `MONGODB_DATABASE` (default: `cards`)
- `MONGO_COLLECTIONS` (default: `easy,prueba`)

### For Realm/Data API migration

- `MONGODB_REALM_API_KEY` (required)
- `MONGODB_REALM_BEARER_URL`
- `MONGODB_REALM_FIND_URL`
- `MONGODB_DATASOURCE` (default: `Cluster0`)

Example:

```bash
MONGODB_REALM_API_KEY='your_key' \
FIREBASE_PROJECT_ID='cards-429a4' \
npm run migrate:mongodb-to-firestore
```

### For Atlas direct migration

Option A:

```bash
MONGODB_URI='mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority' \
MONGODB_DB='cards' \
FIREBASE_PROJECT_ID='cards-429a4' \
npm run migrate:atlas-to-firestore
```

Option B:

```bash
MONGODB_USER='user' \
MONGODB_PASSWORD='pass' \
MONGODB_HOST='cluster0.xxxxx.mongodb.net' \
MONGODB_OPTIONS='retryWrites=true&w=majority' \
FIREBASE_PROJECT_ID='cards-429a4' \
npm run migrate:atlas-to-firestore
```
