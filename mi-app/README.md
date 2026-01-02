# Sistema de Gestión de Iglesia

Aplicación para gestión de **miembros, ingresos y gastos** de una iglesia con **React + Vite + PWA** en el frontend, **Supabase + PostgreSQL** en el backend, y **soporte offline** con IndexedDB + React Query.

## 🚀 Características

- ✅ **PWA** - Instalable y funciona offline
- ✅ **Modo Offline** - Los datos se guardan localmente y sincronizan automáticamente
- ✅ **Autenticación** - Login/registro con roles (Pastor/Secretario)
- ✅ **Gestión de Miembros** - CRUD con sectores y posiciones
- ✅ **Ingresos** - Diezmos, ofrendas, pro-templo
- ✅ **Gastos** - Control de egresos con comprobantes
- ✅ **RLS** - Seguridad a nivel de fila en PostgreSQL
- ✅ **TypeScript** - Tipado completo

## 📁 Estructura del Proyecto

```
mi-app/
├── frontend/           # React + Vite + PWA
│   ├── src/
│   │   ├── app/        # Configuración global
│   │   ├── components/ # UI y Layout
│   │   ├── features/   # members, income, expenses, sectors, auth
│   │   ├── lib/        # supabase, react-query, indexeddb
│   │   ├── services/   # syncService, offlineQueue
│   │   ├── hooks/      # useOffline, useAuth
│   │   ├── store/      # sessionStore
│   │   └── types/      # database types
│   └── public/
├── supabase/           # Backend
│   ├── functions/      # Edge Functions
│   ├── migrations/     # Schema SQL
│   └── triggers/
├── shared/             # Tipos y constantes
└── .env
```

## 🛠️ Instalación

### 1. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. En el SQL Editor, ejecuta: `supabase/migrations/001_schema.sql`
3. Copia las credenciales a `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 2. Instalar dependencias

```bash
cd frontend
npm install
```

### 3. Iniciar desarrollo

```bash
npm run dev
```

## 📊 Base de Datos

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Usuarios (pastor/secretario) |
| `sectors` | 6 sectores predefinidos |
| `members` | Miembros de la iglesia |
| `income` | Diezmos, ofrendas, donaciones |
| `expenses` | Gastos y egresos |

## 📱 Modo Offline

- **IndexedDB**: Almacena members, income, expenses localmente
- **Cola Offline**: Encola operaciones cuando no hay conexión
- **Auto-sync**: Sincroniza cuando vuelve la conexión

## 📄 Licencia

MIT
