# Informe de principios Angular

Fecha de revisión: 2026-05-02

## Resumen

El proyecto cumple parte de los principios de la imagen, pero todavía hay margen claro de mejora para que la arquitectura sea más escalable, el flujo de datos más explícito y la app más fácil de mantener.

Lo más positivo es que ya existe una separación razonable entre `pages`, `services`, `modules` y `utils`, y que parte del acceso a datos está encapsulado en servicios. Aun así, el estado de la app sigue muy concentrado en componentes grandes, y hay oportunidades claras en rendimiento, memoria, pruebas y depuración.

## 1. Estructura escalable

Estado actual: parcial.

Puntos a favor:
- Hay separación por carpetas de `pages`, `services`, `modules` y `utils`.
- La lógica de acceso a Firebase está concentrada en servicios y no repartida por las vistas.
- La aplicación ya introdujo una separación más clara entre presentación y dominio del juego mediante `GameFacade`, `GameLeaderboardService` y `GameTimerService`.

Problemas o mejoras:
- El enrutado sigue montado en un `AppRoutingModule` único y aún no hay una estrategia fuerte de lazy loading por dominio.
- `AppModule` continúa siendo el punto de ensamblaje principal.
- Aunque el estado del juego ya no vive directamente en el componente, `CardContainerComponent` sigue agrupando mucha UI en una sola pieza: cabecera, menú, tablero y diálogos.

Mejora recomendada:
- Separar la app por dominios o features más claros y preparar lazy loading por ruta.
- Dividir el tablero en piezas más pequeñas: contenedor de juego, cabecera, rejilla de cartas y servicio de estado del juego.

## 2. Signals vs RxJS

Estado actual: parcial.

Puntos a favor:
- RxJS está bien usado para flujos asíncronos reales, como Firestore y autenticación.
- El estado local del juego y del ranking ya utiliza `signal()`, lo que aclara la frontera entre flujos externos y estado de UI.

Problemas o mejoras:
- Conviven varios estilos de estado en la app: `signals`, observables y `localStorage`.
- `AuthService` aún puede revisarse para hacer más explícita su estrategia de estado si se quiere homogeneidad total.

Mejora recomendada:
- Mantener RxJS para streams externos, pero migrar estado local de UI a `signals` cuando sea sencillo.
- Usar `computed` para estado derivado y dejar RxJS para Firestore, auth y otras fuentes asíncronas.

## 3. Rendimiento

Estado actual: mejorable.

Puntos a favor:
- Los componentes principales visibles ya usan `ChangeDetectionStrategy.OnPush`.

Problemas o mejoras:
- Sigue existiendo una escucha global de scroll en el tablero.
- El contenedor principal del juego conserva bastante comportamiento interactivo y muchas ramas de render.

Mejora recomendada:
- Introducir `OnPush` en componentes presentacionales y contenedores donde sea posible.
- Reducir mutaciones directas y mover estado derivado a `signals` o selectores.
- Sustituir la escucha global de scroll por una estrategia más barata, como `IntersectionObserver` o una lógica más acotada.

## 4. Memoria y suscripciones

Estado actual: mezcla de buenas prácticas y un punto débil.

Puntos a favor:
- `DataService` devuelve una función de limpieza para `onSnapshot`, así que la suscripción a Firestore sí se cancela correctamente.
- `GameFacade` centraliza la suscripción principal a cartas y limpia recursos en `dispose()`.
- El temporizador se detiene de forma explícita al destruirse la pantalla.

Problemas o mejoras:
- La limpieza está bien resuelta a nivel de fachada, pero futuras suscripciones de componente deberían seguir un patrón homogéneo con `takeUntilDestroyed()` o equivalente.

Mejora recomendada:
- Usar `takeUntilDestroyed()` o `DestroyRef` en suscripciones de componente.
- Minimizar suscripciones manuales cuando una señal, `async` pipe o un `effect` puedan resolverlo.

## 5. Flujo de datos

Estado actual: correcto, pero con zonas poco explícitas.

Puntos a favor:
- Los accesos a Firestore y Firebase están centralizados en servicios.
- El nombre de usuario baja desde `GameComponent` al tablero por `@Input`.
- La nueva arquitectura multi-juego separa mejor el tipo de contenido (`Idiomas`, `Sinonimos`, `Antonimos`) de la mecanica del tablero.

Problemas o mejoras:
- Parte del estado vive en `localStorage` y parte en señales internas, lo que aún deja margen para una capa de persistencia de preferencias más explícita.
- `DataService` sigue combinando acceso a datos, selección de colección, fallback y mensajes de estado.

Mejora recomendada:
- Definir mejor qué estado pertenece al servicio y cuál al componente.
- Extraer un store o facade para el estado del juego.
- Reducir la cantidad de estado mutable compartido dentro de `CardContainerComponent`.

## 6. Testing

Estado actual: insuficiente para lógica de negocio.

Puntos a favor:
- Hay tests para fachada, ranking, generación y componentes principales.
- La suite actual pasa y cubre parte del flujo multi-juego.

Problemas o mejoras:
- Sigue faltando cobertura más profunda de casos borde: fallos de Firestore, expiración del temporizador, preferencias guardadas y regresiones de los distintos juegos.
- No hay tests de integración de flujo completo contra adaptadores reales.

Mejora recomendada:
- Añadir tests de comportamiento, no solo de existencia.
- Priorizar reglas de negocio y casos borde.
- Incluir pruebas de integración para los flujos de login y partida.

## 7. Depuración de producción

Estado actual: mejorable.

Puntos a favor:
- Existe un `LoggerService` para encapsular parte del logging.

Problemas o mejoras:
- Aun así, no hay una estrategia completa de logging, trazas o `ErrorHandler` centralizado para producción.
- Algunos mensajes siguen mezclando estado de infraestructura con mensajes pensados para UI.

Mejora recomendada:
- Introducir un servicio de logging o `ErrorHandler` centralizado.
- Reducir logs directos en componentes salvo durante desarrollo.
- Estandarizar mensajes y códigos de error para hacer más fácil el soporte.

## Conclusión

Mi valoración es que el proyecto ha mejorado claramente respecto al estado anterior y ya tiene una base bastante razonable para seguir creciendo.

Las mejoras con más impacto a partir de aquí serían:
1. Modularizar mejor la UI del tablero en subcomponentes.
2. Simplificar `DataService` separando repositorio, fallback y estado de fuente.
3. Reforzar la batería de tests con casos de error e integración.
4. Preparar una estructura de features con lazy loading real.

No he cambiado nada del código de la app; este fichero es solo un informe de revisión.
