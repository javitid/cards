# Informe de principios Angular

Fecha de revisión: 2026-04-28

## Resumen

El proyecto cumple parte de los principios de la imagen, pero todavía hay margen claro de mejora para que la arquitectura sea más escalable, el flujo de datos más explícito y la app más fácil de mantener.

Lo más positivo es que ya existe una separación razonable entre `pages`, `services`, `modules` y `utils`, y que parte del acceso a datos está encapsulado en servicios. Aun así, el estado de la app sigue muy concentrado en componentes grandes, y hay oportunidades claras en rendimiento, memoria, pruebas y depuración.

## 1. Estructura escalable

Estado actual: parcial.

Puntos a favor:
- Hay separación por carpetas de `pages`, `services`, `modules` y `utils`.
- La lógica de acceso a Firebase está concentrada en servicios y no repartida por las vistas.

Problemas o mejoras:
- El enrutado está montado en un `AppRoutingModule` monolítico y las páginas se cargan de forma eager, no por carga diferida. Ver [app-routing.module.ts](../src/app/app-routing.module.ts:10) y [app.module.ts](../src/app/app.module.ts:59).
- `AppModule` declara todas las páginas en un único módulo raíz, lo que escala peor cuando el proyecto crece.
- `CardContainerComponent` mezcla demasiadas responsabilidades: carga de datos, preferencias, temporizador, estado del tablero, audio, menú y modal. Ver [card-container.component.ts](../src/app/modules/card/components/card-container/card-container.component.ts:30).

Mejora recomendada:
- Separar la app por dominios o features más claros y preparar lazy loading por ruta.
- Dividir el tablero en piezas más pequeñas: contenedor de juego, cabecera, rejilla de cartas y servicio de estado del juego.

## 2. Signals vs RxJS

Estado actual: parcial.

Puntos a favor:
- RxJS está bien usado para flujos asíncronos reales, como Firestore y autenticación.
- En `GameComponent` se usa `async` pipe para consumir el nombre de usuario. Ver [game.component.html](../src/app/pages/game/game.component.html:3).

Problemas o mejoras:
- No se usan `signals` en ningún sitio; todo el estado local se gestiona con propiedades mutables de clase.
- `AuthService` usa `BehaviorSubject` para estado de login y nombre de usuario, aunque parte de ese estado es local y podría simplificarse. Ver [auth.service.ts](../src/app/services/auth.service.ts:24).

Mejora recomendada:
- Mantener RxJS para streams externos, pero migrar estado local de UI a `signals` cuando sea sencillo.
- Usar `computed` para estado derivado y dejar RxJS para Firestore, auth y otras fuentes asíncronas.

## 3. Rendimiento

Estado actual: mejorable.

Problemas o mejoras:
- Ningún componente visible usa `ChangeDetectionStrategy.OnPush`.
- `CardContainerComponent` hace bastante trabajo imperativo: temporizador con `setInterval`, escucha global de scroll y `cdr.detectChanges()`. Ver [card-container.component.ts](../src/app/modules/card/components/card-container/card-container.component.ts:110) y [card-container.component.ts](../src/app/modules/card/components/card-container/card-container.component.ts:201).
- El componente principal del juego concentra muchos estados reactivos y mutaciones, lo que aumenta el riesgo de rerenders innecesarios.

Mejora recomendada:
- Introducir `OnPush` en componentes presentacionales y contenedores donde sea posible.
- Reducir mutaciones directas y mover estado derivado a `signals` o selectores.
- Sustituir la escucha global de scroll por una estrategia más barata, como `IntersectionObserver` o una lógica más acotada.

## 4. Memoria y suscripciones

Estado actual: mezcla de buenas prácticas y un punto débil.

Puntos a favor:
- `DataService` devuelve una función de limpieza para `onSnapshot`, así que la suscripción a Firestore sí se cancela correctamente. Ver [data.service.ts](../src/app/services/data.service.ts:89).
- El temporizador del tablero se limpia en `ngOnDestroy`. Ver [card-container.component.ts](../src/app/modules/card/components/card-container/card-container.component.ts:110).
- En `GameComponent` se usa `async` pipe, que evita suscripciones manuales. Ver [game.component.html](../src/app/pages/game/game.component.html:3).

