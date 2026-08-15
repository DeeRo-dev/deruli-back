# 🍽️ Derulis — Brief de Producto y Diseño

> Especificación viva del producto. Entrada para agentes de diseño (Stitch)
> y de código.
>
> **Convención de idioma:** el código va en **inglés** (tipos, funciones,
> archivos, rutas, columnas). La interfaz va en **español rioplatense**.
> Así, `Table` en el código es "Mesa" en pantalla.

---

## 1. Qué es Derulis

App móvil para **registrar y puntuar lo que comés cuando salís**. Podés hacerlo solo o armar una **Mesa** (`Table`) e invitar a otros usuarios, para que cada uno puntúe lo mismo y se comparen las opiniones.

La unidad de puntuación es el **derulis**: todo se puntúa de **1 a 5 derulis**.

**Diferenciadores:**

1. **Se puntúa plato por plato, no el restaurante entero.** Entrada, principal y postre se puntúan por separado, cada uno con su nombre y su comentario.
2. **Varias opiniones sobre la misma mesa.** Cada comensal puntúa por su cuenta. Se ve lo que opinó cada uno, no un promedio anónimo.
3. **El gasto queda registrado.** Cada salida anota lo que se gastó, así el precio es un dato real y no un `$$$` genérico.

**Plataforma:** mobile-first. El escritorio no es prioridad.

---

## 2. Modelo del producto

**Una Mesa es un grupo que persiste en el tiempo, no una sola comida.** Tiene miembros fijos, una próxima salida y un historial de visitas. Este es el punto que más se malinterpretó al principio y el que define el esquema de datos.

```
TABLE  (mesa: nombre, descripción, privada)
  │
  ├── MEMBERS ──────── el creador + los invitados (1..N)
  │
  └── OUTINGS ──────── salidas de esa mesa a lo largo del tiempo
        │
        ├── PLACE ──── dónde comieron
        ├── fecha/hora, si está reservada, gasto total
        │
        ├── MEALS ──── lo que se pidió en esa salida
        │              ("Flan con dulce de leche", precio)
        │
        └── por cada MEMBER presente:
              ├─ puntúa cada MEAL     1-5 derulis + comentario
              ├─ puntúa el PLACE      1-5 derulis
              └─ puntúa el SERVICE    1-5 derulis
```

**Reglas:**

- Una mesa puede tener **un solo comensal**. Comer solo es un caso normal, no un caso borde — nunca bloquear un flujo por falta de invitados.
- Las comidas son de la **salida**, no de la persona: se cargan una vez y todos los comensales las puntúan.
- Puntuar es **opcional por comida**. Si alguien no probó el postre lo deja vacío; no cuenta como cero.
- El lugar y el servicio se puntúan **una vez por comensal por salida**.
- La nota de un lugar en el feed es el promedio de todas las salidas de todos los usuarios.

### Preguntas abiertas

1. **¿El gasto es total de la mesa o por persona?** Hoy se asume total de la salida, cargado por quien la creó. Si querés split de cuenta, es otro alcance.
2. **¿Cómo se invita a alguien sin cuenta?** Se asume que solo se invita a usuarios registrados, por handle o email.
3. **¿Se puede puntuar días después?** Se asume que sí: la salida queda abierta hasta que el creador la cierra.
4. **¿Las mesas son siempre privadas?** Hoy hay un flag `isPrivate` pero no existe el concepto de mesa pública.

---

## 3. Sistema de diseño

Violeta/lila suave. **Los fondos y superficies son lila muy claro; las acciones usan un violeta más profundo** que cumple contraste AA.

| Token | Hex | Uso |
|---|---|---|
| `lilac-50` | `#F8F6FE` | Fondo de la app |
| `lilac-100` | `#F0EAFD` | Superficies suaves, chips, campos |
| `lilac-200` | `#E0D5FB` | Bordes, separadores, hover |
| `lilac-300` | `#C7B2F7` | Bordes activos, iconos decorativos |
| `lilac-400` | `#A78BFA` | Acento suave |
| `lilac-500` | `#8B5CF6` | Acento medio, badges |
| **`lilac-600`** | **`#7343E0`** | **Primary. Botones, links, pestaña activa** |
| `lilac-700` | `#5B32B8` | Hover, texto violeta enfatizado |
| `foreground` | `#2E2A33` | Texto principal |
| `muted` | `#7A7385` | Texto secundario |
| `derulis` | `#F4B740` | Ámbar. El icono de puntuación lleno |
| `success` | `#16A34A` | Confirmaciones |
| `error` | `#DC2626` | Errores |

**Por qué `lilac-600` y no un violeta más pastel:** `#BB5CF6` da 3.1:1 sobre blanco y falla AA. `#7343E0` da 5.8:1 en ambas direcciones. Lo suave lo aportan los fondos, no los botones.

**El derulis:** es la marca de puntuación, no una estrella genérica. Hoy es un tenedor y cuchillo en ámbar, vacío en `lilac-200`, siempre acompañado del valor numérico para accesibilidad.

Los tokens viven en un bloque `@theme` de `src/index.css` — Tailwind v4 no lee `tailwind.config.ts`.

