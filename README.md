# Sistema Web de Evaluación Docente — UPTX

## Proyecto de Tesina para Titulación

### Información General
*   **Institución:** Universidad Politécnica de Texcoco (UPTEX)
*    **desarrolladores:** Espinoza Merlin Luis José, keny Alexa Gonzales Becerril
*   **Asesor de Tesina:** Gerardo Miguel Sanchez
*   **Coautor:** LUNA BECERRIL EDURNET JHAQUELIN

---

##  Descripción del Proyecto
Este sistema ha sido desarrollado para automatizar y modernizar el proceso de evaluación del desempeño docente en la UPTX. Implementa el instrumento oficial **FDA-24.5**, garantizando la integridad de los datos, la anonimidad de las respuestas y la generación eficiente de reportes institucionales.

### Módulos Principales
*   **Módulo de Administrador:** Gestión de carreras, docentes, alumnos, periodos académicos e importación masiva de datos vía CSV con auditoría de cambios.
*   **Módulo de Alumno:** Interfaz intuitiva para responder evaluaciones asignadas a su grupo, con verificación de cumplimiento único por periodo/materia.
*   **Módulo de Docente:** Acceso a resultados detallados de evaluaciones, promedios por materia y visualización de comentarios con preservación de anonimato estudiantil.

---

## Stack Tecnológico
*   **Framework:** [Next.js 14+](https://nextjs.org) (App Router, Server Actions)
*   **Base de Datos:** [PostgreSQL](https://www.postgresql.org) con [Prisma ORM](https://www.prisma.io)
*   **Autenticación:** [NextAuth.js](https://next-auth.js.org) (JWT, Roles: ADMIN, DOCENTE, ALUMNO)
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com) y Lucide Icons
*   **Reportes:** [jsPDF](https://github.com/parallax/jsPDF) para generación de PDFs institucionales (Client-side)
*   **Gráficas:** [Recharts](https://recharts.org) para analítica visual del desempeño

---

## 📌 Características Destacadas para Evaluadores
1.  **Instrumento FDA-24.5:** Implementación fiel de los 33 ítems divididos en 5 secciones teóricas y prácticas.
2.  **Seguridad por Roles:** Middleware de Next.js para protección estricta de rutas y APIs.
3.  **Auditoría de Datos:** Registro automático de acciones administrativas (`AdminLog`) e importaciones (`ImportLog`).
4.  **Escalabilidad:** Arquitectura preparada para el manejo de múltiples carreras y grandes volúmenes de estudiantes vía importación asíncrona.
5.  **Accesibilidad:** Diseño Responsivo compatible con dispositivos móviles y escritorio.

---

## ⚙️ Configuración del Entorno de Desarrollo

1.  **Clonar el repositorio:**
    ```bash
    git clone [url-del-repositorio]
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Variables de Entorno (.env):**
    Configurar `DATABASE_URL` (PostgreSQL) y `NEXTAUTH_SECRET`.

4.  **Sincronizar DB y Seed:**
    ```bash
    npx prisma db push
    npx prisma db seed
    ```

5.  **Iniciar Servidor:**
    ```bash
    npm run dev
    ```

---
© 2026 Sistema de Evaluación Docente — UPTX. Todos los derechos reservados.
