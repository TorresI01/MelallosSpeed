# Melallos Speed

Sitio estático en español para el catálogo y contacto de Melallos Speed. No procesa pagos. Con Supabase configurado, guarda las solicitudes autorizadas y permite administrar la operación desde un panel privado; WhatsApp se usa para continuar la conversación comercial.

## Estructura

```text
.
├── index.html
├── admin.html
├── privacidad.html
├── cookies.html
├── derechos-autor.html
├── assets/
│   ├── css/
│   │   ├── styles.css
│   │   └── admin.css
│   ├── images/
│   └── js/
│       ├── app.js
│       ├── admin.js
│       └── supabase-config.js
├── supabase/schema.sql
└── README.md
```

Los recursos usan rutas relativas para funcionar tanto en un dominio propio como en una URL de proyecto de GitHub Pages.

## Preparar Supabase y el panel privado

1. Crea un proyecto en Supabase y guarda el correo y la contraseña de acceso del administrador en un gestor de contraseñas.
2. En **SQL Editor**, ejecuta una sola vez el contenido de `supabase/schema.sql`. Crea las tablas, activa RLS, configura los permisos, carga el catálogo inicial con stock en cero, crea el bucket de fotos y prepara informes.
3. En **Authentication → Users**, crea/invita tu usuario de administración. Desactiva el registro público de usuarios en **Authentication → Settings**.
4. En SQL Editor, autoriza únicamente el correo del administrador, reemplazando el ejemplo:

   ```sql
   insert into public.admin_users (email)
   values (lower('tu-correo-admin@ejemplo.com'));
   ```

5. En **Project Settings → API**, copia el Project URL y la clave **publishable** (o la antigua `anon` pública) en `assets/js/supabase-config.js`. Estas claves son públicas para una web estática; la base de datos queda protegida por RLS. **Nunca uses `service_role` ni una clave secreta en el navegador o el repositorio.**
6. En Supabase, configura los URL permitidos de autenticación con la dirección pública de GitHub Pages y la dirección local desde la que probarás el sitio.
7. Abre `admin.html` en la URL publicada e inicia sesión. Si no tienes una contraseña, usa **¿Olvidaste tu contraseña?** para recibir un enlace seguro y crearla. Las fotos nuevas se suben al bucket `product-images`; las fotos del repositorio siguen usando rutas como `assets/images/arai-01.jpg`.
8. Revisa y actualiza el stock real antes de vender. El esquema inicial carga cero unidades para no inventar existencias. Registra las ventas desde el panel: se valida y descuenta stock en la base de datos; para corregir una venta, anúlala y registra una nueva.

El panel no ofrece registro público: para dar acceso a otra persona se requiere agregarla expresamente al allowlist de administradores. La clave `publishable` no es contraseña; privacidad y seguridad dependen de no exponer una `service_role`, mantener el allowlist y conservar activas las políticas RLS.

Los mensajes de WhatsApp se preparan con los datos de la consulta, organizados en líneas con guiones.

El panel incluye resumen, productos, stock y movimientos, clientes, encargos, ventas, gastos, proveedores, informes de los últimos 12 meses y exportación CSV por página. Mantén activas las copias de seguridad del proyecto y descarga periódicamente una copia de los datos importantes. El proyecto de Supabase de Melallos Speed ya está conectado en `assets/js/supabase-config.js`, el esquema se encuentra instalado y el usuario administrador quedó invitado y autorizado. El primer acceso depende de aceptar la invitación enviada al correo administrador.

El formulario público limita los permisos de escritura con RLS y exige autorización, pero no incluye un CAPTCHA ni un límite de frecuencia del lado servidor. Si el formulario recibe spam, añade una verificación anti-bots (por ejemplo, con una Supabase Edge Function) antes de aceptar tráfico público.

## Publicar en GitHub Pages

1. Crea un repositorio público en GitHub y sube el contenido de esta carpeta a la rama `main`.
2. En el repositorio, abre **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`, y guarda.
4. Espera a que termine el despliegue y abre la URL que GitHub Pages muestra en esa pantalla. Después, verifica el sitio público y `/admin.html` en un teléfono y en un computador.
5. Si conectas un dominio propio, configúralo en GitHub Pages y actualiza la URL pública en los metadatos cuando la tengas.

## Revisión antes del lanzamiento

- Confirma que las fotos y los nombres/modelos publicados correspondan a productos que puedes ofrecer.
- Verifica precios, tallas, disponibilidad, certificaciones, condiciones de separación, entregas, crédito, garantías y cambios.
- Revisa los datos comerciales que exige publicar tu actividad y confirma que las políticas de privacidad, cookies y derechos de autor describan la operación real. Estos textos son un borrador informativo y no sustituyen una revisión jurídica.
- Completa la razón social/nombre legal y NIT del responsable en `privacidad.html`; el nombre comercial se usa provisionalmente.
- Prueba desde un dispositivo real los enlaces de WhatsApp, Instagram, Google Maps y el formulario de encargos.
- Añade la URL pública definitiva a los metadatos sociales/SEO si vas a compartir el enlace en redes o registrar el sitio en buscadores.

## Actualizar el catálogo

Edita la lista `PRODUCTOS` y los precios por categoría en `assets/js/app.js`. Las imágenes deben estar dentro de `assets/images/` y sus rutas deben escribirse de forma relativa, por ejemplo `assets/images/arai-01.jpg`.
