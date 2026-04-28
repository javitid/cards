# Cards
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.1.5.

## Commands
Check registry: `npm config get registry`
Set default registry:  `npm install --registry=https://registry.npmjs.org/`
Upgrade node version with nvm: `nvm use 18`
Create project: `ng new cards`
Deploy in github: `npm run deploy`

## Firebase migration
This project now uses Firebase for authentication and data storage.

### 1. Configure Firebase project
Update the `firebase` section in:
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`
- `src/environments/environment.local.ts`

Replace placeholder values:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

### 2. Enable Authentication providers
In Firebase Console -> Authentication -> Sign-in method, enable:
- Email/Password
- Google

### 3. Firestore collections expected
Create these collections/documents:
- `easy`: documents with card pairs (`icon`, `es`, `gb`, `it`, `pt`, `de`)
- `prueba`: optional same schema as `easy`
- `config/openaiCredentials`: document with
	- `apiKey`: string
	- `organization`: string

If `config/openaiCredentials` does not exist, app falls back to `openAICredentials` in environment files.

### 4. Firestore security rules
The app reads cards from the browser, so Firestore rules must allow authenticated users to read `easy`.

Recommended baseline:
- `easy` and `prueba`: read for authenticated users
- writes only for an admin email allowlist
- `config/*`: admin only

Rules are versioned in:
- `firestore.rules`

Important:
- anonymous guest users are also authenticated in Firebase, so `request.auth != null` allows guest play
- do not allow public writes to `easy`, because the `/generate` page writes directly from the browser
- do not allow public reads to `config/openaiCredentials`, because that would expose API credentials to clients

Deploy rules:
- `npm run deploy:firestore-rules`

### Local secrets
Do not commit Firebase service account files or real local environment credentials.

- Keep service account json outside git-tracked files or in an ignored path.
- `src/environments/environment.local.ts` should stay local-only with your own values.

## Deploy in github
Build for GitHub Pages: `npm run build:github`
Deploy to GitHub Pages: `npm run deploy:github`
The project already uses `<base href="./">` in `src/index.html`, which is compatible with GitHub Pages.

## Build y despliegue en latarce.es
1. Crear los ficheros locales:

```bash
mkdir -p .local
cp scripts/latarce-firebase-prod.env.example .local/latarce-firebase-prod.env
cp scripts/latarce-ftps.env.example .local/latarce-ftps.env
```

2. Rellenar `.local/latarce-firebase-prod.env` con las claves reales de Firebase.

3. Rellenar `.local/latarce-ftps.env` con las credenciales FTPS y la ruta remota.

4. Generar build de produccion para latarce:

```bash
npm run build:latarce
```

5. Desplegar por FTPS limpiando antes el destino remoto:

```bash
npm run deploy:latarce:build
```

Notas:

- `environment.prod.ts` permanece sin secretos en git.
- Los scripts generan temporalmente ese fichero desde `.local/latarce-firebase-prod.env` y lo restauran al terminar.
- `.local/` no entra en commits.
- Para login con Google, el dominio final debe estar autorizado en Firebase Auth.
  - Añadir `latarce.es` y, si aplica, `www.latarce.es` en Authorized domains.
  - Si no se hace, Google fallara con `auth/unauthorized-domain`.

## Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding
Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build
Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests
Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests
Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help
To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
