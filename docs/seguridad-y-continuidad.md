# Seguridad y continuidad operativa

## Cifrado de la informacion

El despliegue institucional del proyecto se sustenta sobre **Supabase PostgreSQL**, lo que permite cubrir el almacenamiento cifrado a nivel de infraestructura:

- **Cifrado en reposo y en transito** para la base de datos administrada por Supabase.
- **SSL enforcement** para obligar conexiones cifradas hacia PostgreSQL.
- **Hash bcrypt** para credenciales dentro de la aplicacion.

Referencias oficiales:

- [Supabase - Shared Responsibility Model](https://supabase.com/docs/guides/deployment/shared-responsibility-model)
- [Supabase - Features](https://supabase.com/docs/guides/getting-started/features)
- [Supabase - SSL Enforcement API](https://supabase.com/docs/reference/api/start)

## Respaldo diario

El entorno productivo en Supabase ofrece:

- **Respaldos diarios administrados por la plataforma**
- opcion de **Point in Time Recovery** para recuperacion avanzada

Como respaldo complementario del proyecto se incluyen:

- `scripts/backup.bat`
- `scripts/daily-backup-task.bat`
- `scripts/register-daily-backup-task.ps1`
- `scripts/unregister-daily-backup-task.ps1`
- `scripts/restore.bat`

## Checklist de verificacion para entrega

1. Confirmar que la base institucional usada en produccion sea un proyecto Supabase o infraestructura equivalente con cifrado en reposo.
2. Verificar que las conexiones a PostgreSQL operen con SSL.
3. Confirmar en el panel de Supabase que los respaldos diarios esten habilitados.
4. Conservar la evidencia de restauracion de un respaldo de prueba.
5. Validar que las contrasenas sigan almacenadas con bcrypt.
