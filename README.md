# Cards

Juego web de emparejar cartas construido con Angular y Firebase. La aplicacion ahora soporta varios juegos dentro de la misma experiencia:
- `Idiomas`: emparejar una palabra en castellano con su traduccion.
- `Sinonimos`: emparejar una palabra con otra de significado equivalente.
- `Antonimos`: emparejar una palabra con su opuesta.

Cada juego tiene tres dificultades (`easy`, `medium`, `hard`) y ranking independiente.

## Comandos principales

- Desarrollo local: `npm start`
- Tests: `npm test -- --runInBand --watch=false`
- Build local: `npm run build`
- Deploy reglas Firestore: `npm run deploy:firestore-rules`
- Seed juegos nuevos en Firestore: `npm run seed:firestore-games`
- Deploy web en GitHub Pages: `npm run deploy:github`

## Arquitectura funcional

La app separa la mecanica base del tablero del tipo de contenido que se juega.

- `GameFacade` coordina el estado principal del tablero, la seleccion de juego, el nivel, el idioma visible, el temporizador y la reconstruccion de la partida.
- `GameLeaderboardService` carga y guarda tiempos por juego, idioma y dificultad.
- `DataService` abstrae Firestore, los fallbacks locales y la transformacion de documentos en cartas jugables.
- `UtilsService` genera mazos para `Idiomas` y para juegos binarios como `Sinonimos` y `Antonimos`.

Documentacion ampliada:
- Arquitectura: [docs/arquitectura-aplicacion.md](/Users/javiergarcia/git/cards/docs/arquitectura-aplicacion.md:1)
- Scripts: [scripts/README.md](/Users/javiergarcia/git/cards/scripts/README.md:1)

## Estructura de datos en Firestore

### Cartas del juego `Idiomas`

Colecciones legacy por nivel:
- `easy`
- `medium`
- `hard`
- `prueba` opcional

Esquema de documento:
```json
{
  "icon": "",
  "es": "casa",
  "gb": "house",
  "it": "casa",
  "pt": "casa",
  "de": "Haus"
}
```

### Cartas de `Sinonimos` y `Antonimos`

Colecciones por juego y nivel:
- `games/synonyms/levels/{level}/cards`
- `games/antonyms/levels/{level}/cards`

Esquema de documento:
```json
{
  "icon": "",
  "left": "alegre",
  "right": "contento"
}
```

Los seeds cargados actualmente en Firestore son:
- `synonyms`: 102 pares por nivel
- `antonyms`: 101 pares por nivel

### Ranking

Ranking legacy de `Idiomas`:
- `leaderboards/{language}/levels/{level}/times`

Ranking multi-juego:
- `leaderboardsByGame/{gameId}/languages/{language}/levels/{level}/times`

Campos principales:
```json
{
  "gameId": "synonyms",
  "playerName": "Ana",
  "durationSeconds": 21,
  "language": "es",
  "level": "medium",
  "createdAt": 1767111111111,
  "userId": "uid-123",
  "isAnonymous": false
}
```

### Configuracion auxiliar

- `config/openaiCredentials`
  - `apiKey`
  - `organization`

Si no existe, la pagina `/generate` usa los valores definidos en `environment`.

## Reglas de Firestore

Las reglas versionadas estan en [firestore.rules](/Users/javiergarcia/git/cards/firestore.rules:1).

Permisos actuales:
- lectura autenticada para cartas legacy (`easy`, `medium`, `hard`, `prueba`)
- lectura autenticada para `games/{gameId}/levels/{level}/cards`
- lectura y escritura autenticada para rankings
- escritura de cartas y `config/*` restringida al listado de administradores

Notas:
- los usuarios invitados tambien son autenticados en Firebase, asi que pueden jugar y guardar tiempos
- no se debe permitir lectura publica de `config/openaiCredentials`

## Seeds y administracion de contenido

### Seed rapido de juegos

Sube o reemplaza los contenidos de `synonyms` y `antonyms` en los niveles `easy`, `medium` y `hard`:

```bash
npm run seed:firestore-games
```

El script:
- borra los documentos existentes de esas colecciones
- escribe documentos nuevos con IDs estables
- reutiliza credenciales de `firebase-tools` o una service account si existe

### Replicar niveles legacy

Para copiar documentos desde `easy` a otras colecciones legacy:

```bash
npm run seed:firestore-levels
```

### Carga manual desde la app

La pagina `/generate` permite:
- elegir juego
- elegir nivel
- pegar JSON
- reemplazar el contenido de la coleccion seleccionada

## Configuracion de Firebase

Actualiza el bloque `firebase` en:
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`
- `src/environments/environment.local.ts`

Sustituye los placeholders por:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

## Autenticacion

En Firebase Console -> Authentication -> Sign-in method, habilitar:
- Email/Password
- Google

## Deploy

### GitHub Pages

```bash
npm run deploy:github
```

El proyecto ya usa una configuracion compatible con `<base href="./">`.

### Reglas Firestore

```bash
npm run deploy:firestore-rules
```

### Latarce.es por FTPS

1. Crear ficheros locales:

```bash
mkdir -p .local
cp scripts/latarce-firebase-prod.env.example .local/latarce-firebase-prod.env
cp scripts/latarce-ftps.env.example .local/latarce-ftps.env
```

2. Rellenar secretos reales.
3. Generar build:

```bash
npm run build:latarce
```

4. Desplegar:

```bash
npm run deploy:latarce:build
```

Notas:
- `environment.prod.ts` sigue sin secretos en git
- `.local/` y service accounts no deben versionarse
- para login con Google, el dominio final debe estar autorizado en Firebase Auth

## Calidad

Comprobaciones recomendadas antes de publicar:

```bash
npm test -- --runInBand --watch=false
npm run build
```
