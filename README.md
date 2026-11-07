# Melallos Speed

Sitio estático en español para el catálogo y contacto de Melallos Speed. No procesa pagos. Con Supabase configurado, guarda las solicitudes autorizadas y permite administrar la operación desde un panel privado; WhatsApp se usa para continuar la conversación comercial.

## Estructura

```text
.
├── index.html
├── admin.html
├── aviso-legal.html
├── privacidad.html
├── cookies.html
├── derechos-autor.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── css/
│   │   ├── styles.css
│   │   └── admin.css
│   ├── images/
│   └── js/
│       ├── app.js
│       ├── admin.js
│       ├── consent.js
│       └── supabase-config.js
├── supabase/schema.sql
├── supabase/anti-spam.sql
└── README.md
```

Los recursos usan rutas relativas para funcionar tanto en un dominio propio como en una URL de proyecto de GitHub Pages.

## Preparar Supabase y el panel privado

1. Crea un proyecto en Supabase y guarda el correo y la contraseña de acceso del administrador en un gestor de contraseñas.
2. En **SQL Editor**, ejecuta el contenido de `supabase/schema.sql`. Crea las tablas, activa RLS, configura los permisos, carga el catálogo inicial con stock en cero, crea el bucket de fotos y prepara informes. Si el proyecto ya existe, vuelve a ejecutar el archivo actualizado para aplicar los cambios de seguridad y permisos; también revoca permisos de inserción por columna que pudieron quedar de configuraciones anteriores.
3. En **Authentication → Users**, crea/invita tu usuario inicial de administración y configura el envío de correos de autenticación. Desactiva el registro público de usuarios en **Authentication → Settings**.
4. En SQL Editor, autoriza únicamente el correo del administrador, reemplazando el ejemplo:

   ```sql
   insert into public.admin_users (email)
   values (lower('tu-correo-admin@ejemplo.com'));
   ```

5. En **Project Settings → API**, copia el Project URL y la clave **publishable** (o la antigua `anon` pública) en `assets/js/supabase-config.js`. Estas claves son públicas para una web estática; la base de datos queda protegida por RLS. **Nunca uses `service_role` ni una clave secreta en el navegador o el repositorio.**
6. En Supabase, configura los URL permitidos de autenticación con la dirección pública de GitHub Pages y la dirección local desde la que probarás el sitio.
7. Abre `admin.html` en la URL publicada e inicia sesión. Si no tienes una contraseña, usa **¿Olvidaste tu contraseña?** para recibir un código y cambiarla en el mismo panel. Configura primero la plantilla de restablecimiento descrita abajo. Las fotos nuevas se suben al bucket `product-images`; las fotos del repositorio siguen usando rutas como `assets/images/arai-01.jpg`.
8. Revisa y actualiza el stock real antes de vender. El esquema inicial carga cero unidades para no inventar existencias. Registra las ventas desde el panel: se valida y descuenta stock en la base de datos; para corregir una venta, anúlala y registra una nueva.

### Invitar a otro administrador

