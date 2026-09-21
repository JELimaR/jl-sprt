# Reglas de dependencias

Este documento fija las reglas de la migración hacia `jl-sprt-core` y
`jl-sprt-match`.

## Regla objetivo

```text
jl-sprt-core  <-  jl-sprt-match  <-  JSportModule / Tournament / app
```

La flecha significa "puede ser dependencia de".

## `jl-sprt-core`

Puede importar:

- otros módulos de `jl-sprt-core`;
- librerías neutrales, como tipos o utilidades de fecha estrictamente necesarias;
- contratos externos mínimos y explícitos.

No debe importar:

- `JSportModule`;
- `Tournament`;
- `EventMatch`;
- `Ranking` del engine;
- `Institution` o `Federation`;
- profiles o implementaciones concretas de deportes.

## `jl-sprt-match`

Puede importar:

- `jl-sprt-core`;
- librerías neutrales;
- dependencias propias de la simulación.

No debe importar:

- `JSportModule/data/Team`;
- `JSportModule/Ranking`;
- `Tournament`;
- entidades del engine.

## Excepciones legacy registradas

La fase 1 registró las dependencias existentes del core. Tras la fase 2,
continúan pendientes estas excepciones:

- `A_Match` -> `JSportModule/Match/EventMatch`.
- `A_Serie` -> `JSportModule/data` (`TypeBaseStageOption`).
- `ISportProfile` -> `JSportModule/data` y `JSportModule/Ranking`.

La fase 2 eliminó estas dependencias:

- `A_Match` ahora usa `TeamRef` y no importa `Team`.
- `A_MatchPlay` ahora usa `TeamRef` y no importa `TeamMatch`.
- `A_Serie` ahora usa `TeamRef` y no importa `Team`.

La prueba de arquitectura permite únicamente estas excepciones conocidas. Si
aparece otra dependencia prohibida, la prueba falla y obliga a registrarla o a
resolverla antes de continuar.

## Import smoke test

El barrel de `jl-sprt-core` debe poder importarse y exponer sus abstracciones
principales sin introducir imports desde un profile deportivo concreto.
