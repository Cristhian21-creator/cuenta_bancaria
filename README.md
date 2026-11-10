# 🏦 Banco Andino — Aplicación bancaria Full-Stack

Aplicación web bancaria para consultar saldo, **depositar**, **retirar** y **transferir** dinero entre cuentas, con historial de movimientos. Las operaciones se guardan en una base de datos **MongoDB local** y las transferencias usan **transacciones atómicas** de MongoDB (si algo falla, no se mueve nada).

## 📚 Tabla de contenido

1. [Tecnologías utilizadas](#-tecnologías-utilizadas)
2. [Requisitos previos](#-requisitos-previos)
3. [Estructura del proyecto](#-estructura-del-proyecto)
4. [Instalación de dependencias](#-instalación-de-dependencias)
5. [Configuración de MongoDB local y replica set](#-configuración-de-mongodb-local-y-replica-set)
6. [Configuración de variables de entorno (.env)](#-configuración-de-variables-de-entorno-env)
7. [Ejecutar el seed (cuentas de prueba)](#-ejecutar-el-seed-cuentas-de-prueba)
8. [Iniciar backend y frontend](#-iniciar-backend-y-frontend)
9. [Rutas de la API REST](#-rutas-de-la-api-rest)
10. [Cuentas de prueba](#-cuentas-de-prueba)
11. [Cómo realizar las operaciones](#-cómo-realizar-las-operaciones)
12. [Guion sugerido para la demostración](#-guion-sugerido-para-la-demostración)
13. [Solución de errores comunes](#-solución-de-errores-comunes)
14. [Subir el proyecto a GitHub](#-subir-el-proyecto-a-github)

---

## 🛠 Tecnologías utilizadas

| Capa | Tecnologías |
|---|---|
| Backend | Node.js, Express.js, JavaScript ES6+ (módulos), Mongoose, API REST, dotenv, CORS |
| Base de datos | MongoDB local con **replica set** (necesario para transacciones) |
| Frontend | React, Vite, JSX, Hooks (`useState`, `useEffect`), Tailwind CSS, Fetch API |
| Iconos | lucide-react |

## ✅ Requisitos previos

- **Node.js 20 LTS o superior** (incluye npm). Comprueba con `node -v`.
- **MongoDB Community Server 7.x u 8.x** instalado localmente.
- **MongoDB Shell (`mongosh`)** para iniciar el replica set.
- **Git** (para subir a GitHub).
- (Opcional) **MongoDB Compass** y **Postman / Thunder Client** para pruebas.

## 📁 Estructura del proyecto

```
banco-fullstack/
├── server/
│   ├── src/
│   │   ├── config/database.js          # Conexión a MongoDB y verificación del replica set
│   │   ├── models/Cuenta.js            # Modelo de cuenta
│   │   ├── models/Transaccion.js       # Modelo de transacción
│   │   ├── controllers/cuentaController.js  # Lógica de negocio (transacciones atómicas)
│   │   ├── routes/cuentaRoutes.js      # Rutas REST
│   │   ├── middleware/errorHandler.js  # Manejo centralizado de errores
│   │   ├── utils/validators.js         # Validaciones de monto, identificadores y descripción
│   │   ├── seed/seed.js                # Cuentas de prueba
│   │   └── app.js                      # Servidor Express
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── SaldoCard.jsx
│   │   │   ├── InfoCuenta.jsx
│   │   │   ├── Operaciones.jsx         # Pestañas de operaciones
│   │   │   ├── FormOperacion.jsx       # Formulario reutilizable (depósito/retiro/transferencia)
│   │   │   ├── HistorialTransacciones.jsx
│   │   │   ├── Notificacion.jsx
│   │   │   └── Loading.jsx
│   │   ├── services/cuentaService.js   # Consumo de la API REST
│   │   ├── config/cuentasDemo.js       # Cuentas de prueba del selector
│   │   ├── utils/formato.js            # Formato de moneda y fecha
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── README.md
└── .gitignore
```

## 📦 Instalación de dependencias

Desde la carpeta raíz del proyecto:

```bash
cd server
npm install

cd ../client
npm install
```

## 🍃 Configuración de MongoDB local y replica set

### ¿Por qué un replica set?

Las **transacciones multidocumento** de MongoDB (necesarias para que una transferencia debite una cuenta y acredite otra de forma atómica) **solo funcionan en un replica set**. Una instalación local por defecto es un servidor "standalone" y, sin replica set, verás el error *"Transaction numbers are only allowed on a replica set member or mongos"*.

Un replica set de **un solo nodo** es suficiente para desarrollo. Elige tu sistema operativo:

### 🪟 Windows (MongoDB instalado como servicio)

1. Abre el archivo de configuración como **Administrador** (la versión puede variar, por ejemplo `8.0`):

   ```
   C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg
   ```

2. Agrega estas líneas al final (respeta la indentación; sin tabulaciones):

   ```yaml
   replication:
     replSetName: rs0
   ```

3. Reinicia el servicio desde **PowerShell como Administrador**:

   ```powershell
   net stop MongoDB
   net start MongoDB
   ```

4. Inicia el replica set (**solo se hace una vez**):

   ```powershell
   mongosh "mongodb://127.0.0.1:27017"
   ```

   Dentro de `mongosh`:

   ```javascript
   rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })
   ```

5. Espera unos segundos y comprueba que el prompt diga `rs0 [direct: primary]` o ejecuta `rs.status().ok` (debe dar `1`).

### 🪟 Windows / 🐧 Linux / 🍎 macOS (alternativa: ejecutar mongod manualmente)

Si prefieres no tocar el servicio, detén el servicio de MongoDB y ejecuta en una terminal (déjala abierta):

```bash
# Crea la carpeta de datos una vez (ejemplo)
mkdir -p ~/mongo-data           # Windows: mkdir C:\mongo-data

# Inicia mongod con replica set
mongod --replSet rs0 --dbpath ~/mongo-data --bind_ip 127.0.0.1 --port 27017
# Windows: mongod --replSet rs0 --dbpath C:\mongo-data --bind_ip 127.0.0.1 --port 27017
```

En **otra** terminal inicia el replica set (solo la primera vez):

```bash
mongosh "mongodb://127.0.0.1:27017" --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
```

### 🐧 Linux (servicio systemd)

```bash
sudo nano /etc/mongod.conf
```

Agrega:

```yaml
replication:
  replSetName: rs0
```

```bash
sudo systemctl restart mongod
mongosh --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
```

### 🍎 macOS (Homebrew)

```bash
# Apple Silicon: /opt/homebrew/etc/mongod.conf   |   Intel: /usr/local/etc/mongod.conf
nano /opt/homebrew/etc/mongod.conf
```

Agrega:

```yaml
replication:
  replSetName: rs0
```

```bash
brew services restart mongodb-community
mongosh --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
```

> 💡 `rs.initiate` se ejecuta **una sola vez**: la configuración queda guardada en los datos de MongoDB. Si MongoDB se reinicia, el replica set vuelve a arrancar solo.

## 🔐 Configuración de variables de entorno (.env)

### Backend (`server/.env`)

Copia el ejemplo y edítalo si es necesario:

```bash
cd server
cp .env.example .env          # Windows: copy .env.example .env
```

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto donde corre la API | `5000` |
| `MONGODB_URI` | Cadena de conexión a MongoDB local. Debe incluir `?replicaSet=rs0` | `mongodb://127.0.0.1:27017/banco?replicaSet=rs0` |
| `CLIENT_URL` | Origen(es) permitido(s) por CORS (el frontend). Varios separados por coma | `http://localhost:5173` |

### Frontend (`client/.env`)

```bash
cd client
cp .env.example .env          # Windows: copy .env.example .env
```

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API REST | `http://localhost:5000/api` |

> Los archivos `.env` **no se suben a GitHub** (están en `.gitignore`). Solo se suben los `.env.example`.

## 🌱 Ejecutar el seed (cuentas de prueba)

Con MongoDB corriendo:

```bash
cd server
npm run seed          # Crea solo las cuentas que no existan (NO duplica)
npm run seed:reset    # BORRA cuentas y transacciones y las vuelve a crear (deja los saldos iniciales)
```

Úsalo antes de la demostración para empezar con saldos limpios: `npm run seed:reset`.

## ▶️ Iniciar backend y frontend

Necesitas **dos terminales**:

**Terminal 1 – Backend**

```bash
cd server
npm run dev       # con recarga automática (nodemon)
# o: npm start
```

Debes ver:

```
✅ MongoDB conectado: 127.0.0.1:27017/banco
✅ Replica set activo: rs0
🚀 API bancaria escuchando en http://localhost:5000
```

Comprobación rápida: abre `http://localhost:5000/api/health` en el navegador.

**Terminal 2 – Frontend**

```bash
cd client
npm run dev
```

Abre **http://localhost:5173** en el navegador.

## 🔌 Rutas de la API REST

Base URL: `http://localhost:5000/api`. Las cuentas se pueden identificar por **número de cuenta** (ej. `1001`) o por `_id` de MongoDB.

Todas las respuestas son JSON. Éxito: `{ "ok": true, ... }`. Error: `{ "ok": false, "error": "mensaje" }`.

| Método | Ruta | Descripción | Body |
|---|---|---|---|
| GET | `/cuenta/:id` | Datos y saldo de una cuenta | — |
| POST | `/cuenta/deposito` | Registra un depósito | `{ "cuentaId": "1001", "monto": 100, "descripcion": "opcional" }` |
| POST | `/cuenta/retiro` | Registra un retiro | `{ "cuentaId": "1001", "monto": 50, "descripcion": "opcional" }` |
| POST | `/cuenta/transferencia` | Transfiere entre cuentas (atómica) | `{ "cuentaOrigen": "1001", "cuentaDestino": "1002", "monto": 75, "descripcion": "opcional" }` |
| GET | `/cuenta/:id/historial?limite=20` | Últimos movimientos (más reciente primero; `limite` de 1 a 100) | — |
| GET | `/health` | Estado del servidor (extra, para diagnóstico) | — |

### Códigos HTTP

| Código | Cuándo |
|---|---|
| `200` | Consulta correcta |
| `201` | Depósito, retiro o transferencia registrados |
| `400` | Datos inválidos (monto ≤ 0, no numérico, más de 2 decimales, identificador inválido), saldo insuficiente, transferencia a la misma cuenta, cuenta inactiva |
| `404` | Cuenta inexistente o ruta no encontrada |
| `500` | Error interno (por ejemplo, MongoDB sin replica set) |

### Ejemplos con curl

```bash
# Consultar saldo
curl http://localhost:5000/api/cuenta/1001

# Depósito
curl -X POST http://localhost:5000/api/cuenta/deposito \
  -H "Content-Type: application/json" \
  -d '{"cuentaId":"1001","monto":100.50}'

# Retiro
curl -X POST http://localhost:5000/api/cuenta/retiro \
  -H "Content-Type: application/json" \
  -d '{"cuentaId":"1001","monto":50}'

# Transferencia
curl -X POST http://localhost:5000/api/cuenta/transferencia \
  -H "Content-Type: application/json" \
  -d '{"cuentaOrigen":"1001","cuentaDestino":"1002","monto":75,"descripcion":"Pago de prueba"}'

# Historial
curl "http://localhost:5000/api/cuenta/1001/historial?limite=10"
```

> En **PowerShell** usa `curl.exe` (no el alias `curl`) y escapa las comillas del JSON, o usa Postman / Thunder Client.

## 👥 Cuentas de prueba

| N.º de cuenta | Titular | Saldo inicial |
|---|---|---|
| `1001` | Ana Torres Quispe | PEN 5,000.00 |
| `1002` | Luis Rojas Mendoza | PEN 1,500.00 |
| `1003` | María Salazar Huamán | PEN 250.75 |

En la interfaz puedes cambiar de cuenta con el selector de la barra superior.

## 💳 Cómo realizar las operaciones

1. Selecciona la cuenta activa en la barra superior.
2. En **Operaciones bancarias** elige la pestaña **Depositar**, **Retirar** o **Transferir**.
3. Completa el monto (y la cuenta destino en transferencias, por ejemplo `1002`).
4. Pulsa el botón. Verás un estado de carga, luego una **notificación** de éxito o error.
5. El **saldo** y el **historial** se actualizan solos, sin recargar la página, y el formulario se limpia.

El botón se bloquea mientras se procesa la operación para evitar duplicados por múltiples clics.

## 🎤 Guion sugerido para la demostración

1. `npm run seed:reset` para dejar los saldos iniciales.
2. Mostrar el saldo de la cuenta `1001` (5,000.00).
3. **Depósito** de 200 → saldo 5,200.00 y aparece en el historial.
4. **Retiro** de 100 → saldo 5,100.00.
5. **Retiro** mayor al saldo → error "Saldo insuficiente" (el saldo no cambia).
6. **Transferencia** de 500 a `1002` → baja el saldo de 1001; cambia a la cuenta 1002 con el selector y muestra que subió a 2,000.00.
7. **Transferencia** a `1001` desde la misma cuenta, o a `9999` → mensajes de error.
8. Mostrar en Compass las colecciones `cuentas` y `transaccions` para evidenciar la persistencia.
9. Explicar la atomicidad: la transferencia usa `session.withTransaction`; si falla cualquier paso se revierte todo.

## 🧯 Solución de errores comunes

| Problema | Causa y solución |
|---|---|
| `MongoServerSelectionError` / `ECONNREFUSED 127.0.0.1:27017` | MongoDB no está corriendo. Inicia el servicio (`net start MongoDB`, `brew services start mongodb-community`, `sudo systemctl start mongod`) o ejecuta `mongod --replSet rs0 ...`. |
| `Transaction numbers are only allowed on a replica set member or mongos` | MongoDB no es un replica set. Sigue la sección [Configuración del replica set](#-configuración-de-mongodb-local-y-replica-set). |
| Aviso `MongoDB NO está corriendo como replica set` al iniciar | Falta `replSetName` en la configuración o no ejecutaste `rs.initiate(...)`. |
| `MongoServerSelectionError: ... getaddrinfo` o la conexión se queda esperando | Usa `127.0.0.1` en lugar de `localhost` en `MONGODB_URI` y en `rs.initiate`. Verifica que el `host` del replica set sea `127.0.0.1:27017` (`rs.conf()`). |
| `rs.initiate` dice `already initialized` | Ya estaba configurado; no hace falta repetirlo. |
| `Falta la variable MONGODB_URI` | No existe `server/.env`. Copia `.env.example` a `.env`. |
| El frontend muestra "No se pudo conectar con el servidor" | El backend no está corriendo, el puerto no coincide con `VITE_API_URL`, o falta reiniciar `npm run dev` del cliente tras crear/editar `client/.env`. |
| Error de CORS en la consola del navegador | `CLIENT_URL` del backend no coincide con la URL del frontend (por ejemplo, otro puerto). Corrígelo en `server/.env` y reinicia el backend. |
| `Port 5000 is already in use` (`EADDRINUSE`) | Cambia `PORT` en `server/.env` (y `VITE_API_URL` en el cliente) o cierra el proceso que usa el puerto. En macOS el puerto 5000 puede estar ocupado por AirPlay: usa `PORT=5001`. |
| `"La cuenta (1002) no existe"` | No ejecutaste el seed. Corre `npm run seed`. |
| `'mongod' no se reconoce como comando` (Windows) | Agrega `C:\Program Files\MongoDB\Server\<versión>\bin` al PATH o ejecútalo con la ruta completa. |
| Error al instalar dependencias o iniciar Vite | Verifica `node -v` (≥ 20). Borra `node_modules` y `package-lock.json` y ejecuta `npm install` de nuevo. |

## 🚀 Subir el proyecto a GitHub

```bash
# En la carpeta raíz banco-fullstack
git init
git add .
git commit -m "Aplicación bancaria Full-Stack"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/banco-fullstack.git
git push -u origin main
```

Antes de subir, comprueba con `git status` que **no** aparezcan `node_modules/` ni archivos `.env`.

---

### 🔒 Notas de diseño y seguridad

- **Atomicidad:** depósitos, retiros y transferencias usan `session.withTransaction()`. Ante cualquier error, MongoDB revierte todos los cambios.
- **Saldos nunca negativos:** el débito se hace con `findOneAndUpdate({ saldo: { $gte: monto } })`, condición evaluada de forma atómica en la base de datos. Así, incluso con peticiones simultáneas, no se puede sobregirar.
- **Validaciones:** monto numérico, mayor que cero, máximo 2 decimales y tope por operación; identificadores validados; cuentas activas y de la misma moneda.
- **Credenciales fuera del código:** todo en variables de entorno (`dotenv`); CORS restringido al origen del frontend; límite de tamaño del cuerpo JSON.
- **Errores centralizados:** un único middleware responde JSON consistente y no expone detalles internos en errores 500.
