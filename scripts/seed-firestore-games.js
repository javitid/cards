#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const os = require('os');
const path = require('path');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'cards-429a4';
const LEVELS = (process.env.TARGET_LEVELS || 'easy,medium,hard')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const GAMES_COLLECTION = 'games';

const SYNONYM_PAIRS = [
  ['alegre', 'contento'],
  ['triste', 'apenado'],
  ['bonito', 'hermoso'],
  ['feo', 'horrible'],
  ['grande', 'enorme'],
  ['pequeno', 'chico'],
  ['rapido', 'veloz'],
  ['lento', 'pausado'],
  ['facil', 'sencillo'],
  ['dificil', 'complicado'],
  ['empezar', 'comenzar'],
  ['terminar', 'acabar'],
  ['hablar', 'conversar'],
  ['mirar', 'observar'],
  ['escuchar', 'oir'],
  ['andar', 'caminar'],
  ['correr', 'trotar'],
  ['saltar', 'brincar'],
  ['enojado', 'molesto'],
  ['calmado', 'sereno'],
  ['fuerte', 'robusto'],
  ['debil', 'fragil'],
  ['listo', 'inteligente'],
  ['torpe', 'patoso'],
  ['amable', 'cortes'],
  ['grosero', 'descortes'],
  ['amigo', 'companero'],
  ['enemigo', 'rival'],
  ['casa', 'hogar'],
  ['coche', 'automovil'],
  ['trabajo', 'empleo'],
  ['dinero', 'plata'],
  ['regalo', 'obsequio'],
  ['error', 'fallo'],
  ['miedo', 'temor'],
  ['ruido', 'estruendo'],
  ['silencio', 'calma'],
  ['ropa', 'vestimenta'],
  ['comida', 'alimento'],
  ['bebida', 'refresco'],
  ['cansado', 'fatigado'],
  ['sano', 'saludable'],
  ['enfermo', 'indispuesto'],
  ['limpio', 'aseado'],
  ['sucio', 'manchado'],
  ['carino', 'afecto'],
  ['beso', 'osculo'],
  ['ayuda', 'apoyo'],
  ['idea', 'ocurrencia'],
  ['viaje', 'recorrido'],
  ['camino', 'sendero'],
  ['bosque', 'selva'],
  ['playa', 'costa'],
  ['montana', 'sierra'],
  ['mar', 'oceano'],
  ['rio', 'corriente'],
  ['nube', 'neblina'],
  ['lluvia', 'aguacero'],
  ['viento', 'brisa'],
  ['fuego', 'llama'],
  ['luz', 'claridad'],
  ['oscuro', 'sombrio'],
  ['nuevo', 'reciente'],
  ['viejo', 'antiguo'],
  ['rico', 'adinerado'],
  ['pobre', 'necesitado'],
  ['feliz', 'dichoso'],
  ['valiente', 'audaz'],
  ['cobarde', 'miedoso'],
  ['verdad', 'certeza'],
  ['mentira', 'engano'],
  ['pregunta', 'consulta'],
  ['respuesta', 'contestacion'],
  ['escuela', 'colegio'],
  ['maestro', 'profesor'],
  ['alumno', 'estudiante'],
  ['tarea', 'deber'],
  ['descanso', 'reposo'],
  ['sueno', 'somnolencia'],
  ['hambre', 'apetito'],
  ['sed', 'ansia'],
  ['dulce', 'azucarado'],
  ['salado', 'sazonado'],
  ['frio', 'helado'],
  ['caliente', 'ardiente'],
  ['cerrado', 'clausurado'],
  ['abierto', 'despejado'],
  ['subir', 'ascender'],
  ['bajar', 'descender'],
  ['comprar', 'adquirir'],
  ['vender', 'comerciar'],
  ['romper', 'quebrar'],
  ['unir', 'juntar'],
  ['guardar', 'almacenar'],
  ['lanzar', 'arrojar'],
  ['elegir', 'escoger'],
  ['mandar', 'ordenar'],
  ['buscar', 'indagar'],
  ['hallar', 'encontrar'],
  ['usar', 'emplear'],
  ['crear', 'fabricar'],
  ['cuidar', 'proteger']
];