**Tipografía:** Plus Jakarta Sans. Títulos semibold con tracking apretado, cuerpo 16px.

**Componentes:** botón primario pill de 48px; tarjetas blancas radio 16–24px con sombra difusa; inputs con fondo `lilac-100` sin borde; nav inferior de 4 pestañas (**Descubrir, Buscar, Mesas, Perfil**) con Mesas al centro elevado. Modo claro únicamente.

---

## 4. Pantallas

### Construidas ✅

| Ruta | Pantalla | Estado |
|---|---|---|
| `/login` · `/register` | Auth | Conectadas a la API real |
| `/discover` | Home: armá una mesa, mesas activas, actividad reciente | Datos mock |
| `/tables/new` | Alta de mesa (nombre + descripción) | Mock |
| `/tables/:tableId` | Detalle de mesa: miembros, próxima salida, visitas | Mock |
| `/reviews/:reviewId` | Detalle de reseña | Solo el nombre del lugar |

### Faltan 🔲

Por prioridad:

1. **`/tables/:tableId/invite`** — buscar usuarios por handle o email y sumarlos.
2. **`/tables/:tableId/outings/new`** — proponer lugar y fecha.
3. **Carga de reseña** — puntuar comidas, lugar y servicio, con el gasto.
4. **`/places/new`** — alta de lugar: nombre, dirección, instagram, foto por defecto.
5. **`/tables`** — listado de mesas.
6. **`/profile`** — estadísticas y opciones (hoy solo muestra usuario y cerrar sesión).
7. **`/search`** — buscador de lugares con filtros.
8. **`/places/:placeId`** — detalle de lugar con promedio y gasto real.

---

## 5. Backend

### Lo que existe

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password, name }` | `201` → `{ accessToken, user }` |
| POST | `/auth/login` | `{ email, password }` | `200` → `{ accessToken, user }` |
| GET | `/users` | — | `200` → `User[]` (requiere token) |

JWT en `Authorization: Bearer <token>`, vence a los 7 días.
`409` email duplicado · `401` credenciales inválidas.

Ya configurado: CORS, `ValidationPipe` global y guard JWT global con `@Public()`.

### Entidades a crear

```
User          + handle (único, para invitar por @)

Place         name, address, instagram, photoUrl (default), createdById

Table         name, description, isPrivate, createdById
TableMember   tableId, userId, status(invited|accepted)   ← único (table,user)

Outing        tableId, placeId, dateTime, booked,
              totalSpend, status(planned|done|cancelled)
OutingGuest   outingId, userId                            ← quién fue realmente

Meal          outingId, name, price (opcional)
MealRating    mealId, userId, derulis(1-5), comment       ← único (meal,user)
OutingRating  outingId, userId, place(1-5), service(1-5)  ← único (outing,user)
```

**Notas de implementación:**

- Los ratings necesitan **índice único compuesto**: un comensal puntúa cada cosa una sola vez.
- Los montos van en **enteros (centavos)**, nunca float. Definir moneda desde el arranque.
- `Table` choca con `TABLE` de SQL: la tabla física necesita un nombre explícito distinto (por ejemplo `@Entity('tables')`) y hay que citarlo en queries crudas.
- `photoUrl` apunta a una imagen por defecto hasta que haya storage. Fotos de lugares y comidas son alcance futuro.
- **Autorizar por pertenencia, no solo por login**: solo los miembros de una mesa pueden verla o puntuar sus salidas.

---

## 6. Requisitos no negociables

- **Accesibilidad:** contraste AA (4.5:1) — `lilac-600` o más oscuro para texto sobre fondo claro. Área táctil ≥44×44px. Los derulis siempre con su valor numérico, no solo el icono.
- **Estados:** toda vista con datos necesita carga, error y vacío. No entregar solo el caso feliz.
- **Comer solo es de primera clase.** Nunca bloquear un flujo por falta de invitados.
- **Formularios:** validar en cliente lo mismo que el servidor. Los esquemas zod del front espejan los DTO de class-validator del back.
- **Dinero:** enteros en centavos, formateo con `Intl` en `es-AR`.
- **Fechas:** `Intl` con `hour12: false`. Nunca `capitalize` en fechas — pone mayúscula en cada palabra.
- **Seguridad:** nunca mostrar token ni contraseña. Cerrar sesión borra el token.
- **Rendimiento:** imágenes diferidas con placeholder. Feeds paginados de a 10.

---

## 7. Estado del frontend

`derulis/deruli-front` — Vite 8, React 19, TanStack Query, React Router 7, Tailwind v4, react-hook-form + zod, react-icons.

**Organización:** por features en `src/features/{auth,discover,tables,reviews,places,profile}`, cada una con `api/`, `hooks/`, `components/`, `pages/`, `types.ts`. Todo lo que no existe en el backend se consume desde un mock en `api/`, para reemplazarlo sin tocar componentes.

**Deuda conocida:**

- Los mocks viven en memoria: recargar la página entera reinicia los datos.
- El bundle pasó los 500 kB; conviene code-splitting por ruta antes de producción.
- El detalle de reseña muestra solo el nombre del lugar.
- No hay tests.
