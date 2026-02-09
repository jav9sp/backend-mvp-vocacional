📊 Portal Vocacional - Backend MVP
Es un sistema completo para orientación vocacional y gestión de admisión universitaria en Chile.

🎯 Funcionalidades Principales
Test Vocacional INAPV

103 preguntas distribuidas en 10 áreas vocacionales
Mide intereses y aptitudes
Genera reportes PDF personalizados
Recomienda carreras basadas en resultados
Gestión de Usuarios Multi-org

3 roles: student, admin, superadmin
Sistema multi-organización (separación por institución)
Autenticación JWT + bcrypt
Gestión de períodos de evaluación
Ofertas Académicas

Catálogo completo de programas universitarios chilenos (DEMRE)
Búsqueda por institución, carrera, área, ubicación
Sistema de favoritos
Filtros: PACE, gratuidad, puntajes de corte
Perfil Académico

Gestión de puntajes PAES (CL, M1, M2, Ciencias, Historia)
Conversión automática NEM a puntaje
3 tipos de educación: HC, HC Adultos, TP
🏗️ Arquitectura
Stack: Node.js + Express + TypeScript + Sequelize + PostgreSQL
16 modelos de datos con relaciones complejas
Validación: Zod schemas en runtime
PDFs: Puppeteer para generación de reportes
Migraciones: 8 migraciones SQL con node-pg-migrate
📁 Estructura Clave

src/
├── models/ → 16 entidades (User, Test, Attempt, Period, etc.)
├── controllers/ → Admin, Student, Auth, Offers
├── routes/ → +15 archivos de rutas organizados
├── services/ → scoring, NEM conversion, PDF generation
├── middlewares/ → Auth, roles, validaciones
└── data/ → INAPV (103 preguntas + interpretaciones)
🔐 Seguridad
Tokens JWT (8h expiry)
Scoping estricto por organización
Role-based access control
Validación de propiedad en todos los endpoints
