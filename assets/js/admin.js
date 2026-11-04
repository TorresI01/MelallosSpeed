(() => {
  const config = window.MELALLOS_SUPABASE_CONFIG || {};
  const loginScreen = document.getElementById("admin-login");
  const appScreen = document.getElementById("admin-app");
  const setupNotice = document.getElementById("setup-notice");
  const loginError = document.getElementById("login-error");
  const appNotice = document.getElementById("app-notice");
  const loginForm = document.getElementById("login-form");
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
      description: "Guarda los datos de contacto que tus clientes te compartan para gestionar su atención.",
      table: "customers",
      order: "created_at",
      columns: [["full_name", "Nombre"], ["phone", "Teléfono"], ["email", "Correo"], ["address", "Dirección"], ["notes", "Notas"]],
      fields: [
        { name: "full_name", label: "Nombre completo", required: true },
        { name: "phone", label: "Teléfono / WhatsApp", required: true },
        { name: "email", label: "Correo", type: "email", nullable: true },
        { name: "address", label: "Dirección", nullable: true },
        { name: "notes", label: "Notas", type: "textarea", wide: true },
      ],
    },
    inquiries: {
      title: "Encargos y consultas",
      description: "Revisa las solicitudes enviadas desde la web, actualiza su estado y agrega notas de seguimiento.",
      table: "inquiries",
      order: "created_at",
      columns: [["created_at", "Fecha"], ["customer_name", "Cliente"], ["phone", "Teléfono"], ["product_name", "Producto"], ["size", "Talla"], ["status", "Estado"], ["consent_given", "Autorización"]],
      fields: [
        { name: "customer_name", label: "Nombre", required: true },
        { name: "phone", label: "Teléfono / WhatsApp", required: true },
        { name: "product_name", label: "Producto solicitado", required: true },
        { name: "reference", label: "Marca o referencia", nullable: true },
        { name: "size", label: "Talla", nullable: true },
        { name: "status", label: "Estado", type: "select", options: [["nuevo", "Nuevo"], ["contactado", "Contactado"], ["cotizado", "Cotizado"], ["pedido", "Pedido"], ["cerrado", "Cerrado"], ["cancelado", "Cancelado"]] },
        { name: "notes", label: "Notas de seguimiento", type: "textarea", wide: true },
      ],
    },
    sales: {
      title: "Ventas",
      description: "Registra ventas confirmadas. Al guardar una venta, el stock se descuenta automáticamente; el movimiento queda en el historial.",
      table: "sales",
      order: "sale_date",
      allowDelete: false,
      columns: [["sale_date", "Fecha"], ["customer_name", "Cliente"], ["product_name", "Producto"], ["quantity", "Cantidad"], ["unit_price_cop", "Precio unitario"], ["total_cop", "Total"], ["paid_cop", "Recibido"], ["payment_method", "Medio de pago"], ["payment_status", "Pago"], ["status", "Venta"]],
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
      description: "Registra egresos del negocio, su categoría, proveedor y medio de pago.",
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
      description: "Administra contactos, direcciones y notas de proveedores.",
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
  };

  let client = null;
  let currentView = "dashboard";
  let currentPage = 0;
  let currentRows = [];
  let editingRecord = null;

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

  function formatMoney(value) {
    if (value === null || value === undefined || value === "") return "—";
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value));
  }

  function displayValue(value, column) {
    if (value === null || value === undefined || value === "") return "—";
    if (column === "price_cop" || column === "cost_cop" || column === "amount_cop" ||
        column === "unit_price_cop" || column === "total_cop") return formatMoney(value);
    if (column === "active" || column === "consent_given") return value ? "Sí" : "No";
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
    const { error } = await client.auth.signInWithPassword({
      email: String(values.get("email")).trim(),
      password: String(values.get("password")),
    });
    submit.disabled = false;
    submit.textContent = "Iniciar sesión";
    if (error) {
      showNotice(loginError, "No se pudo iniciar sesión. Revisa el correo, la contraseña y la configuración de autenticación.", true);
      return;
    }
    try {
      await checkAdmin();
    } catch (authorizationError) {
      showNotice(loginError, authorizationError.message, true);
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

  async function renderDashboard() {
    clearNotice(appNotice);
    const { data, error } = await client.rpc("admin_dashboard_summary");
    if (error) {
      showNotice(appNotice, "No se pudo cargar el resumen: " + error.message, true);
      return;
    }
    const summary = data || {};
    const metrics = [
      ["Productos activos", String(summary.active_products ?? 0)],
      ["Unidades en stock", String(summary.stock_units ?? 0)],
      ["Productos por reponer", String(summary.low_stock_products ?? 0)],
      ["Encargos abiertos", String(summary.open_inquiries ?? 0)],
      ["Ventas registradas", formatMoney(summary.sales_total_cop ?? 0)],
      ["Gastos registrados", formatMoney(summary.expenses_total_cop ?? 0)],
      ["Ingresos menos gastos", formatMoney(summary.balance_cop ?? 0)],
      ["Cuentas por cobrar", formatMoney(summary.receivables_cop ?? 0)],
    ];
    const grid = document.getElementById("metric-grid");
    grid.replaceChildren(...metrics.map(([label, value]) => metric(label, value)));
    await renderRecentInquiries();
  }

  async function renderRecentInquiries() {
    const container = document.getElementById("recent-inquiries");
    const { data, error } = await client.from("inquiries")
      .select("id,created_at,customer_name,product_name,status")
      .order("created_at", { ascending: false }).limit(5);
    if (error) {
      container.textContent = "No se pudieron cargar los encargos: " + error.message;
      return;
    }
    const table = document.createElement("table");
    table.append(createTableHead([["created_at", "Fecha"], ["customer_name", "Cliente"], ["product_name", "Producto"], ["status", "Estado"]]));
    const body = document.createElement("tbody");
    data.forEach((row) => {
      const tr = document.createElement("tr");
      ["created_at", "customer_name", "product_name", "status"].forEach((column) => {
        const td = document.createElement("td");
        td.textContent = displayValue(row[column], column);
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
    container.replaceChildren(table);
    if (!data.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Todavía no hay encargos.";
      container.replaceChildren(empty);
    }
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
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === view);
    });
    document.getElementById("dashboard-view").hidden = view !== "dashboard";
    document.getElementById("module-view").hidden = view === "dashboard" || view === "reports";
    document.getElementById("page-title").textContent = view === "dashboard" ? "Resumen del negocio" :
      view === "reports" ? "Informes del negocio" : modules[view].title;
    if (view === "dashboard") return renderDashboard();
    if (view === "reports") return renderReports();
    await renderModule();
  }

  async function renderModule() {
    const module = modules[currentView];
    document.getElementById("module-eyebrow").textContent = "GESTIÓN · " + module.table.toUpperCase();
    document.getElementById("module-heading").textContent = module.title;
    document.getElementById("module-description").textContent = module.description;
    document.getElementById("add-record-button").hidden = Boolean(module.readOnly);
    document.getElementById("export-button").hidden = false;
    const { data, error, count } = await client.from(module.table)
      .select("*", { count: "exact" })
      .order(module.order, { ascending: false, nullsFirst: false })
      .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
    if (error) {
      showNotice(appNotice, "No se pudo cargar " + module.title.toLowerCase() + ": " + error.message, true);
      return;
    }
    clearNotice(appNotice);
    currentRows = data || [];
    renderTable(module, currentRows);
    const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
    document.getElementById("page-indicator").textContent = "Página " + (currentPage + 1) + " de " + totalPages + " · " + (count || 0) + " registros";
    document.getElementById("previous-page").disabled = currentPage === 0;
    document.getElementById("next-page").disabled = currentPage + 1 >= totalPages;
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
        cell.textContent = displayValue(record[column], column);
        row.appendChild(cell);
      });
      const actionCell = document.createElement("td");
      const actionGroup = document.createElement("div");
      actionGroup.className = "table-actions";
      if (!module.readOnly) {
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

  async function loadRelationOptions(field) {
    const selection = field.relation === "products" ? "id,name,price_cop" : "id," + field.display;
    const { data, error } = await client.from(field.relation).select(selection).order(field.display).limit(500);
    if (error) throw error;
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
    if (field.type === "date" && value === undefined) input.value = new Date().toISOString().slice(0, 10);
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
    clearNotice(document.getElementById("record-error"));
    document.getElementById("record-title").textContent = record ? "Editar registro" : "Nuevo registro";
    document.getElementById("save-record-button").textContent = record ? "Guardar cambios" : "Guardar registro";
    const fields = module.fields.map((field) => makeInput(field, record ? record[field.name] : undefined));
    recordFields.replaceChildren(...fields);
    recordDialog.showModal();
    try {
      for (const field of module.fields.filter((item) => item.type === "relation")) {
        const options = await loadRelationOptions(field);
        const select = recordFields.querySelector(`[name="${field.name}"]`);
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
    } catch (error) {
      showNotice(document.getElementById("record-error"), "No se pudieron cargar las opciones relacionadas: " + error.message, true);
    }
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
    if (currentView === "sales" && !values.sale_date) values.sale_date = new Date().toISOString().slice(0, 10);
    if (currentView === "sales" && values.product_id) {
      values.product_name = recordFields.querySelector('[name="product_id"] option:checked').textContent;
    }
    if (currentView === "sales" && values.customer_id && !values.customer_name) {
      values.customer_name = recordFields.querySelector('[name="customer_id"] option:checked').textContent;
    }
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
    const { error } = await client.from(module.table).delete().eq("id", record.id);
    if (error) {
      showNotice(appNotice, "No se pudo eliminar: " + error.message, true);
      return;
    }
    showNotice(appNotice, "Registro eliminado.");
    await renderModule();
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
    document.getElementById("dashboard-view").hidden = true;
    document.getElementById("module-view").hidden = true;
    const { data, error } = await client.rpc("admin_monthly_report");
    if (error) {
      showNotice(appNotice, "No se pudieron cargar los informes: " + error.message, true);
      return;
    }
    clearNotice(appNotice);
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
    (data || []).forEach((month) => {
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
    document.getElementById("table-wrap").replaceChildren(section);
    document.getElementById("add-record-button").hidden = true;
    document.getElementById("export-button").hidden = true;
    document.querySelector(".pagination").hidden = true;
  }

  if (!window.supabase?.createClient || !config.url || !config.publishableKey) {
    setupNotice.hidden = false;
    setupNotice.textContent = "Falta conectar Supabase. Sigue la guía de configuración del README para crear el proyecto, ejecutar supabase/schema.sql y completar assets/js/supabase-config.js. No uses una clave service_role.";
    loginForm.querySelectorAll("input,button").forEach((element) => { element.disabled = true; });
    return;
  }

  client = window.supabase.createClient(config.url, config.publishableKey);
  loginForm.addEventListener("submit", signIn);
  document.getElementById("logout-button").addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error) showNotice(appNotice, "No se pudo cerrar sesión: " + error.message, true);
    else {
      appScreen.hidden = true;
      loginScreen.hidden = false;
    }
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(".pagination").hidden = false;
      openView(button.dataset.view).catch((error) => showNotice(appNotice, error.message, true));
    });
  });
  document.querySelector("[data-go='inquiries']").addEventListener("click", () => {
    document.querySelector(".pagination").hidden = false;
    openView("inquiries").catch((error) => showNotice(appNotice, error.message, true));
  });
  document.getElementById("add-record-button").addEventListener("click", () => showRecordDialog());
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
  client.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      appScreen.hidden = true;
      loginScreen.hidden = false;
    }
  });
  checkAdmin().catch((error) => {
    showNotice(loginError, error.message || "No se pudo validar la sesión.", true);
  });
})();
