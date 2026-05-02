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

function buildGameDocsForAllLevels(docs) {
  return {
    easy: docs,
    medium: docs,
    hard: docs
  };
}

function buildEasyMathPairs(count = 100) {
  return Array.from({ length: count }, (_, index) => {
    const result = index + 11;

    if (index % 2 === 0) {
      const addend = (index % 8) + 2;
      return {
        icon: '',
        left: `${result - addend} + ${addend}`,
        right: String(result)
      };
    }

    const subtrahend = (index % 9) + 2;
    return {
      icon: '',
      left: `${result + subtrahend} - ${subtrahend}`,
      right: String(result)
    };
  });
}

function buildMediumMathPairs(count = 100) {
  return Array.from({ length: count }, (_, index) => {
    const result = index + 121;

    switch (index % 4) {
      case 0: {
        const factor = (index % 5) + 3;
        const quotient = Math.floor(result / factor);
        const remainder = result - (factor * quotient);

        return {
          icon: '',
          left: `${factor} x ${quotient} + ${remainder}`,
          right: String(result)
        };
      }
      case 1: {
        const multiplier = (index % 4) + 2;
        let adjustment = multiplier - (result % multiplier);

        if (adjustment === multiplier) {
          adjustment = multiplier;
        }

        const grouped = (result + adjustment) / multiplier;
        const left = Math.floor(grouped / 2);
        const right = grouped - left;

        return {
          icon: '',
          left: `(${left} + ${right}) x ${multiplier} - ${adjustment}`,
          right: String(result)
        };
      }
      case 2: {
        const factor = (index % 6) + 4;
        const quotient = Math.ceil(result / factor);
        const difference = (factor * quotient) - result;

        return {
          icon: '',
          left: `${factor} x ${quotient} - ${difference}`,
          right: String(result)
        };
      }
      default: {
        const divisor = (index % 4) + 2;
        const bonus = (index % 7) + 3;

        return {
          icon: '',
          left: `${(result - bonus) * divisor} / ${divisor} + ${bonus}`,
          right: String(result)
        };
      }
    }
  });
}

function buildHardMathPairs(count = 100) {
  return Array.from({ length: count }, (_, index) => {
    const result = index + 251;

    switch (index % 4) {
      case 0: {
        const multiplier = (index % 4) + 3;
        let adjustment = multiplier - (result % multiplier);

        if (adjustment === multiplier) {
          adjustment = multiplier;
        }

        const grouped = (result + adjustment) / multiplier;
        const first = 20 + (index % 11);
        const second = grouped - first;

        return {
          icon: '',
          left: `(${first} + ${second}) x ${multiplier} - ${adjustment}`,
          right: String(result)
        };
      }
      case 1: {
        const factor = (index % 4) + 4;
        let deduction = factor - (result % factor);

        if (deduction === factor) {
          deduction = factor;
        }

        const grouped = (result + deduction) / factor;
        const first = 10 + (index % 9);
        const second = grouped - first;

        return {
          icon: '',
          left: `${factor} x (${first} + ${second}) - ${deduction}`,
          right: String(result)
        };
      }
      case 2: {
        const factor = (index % 5) + 6;
        const quotient = Math.floor(result / factor);
        const remainder = result - (factor * quotient);
        const subtraction = (index % 6) + 2;
        const addition = remainder + subtraction;

        return {
          icon: '',
          left: `(${factor} x ${quotient}) + ${addition} - ${subtraction}`,
          right: String(result)
        };
      }
      default: {
        const bonusBase = (index % 8) + 5;
        const multiplier = (index % 3) + 3;
        let bonus = result % multiplier;

        if (bonus === 0) {
          bonus = multiplier;
        }

        if (bonus < bonusBase) {
          bonus += multiplier * Math.ceil((bonusBase - bonus) / multiplier);
        }

        const grouped = (result - bonus) / multiplier;
        const first = Math.floor(grouped / 2);
        const second = grouped - first;

        return {
          icon: '',
          left: `((${first} + ${second}) x ${multiplier}) + ${bonus}`,
          right: String(result)
        };
      }
    }
  });
}

function buildMathDocsByLevel() {
  return {
    easy: buildEasyMathPairs(),
    medium: buildMediumMathPairs(),
    hard: buildHardMathPairs()
  };
}

const GAME_SEEDS = {
  synonyms: {
    prefix: 'synonyms',
    docsByLevel: buildGameDocsForAllLevels(buildPairDocs(SYNONYM_PAIRS))
  },
  antonyms: {
    prefix: 'antonyms',
    docsByLevel: buildGameDocsForAllLevels(buildPairDocs(ANTONYM_PAIRS))
  },
  math: {
    prefix: 'math',
    docsByLevel: buildMathDocsByLevel()
  }
};

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

async function seedGame(firestore, accessToken, gameId, gameSeed) {
  console.log(`\nSeeding ${gameId}`);

  for (const level of LEVELS) {
    const docs = gameSeed.docsByLevel[level];

    if (!docs) {
      continue;
    }

    const collectionPath = targetPath(gameId, level);
    process.stdout.write(`- ${collectionPath.padEnd(40)} `);

    if (firestore) {
      await replaceCollectionAdmin(firestore, collectionPath, docs, gameSeed.prefix);
    } else {
      await replaceCollectionRest(accessToken, collectionPath, docs, gameSeed.prefix);
    }

    console.log(`OK (${docs.length})`);
  }
}

async function seedGames() {
  const firestore = initializeFirestoreAdmin();
  const accessToken = firestore ? null : getFirebaseToolsAccessToken();

  try {
    for (const [gameId, gameSeed] of Object.entries(GAME_SEEDS)) {
      await seedGame(firestore, accessToken, gameId, gameSeed);
    }

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

module.exports = {
  buildEasyMathPairs,
  buildMediumMathPairs,
  buildHardMathPairs
};