const ANTONYM_PAIRS = [
  ['alto', 'bajo'],
  ['grande', 'pequeno'],
  ['rapido', 'lento'],
  ['encender', 'apagar'],
  ['entrar', 'salir'],
  ['feliz', 'triste'],
  ['cerca', 'lejos'],
  ['fuerte', 'debil'],
  ['limpio', 'sucio'],
  ['nuevo', 'viejo'],
  ['abrir', 'cerrar'],
  ['subir', 'bajar'],
  ['dia', 'noche'],
  ['blanco', 'negro'],
  ['caliente', 'frio'],
  ['claro', 'oscuro'],
  ['duro', 'blando'],
  ['facil', 'dificil'],
  ['verdad', 'mentira'],
  ['rico', 'pobre'],
  ['lleno', 'vacio'],
  ['inicio', 'final'],
  ['amor', 'odio'],
  ['orden', 'caos'],
  ['ruido', 'silencio'],
  ['gordo', 'delgado'],
  ['ancho', 'estrecho'],
  ['largo', 'corto'],
  ['vivo', 'muerto'],
  ['joven', 'anciano'],
  ['valiente', 'cobarde'],
  ['seguro', 'peligroso'],
  ['dulce', 'amargo'],
  ['salado', 'soso'],
  ['mojado', 'seco'],
  ['tranquilo', 'nervioso'],
  ['arriba', 'abajo'],
  ['izquierda', 'derecha'],
  ['dentro', 'fuera'],
  ['antes', 'despues'],
  ['pronto', 'tarde'],
  ['ganar', 'perder'],
  ['comprar', 'vender'],
  ['dar', 'recibir'],
  ['reir', 'llorar'],
  ['recordar', 'olvidar'],
  ['aceptar', 'rechazar'],
  ['unir', 'separar'],
  ['construir', 'destruir'],
  ['crear', 'borrar'],
  ['empezar', 'terminar'],
  ['nacer', 'morir'],
  ['subida', 'bajada'],
  ['entrada', 'salida'],
  ['pregunta', 'respuesta'],
  ['curvo', 'recto'],
  ['cuerdo', 'loco'],
  ['libre', 'ocupado'],
  ['encima', 'debajo'],
  ['cansado', 'descansado'],
  ['despierto', 'dormido'],
  ['amigo', 'enemigo'],
  ['presente', 'ausente'],
  ['publico', 'privado'],
  ['interno', 'externo'],
  ['simple', 'complejo'],
  ['local', 'global'],
  ['subjetivo', 'objetivo'],
  ['legal', 'ilegal'],
  ['posible', 'imposible'],
  ['normal', 'raro'],
  ['falso', 'autentico'],
  ['completo', 'incompleto'],
  ['correcto', 'incorrecto'],
  ['positivo', 'negativo'],
  ['sumar', 'restar'],
  ['aparecer', 'desaparecer'],
  ['aprobar', 'suspender'],
  ['avanzar', 'retroceder'],
  ['empujar', 'tirar'],
  ['superior', 'inferior'],
  ['amable', 'grosero'],
  ['alegre', 'deprimido'],
  ['humedo', 'arido'],
  ['transparente', 'opaco'],
  ['profundo', 'superficial'],
  ['fino', 'grueso'],
  ['abundante', 'escaso'],
  ['generoso', 'tacano'],
  ['obediente', 'rebelde'],
  ['pacifico', 'violento'],
  ['visible', 'oculto'],
  ['ligero', 'pesado'],
  ['cerrado', 'abierto'],
  ['presionar', 'soltar'],
  ['encoger', 'estirar'],
  ['subestimar', 'sobrevalorar'],
  ['permitir', 'prohibir'],
  ['apoyar', 'oponer'],
  ['inspirar', 'espirar'],
  ['acercar', 'alejar']
];

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

