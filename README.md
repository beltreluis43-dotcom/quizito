# ClaseQuiz para Veltramon

Aplicación Next.js con PostgreSQL. Permite que el profesor cree preguntas de verdadero/falso o A–B–C y consulte las puntuaciones de los alumnos.

## Despliegue

1. Sube esta carpeta a un repositorio de GitHub.
2. En Veltramon crea una aplicación Node.js desde ese repositorio.
3. Crea o conecta una base de datos PostgreSQL.
4. Añade estas variables en el panel de secretos:
   - `DATABASE_URL`: conexión completa de PostgreSQL.
   - `QUIZ_TEACHER_PIN`: PIN privado del profesor.
   - `DATABASE_SSL=true`: usa `false` solo si la base de datos local no ofrece TLS.
5. Comando de instalación: `npm install` o `npm ci` después de generar `package-lock.json`.
6. Comando de compilación: `npm run build`.
7. Comando de inicio: `npm start`.
8. Expón el puerto indicado por `PORT`; la aplicación usa 3000 cuando no se proporciona.

Al arrancar, `npm start` ejecuta una migración segura e idempotente que crea las tablas necesarias.

## Desarrollo local

```bash
cp .env.example .env.local
npm install
npm run migrate
npm run dev
```

No subas `.env` ni `.env.local` al repositorio.
