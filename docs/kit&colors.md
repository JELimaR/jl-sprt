Lo que estás buscando es un **sistema de identidad cromática para instituciones deportivas**, que contemple tanto sus colores institucionales como sus distintas equipaciones y sus representaciones gráficas en la interfaz.

La idea es separar las decisiones cromáticas y evitar que todas dependan de una única pareja de colores.

## **1. Áreas de identidad cromática**

Veo tres grandes áreas:

### **A. Identidad institucional**

Representa los colores propios de la institución, independientemente de sus equipaciones.

- Entre 1 y 3 colores institucionales, con posibilidad de ampliar a 4.
- Debe existir una jerarquía: color institucional principal y colores complementarios.
- No necesariamente todos los colores institucionales tienen que aparecer en las camisetas.

Ejemplos:

| Institución          | Colores institucionales |
| -------------------- | ----------------------- |
| Liverpool FC         | Rojo                    |
| Liverpool Montevideo | Azul y negro            |
| Barcelona            | Azul y granate          |
| Real Madrid          | Blanco                  |

### **B. Identidad de equipaciones**

La institución puede tener varias equipaciones, cada una con su propia combinación cromática:

| Equipación         | Descripción                      |
| ------------------ | -------------------------------- |
| Camisa primaria    | Equipación principal del equipo  |
| Camisa secundaria  | Primera alternativa              |
| Camisa terciaria   | Segunda alternativa, opcional    |
| Arquero primaria   | Equipación principal del arquero |
| Arquero secundaria | Alternativa del arquero          |

Cada equipación debe poder tener uno o varios colores principales y un color secundario.

Es importante que las equipaciones puedan utilizar colores que no estén presentes en la identidad institucional.

### **C. Identidad de representación web**

Son los colores utilizados para representar visualmente a la institución en la aplicación: alineaciones, tablas, resultados, tarjetas, etc.

Acá hay dos niveles que conviene distinguir:

- `web_1`: representación institucional general, basada en el primer color institucional.
- Representaciones de equipaciones: colores derivados de cada camiseta, para cuando la interfaz necesite identificar específicamente una equipación.

## **2. Dos alternativas para los colores web**

Hay una decisión que todavía tenemos que cerrar.

**Alternativa A: definir cada representación web independientemente**

**web_1**

Institucional

**web_primaria**

**web_secundaria**

Cada representación tiene sus propios colores, aunque puede haber reglas para generarlos automáticamente.

**Alternativa B: generar las representaciones de las equipaciones automáticamente**

**web_1**

Institucional

**web_primaria**

Camisa azul

**web_secundaria**

Camisa blanca

Cada representación utiliza como fondo el color principal de la camiseta y selecciona automáticamente un color de primer plano contrastante:

- Si el fondo es oscuro: blanco.
- Si el fondo es claro: negro.

La segunda alternativa parece ser la que mejor se ajusta a lo que buscás: evita definir manualmente demasiados colores y mantiene una relación directa entre la equipación y su representación gráfica.

## **3. Estructura conceptual resultante**

**Institución deportiva**

**Identidad institucional**

1–4 colores

`web_1`

**Equipaciones**

Primaria, secundaria, terciaria y arquero

`web_primaria`, `web_secundaria`, etc.

## **4. Mi recomendación**

Mantendría estas reglas:

1. Los colores institucionales son independientes de las equipaciones.
2. Las equipaciones pueden utilizar colores institucionales o colores alternativos.
3. Cada equipación tiene su propia combinación cromática.
4. `web_1` representa a la institución, utilizando su primer color institucional.
5. Cada representación web de una equipación se genera a partir del color principal de esa equipación, con blanco o negro como color de primer plano según el contraste.
6. Las equipaciones de arquero forman parte del mismo sistema, pero son independientes de las equipaciones de campo.

**Hay una última cuestión que dejaría pendiente:** si una camiseta tiene dos colores principales —por ejemplo, franjas azules y negras—, ¿cuál se utiliza para generar su representación web? Mi propuesta sería establecer un color dominante explícito para cada equipación, en lugar de intentar deducirlo automáticamente de todos sus colores.

Así tendrías un sistema sencillo de generar, determinístico y suficientemente flexible para incorporar posteriormente los diseños de camisetas (lisas, rayadas, divididas, etc.).

---

Sí. Existen varios generadores de camisetas de fútbol que hacen exactamente eso: permiten elegir una plantilla, seleccionar patrones, asignar colores a distintas partes de la camiseta y agregar detalles.

Y creo que es una buena referencia para lo que querés implementar en `jl-sprt`. No necesitás un editor gráfico complejo: podés tener un **generador paramétrico de camisetas**, donde el diseño se construye a partir de opciones predefinidas.

## **1. Algunos ejemplos que podés probar**