function buildPairDocs(pairs) {
  return pairs.map(([left, right]) => ({ icon: '', left, right }));
}

function targetPath(gameId, level) {
  return `${GAMES_COLLECTION}/${gameId}/levels/${level}/cards`;
}

async function replaceCollectionAdmin(firestore, collectionPath, docs, prefix) {
  const collectionRef = firestore.collection(collectionPath);
  const existingSnapshot = await collectionRef.get();

  if (!existingSnapshot.empty) {
    let deleteBatch = firestore.batch();
    let deleteCount = 0;

    for (const documentSnapshot of existingSnapshot.docs) {
      deleteBatch.delete(documentSnapshot.ref);
      deleteCount += 1;

      if (deleteCount % 400 === 0) {
        await deleteBatch.commit();
        deleteBatch = firestore.batch();
      }
    }

    if (deleteCount % 400 !== 0) {
      await deleteBatch.commit();
    }
  }

  for (let i = 0; i < docs.length; i += 400) {
    const batch = firestore.batch();
    const chunk = docs.slice(i, i + 400);

    chunk.forEach((docData, chunkIndex) => {
      batch.set(collectionRef.doc(`${prefix}-${i + chunkIndex + 1}`), docData);
    });

    await batch.commit();
  }
}

function toFirestoreFields(document) {
  return Object.fromEntries(
    Object.entries(document).map(([key, value]) => [key, { stringValue: String(value) }])
  );
}

async function listDocumentsRest(accessToken, collectionPath) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionPath}?pageSize=500`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Could not list ${collectionPath} via REST (HTTP ${response.status}).`);
  }

  const payload = await response.json();
  return payload.documents || [];
}

async function commitWritesRest(accessToken, writes) {
  if (!writes.length) {
    return;
  }

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
    throw new Error(`Could not commit Firestore writes via REST (HTTP ${response.status}).`);
  }
}

async function replaceCollectionRest(accessToken, collectionPath, docs, prefix) {
  const existingDocuments = await listDocumentsRest(accessToken, collectionPath);
  const deleteWrites = existingDocuments.map((document) => ({ delete: document.name }));

  for (let i = 0; i < deleteWrites.length; i += 200) {
    await commitWritesRest(accessToken, deleteWrites.slice(i, i + 200));
  }

  const updateWrites = docs.map((docData, index) => ({
    update: {
      name: `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionPath}/${prefix}-${index + 1}`,
      fields: toFirestoreFields(docData)
    }
  }));

  for (let i = 0; i < updateWrites.length; i += 200) {
    await commitWritesRest(accessToken, updateWrites.slice(i, i + 200));
  }
}

async function seedGame(firestore, accessToken, gameId, docs, prefix) {
  console.log(`\nSeeding ${gameId} (${docs.length} pares por nivel)`);

  for (const level of LEVELS) {
    const collectionPath = targetPath(gameId, level);
    process.stdout.write(`- ${collectionPath.padEnd(40)} `);

    if (firestore) {
      await replaceCollectionAdmin(firestore, collectionPath, docs, prefix);
    } else {
      await replaceCollectionRest(accessToken, collectionPath, docs, prefix);
    }

    console.log(`OK (${docs.length})`);
  }
}

async function seedGames() {
  const firestore = initializeFirestoreAdmin();
  const accessToken = firestore ? null : getFirebaseToolsAccessToken();

  try {
    await seedGame(firestore, accessToken, 'synonyms', buildPairDocs(SYNONYM_PAIRS), 'synonyms');
    await seedGame(firestore, accessToken, 'antonyms', buildPairDocs(ANTONYM_PAIRS), 'antonyms');
    console.log('\nFirestore game seeding completed.\n');
  } finally {
    if (admin.apps.length) {
      await admin.app().delete();
    }
  }
}

if (require.main === module) {
  seedGames().catch((error) => {
    console.error('\nGame seeding failed:', error.message);
    process.exit(1);
  });
}