1. Instala y autentica [Supabase CLI](https://supabase.com/docs/guides/cli) para el mismo proyecto.
2. Configura el secreto `ADMIN_REDIRECT_URL` con la URL absoluta de `admin.html` en el sitio publicado (por ejemplo, `https://tu-dominio/admin.html`). Agrega esa URL a **Authentication → URL Configuration → Redirect URLs**:

   ```sh
   supabase secrets set ADMIN_REDIRECT_URL="https://tu-dominio/admin.html"
   ```

3. Verifica que el proyecto tenga el envío de correos de autenticación configurado. Desde la raíz del proyecto, publica la función que envía invitaciones:

   ```sh
   supabase functions deploy invite-admin
   ```

4. En el panel, abre **Administradores → Invitar administrador**. La persona recibirá un correo para activar su cuenta y definir su contraseña. La función valida que quien invita ya sea administrador y autoriza el correo únicamente después de enviar la invitación.

En **Administradores**, puedes migrar el correo de otro administrador con una invitación al correo nuevo o enviarle un código de restablecimiento. El cambio de correo retira la autorización anterior cuando la nueva invitación se envía; no permite cambiar el correo de la sesión propia. Las contraseñas no se muestran ni se definen en el panel.

### Restablecer contraseñas con código

El panel ya solicita y verifica el código OTP de Supabase; no usa el enlace de recuperación para cambiar la contraseña. Sin embargo, Supabase no permite editar la plantilla mientras se use su servicio de correo predeterminado. Primero configura y habilita un proveedor SMTP propio en **Authentication → Emails → SMTP Settings**. Después, en **Authentication → Emails → Templates → Reset password**, cambia el asunto a **Código de verificación para cambiar tu contraseña** y reemplaza el cuerpo completo con el contenido de [`supabase/email-templates/reset-password.html`](./supabase/email-templates/reset-password.html). La plantilla debe contener `{{ .Token }}` y no debe incluir `{{ .ConfirmationURL }}` ni ningún enlace de restablecimiento.

El cuerpo de la plantilla es:

```html
<h2>Código de verificación para cambiar tu contraseña</h2>
<p>Recibimos una solicitud para cambiar la contraseña de tu cuenta de Melallos Speed.</p>
<p>Ingresa este código de verificación en el panel de administración:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 6px">{{ .Token }}</p>
<p>Este código vence según el tiempo configurado para los códigos OTP en Supabase.</p>
<p>Si no solicitaste este cambio, ignora este correo. Tu contraseña no cambiará sin ingresar el código en el panel.</p>
```

Desde el login, **¿Olvidaste tu contraseña?** abre un campo editable para ingresar el correo y solicitar el código. En el panel, **Cambiar contraseña** permite solicitarlo para la cuenta conectada; desde **Administradores**, **Enviar restablecimiento** abre el campo con el correo de la cuenta seleccionada, que puedes verificar o editar antes de pulsar **Enviar código**. La persona ingresa el código, su nueva contraseña y la confirmación en `admin.html`; abrir un enlace de restablecimiento antiguo no cambia la contraseña. El código vence según la configuración de expiración de OTP de Supabase. Los enlaces de invitación inicial conservan su flujo normal para que la persona pueda crear la contraseña de su cuenta.

El panel no ofrece registro público. La función usa la clave de servicio solo en el entorno seguro de Supabase; nunca la copies al navegador ni al repositorio. La clave `publishable` del sitio es pública y la protección de datos depende de conservar activas las políticas RLS.

El sitio funciona como catálogo y canal de contacto, no como ecommerce: no procesa compras ni pagos. La operación se registra manualmente en **Registro manual**, en la parte superior de la navegación, después de atender al cliente por WhatsApp, teléfono, en persona u otro canal. Allí están centralizados los formularios de alta; cada registro queda en su sección correspondiente:

- **Agregar cliente**: guarda nombre, teléfono/WhatsApp y, si corresponde, correo, dirección y notas. El estado puede ser activo o inactivo; puedes modificarlo desde **Clientes**.
- **Registrar encargo**: anota una solicitud recibida por cualquier canal y confirma que el cliente autorizó el registro de sus datos. Las consultas enviadas desde el sitio aparecen aquí automáticamente. Cambia cada estado directamente en la tabla de **Encargos** (Nuevo, Contactado, Cotizado, Pedido, Cerrado o Cancelado) o abre **Editar** para actualizarlo junto con las notas. Cambiar a **Pedido** no crea una venta automáticamente; registra la venta por separado en **Registro manual** cuando se haya concretado.
- **Registrar venta**: registra la venta hecha por otro canal. Selecciona el producto, cantidad, precio, cliente y estado del pago. Al confirmar, el inventario se descuenta automáticamente. Para corregir producto, cantidad o precio, marca la venta **Anulada** y crea el registro correcto para conservar el historial.
- **Registrar gasto**: guarda cada egreso, fecha, categoría, valor y, opcionalmente, proveedor.
- **Agregar proveedor**: guarda sus datos de contacto y luego selecciónalo al registrar un gasto.
- **Agregar producto o ajustar inventario**: administra el catálogo y existencias. Los cambios manuales de stock quedan anotados en **Movimientos de inventario**, un historial automático de solo lectura.
- **Invitar administrador**: autoriza a otra persona para usar el panel.

Las secciones de datos ya no muestran botones para crear; la captura se centraliza en **Registro manual**. En **Clientes**, **Encargos**, **Ventas**, **Gastos**, **Proveedores** y **Productos e inventario** puedes modificar registros desde **Editar**. El **Resumen** muestra clientes activos, encargos abiertos, ventas confirmadas, saldos por cobrar y gastos, además del desglose de estados de clientes, encargos, ventas y pagos. La gráfica mensual usa barras agrupadas para comparar ventas confirmadas y gastos de los últimos seis meses, con valores visibles en COP; la gráfica de existencias prioriza los productos con menos stock frente a su mínimo. Las gráficas e informes cuentan ventas confirmadas y gastos registrados; las ventas anuladas no se suman a los ingresos. Registrar una venta en el panel lleva control de una transacción acordada fuera de la web: no cobra al cliente ni inicia una pasarela de pago.

Los mensajes de WhatsApp se preparan con los datos de la consulta, organizados en líneas con guiones.

El panel no contiene modo de demostración ni registros ficticios en el código de ejecución; el sitio público carga el catálogo desde Supabase y no presenta datos locales de respaldo si la conexión falla. El panel incluye resumen, productos, stock y movimientos, clientes, encargos, ventas, gastos, proveedores, informes de los últimos 12 meses y exportación CSV por página. Los movimientos de inventario son de solo lectura y los cambios nuevos registran si el stock aumentó o disminuyó. Después de actualizar el proyecto, vuelve a ejecutar `supabase/schema.sql` para aplicar esos permisos y la optimización del informe mensual; no se modifican datos actuales desde el navegador. Mantén activas las copias de seguridad del proyecto y descarga periódicamente una copia de los datos importantes.

### Protección del formulario contra spam

El formulario de encargos tiene varias capas:

1. **Campo trampa** invisible (`sitio_web`): si un robot lo rellena, el envío se ignora.
2. **Tiempo mínimo** de 3 segundos desde que la persona empieza a escribir y **espera de 30 segundos** entre envíos.
3. **Límite en la base de datos**: ejecuta una vez `supabase/anti-spam.sql` en el SQL Editor de Supabase. Permite como máximo 3 solicitudes por hora con el mismo teléfono y 40 cada 10 minutos en total. Sin este archivo, solo funcionan las capas 1 y 2.
4. Las políticas RLS ya validan longitudes y exigen la autorización.

Si aun así recibes spam, añade una verificación anti-bots (por ejemplo, Cloudflare Turnstile validado en una Supabase Edge Function).
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

Administra el catálogo y los precios desde **Productos e inventario** en el panel. Las imágenes pueden subirse desde el formulario del producto o referenciarse con una ruta como `assets/images/arai-01.jpg`.


## Antes de publicar: dominio, SEO y analítica

1. **URL pública.** Los archivos `index.html`, `aviso-legal.html`, `privacidad.html`, `cookies.html`, `derechos-autor.html`, `404.html`, `robots.txt` y `sitemap.xml` usan el marcador `https://TU-DOMINIO.com`. En VS Code abre **Buscar y reemplazar en archivos** (`Ctrl + Shift + H`) y reemplaza `https://TU-DOMINIO.com` por tu dirección real **sin barra final**. Ejemplos: `https://www.melallosspeed.com` o `https://tu-usuario.github.io/MelallosSpeed`. Así quedan bien el canonical, las etiquetas para redes, los datos estructurados, el sitemap y la página 404.
2. **HTTPS.** Todas las páginas redirigen de `http` a `https`. En GitHub, en **Settings → Pages**, marca **Enforce HTTPS**.
3. **Buscadores.** Cuando publiques, entra a [Google Search Console](https://search.google.com/search-console), agrega el sitio y envía `sitemap.xml`. `robots.txt` solo es válido si el sitio está en la raíz de un dominio (por ejemplo, un dominio propio); en una URL de GitHub Pages con carpeta (`usuario.github.io/MelallosSpeed`) los buscadores lo ignoran, pero el sitemap sigue funcionando.
4. **Ficha de Google.** Crea o reclama la ficha del negocio en [Google Business Profile](https://business.google.com): nombre «Melallos Speed», categoría «Tienda de cascos para motocicletas» o la más cercana, dirección Dg. 38A # 34-4, Ángeles, Itagüí, teléfono +57 321 520 3260, horarios y fotos. Verifica la ficha con el método que Google ofrezca y añade la URL del sitio.
5. **Analítica.** Crea una propiedad de Google Analytics 4, copia el ID de medición (empieza por `G-`) y pégalo en `GA4_ID` dentro de `assets/js/consent.js`. La analítica solo se carga si la persona pulsa «Aceptar analítica» en el aviso de cookies. Con `GA4_ID` vacío no se carga nada y el aviso solo informa.
6. **Datos legales.** Completa la razón social/nombre legal y el NIT en `aviso-legal.html` y `privacidad.html`.