Problemas o mejoras:
- `CardContainerComponent.loadCards()` hace una suscripción directa a `getCards()` sin una estrategia explícita de teardown. Ver [card-container.component.ts](../src/app/modules/card/components/card-container/card-container.component.ts:73).
- Aunque hoy el observable subyacente se completa o comparte bien, la ausencia de `takeUntilDestroyed()` o `DestroyRef` deja la intención menos clara y puede convertirse en fuga si el flujo cambia.

Mejora recomendada:
- Usar `takeUntilDestroyed()` o `DestroyRef` en suscripciones de componente.
- Minimizar suscripciones manuales cuando una señal, `async` pipe o un `effect` puedan resolverlo.

## 5. Flujo de datos

Estado actual: correcto, pero con zonas poco explícitas.

Puntos a favor:
- Los accesos a Firestore y Firebase están centralizados en servicios.
- El nombre de usuario baja desde el `GameComponent` al tablero por `@Input`. Ver [game.component.ts](../src/app/pages/game/game.component.ts:12) y [game.component.html](../src/app/pages/game/game.component.html:3).

Problemas o mejoras:
- El tablero concentra demasiada lógica mutable en el propio componente y eso hace que el ownership del estado sea menos claro.
- Parte del estado vive en `localStorage` y parte en propiedades del componente, sin una capa intermedia que lo haga explícito.
- `DataService` también mezcla gestión de fallback, estado de fuente de datos y errores, además de la lectura/escritura. Ver [data.service.ts](../src/app/services/data.service.ts:44).

Mejora recomendada:
- Definir mejor qué estado pertenece al servicio y cuál al componente.
- Extraer un store o facade para el estado del juego.
- Reducir la cantidad de estado mutable compartido dentro de `CardContainerComponent`.

## 6. Testing

Estado actual: insuficiente para lógica de negocio.

Puntos a favor:
- Hay tests para componentes principales y algunos comportamientos concretos.
- La suite actual pasa y cubre los flujos básicos.

Problemas o mejoras:
- La mayoría de los tests son de creación de componente o validaciones muy ligeras. Ver [login.component.spec.ts](../src/app/pages/login/login.component.spec.ts:11), [generate.component.spec.ts](../src/app/pages/generate/generate.component.spec.ts:9) y [card-container.component.spec.ts](../src/app/modules/card/components/card-container/card-container.component.spec.ts:10).
- Falta cobertura de reglas importantes: aciertos/errores del juego, temporizador, fallback de Firestore, login con errores y navegación por guard.
- No hay tests de integración de flujo completo.

Mejora recomendada:
- Añadir tests de comportamiento, no solo de existencia.
- Priorizar reglas de negocio y casos borde.
- Incluir pruebas de integración para los flujos de login y partida.

## 7. Depuración de producción

Estado actual: mejorable.

Problemas o mejoras:
- Hay bastante logging con `console.error` y `console.warn` disperso por servicios y componentes.
- No existe una estrategia centralizada de logging, trazas o tratamiento de errores.
- Algunos mensajes de error están mezclados entre UI y lógica, lo que complica seguir el flujo real de fallo.

Mejora recomendada:
- Introducir un servicio de logging o `ErrorHandler` centralizado.
- Reducir logs directos en componentes salvo durante desarrollo.
- Estandarizar mensajes y códigos de error para hacer más fácil el soporte.

## Conclusión

Mi valoración es que el proyecto está bien encaminado para una app pequeña o mediana, pero todavía no cumple del todo los principios de una Angular app escalable y limpia.

Las mejoras con más impacto serían:
1. Separar mejor el estado y la lógica del tablero.
2. Introducir `OnPush` y una estrategia de estado más moderna.
3. Añadir suscripciones con teardown explícito.
4. Reforzar mucho más la batería de tests.
5. Preparar una estructura de rutas/features más modular y con lazy loading.

No he cambiado nada del código de la app; este fichero es solo un informe de revisión.