[FM Kit Creator | FM Base](https://images.openai.com/static-rsc-4/uC1M6dZCN7EDNmA-d36dzMoqjB3smp84Fwu57Cap0tH-rqBApLdDC_U2i6kyxvzg7nzgfeE8kZ-UsF1NiukRzYUKA4Fd76eS93T5IO6rYLu4hSpofVCLb2rmfBlM5Vq1mJlj-a6g-hVC7yxAB1DJOlhvTTc6ce-Y9967wPbMpWQ?purpose=inline)

[**myFPL – Football Kit Creator**](https://myfpl.co/kit-creator?utm_source=chatgpt.com)

Bastante cercano a lo que necesitás. Permite camisetas lisas, rayadas, a franjas horizontales, divididas, con banda diagonal, colores de mangas, cuello y puños.

[Forma Yapma ve Tasarlama programı Nedir ve Nasıl Çalışır? | Acun Sport](https://images.openai.com/static-rsc-4/f-PK93FDfSREe8Kafm2delXcOkg-LC7fgg8_V-wzJ0vB0dWTs0i9dD7CFlujDavSeOlNePnXix1wfhvxeSw_jQpDqVSTzE6nc-7Hkdc_EsJg8hiUkPhnmDfZ1pIAjwFmDvh4g-Z1LoLoXctzLXuCpyuXufkPf2xjZtNZ2Mu-ykc?purpose=inline)

[**RenderFoot – Kit Designer**](https://www.renderfoot.com/kit-designer?utm_source=chatgpt.com)

Tiene una selección sencilla de diseños: lisa, rayas verticales, horizontales, diagonal, mitades, cuartos, chevrón, etc. También permite elegir tipos de cuello.

[EAFC Kit Creator FAQ and Showcase | PDF](https://images.openai.com/static-rsc-4/jeIofJef-RyAScpZCABzTTbPOr6SwZ-m524m6AUlgXBiWZLzDAgDAkfTx5Wsgt1PwMos5XlGZNtI8w4YCsTyfd6XbXhpeS-rrhSgOkTsqHTku_fz9g4gepVCbmjad-tIUJ_X4lB0GsYRmeGiJ9LYi_XEF8fqTEUzZKvBzlITq3A?purpose=inline)

[**Football Shirt Designer**](https://gregeasts.github.io/Football-Shirt-Designer/?utm_source=chatgpt.com)

Es más completo: permite modificar partes de la camiseta, agregar logos, seleccionar colores y personalizar detalles.

[Fabric textile design for Sport t-shirt, Soccer jersey mockup for football club.](https://images.openai.com/static-rsc-4/UH4b4ybhBbYE2aQpjV5KI1BcV0DTKo8TlO-rmZ3QEXiuOFT2OwuE23uPb3cq8KNSRqcBmkxJiC_8aW9xv0Eb6WQbepmhG-WEAEX9v4sB0eqAj1trqkkHo0Lz2NrOX2gKB4Ai_wdjdtNzgw2q1dRSJ6U9dXw92o5oEnVjk1vaYOcV5HmS7MLZgeiALzJ9SFYV?purpose=inline)

[**soccer-jersey (GitHub / npm)**](https://github.com/nadchif/soccer-jersey?utm_source=chatgpt.com)

Este es particularmente interesante desde el punto de vista de programación. Genera camisetas SVG mediante parámetros, con estilos como `plain`, `striped`, `hoops`, `two-color`, `waves` y otros.

## **2. Cómo lo implementaría en tu aplicación**

Mi recomendación sería utilizar **SVG como sistema de representación**.

Una camiseta no necesita ser una imagen generada mediante IA ni un modelo 3D. Puede ser un dibujo vectorial compuesto por distintas regiones coloreables.

Por ejemplo:

[Blank White Soccer Jersey Shirt Template On Gray Background](https://images.openai.com/static-rsc-4/fFMo57uqWb5CV2pG8HPStgEDqCGnje6nwWpTUXTiiaxgx9wPe_f3CIhPk0HFi4dTo8FFscOPEiU8pZZx2MKUSKhB7V9Oi3gty7YLAbT-tkd4EqFT9U_4YGr5CnNLW-8a27T6f3-_KIPNRFqpIqxIxgHddzLrZFu5uVFWapIt9Elf30F0jXhSqyRYTstOjlre?purpose=inline)

[Purple and white striped sports jersey vector icon. Short sleeve football or soccer t-shirt template isolated on white.](https://images.openai.com/static-rsc-4/083puI0_7KuPFQ__uDl8Gz8dXf03vmylyT176IZfIkMebZ58gPjNJ7vhgkbecYamP80CpJ8ZQrCZHVjVjkkHhEv0T6KpPusrvynQNPnwWd7D2pWEL98iZRzdfdSLj9tBsV5ssz7Df_QUhfk94ADoOiyYACx-XaNHDQkNCMwIvlHM7K4FEjQ7P9rRpKZyPGUS?purpose=inline)

[Telegraph Fantasy Football Planner & Fixture Ticker | PlanTFF](https://images.openai.com/static-rsc-4/ji4Xth8tJiuFogqNqn3XeBnD5jhuZZA-Hsn0wwgXQfRWeZK-R1XdR1ErnrMEA_1a7yPdpm4c1iFcqKn_x3FHVvrPdGpwkXjSoeSHzKM7CLl6ed-tN5ISApMXRT443X5X4M2_b2A31GpFbWKldX176gpB5z5hWje4EduyHhcrXH0?purpose=inline)

8

Podrías tener una serie de componentes:

- Cuerpo.
- Manga izquierda.
- Manga derecha.
- Cuello.
- Puños.
- Paneles laterales.
- Estampado o patrón.

Cada componente puede tener su propio color o patrón.

### **Tipos de diseño iniciales**

Yo empezaría con estos:

| Tipo                 | Descripción            |
| -------------------- | ---------------------- |
| `plain`              | Lisa                   |
| `vertical-stripes`   | Rayas verticales       |
| `horizontal-stripes` | Rayas horizontales     |
| `halves`             | Dos mitades verticales |
| `quarters`           | Cuatro cuadrantes      |
| `diagonal-sash`      | Banda diagonal         |
| `pinstripes`         | Rayas finas            |
| `chevron`            | Diseño en V            |
| `horizontal-band`    | Franja horizontal      |
| `shoulder-panels`    | Paneles en hombros     |

### **Detalles configurables**

[Nederland Thuisshirt 2024/25](https://images.openai.com/static-rsc-4/W3vm4VbzWt1zTuRm0rq6voDJCUQ7fZLr8EvEnKk5buc5z8fzbv1r9GSw7gsXzj5E1mU7dQFXqoS2Hgi2EG7p7KwJbxAj1MXAl_LFwgDJjabkvSRFgZ0pMU0Yi-2FJQRBXiHyscahhTg0tR-5MP-ay0r4IzJdbZcW3zWTnTsvgGU?purpose=inline)

[unisportstore.nl](https://www.unisportstore.nl/voetbalshirts/nederland-thuisshirt-euro-2024/352801/?utm_source=chatgpt.com)

También permitiría seleccionar independientemente:

- Tipo de cuello: redondo, V, polo.
- Color del cuello.
- Color del borde del cuello.
- Color de las mangas.
- Color del borde de las mangas.
- Color de los paneles laterales.

No implementaría todavía sponsors, escudos, marcas ni números. Son elementos posteriores.

## **3. Modelo de datos que utilizaría**

La clave es que el diseño no sea una imagen almacenada, sino una configuración que permita volver a dibujarlo.

Por ejemplo:

```
export type JerseyPattern =
  | "plain"
  | "vertical-stripes"
  | "horizontal-stripes"
  | "halves"
  | "quarters"
  | "diagonal-sash"
  | "pinstripes"
  | "chevron"
  | "horizontal-band"
  | "shoulder-panels";

export type JerseyCollar =
  | "round"
  | "v-neck"
  | "polo";

export interface IJerseyDesign {
  pattern: JerseyPattern;

  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };

  collar: {
    type: JerseyCollar;
    color: string;
    trimColor?: string;
  };

  sleeves: {
    leftColor: string;
    rightColor: string;
    cuffColor?: string;
  };
}
```

Esto es un punto de partida. Posteriormente se pueden agregar parámetros específicos de cada patrón, como cantidad de rayas, anchura, separación y orientación.

## **4. Una distinción importante para tu generador aleatorio**

Yo separaría dos operaciones:

**Generar una equipación:** seleccionar aleatoriamente el tipo de diseño y sus colores, respetando la identidad institucional cuando corresponda.

**Representar una equipación:** dibujar la configuración mediante SVG.

Así, una institución podría tener:

- Principal: rayas verticales azules y negras, cuello blanco y puños blancos.
- Secundaria: lisa blanca, cuello azul y puños azules.
- Terciaria: amarilla con banda diagonal negra.

Y el mismo sistema serviría para las equipaciones de arquero.

## **Mi recomendación final**

No incorporaría directamente un editor de camisetas completo de terceros. Tomaría como referencia visual los generadores anteriores y desarrollaría un renderizador SVG propio, sencillo y determinístico.

El proyecto `soccer-jersey` puede servirte como punto de partida técnico: [ver su API y estilos disponibles](https://github.com/nadchif/soccer-jersey/blob/master/README.md?utm_source=chatgpt.com). También revisaría su licencia Apache 2.0 antes de reutilizar código.

**El siguiente paso lógico sería definir una primera biblioteca de 8–10 patrones SVG y una única plantilla de camiseta de fútbol**, con colores independientes para cuerpo, mangas, cuello y puños. Después podrías ampliar los diseños sin cambiar el modelo general.
