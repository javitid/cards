# Scripts

Este directorio contiene utilidades operativas para Firestore, migraciones y despliegues auxiliares.

## Scripts disponibles

### Validacion y migracion

- `npm run migrate:validate`
  - Valida acceso a Firebase y al origen de datos de migracion.
- `npm run migrate:mongodb-to-firestore`
  - Migra colecciones desde MongoDB Realm/Data API a Firestore.
- `npm run migrate:atlas-to-firestore`
  - Migra directamente desde MongoDB Atlas.

### Seeds de datos

- `npm run seed:firestore-levels`
  - Copia documentos desde una coleccion legacy origen a otras colecciones legacy.
  - Uso tipico: replicar `easy` en `medium` y `hard`.

- `npm run seed:firestore-games`
  - Reemplaza el contenido de:
    - `games/synonyms/levels/easy|medium|hard/cards`
    - `games/antonyms/levels/easy|medium|hard/cards`
  - Sube actualmente:
    - `102` pares de sinonimos por nivel
    - `101` pares de antonimos por nivel

## Prerrequisitos

1. Tener dependencias instaladas:

```bash
npm install
```

2. Autenticacion con Firebase usando una de estas opciones:
- `firebase login`
- o `FIREBASE_SERVICE_KEY=/ruta/absoluta/key.json`

3. Si se usa service account local, puede colocarse en:
- `scripts/firebase-service-key.json`

## Variables de entorno comunes

- `FIREBASE_SERVICE_KEY`
- `FIREBASE_PROJECT_ID`

## Uso de `seed:firestore-levels`

Variables soportadas:
- `SOURCE_COLLECTION`
- `TARGET_COLLECTIONS`
- `DOCS_PER_LEVEL`
- `FIREBASE_PROJECT_ID`

Ejemplo:

```bash
SOURCE_COLLECTION=easy \
TARGET_COLLECTIONS=medium,hard \
DOCS_PER_LEVEL=100 \
FIREBASE_PROJECT_ID=cards-429a4 \
npm run seed:firestore-levels
```

## Uso de `seed:firestore-games`

Variables soportadas:
- `TARGET_LEVELS`
- `FIREBASE_PROJECT_ID`

Ejemplo:

```bash
TARGET_LEVELS=easy,medium,hard \
FIREBASE_PROJECT_ID=cards-429a4 \
npm run seed:firestore-games
```

Comportamiento:
- borra los documentos existentes de las colecciones objetivo
- escribe documentos nuevos con IDs estables
- usa Admin SDK si hay service account y, si no, usa REST con el token de `firebase-tools`

## Migracion desde MongoDB Realm/Data API

Variables relevantes:
- `MONGODB_REALM_API_KEY`
- `MONGODB_REALM_BEARER_URL`
- `MONGODB_REALM_FIND_URL`
- `MONGODB_DATASOURCE`
- `MONGODB_DATABASE`
- `MONGO_COLLECTIONS`

Ejemplo:

```bash
MONGODB_REALM_API_KEY='your_key' \
FIREBASE_PROJECT_ID='cards-429a4' \
npm run migrate:mongodb-to-firestore
```

## Migracion directa desde MongoDB Atlas

Opcion A:

```bash
MONGODB_URI='mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority' \
MONGODB_DB='cards' \
FIREBASE_PROJECT_ID='cards-429a4' \
npm run migrate:atlas-to-firestore
```

Opcion B:

```bash
MONGODB_USER='user' \
MONGODB_PASSWORD='pass' \
MONGODB_HOST='cluster0.xxxxx.mongodb.net' \
MONGODB_OPTIONS='retryWrites=true&w=majority' \
FIREBASE_PROJECT_ID='cards-429a4' \
npm run migrate:atlas-to-firestore
```

## Notas operativas

- No versionar service accounts ni secretos reales.
- `.local/` y `environment.local.ts` deben permanecer fuera de git.
- Los seeds de `synonyms` y `antonyms` estan pensados para poder relanzarse sin duplicados.
