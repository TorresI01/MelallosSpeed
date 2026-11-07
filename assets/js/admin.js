(() => {
  const config = window.MELALLOS_SUPABASE_CONFIG || {};
  const loginScreen = document.getElementById("admin-login");
  const appScreen = document.getElementById("admin-app");
  const setupNotice = document.getElementById("setup-notice");
  const loginError = document.getElementById("login-error");
  const appNotice = document.getElementById("app-notice");
  const loginForm = document.getElementById("login-form");
  const resetPasswordButton = document.getElementById("reset-password-button");
  const passwordUpdateForm = document.getElementById("password-update-form");
  const passwordResetRequestForm = document.getElementById("password-reset-request-form");
  const passwordResetForm = document.getElementById("password-reset-form");
  const passwordResetNotice = document.getElementById("password-reset-notice");
  const recordDialog = document.getElementById("record-dialog");
  const recordForm = document.getElementById("record-form");
  const recordFields = document.getElementById("record-fields");
  const pageSize = 50;

  const modules = {
    products: {
      title: "Productos e inventario",
      description: "Administra el catálogo publicado, los precios, el costo de compra y el stock. Los cambios de inventario se registran automáticamente.",
      table: "products",
      order: "updated_at",
      columns: [
        ["name", "Producto"], ["category", "Categoría"], ["brand", "Marca"], ["sku", "SKU"],
        ["price_cop", "Precio"], ["cost_cop", "Costo"], ["stock", "Stock"], ["min_stock", "Mínimo"], ["active", "Publicado"],
      ],
      fields: [
        { name: "name", label: "Nombre", required: true },
        { name: "category", label: "Categoría", type: "select", options: [["integrales", "Full face"], ["abiertos", "Open face"], ["otros", "Otros"]], required: true },
        { name: "brand", label: "Marca", nullable: true },
        { name: "sku", label: "SKU", nullable: true },
        { name: "description", label: "Descripción", type: "textarea", wide: true },
        { name: "price_cop", label: "Precio de venta (COP)", type: "number", min: 0 },
        { name: "cost_cop", label: "Costo (COP)", type: "number", min: 0 },
        { name: "stock", label: "Stock actual", type: "number", min: 0, required: true },
        { name: "min_stock", label: "Alerta de stock mínimo", type: "number", min: 0, required: true },
        { name: "image_path", label: "Ruta o URL de imagen", placeholder: "assets/images/arai-01.jpg", wide: true },
        { name: "image_file", label: "Subir foto del producto (máximo 5 MB)", type: "file", accept: "image/jpeg,image/png,image/webp,image/avif", wide: true },
        { name: "image_style", label: "Ajuste de imagen", type: "select", options: [["contain", "Mostrar completa"], ["cover", "Recortar para cubrir"]] },
        { name: "visor", label: "Tipo de visor", nullable: true },
        { name: "active", label: "Visible en el sitio", type: "checkbox" },
      ],
    },
    customers: {
      title: "Clientes",
      description: "Ficha de las personas que te contactan. El estado indica si la relación está activa; edita los datos o el estado desde Acciones.",
      table: "customers",
      order: "created_at",
      columns: [["full_name", "Nombre"], ["phone", "Teléfono"], ["status", "Estado"], ["email", "Correo"], ["address", "Dirección"]],
      fields: [
        { name: "full_name", label: "Nombre completo", required: true },
        { name: "phone", label: "Teléfono / WhatsApp", required: true },
        { name: "status", label: "Estado del cliente", type: "select", options: [["activo", "Activo"], ["inactivo", "Inactivo"]] },
        { name: "email", label: "Correo", type: "email", nullable: true },
        { name: "address", label: "Dirección", nullable: true },
        { name: "notes", label: "Notas", type: "textarea", wide: true },
      ],
    },
    inquiries: {
      title: "Encargos y consultas",
      description: "Aquí llegan las consultas del sitio y también puedes registrar encargos recibidos por WhatsApp, teléfono o en persona. Edita el estado y las notas para dar seguimiento.",
      table: "inquiries",
      order: "created_at",
      columns: [["created_at", "Fecha"], ["customer_name", "Cliente"], ["product_name", "Producto"], ["status", "Estado"], ["source", "Origen"]],
      fields: [
        { name: "customer_name", label: "Nombre", required: true },
        { name: "phone", label: "Teléfono / WhatsApp", required: true },
        { name: "product_name", label: "Producto solicitado", required: true },
        { name: "reference", label: "Marca o referencia", nullable: true },
        { name: "size", label: "Talla", nullable: true },
        { name: "status", label: "Estado", type: "select", options: [["nuevo", "Nuevo"], ["contactado", "Contactado"], ["cotizado", "Cotizado"], ["pedido", "Pedido"], ["cerrado", "Cerrado"], ["cancelado", "Cancelado"]] },
        { name: "notes", label: "Notas de seguimiento", type: "textarea", wide: true },
        { name: "consent_given", label: "El cliente autorizó el registro de sus datos", type: "checkbox", required: true, wide: true },
      ],
    },
    sales: {
      title: "Ventas",
      description: "Registra aquí las ventas acordadas fuera del sitio (por ejemplo, en persona o por WhatsApp); no se cobra al cliente desde la web. Al confirmar una venta se descuenta el stock y queda un movimiento en el historial. Edita los datos de pago o notas; para corregir producto, cantidad o precio, anula la venta y registra otra.",
      table: "sales",
      order: "sale_date",
      allowDelete: false,
      columns: [["sale_date", "Fecha"], ["customer_name", "Cliente"], ["product_name", "Producto"], ["total_cop", "Total"], ["payment_status", "Estado del pago"], ["status", "Estado de la venta"]],
      fields: [
        { name: "sale_date", label: "Fecha", type: "date", required: true },
        { name: "customer_id", label: "Cliente guardado", type: "relation", relation: "customers", display: "full_name", nullable: true },
        { name: "customer_name", label: "Nombre del cliente" },
        { name: "product_id", label: "Producto de inventario", type: "relation", relation: "products", display: "name", required: true, readOnlyOnEdit: true },
        { name: "product_name", label: "Producto vendido", readOnlyOnEdit: true },
        { name: "quantity", label: "Cantidad", type: "number", min: 1, required: true, readOnlyOnEdit: true },
        { name: "unit_price_cop", label: "Precio unitario (COP)", type: "number", min: 0, required: true, readOnlyOnEdit: true },
        { name: "payment_method", label: "Medio de pago", type: "select", options: [["efectivo", "Efectivo"], ["transferencia", "Transferencia"], ["credito", "Crédito"], ["por_confirmar", "Por confirmar"], ["otro", "Otro"]] },
        { name: "payment_status", label: "Estado del pago", type: "select", options: [["pendiente", "Pendiente"], ["parcial", "Parcial"], ["pagado", "Pagado"], ["reembolsado", "Reembolsado"]] },
        { name: "paid_cop", label: "Valor recibido (COP)", type: "number", min: 0, default: 0 },
        { name: "status", label: "Estado de la venta", type: "select", options: [["confirmada", "Confirmada"], ["anulada", "Anulada"]] },
        { name: "notes", label: "Notas", type: "textarea", wide: true },
      ],
    },
    expenses: {
      title: "Gastos",
      description: "Ingresa manualmente cada egreso del negocio, con su fecha, categoría, proveedor y medio de pago. Usa Editar para corregirlo.",
      table: "expenses",
      order: "expense_date",
      columns: [["expense_date", "Fecha"], ["category", "Categoría"], ["description", "Descripción"], ["supplier_id", "Proveedor"], ["amount_cop", "Valor"], ["payment_method", "Medio de pago"]],
      fields: [
        { name: "expense_date", label: "Fecha", type: "date", required: true },
        { name: "category", label: "Categoría", required: true },
        { name: "description", label: "Descripción", required: true, wide: true },
        { name: "supplier_id", label: "Proveedor", type: "relation", relation: "suppliers", display: "name", nullable: true },
        { name: "amount_cop", label: "Valor (COP)", type: "number", min: 1, required: true },
        { name: "payment_method", label: "Medio de pago", type: "select", options: [["efectivo", "Efectivo"], ["transferencia", "Transferencia"], ["credito", "Crédito"], ["por_confirmar", "Por confirmar"], ["otro", "Otro"]] },
        { name: "notes", label: "Notas", type: "textarea", wide: true },
      ],
    },
    suppliers: {
      title: "Proveedores",
      description: "Crea y actualiza manualmente la ficha de cada proveedor. Después podrás seleccionarlo al registrar un gasto.",
      table: "suppliers",
      order: "created_at",
      columns: [["name", "Empresa"], ["contact_name", "Contacto"], ["phone", "Teléfono"], ["email", "Correo"], ["address", "Dirección"]],
      fields: [
        { name: "name", label: "Nombre de empresa", required: true },
        { name: "contact_name", label: "Persona de contacto", nullable: true },
        { name: "phone", label: "Teléfono" },
        { name: "email", label: "Correo", type: "email", nullable: true },
        { name: "address", label: "Dirección", nullable: true },
        { name: "notes", label: "Notas", type: "textarea", wide: true },
      ],
    },
    inventory_movements: {
      title: "Movimientos de inventario",
      description: "Historial de entradas, salidas por venta y ajustes de stock. Se genera automáticamente al cambiar existencias o registrar una venta.",
      table: "inventory_movements",
      order: "created_at",
      readOnly: true,
      columns: [["created_at", "Fecha"], ["product_name", "Producto"], ["movement_type", "Tipo"], ["quantity", "Cantidad"], ["reason", "Motivo"]],
    },
    administrators: {
      title: "Administradores",
      description: "Personas autorizadas para ingresar al panel. Cada administrador tiene acceso completo a la información del negocio.",
      table: "admin_users",
      order: "created_at",
      readOnly: true,
      columns: [["email", "Correo electrónico"], ["created_at", "Fecha de autorización"]],
    },
  };

  let client = null;
  let currentView = "dashboard";
  let currentPage = 0;
  let currentRows = [];
  let editingRecord = null;
  let editingAdminEmail = null;
  let currentUserEmail = null;
  let dashboardRequest = 0;
  let moduleRequest = 0;
  let reportRequest = 0;
  let pendingResetEmail = "";
  let returnToAppAfterReset = false;
  let verifyingResetCode = false;
  let handlingLegacyRecovery = false;

  const statusGroups = [
    {
      label: "Clientes",
      key: "customer_status",
      statuses: [["activo", "Activos"], ["inactivo", "Inactivos"]],
    },
    {
      label: "Encargos",
      key: "inquiry_status",
      statuses: [["nuevo", "Nuevos"], ["contactado", "Contactados"], ["cotizado", "Cotizados"], ["pedido", "Pedidos"], ["cerrado", "Cerrados"], ["cancelado", "Cancelados"]],
    },
    {
      label: "Ventas",
      key: "sales_status",
      statuses: [["confirmada", "Confirmadas"], ["anulada", "Anuladas"]],
    },
    {
      label: "Estado del pago",
      key: "payment_status",
      statuses: [["pendiente", "Pendientes"], ["parcial", "Parciales"], ["pagado", "Pagados"], ["reembolsado", "Reembolsados"]],
    },
  ];

  function showNotice(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("error", isError);
    element.hidden = false;
  }

  function clearNotice(element) {
    element.hidden = true;
    element.textContent = "";
    element.classList.remove("error");
  }

  function setLoadingState(container, message, isError = false) {
    container.setAttribute("aria-busy", "true");
    const status = document.createElement("p");
    status.className = "loading-state" + (isError ? " error" : "");
    status.setAttribute("role", isError ? "alert" : "status");
    status.textContent = message;
    container.replaceChildren(status);
    if (isError) container.setAttribute("aria-busy", "false");
  }

  function formatMoney(value) {
    if (value === null || value === undefined || value === "") return "—";
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value));
  }

  function localDateValue() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function displayValue(value, column) {
    if (value === null || value === undefined || value === "") return "—";
    if (column === "price_cop" || column === "cost_cop" || column === "amount_cop" ||
        column === "unit_price_cop" || column === "total_cop") return formatMoney(value);
    if (column === "active" || column === "consent_given") return value ? "Sí" : "No";
    if (column === "source") return value === "sitio_web" ? "Sitio web" : value === "panel" ? "Panel" : String(value);
    if (column === "status" || column === "payment_status") {
      const labels = {
        activo: "Activo", inactivo: "Inactivo", nuevo: "Nuevo", contactado: "Contactado",
        cotizado: "Cotizado", pedido: "Pedido", cerrado: "Cerrado", cancelado: "Cancelado",
        confirmada: "Confirmada", anulada: "Anulada", pendiente: "Pendiente",
        parcial: "Parcial", pagado: "Pagado", reembolsado: "Reembolsado",
      };
      return labels[value] || String(value);
    }
    if (column.endsWith("_at")) return new Date(value).toLocaleString("es-CO");
    if (column.endsWith("_date")) return new Date(value + "T12:00:00").toLocaleDateString("es-CO");
    return String(value);
  }

  async function checkAdmin() {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    if (!session) {
      loginScreen.hidden = false;
      appScreen.hidden = true;
      return;
    }

    const { data: authorized, error: authorizationError } = await client.rpc("is_site_admin");
    if (authorizationError) throw authorizationError;
    if (!authorized) {
      await client.auth.signOut();
      throw new Error("Esta cuenta no está autorizada. Agrega su correo en public.admin_users desde Supabase.");
    }

    loginScreen.hidden = true;
    appScreen.hidden = false;
    currentUserEmail = session.user.email?.toLowerCase() || null;
    document.getElementById("admin-email").textContent = session.user.email;
    await renderDashboard();
  }

  async function signIn(event) {
    event.preventDefault();
    clearNotice(loginError);
    const submit = loginForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Ingresando…";
    const values = new FormData(loginForm);
    try {
      const { error } = await client.auth.signInWithPassword({
        email: String(values.get("email")).trim(),
        password: String(values.get("password")),
      });
      if (error) {
        showNotice(loginError, "No se pudo iniciar sesión. Revisa el correo, la contraseña y la configuración de autenticación.", true);
        return;
      }
      await checkAdmin();
    } catch (authorizationError) {
      showNotice(loginError, authorizationError.message || "No se pudo validar la sesión.", true);
    } finally {
      submit.disabled = false;
      submit.textContent = "Iniciar sesión";
    }
  }

  function beginPasswordReset(email = "", fromPanel = false) {
    returnToAppAfterReset = fromPanel;
    appScreen.hidden = true;
    loginScreen.hidden = false;
    document.getElementById("login-heading").textContent = "Restablecer contraseña";
    loginForm.hidden = true;
    resetPasswordButton.hidden = true;
    passwordUpdateForm.hidden = true;
    passwordResetForm.hidden = true;
    passwordResetRequestForm.hidden = false;
    const emailInput = passwordResetRequestForm.elements.email;
    emailInput.value = email;
    emailInput.readOnly = fromPanel;
    emailInput.disabled = false;
    document.getElementById("password-reset-instructions").textContent =
      "Te enviaremos un código de verificación a tu correo. Ingresa el código aquí; no necesitas abrir un enlace para cambiar la contraseña.";
    clearNotice(loginError);
    clearNotice(passwordResetNotice);
    if (fromPanel) emailInput.blur();
    else {
      emailInput.focus();
      emailInput.select();
    }
  }

  function cancelPasswordReset() {
    passwordResetRequestForm.hidden = true;
    passwordResetForm.hidden = true;
    passwordUpdateForm.hidden = true;
    loginForm.hidden = false;
    resetPasswordButton.hidden = false;
    document.getElementById("login-heading").textContent = "Ingresar al panel";
    clearNotice(passwordResetNotice);
    if (returnToAppAfterReset) {
      returnToAppAfterReset = false;
      loginScreen.hidden = true;
      appScreen.hidden = false;
    }
  }

  async function sendPasswordRecovery(event) {
    if (event) event.preventDefault();
    clearNotice(passwordResetNotice);
    const email = String(passwordResetRequestForm.elements.email.value).trim().toLowerCase();
    if (!email) {
      showNotice(passwordResetNotice, "Escribe el correo de la cuenta para enviarle un código.", true);
      passwordResetRequestForm.elements.email.focus();
      return;
    }

    const submit = document.getElementById("send-reset-code");
    submit.disabled = true;
    submit.textContent = "Enviando código…";
    try {
      const { error } = await client.auth.resetPasswordForEmail(email);
      if (error) throw error;
      pendingResetEmail = email;
      passwordResetRequestForm.hidden = true;
      passwordResetForm.hidden = false;
      passwordResetForm.elements.code.value = "";
      document.getElementById("reset-code-destination").textContent = "Ingresa el código de 6 dígitos enviado a " + email + ".";
      showNotice(passwordResetNotice, "Si el correo corresponde a una cuenta, recibirás un código de verificación. Escríbelo aquí junto con tu nueva contraseña.");
    } catch (error) {
      showNotice(passwordResetNotice, "No se pudo enviar el código: " + error.message, true);
    } finally {
      submit.disabled = false;
      submit.textContent = "Enviar código";
    }
  }

  async function verifyPasswordReset(event) {
    event.preventDefault();
    clearNotice(passwordResetNotice);
    const values = new FormData(passwordResetForm);
    const code = String(values.get("code")).trim();
    const password = String(values.get("password"));
    if (password !== String(values.get("confirm-password"))) {
      showNotice(passwordResetNotice, "Las contraseñas no coinciden.", true);
      return;
    }

    const submit = document.getElementById("verify-reset-code");
    verifyingResetCode = true;
    submit.disabled = true;
    submit.textContent = "Verificando…";
    try {
      const { error: verifyError } = await client.auth.verifyOtp({
        email: pendingResetEmail,
        token: code,
        type: "recovery",
      });
      if (verifyError) throw verifyError;
      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) throw updateError;

      passwordResetForm.hidden = true;
      passwordResetRequestForm.hidden = true;
      resetPasswordButton.hidden = false;
      loginForm.hidden = false;
      returnToAppAfterReset = false;
      await checkAdmin();
      showNotice(appNotice, "Contraseña actualizada correctamente.");
      clearNotice(passwordResetNotice);
    } catch (error) {
      showNotice(passwordResetNotice, "No se pudo verificar el código o cambiar la contraseña: " + error.message, true);
    } finally {
      verifyingResetCode = false;
      submit.disabled = false;
      submit.textContent = "Verificar código y cambiar contraseña";
    }
  }

  function showPasswordUpdateForm() {
    loginScreen.hidden = false;
    appScreen.hidden = true;
    document.getElementById("login-heading").textContent = "Crear contraseña";
    loginForm.hidden = true;
    resetPasswordButton.hidden = true;
    passwordResetRequestForm.hidden = true;
    passwordResetForm.hidden = true;
    passwordUpdateForm.hidden = false;
    clearNotice(loginError);
  }

  async function updatePassword(event) {
    event.preventDefault();
    clearNotice(passwordResetNotice);
    const values = new FormData(passwordUpdateForm);
    const password = String(values.get("password"));
    if (password !== String(values.get("confirm-password"))) {
      showNotice(passwordResetNotice, "Las contraseñas no coinciden.", true);
      return;
    }

    const submit = passwordUpdateForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
    } catch (error) {
      showNotice(passwordResetNotice, "No se pudo actualizar la contraseña: " + error.message, true);
      submit.disabled = false;
      return;
    }

    passwordUpdateForm.hidden = true;
    try {
      await checkAdmin();
      showNotice(appNotice, "Contraseña actualizada correctamente.");
    } catch (error) {
      loginForm.hidden = false;
      resetPasswordButton.hidden = false;
      showNotice(loginError, "La contraseña se actualizó, pero no se pudo validar la sesión: " + error.message, true);
    } finally {
      submit.disabled = false;
    }
  }

  function metric(label, value) {
    const card = document.createElement("article");
    card.className = "metric-card";
    const caption = document.createElement("span");
    caption.textContent = label;
    const number = document.createElement("strong");
    number.textContent = value;
    card.append(caption, number);
    return card;
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  function renderBarChart(container, rows, labelField, series) {
    container.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Todavía no hay datos para graficar.";
      container.appendChild(empty);
      return;
    }

    const width = 640;
    const height = 270;
    const margin = { top: 16, right: 16, bottom: 52, left: 58 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const isMonthlyChart = container.id === "monthly-chart";
    const maximum = Math.max(1, ...rows.flatMap((row) => series.map((item) => Number(row[item.key]) || 0)));
    const scaleMaximum = maximum * 1.15;
    const baseline = margin.top + chartHeight;
    const svg = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      class: "chart-entrance",
      "aria-label": isMonthlyChart
        ? "Gráfica de barras agrupadas de ventas y gastos mensuales"
        : "Gráfica de existencias actuales y stock mínimo por producto",
    });

    for (let tick = 0; tick <= 4; tick += 1) {
      const value = (scaleMaximum * tick) / 4;
      const y = baseline - (value / scaleMaximum) * chartHeight;
      svg.appendChild(svgElement("line", { x1: margin.left, y1: y, x2: width - margin.right, y2: y, class: "chart-gridline" }));
      const label = svgElement("text", { x: margin.left - 8, y: y + 4, "text-anchor": "end", class: "chart-axis-label" });
      label.textContent = isMonthlyChart
        ? new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(value)
        : String(Math.round(value));
      svg.appendChild(label);
    }

    const groupWidth = chartWidth / rows.length;
    const barWidth = Math.min(isMonthlyChart ? 38 : 24, (groupWidth * 0.7) / series.length);
    rows.forEach((row, index) => {
      const groupX = margin.left + index * groupWidth;
      series.forEach((item, seriesIndex) => {
        const value = Math.max(0, Number(row[item.key]) || 0);
        const barHeight = (value / scaleMaximum) * chartHeight;
        const rect = svgElement("rect", {
          x: groupX + groupWidth / 2 - (series.length * barWidth) / 2 + seriesIndex * barWidth,
          y: baseline - barHeight,
          width: Math.max(2, barWidth - 3),
          height: barHeight,
          rx: 3,
          class: item.className,
        });
        rect.style.setProperty("--bar-index", String(index * series.length + seriesIndex));
        const title = svgElement("title");
        title.textContent = `${row[labelField]}: ${item.label} ${isMonthlyChart ? formatMoney(value) : value}`;
        rect.appendChild(title);
        svg.appendChild(rect);
        if (isMonthlyChart) {
          const valueLabel = svgElement("text", {
            x: Number(rect.getAttribute("x")) + Number(rect.getAttribute("width")) / 2,
            y: barHeight >= 24 ? baseline - barHeight + 14 : baseline - barHeight - 5,
            "text-anchor": "middle",
            class: `chart-value-label ${barHeight >= 24 ? "chart-value-inside" : "chart-value-outside"} ${item.className}`,
          });
          valueLabel.textContent = value >= 1000000
            ? `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value / 1000000)} M`
            : `${Math.round(value / 1000)} mil`;
          const valueTitle = svgElement("title");
          valueTitle.textContent = `${row[labelField]}: ${item.label} ${formatMoney(value)}`;
          valueLabel.appendChild(valueTitle);
          svg.appendChild(valueLabel);
        }
      });
      const tick = svgElement("text", {
        x: groupX + groupWidth / 2,
        y: baseline + 22,
        "text-anchor": "middle",
        class: "chart-axis-label",
      });
      const label = String(row[labelField]);
      if (isMonthlyChart) {
        const month = new Date(`${label}-01T00:00:00Z`);
        tick.textContent = Number.isNaN(month.getTime())
          ? label
          : new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit", timeZone: "UTC" })
            .format(month).replace(".", "");
      } else {
        tick.textContent = label.length > 9 ? `${label.slice(0, 8)}…` : label;
      }
      svg.appendChild(tick);
    });
    container.appendChild(svg);

    const legend = document.createElement("div");
    legend.className = "chart-legend";
    series.forEach((item) => {
      const entry = document.createElement("span");
      const swatch = document.createElement("i");
      swatch.className = item.className;
      const label = document.createElement("span");
      label.textContent = item.label;
      entry.append(swatch, label);
      legend.appendChild(entry);
    });
    container.appendChild(legend);
  }

  function renderStatusSummary(summary) {
    const container = document.getElementById("status-summary");
    const colors = ["status-blue", "status-green", "status-amber", "status-violet", "status-red", "status-gray"];
    container.replaceChildren(...statusGroups.map((group) => {
      const counts = summary[group.key] || {};
      const total = group.statuses.reduce((sum, [key]) => sum + Number(counts[key] || 0), 0);
      const section = document.createElement("section");
      section.className = "status-group";
      const heading = document.createElement("h3");
      heading.textContent = group.label;
      const totalLabel = document.createElement("span");
      totalLabel.className = "status-total";
      totalLabel.textContent = String(total);
      const title = document.createElement("div");
      title.className = "status-group-heading";
      title.append(heading, totalLabel);
      const bar = document.createElement("div");
      bar.className = "status-bar";
      bar.setAttribute("role", "img");
      bar.setAttribute("aria-label", group.label + ": " + group.statuses.map(([key, label]) => label + " " + Number(counts[key] || 0)).join(", "));
      group.statuses.forEach(([key], index) => {
        const count = Number(counts[key] || 0);
        if (!count || !total) return;
        const segment = document.createElement("span");
        segment.className = colors[index % colors.length];
        segment.style.width = (count / total * 100) + "%";
        bar.appendChild(segment);
      });
      const list = document.createElement("ul");
      list.className = "status-legend";
      group.statuses.forEach(([key, label], index) => {
        const count = Number(counts[key] || 0);
        const item = document.createElement("li");
        const swatch = document.createElement("span");
        swatch.className = "status-swatch " + colors[index % colors.length];
        const text = document.createElement("span");
        text.textContent = label;
        const value = document.createElement("strong");
        value.textContent = String(count);
        item.append(swatch, text, value);
        list.appendChild(item);
      });
      section.append(title, bar, list);
      return section;
    }));
  }

  async function renderDashboard() {
    clearNotice(appNotice);
    const requestId = ++dashboardRequest;
    const grid = document.getElementById("metric-grid");
    const statusSummary = document.getElementById("status-summary");
    const monthlyChart = document.getElementById("monthly-chart");
    const stockChart = document.getElementById("stock-chart");
    [grid, statusSummary, monthlyChart, stockChart].forEach((container) => setLoadingState(container, "Cargando datos…"));
    let summary;
    let monthlyData;
    let stockData;
    try {
      const [summaryResult, monthlyResult, stockResult] = await Promise.all([
        client.rpc("admin_dashboard_summary"),
        client.rpc("admin_monthly_report"),
        client.from("products").select("name,stock,min_stock").eq("active", true).order("stock", { ascending: true }).limit(6),
      ]);
      if (summaryResult.error) throw new Error("No se pudo cargar el resumen: " + summaryResult.error.message);
      if (monthlyResult.error) throw new Error("No se pudo cargar la tendencia mensual: " + monthlyResult.error.message);
      if (stockResult.error) throw new Error("No se pudo cargar el inventario: " + stockResult.error.message);
      if (!summaryResult.data || !Array.isArray(monthlyResult.data) || !Array.isArray(stockResult.data)) {
        throw new Error("Supabase devolvió datos incompletos para el resumen.");
      }
      if (requestId !== dashboardRequest || currentView !== "dashboard") return;
      summary = summaryResult.data || {};
      monthlyData = monthlyResult.data;
      stockData = stockResult.data;
    } catch (error) {
      if (requestId !== dashboardRequest) return;
      showNotice(appNotice, error.message || "No se pudo cargar el resumen.", true);
      [grid, statusSummary, monthlyChart, stockChart].forEach((container) => setLoadingState(container, "No se pudieron cargar los datos.", true));
      return;
    }
    const metrics = [
      ["Clientes activos", String(summary.active_customers ?? 0)],
      ["Encargos abiertos", String(summary.open_inquiries ?? 0)],
      ["Ventas confirmadas", formatMoney(summary.sales_total_cop ?? 0)],
      ["Cuentas por cobrar", formatMoney(summary.receivables_cop ?? 0)],
      ["Gastos registrados", formatMoney(summary.expenses_total_cop ?? 0)],
      ["Balance del negocio", formatMoney(summary.balance_cop ?? 0)],
    ];
    grid.replaceChildren(...metrics.map(([label, value]) => metric(label, value)));
    [grid, statusSummary, monthlyChart, stockChart].forEach((container) => container.setAttribute("aria-busy", "false"));
    renderBarChart(monthlyChart, monthlyData.slice(-6), "month", [
      { key: "sales_cop", label: "Ventas", className: "chart-sales" },
      { key: "expenses_cop", label: "Gastos", className: "chart-expenses" },
    ]);
    renderBarChart(stockChart, stockData, "name", [
      { key: "stock", label: "Existencias", className: "chart-stock" },
      { key: "min_stock", label: "Mínimo", className: "chart-minimum" },
    ]);
    renderStatusSummary(summary);
  }

  function createTableHead(columns) {
    const head = document.createElement("thead");
    const row = document.createElement("tr");
    columns.forEach(([, label]) => {
      const th = document.createElement("th");
      th.textContent = label;
      row.appendChild(th);
    });
    const actions = document.createElement("th");
    actions.textContent = "Acciones";
    row.appendChild(actions);
    head.appendChild(row);
    return head;
  }

  async function openView(view) {
    currentView = view;
    currentPage = 0;
    dashboardRequest += 1;
    moduleRequest += 1;
    reportRequest += 1;
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === view);
    });
    document.getElementById("dashboard-view").hidden = view !== "dashboard";
    document.getElementById("manual-view").hidden = view !== "manual";
    document.getElementById("module-view").hidden = view === "dashboard" || view === "reports" || view === "manual";
    document.getElementById("page-title").textContent = view === "dashboard" ? "Resumen del negocio" :
      view === "reports" ? "Informes del negocio" : view === "manual" ? "Registro manual" : modules[view].title;
    if (view === "dashboard") return renderDashboard();
    if (view === "reports") return renderReports();
    if (view === "manual") {
      document.querySelector(".pagination").hidden = true;
      return;
    }
    await renderModule();
  }

  async function renderModule() {
    const view = currentView;
    const module = modules[view];
    const requestId = ++moduleRequest;
    const container = document.getElementById("table-wrap");
    document.getElementById("module-eyebrow").textContent = "GESTIÓN · " + module.table.toUpperCase();
    document.getElementById("module-heading").textContent = module.title;
    document.getElementById("module-description").textContent = module.description;
    document.getElementById("export-button").hidden = false;
    document.getElementById("export-button").disabled = true;
    document.getElementById("previous-page").disabled = true;
    document.getElementById("next-page").disabled = true;
    currentRows = [];
    setLoadingState(container, "Cargando " + module.title.toLowerCase() + "…");
    try {
      const result = await client.from(module.table)
        .select("*", { count: "exact" })
        .order(module.order, { ascending: false, nullsFirst: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
      if (result.error) throw result.error;
      if (requestId !== moduleRequest || currentView !== view) return;
      if (!Array.isArray(result.data) || result.count === null) throw new Error("Supabase devolvió datos incompletos.");
      clearNotice(appNotice);
      currentRows = result.data;
      renderTable(module, currentRows);
      document.getElementById("export-button").disabled = currentRows.length === 0;
      const totalPages = Math.max(1, Math.ceil(result.count / pageSize));
      document.getElementById("page-indicator").textContent = "Página " + (currentPage + 1) + " de " + totalPages + " · " + result.count + " registros";
      document.getElementById("previous-page").disabled = currentPage === 0;
      document.getElementById("next-page").disabled = currentPage + 1 >= totalPages;
    } catch (error) {
      if (requestId !== moduleRequest) return;
      showNotice(appNotice, "No se pudo cargar " + module.title.toLowerCase() + ": " + error.message, true);
      setLoadingState(container, "No se pudieron cargar los registros.", true);
    }
  }

  function renderTable(module, rows) {
    const container = document.getElementById("table-wrap");
    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No hay registros todavía.";
      container.replaceChildren(empty);
      return;
    }
    const table = document.createElement("table");
    table.appendChild(createTableHead(module.columns));
    const body = document.createElement("tbody");
    rows.forEach((record) => {
      const row = document.createElement("tr");
      module.columns.forEach(([column]) => {
        const cell = document.createElement("td");
        if (currentView === "inquiries" && column === "status") {
          const statusSelect = document.createElement("select");
          statusSelect.className = "status-select";
          statusSelect.setAttribute("aria-label", "Estado del encargo de " + record.customer_name);
          modules.inquiries.fields.find((field) => field.name === "status").options.forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            statusSelect.appendChild(option);
          });
          statusSelect.value = record.status;
          statusSelect.addEventListener("change", () => updateInquiryStatus(record, statusSelect));
          cell.appendChild(statusSelect);
        } else {
          cell.textContent = displayValue(record[column], column);
        }
        row.appendChild(cell);
      });
      const actionCell = document.createElement("td");
      const actionGroup = document.createElement("div");
      actionGroup.className = "table-actions";
      if (currentView === "administrators") {
        const changeEmail = document.createElement("button");
        changeEmail.type = "button";
        changeEmail.textContent = "Cambiar correo";
        changeEmail.addEventListener("click", () => showAdminEmailDialog(record));
        actionGroup.appendChild(changeEmail);
        const resetPassword = document.createElement("button");
        resetPassword.type = "button";
        resetPassword.textContent = "Enviar restablecimiento";
        resetPassword.addEventListener("click", () => sendAdminPasswordReset(record.email));
        actionGroup.appendChild(resetPassword);
      } else if (!module.readOnly) {
        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "Editar";
        edit.addEventListener("click", () => showRecordDialog(record));
        actionGroup.append(edit);
        if (module.allowDelete !== false) {
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "danger";
          remove.textContent = "Eliminar";
          remove.addEventListener("click", () => deleteRecord(record));
          actionGroup.appendChild(remove);
        }
      }
      actionCell.appendChild(actionGroup);
      row.appendChild(actionCell);
      body.appendChild(row);
    });
    table.appendChild(body);
    container.replaceChildren(table);
  }

  async function updateInquiryStatus(record, select) {
    const previousStatus = record.status;
    const nextStatus = select.value;
    if (nextStatus === previousStatus) return;
    select.disabled = true;
    clearNotice(appNotice);
    try {
      const { error } = await client.from("inquiries")
        .update({ status: nextStatus })
        .eq("id", record.id);
      if (error) throw error;
      record.status = nextStatus;
      showNotice(appNotice, "Estado del encargo actualizado a " + displayValue(nextStatus, "status") + ".");
    } catch (error) {
      select.value = previousStatus;
      showNotice(appNotice, "No se pudo actualizar el estado del encargo: " + error.message, true);
    } finally {
      select.disabled = false;
    }
  }

  async function loadRelationOptions(field) {
    const isSaleProduct = currentView === "sales" && field.relation === "products";
    const selection = isSaleProduct ? "id,name,price_cop,stock,active" : "id," + field.display;
    const { data, error } = await client.from(field.relation).select(selection).order(field.display).limit(500);
    if (error) throw error;
    if (isSaleProduct) {
      return (data || []).filter((product) =>
        (product.active && product.stock > 0) || product.id === field.selectedId);
    }
    return data || [];
  }

  function makeInput(field, value) {
    const wrapper = document.createElement("label");
    wrapper.className = "form-field" + (field.wide ? " wide" : "");
    const caption = document.createElement("span");
    caption.textContent = field.label + (field.required ? " *" : "");
    if (field.type === "checkbox") {
      wrapper.classList.add("checkbox-field");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = field.name;
      input.required = Boolean(field.required);
      input.checked = value === undefined ? field.name === "active" : Boolean(value);
      wrapper.replaceChildren(input, caption);
      return wrapper;
    }

    let input;
    if (field.type === "textarea") input = document.createElement("textarea");
    else if (field.type === "select" || field.type === "relation") input = document.createElement("select");
    else input = document.createElement("input");
    input.name = field.name;
    input.required = Boolean(field.required);
    input.disabled = Boolean(field.readOnlyOnEdit && value !== undefined);
    if (field.type === "file") input.accept = field.accept;
    if (field.type === "date" && value === undefined) input.value = localDateValue();
    if (field.placeholder) input.placeholder = field.placeholder;
    if (field.type === "number") {
      input.type = "number";
      input.min = String(field.min ?? 0);
      input.step = "any";
    } else if (field.type && !["textarea", "select", "relation"].includes(field.type)) {
      input.type = field.type;
    }
    if (field.type === "select") {
      field.options.forEach(([optionValue, label]) => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = label;
        input.appendChild(option);
      });
    }
    if (field.type === "relation") {
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "Selecciona un registro";
      input.appendChild(blank);
    }
    if (value !== undefined && value !== null) input.value = String(value);
    else if (field.default !== undefined) input.value = String(field.default);
    wrapper.append(caption, input);
    return wrapper;
  }

  async function showRecordDialog(record = null) {
    const module = modules[currentView];
    editingRecord = record;
    const saveButton = document.getElementById("save-record-button");
    clearNotice(document.getElementById("record-error"));
    document.getElementById("record-title").textContent = record ? "Editar registro" : "Nuevo registro";
    saveButton.textContent = record ? "Guardar cambios" : "Guardar registro";
    const fields = module.fields.map((field) => makeInput(field, record ? record[field.name] : undefined));
    recordFields.replaceChildren(...fields);
    recordDialog.showModal();
    const relationFields = module.fields.filter((item) => item.type === "relation");
    saveButton.disabled = relationFields.length > 0;
    try {
      for (const field of relationFields) {
        const options = await loadRelationOptions({ ...field, selectedId: record?.[field.name] });
        const select = recordFields.querySelector(`[name="${field.name}"]`);
        if (currentView === "sales" && field.relation === "products" && !options.length) {
          select.options[0].textContent = "No hay productos activos con stock para vender";
        }
        options.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.id;
          option.textContent = item[field.display];
          if (field.relation === "products") option.dataset.price = item.price_cop ?? "";
          select.appendChild(option);
        });
        if (record && record[field.name]) select.value = record[field.name];
      }
      const productSelect = recordFields.querySelector('[name="product_id"]');
      const productName = recordFields.querySelector('[name="product_name"]');
      if (productSelect && productName) {
        productSelect.addEventListener("change", () => {
          if (productSelect.value) {
            productName.value = productSelect.selectedOptions[0].textContent;
            const option = productSelect.selectedOptions[0];
            const price = option.dataset.price;
            const priceInput = recordFields.querySelector('[name="unit_price_cop"]');
            if (price && priceInput && !priceInput.value) priceInput.value = price;
          }
        });
      }
      saveButton.disabled = false;
    } catch (error) {
      showNotice(document.getElementById("record-error"), "No se pudieron cargar las opciones relacionadas: " + error.message, true);
      saveButton.disabled = true;
    }
  }

  function showAdminEmailDialog(admin) {
    if (admin.email.toLowerCase() === currentUserEmail) {
      showNotice(appNotice, "Para evitar perder el acceso a tu sesión actual, cambia tu correo desde Supabase y vuelve a autorizarlo.", true);
      return;
    }
    editingAdminEmail = admin.email;
    clearNotice(document.getElementById("change-admin-email-error"));
    document.getElementById("change-admin-email-form").reset();
    document.getElementById("change-admin-email-dialog").showModal();
  }

  async function invokeAdminInvite(body) {
    const { error } = await client.functions.invoke("invite-admin", { body });
    if (!error) return;
    let message = error.message;
    if (error.context instanceof Response) {
      const details = await error.context.clone().json().catch(() => null);
      if (typeof details?.error === "string") message = details.error;
    }
    throw new Error(message);
  }

  function sendAdminPasswordReset(email) {
    clearNotice(appNotice);
    const isCurrentUser = email.toLowerCase() === currentUserEmail;
    beginPasswordReset(email, isCurrentUser);
    showNotice(passwordResetNotice, isCurrentUser
      ? "El código se solicitará para el correo de esta sesión."
      : "Confirma o edita el correo y pulsa «Enviar código» para solicitar la verificación.");
  }

  function getFormValues() {
    const values = {};
    modules[currentView].fields.forEach((field) => {
      const input = recordForm.elements.namedItem(field.name);
      if (field.type === "checkbox") {
        values[field.name] = input.checked;
      } else if (field.type === "number") {
        values[field.name] = input.value === "" ? null : Number(input.value);
      } else if (field.type === "file") {
        return;
      } else if (field.type === "relation") {
        values[field.name] = input.value || null;
      } else {
        const text = input.value.trim();
        values[field.name] = text || (field.nullable ? null : "");
      }
    });
    if (currentView === "sales" && !values.sale_date) values.sale_date = localDateValue();
    if (currentView === "sales" && values.product_id) {
      values.product_name = recordFields.querySelector('[name="product_id"] option:checked').textContent;
    }
    if (currentView === "sales" && values.customer_id && !values.customer_name) {
      values.customer_name = recordFields.querySelector('[name="customer_id"] option:checked').textContent;
    }
    if (currentView === "inquiries" && !editingRecord) values.source = "panel";
    return values;
  }

  async function saveRecord(event) {
    event.preventDefault();
    const saveButton = document.getElementById("save-record-button");
    saveButton.disabled = true;
    clearNotice(document.getElementById("record-error"));
    const values = getFormValues();
    const module = modules[currentView];
    let uploadedImagePath = null;
    try {
      if (currentView === "products") {
        const file = recordForm.elements.image_file.files[0];
        if (file) {
          const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
          if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
            showNotice(document.getElementById("record-error"), "Elige una imagen JPG, PNG, WebP o AVIF de hasta 5 MB.", true);
            return;
          }
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
          uploadedImagePath = "products/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "-" + safeName;
          const { error: uploadError } = await client.storage.from("product-images")
            .upload(uploadedImagePath, file, { cacheControl: "3600", upsert: false });
          if (uploadError) {
            uploadedImagePath = null;
            showNotice(document.getElementById("record-error"), "No se pudo subir la imagen: " + uploadError.message, true);
            return;
          }
          values.image_path = client.storage.from("product-images").getPublicUrl(uploadedImagePath).data.publicUrl;
        }
        delete values.image_file;
      }

      const request = editingRecord
        ? client.from(module.table).update(values).eq("id", editingRecord.id)
        : client.from(module.table).insert(values);
      const { error } = await request;
      if (error) {
        if (uploadedImagePath) {
          try {
            const { error: cleanupError } = await client.storage.from("product-images").remove([uploadedImagePath]);
            if (cleanupError) console.error("No se pudo limpiar la imagen subida:", cleanupError.message);
          } catch (cleanupError) {
            console.error("No se pudo limpiar la imagen subida:", cleanupError);
          }
        }
        showNotice(document.getElementById("record-error"), "No se pudo guardar el registro: " + error.message, true);
        return;
      }
      uploadedImagePath = null;
      recordDialog.close();
      showNotice(appNotice, editingRecord ? "Cambios guardados." : "Registro creado correctamente.");
      if (currentView === "dashboard") await renderDashboard();
      else await renderModule();
    } catch (error) {
      if (uploadedImagePath) {
        try {
          const { error: cleanupError } = await client.storage.from("product-images").remove([uploadedImagePath]);
          if (cleanupError) console.error("No se pudo limpiar la imagen subida:", cleanupError.message);
        } catch (cleanupError) {
          console.error("No se pudo limpiar la imagen subida:", cleanupError);
        }
      }
      showNotice(recordDialog.open ? document.getElementById("record-error") : appNotice,
        "No se pudo completar la operación. " + error.message, true);
    } finally {
      saveButton.disabled = false;
    }
  }

  async function deleteRecord(record) {
    const module = modules[currentView];
    const label = record.name || record.full_name || record.product_name || record.description || "este registro";
    if (!window.confirm("¿Eliminar " + label + "? Esta acción no se puede deshacer.")) return;
    try {
      const { error } = await client.from(module.table).delete().eq("id", record.id);
      if (error) throw error;
      showNotice(appNotice, "Registro eliminado.");
      await renderModule();
    } catch (error) {
      showNotice(appNotice, "No se pudo eliminar: " + error.message, true);
    }
  }

  function exportCsv() {
    const module = modules[currentView];
    if (!module || !currentRows.length) {
      showNotice(appNotice, "No hay registros en esta página para exportar.");
      return;
    }
    const columns = module.columns.map(([name, label]) => [name, label]);
    const quote = (value) => {
      const text = String(value ?? "");
      const safe = /^[=+\-@]/.test(text) ? "'" + text : text;
      return '"' + safe.replace(/"/g, '""') + '"';
    };
    const csv = [
      columns.map(([, label]) => quote(label)).join(","),
      ...currentRows.map((row) => columns.map(([name]) => quote(row[name])).join(",")),
    ].join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentView + "-" + new Date().toISOString().slice(0, 10) + ".csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function renderReports() {
    const requestId = ++reportRequest;
    document.getElementById("dashboard-view").hidden = true;
    document.getElementById("module-view").hidden = true;
    document.getElementById("export-button").hidden = true;
    document.querySelector(".pagination").hidden = true;
    const container = document.getElementById("table-wrap");
    setLoadingState(container, "Cargando informes…");
    try {
      const result = await client.rpc("admin_monthly_report");
      if (result.error) throw result.error;
      if (!Array.isArray(result.data)) throw new Error("Supabase devolvió datos incompletos.");
      if (requestId !== reportRequest || currentView !== "reports") return;
      clearNotice(appNotice);
      const data = result.data;
      const section = document.createElement("section");
      section.className = "panel-card";
      const heading = document.createElement("div");
      heading.className = "panel-heading";
      const text = document.createElement("div");
      const eyebrow = document.createElement("p");
      eyebrow.className = "eyebrow";
      eyebrow.textContent = "ÚLTIMOS 12 MESES";
      const title = document.createElement("h2");
      title.textContent = "Ventas, gastos y balance mensual";
      text.append(eyebrow, title);
      heading.appendChild(text);
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      ["Mes", "Ventas", "Gastos", "Balance"].forEach((label) => {
        const cell = document.createElement("th");
        cell.textContent = label;
        headerRow.appendChild(cell);
      });
      thead.appendChild(headerRow);
      const tbody = document.createElement("tbody");
      data.forEach((month) => {
        const row = document.createElement("tr");
        [month.month, formatMoney(month.sales_cop), formatMoney(month.expenses_cop), formatMoney(month.balance_cop)].forEach((value) => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });
        tbody.appendChild(row);
      });
      table.append(thead, tbody);
      const tableWrap = document.createElement("div");
      tableWrap.className = "table-wrap";
      tableWrap.appendChild(table);
      const note = document.createElement("p");
      note.className = "muted";
      note.textContent = "Los reportes reflejan los registros capturados en el sistema y no sustituyen la contabilidad oficial.";
      section.append(heading, tableWrap, note);
      document.getElementById("module-view").hidden = false;
      document.getElementById("module-heading").textContent = "Informes del negocio";
      document.getElementById("module-eyebrow").textContent = "VENTAS Y GASTOS";
      document.getElementById("module-description").textContent = "";
      container.replaceChildren(section);
      container.setAttribute("aria-busy", "false");
      document.getElementById("export-button").hidden = true;
      document.querySelector(".pagination").hidden = true;
    } catch (error) {
      if (requestId !== reportRequest) return;
      showNotice(appNotice, "No se pudieron cargar los informes: " + error.message, true);
      setLoadingState(container, "No se pudieron cargar los informes.", true);
    }
  }

  if (!window.supabase?.createClient || !config.url || !config.publishableKey) {
    setupNotice.hidden = false;
    setupNotice.textContent = "Falta conectar Supabase. Sigue la guía de configuración del README para crear el proyecto, ejecutar supabase/schema.sql y completar assets/js/supabase-config.js. No uses una clave service_role.";
    loginForm.querySelectorAll("input,button").forEach((element) => { element.disabled = true; });
    resetPasswordButton.disabled = true;
    passwordUpdateForm.querySelectorAll("input,button").forEach((element) => { element.disabled = true; });
    passwordResetRequestForm.querySelectorAll("input,button").forEach((element) => { element.disabled = true; });
    passwordResetForm.querySelectorAll("input,button").forEach((element) => { element.disabled = true; });
    return;
  }

  client = window.supabase.createClient(config.url, config.publishableKey);
  loginForm.addEventListener("submit", signIn);
  resetPasswordButton.addEventListener("click", () => {
    beginPasswordReset(String(loginForm.elements.email.value).trim());
  });
  passwordResetRequestForm.addEventListener("submit", sendPasswordRecovery);
  passwordResetForm.addEventListener("submit", verifyPasswordReset);
  document.getElementById("cancel-password-reset").addEventListener("click", cancelPasswordReset);
  document.getElementById("resend-reset-code").addEventListener("click", () => {
    passwordResetRequestForm.elements.email.value = pendingResetEmail;
    passwordResetRequestForm.hidden = false;
    passwordResetForm.hidden = true;
    sendPasswordRecovery().catch((error) => {
      showNotice(passwordResetNotice, "No se pudo enviar otro código: " + error.message, true);
    });
  });
  document.getElementById("change-password-button").addEventListener("click", () => {
    beginPasswordReset(currentUserEmail || "", true);
  });
  passwordUpdateForm.addEventListener("submit", updatePassword);
  document.getElementById("logout-button").addEventListener("click", async () => {
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      appScreen.hidden = true;
      loginScreen.hidden = false;
    } catch (error) {
      showNotice(appNotice, "No se pudo cerrar sesión: " + error.message, true);
    }
  });
  document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(".pagination").hidden = false;
      openView(button.dataset.view).catch((error) => showNotice(appNotice, error.message, true));
    });
  });
  document.querySelectorAll("[data-register]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await openView(button.dataset.register);
        await showRecordDialog();
      } catch (error) {
        showNotice(appNotice, "No se pudo abrir el formulario: " + error.message, true);
      }
    });
  });
  const inviteAdminDialog = document.getElementById("invite-admin-dialog");
  const inviteAdminForm = document.getElementById("invite-admin-form");
  const inviteAdminError = document.getElementById("invite-admin-error");
  document.getElementById("invite-admin-button").addEventListener("click", () => {
    clearNotice(inviteAdminError);
    inviteAdminDialog.showModal();
  });
  document.getElementById("close-invite-dialog").addEventListener("click", () => inviteAdminDialog.close());
  document.getElementById("cancel-invite-dialog").addEventListener("click", () => inviteAdminDialog.close());
  inviteAdminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotice(inviteAdminError);
    const submit = document.getElementById("send-admin-invite");
    const email = String(new FormData(inviteAdminForm).get("email")).trim();
    submit.disabled = true;
    submit.textContent = "Enviando…";
    try {
      await invokeAdminInvite({ email });
    } catch (error) {
      showNotice(inviteAdminError, "No se pudo enviar la invitación: " + error.message, true);
      return;
    } finally {
      submit.disabled = false;
      submit.textContent = "Enviar invitación";
    }
    inviteAdminForm.reset();
    inviteAdminDialog.close();
    if (currentView === "administrators") await renderModule();
    if (!appNotice.classList.contains("error")) showNotice(appNotice, "Invitación enviada a " + email + ".");
  });
  const changeAdminEmailDialog = document.getElementById("change-admin-email-dialog");
  const changeAdminEmailForm = document.getElementById("change-admin-email-form");
  const changeAdminEmailError = document.getElementById("change-admin-email-error");
  document.getElementById("close-change-admin-email-dialog").addEventListener("click", () => changeAdminEmailDialog.close());
  document.getElementById("cancel-change-admin-email-dialog").addEventListener("click", () => changeAdminEmailDialog.close());
  changeAdminEmailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotice(changeAdminEmailError);
    const submit = document.getElementById("save-change-admin-email");
    const email = String(new FormData(changeAdminEmailForm).get("email")).trim();
    submit.disabled = true;
    submit.textContent = "Procesando…";
    try {
      await invokeAdminInvite({ action: "change-email", currentEmail: editingAdminEmail, email });
    } catch (error) {
      showNotice(changeAdminEmailError, "No se pudo cambiar el correo: " + error.message, true);
      return;
    } finally {
      submit.disabled = false;
      submit.textContent = "Enviar invitación y cambiar";
    }
    editingAdminEmail = null;
    changeAdminEmailForm.reset();
    changeAdminEmailDialog.close();
    await renderModule();
    if (!appNotice.classList.contains("error")) showNotice(appNotice, "Correo actualizado e invitación enviada a " + email + ".");
  });
  document.getElementById("export-button").addEventListener("click", exportCsv);
  document.getElementById("previous-page").addEventListener("click", () => {
    if (currentPage > 0) { currentPage -= 1; renderModule(); }
  });
  document.getElementById("next-page").addEventListener("click", () => {
    currentPage += 1;
    renderModule();
  });
  recordForm.addEventListener("submit", saveRecord);
  document.getElementById("close-dialog").addEventListener("click", () => recordDialog.close());
  document.getElementById("cancel-dialog").addEventListener("click", () => recordDialog.close());
  client.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && !verifyingResetCode && !handlingLegacyRecovery) {
      handlingLegacyRecovery = true;
      client.auth.signOut().then(({ error }) => {
        if (error) throw error;
        beginPasswordReset(session?.user.email || "", false);
        showNotice(passwordResetNotice, "Para cambiar la contraseña, solicita un código e ingrésalo aquí. Abrir el enlace no cambia la contraseña.");
      }).catch((error) => {
        showNotice(loginError, "No se pudo cerrar el enlace de recuperación anterior: " + error.message, true);
      }).finally(() => {
        handlingLegacyRecovery = false;
      });
    }
    if (!session) {
      currentUserEmail = null;
      appScreen.hidden = true;
      loginScreen.hidden = false;
      if (event === "SIGNED_OUT") {
        loginForm.hidden = false;
        resetPasswordButton.hidden = false;
        passwordResetRequestForm.hidden = true;
        passwordResetForm.hidden = true;
        passwordUpdateForm.hidden = true;
        document.getElementById("login-heading").textContent = "Ingresar al panel";
      }
    }
  });
  const authLinkType = new URLSearchParams(window.location.hash.slice(1)).get("type");
  if (authLinkType === "invite") {
    showPasswordUpdateForm();
  } else if (authLinkType === "recovery") {
    handlingLegacyRecovery = true;
    client.auth.getSession().then(async ({ data, error }) => {
      if (error) throw error;
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) throw signOutError;
      beginPasswordReset(data.session?.user.email || "", false);
      showNotice(passwordResetNotice, "Solicita un código de verificación e ingrésalo aquí. Abrir el enlace no cambia la contraseña.");
    }).catch((error) => {
      showNotice(loginError, "No se pudo preparar el restablecimiento: " + error.message, true);
    }).finally(() => {
      handlingLegacyRecovery = false;
    });
  } else {
    checkAdmin().catch((error) => {
      showNotice(loginError, error.message || "No se pudo validar la sesión.", true);
    });
  }
})();
