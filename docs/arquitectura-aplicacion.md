# Arquitectura de la aplicacion

## Resumen
La aplicacion es un juego de emparejar cartas construido con Angular. La UI vive en componentes de pagina y de modulo, mientras que la logica del juego se concentra en una capa `Facade` y servicios especializados. Firebase se usa para autenticacion, lectura de cartas y almacenamiento del ranking de tiempos.

## Vista general
```mermaid
flowchart LR
    U[Usuario] --> UI[Angular UI]
    UI --> G[GameFacade]
    G --> T[GameTimerService]
    G --> L[GameLeaderboardService]
    G --> D[DataService]
    G --> H[HelperService]
    L --> A[AuthService]
    L --> D
    D --> F[(Firestore)]
    A --> FA[Firebase Auth]
```

## Capas principales

### 1. Capa de presentacion
- `GameComponent` monta la pantalla del juego.
- `CardContainerComponent` compone la cabecera, tablero, dialogos y acciones de usuario.
- `CardComponent` renderiza cada carta individual.

La presentacion consume estado expuesto por `GameFacade` y delega eventos como:
- seleccionar carta
- cambiar idioma
- iniciar nueva partida
- guardar puntuacion
- abrir ranking

## Flujo de una partida
```mermaid
flowchart TD
    A[Entrar en /game] --> B[GameComponent]
    B --> C[CardContainerComponent.ngOnInit]
    C --> D[GameFacade.loadCards]
    D --> E[DataService.getCards]
    E --> F[Firestore coleccion easy]
    D --> G[GameLeaderboardService.initialize]
    D --> H[Start new game]
    H --> I[Seleccion aleatoria de pares]
    H --> J[GameTimerService.start]
    I --> K[Render de cartas]
    K --> L[Usuario selecciona cartas]
    L --> M[GameFacade.checkMatch]
    M --> N{Hace match?}
    N -->|Si| O[Actualizar progreso]
    N -->|No| P[Reset de seleccion]
    O --> Q{100% completado?}
    Q -->|Si| R[Parar timer y abrir dialogo final]
    Q -->|No| K
    P --> K
```

## Responsabilidades por servicio

### `GameFacade`
Archivo: [src/app/modules/card/services/game-facade.service.ts](/Users/javiergarcia/git/cards/src/app/modules/card/services/game-facade.service.ts:1)

Es la capa de coordinacion entre UI y dominio del juego.

Responsabilidades:
- cargar cartas y preferencias
- mantener el estado reactivo principal del tablero
- gestionar seleccion de cartas y matches
- reconstruir el layout del tablero segun idioma y columnas
- coordinar temporizador y ranking

No accede directamente a Firebase Auth ni maneja internamente el timer.

### `GameTimerService`
Archivo: [src/app/modules/card/services/game-timer.service.ts](/Users/javiergarcia/git/cards/src/app/modules/card/services/game-timer.service.ts:1)

Responsabilidades:
- iniciar una cuenta atras
- exponer `timeLeft` como signal
- detener el temporizador
- ejecutar callback al finalizar el tiempo

### `GameLeaderboardService`
Archivo: [src/app/modules/card/services/game-leaderboard.service.ts](/Users/javiergarcia/git/cards/src/app/modules/card/services/game-leaderboard.service.ts:1)

Responsabilidades:
- cargar mejores tiempos por idioma
- abrir/cerrar el dialogo de fin de partida
- preparar nombre por defecto
- guardar la puntuacion del usuario
- exponer el estado del ranking a la UI

### `DataService`
Archivo: [src/app/services/data.service.ts](/Users/javiergarcia/git/cards/src/app/services/data.service.ts:1)

Responsabilidades:
- leer cartas desde Firestore
- usar fallback local si Firebase no esta disponible
- leer top scores del ranking
- guardar nuevas puntuaciones

### `AuthService`
Archivo: [src/app/services/auth.service.ts](/Users/javiergarcia/git/cards/src/app/services/auth.service.ts:1)

Responsabilidades:
- login con Google, email/password o invitado
- persistencia de sesion
- exponer `username`
- facilitar `uid` y si el usuario es anonimo

## Flujo de guardado de puntuacion
```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as CardContainerComponent
    participant G as GameFacade
    participant L as GameLeaderboardService
    participant A as AuthService
    participant D as DataService
    participant F as Firestore

    U->>UI: Completa el puzzle
    UI->>G: selectCard(...)
    G->>L: openCompletedDialog(tiempo, idioma)
    U->>UI: Guardar tiempo
    UI->>G: saveCompletedGame()
    G->>L: saveCompletedGame()
    L->>A: getCurrentUserId() / isAnonymousUser()
    L->>D: saveScore(...)
    D->>F: addDoc(leaderboards/{language}/times)
    F-->>D: ok
    D-->>L: ok
    L-->>UI: scoreSaveMessage = "Tiempo guardado..."
```

## Estructura de datos en Firebase

### Firestore
- `easy/`
  - documentos con pares de cartas: `icon`, `es`, `gb`, `it`, `pt`, `de`
- `prueba/`
  - misma estructura que `easy`
- `leaderboards/{language}/times/`
  - `playerName`
  - `durationSeconds`
  - `language`
  - `createdAt`
  - `userId`
  - `isAnonymous`
- `config/openaiCredentials`
  - credenciales auxiliares si se usan desde la pagina `/generate`

## Diagrama de modulos frontend
```mermaid
flowchart TB
    App[AppModule] --> GameModule
    App --> LoginModule
    App --> RegisterModule
    App --> GenerateModule

    GameModule --> CardModule
    GameModule --> SharedModule

    CardModule --> CardContainer[CardContainerComponent]
    CardModule --> Card[CardComponent]

    CardContainer --> GameFacade
    GameFacade --> GameTimerService
    GameFacade --> GameLeaderboardService
    GameFacade --> DataService
```

## Decisiones de arquitectura

### Signals para estado de UI
Se usan `signal()` de Angular para exponer estado ligero y reactivo sin sobrecargar la app con mas infraestructura.

### Facade como punto de entrada de la pantalla
La vista no conoce detalles de Firebase, temporizador o persistencia. Todo pasa por `GameFacade`, lo que simplifica componentes y testing.

### Separacion por responsabilidad
La logica que tiende a crecer de forma independiente se ha sacado a servicios propios:
- timer
- leaderboard

Esto reduce el tamaño del `Facade` y prepara mejor la app para nuevas funcionalidades.

## Posibles mejoras futuras
- extraer un `GameEngineService` para encapsular toda la logica de emparejamiento y barajado
- añadir pruebas de integracion para el flujo completo de partida
- versionar y limitar el ranking por dificultad, idioma o modo de juego
- registrar eventos analiticos de inicio, fin y abandono de partida
