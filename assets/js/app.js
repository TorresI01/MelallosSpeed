/* ==========================================================
   Melallos Speed – lógica de la página
   ========================================================== */

/* ---------- 1. DATOS QUE DEBES COMPLETAR ---------- */

const CONFIG = {
  // Número de WhatsApp con indicativo de país y sin "+" ni espacios.
  whatsapp: "573215203260",
};

const supabaseConfig = window.MELALLOS_SUPABASE_CONFIG || {};
const supabaseReady = Boolean(
  window.supabase?.createClient && supabaseConfig.url && supabaseConfig.publishableKey
);
const database = supabaseReady
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey)
  : null;

// Precio por defecto de cada categoría (pesos colombianos).
// Si un producto tiene su propio "precio", ese manda.
const PRECIOS = {
  integrales: 850000, // Full face
  abiertos: 650000,   // Open face
};

const TIPOS = {
  integrales: { nombre: "Full face · integral", info: "Casco integral: cubre toda la cabeza y el mentón, y lleva visor frontal." },
  abiertos:   { nombre: "Open face · abierto",  info: "Casco abierto: deja el rostro descubierto y lleva visor frontal." },
  otros:      { nombre: "Accesorio",            info: "Accesorio para motociclistas." },
};

/*
  Catálogo. Reemplaza los nombres por los modelos reales cuando los tengas.
  - categoria: "integrales" (full face) | "abiertos" (open face) | "otros"
  - marca: "Arai" | "AGV" | "Shoei" | "" (el filtro de marca usa este valor)
  - precio: número en pesos; si no lo pones se usa el de la categoría (PRECIOS)
  - tallas: lista (ej. ["S", "M", "L"]) o nada si no la tienes
  - visor: tipo de visor que muestra la foto
  - descripcion: texto que sale en la ventana del producto
  - imagen: foto principal dentro de assets/images/ (o "imagenes": [...] para varias vistas)
  - foto: true si la imagen tiene fondo oscuro (no blanco)
*/
const PRODUCTOS = [
  // ---- Full face (integrales) ----
  { nombre: "Blanco con visor iridiscente", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-01.jpg", visor: "Iridiscente dorado",
    descripcion: "Acabado blanco liso con visor iridiscente. Un diseño limpio que combina con cualquier moto." },
  { nombre: "Gráfico rojo, negro y azul", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-02.jpg", visor: "Ahumado",
    descripcion: "Diseño deportivo en rojo, negro y azul con detalles dorados y visor ahumado." },
  { nombre: "Samurái dorado y negro", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-03.jpg", visor: "Iridiscente dorado",
    descripcion: "Gráfico de samurái al atardecer en negro, dorado y amarillo, con visor iridiscente." },
  { nombre: "Estrellas y franjas rojo y azul", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-04.jpg", visor: "Iridiscente multicolor",
    descripcion: "Diseño de estrellas y franjas en rojo, blanco y azul, con visor iridiscente multicolor." },
  { nombre: "Cromo negro", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-05.jpg", visor: "Ahumado",
    descripcion: "Acabado cromado oscuro tipo espejo con visor ahumado. Discreto y llamativo a la vez." },
  { nombre: "Grulla y flores de cerezo", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-06.jpg", visor: "Iridiscente rojo",
    descripcion: "Gráfico artístico de una grulla con flores de cerezo en blanco, dorado y azul, con visor iridiscente rojo." },
  { nombre: "Gráfico japonés rojo y blanco", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-07.jpg", visor: "Iridiscente verde",
    descripcion: "Diseño oriental muy colorido en rojo, blanco y dorado, con visor iridiscente verde." },
  { nombre: "Llamas rojas", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-08.jpg", visor: "Iridiscente dorado",
    descripcion: "Llamas rojas y negras sobre fondo blanco, con visor iridiscente." },
  { nombre: "Gráfico rojo, blanco y negro", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-09.jpg", visor: "Ahumado",
    descripcion: "Trazos geométricos en rojo, blanco y negro con visor ahumado. Look deportivo de competición." },
  { nombre: "Negro mate edición Red Bull", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-10.jpg", visor: "Ahumado",
    descripcion: "Negro mate con gráficos de Red Bull en rojo y amarillo, y detalles en azul turquesa." },
  { nombre: "Edición Isle of Man TT", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-11.jpg", visor: "Iridiscente dorado",
    descripcion: "Gráfico de la carrera Isle of Man Tourist Trophy en naranja, azul y rojo." },
  { nombre: "Estrellas y barras", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-12.jpg", visor: "Iridiscente multicolor",
    descripcion: "Diseño de estrellas y barras en rojo, blanco y azul, con detalles verdes y visor iridiscente." },
  { nombre: "Blanco con flores de cerezo", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-13.jpg", visor: "Iridiscente dorado",
    descripcion: "Blanco con flores de cerezo rosadas y base celeste, con visor iridiscente." },
  { nombre: "Blanco y negro con visor transparente", categoria: "integrales", marca: "Arai", imagen: "assets/images/arai-14.jpg", visor: "Transparente",
    descripcion: "Gráfico geométrico en blanco y negro con visor transparente." },
  { nombre: "Blanco con visor azul", categoria: "integrales", marca: "Shoei", imagen: "assets/images/shoei-blanco-integral.jpg", foto: true, visor: "Iridiscente azul",
    descripcion: "Casco blanco liso con visor iridiscente azul." },
  { nombre: "Gráficos de competición", categoria: "integrales", marca: "AGV", imagen: "assets/images/agv-sandia-integral.jpg", foto: true, visor: "Iridiscente multicolor",
    descripcion: "Gráficos coloridos de competición con visor iridiscente." },
  { nombre: "Gráfico de puntos de colores", categoria: "integrales", marca: "AGV", imagen: "assets/images/agv-lentejuelas-integral.jpg", foto: true, visor: "Iridiscente azul y violeta",
    descripcion: "Gráfico de puntos de colores sobre fondo azul, con visor iridiscente." },

  // ---- Open face (abiertos) ----
  { nombre: "Blanco con visor iridiscente", categoria: "abiertos", marca: "Shoei", imagen: "assets/images/shoei-blanco-abierto.jpg", foto: true, visor: "Iridiscente",
    descripcion: "Casco abierto blanco con visor iridiscente. Ligero y cómodo para la ciudad." },
  { nombre: "Casco abierto Arai", categoria: "abiertos", marca: "Arai", imagen: "",
    descripcion: "Casco abierto Arai. Escríbenos para conocer los diseños y tallas disponibles." },

  // ---- Otros ----
  { nombre: "Accesorio para motociclista", categoria: "otros", marca: "", imagen: "",
    descripcion: "Accesorios para tu casco y tu moto. Pregúntanos qué tenemos disponible." },
];

/* ---------- 2. UTILIDADES ---------- */

const ETIQUETA_SIN_FOTO = { integrales: "Full face", abiertos: "Open face", otros: "Próximamente" };

function waLink(mensaje) {
  return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(mensaje);
}

function formatoPrecio(valor) {
  return "$" + Number(valor).toLocaleString("es-CO");
}

function precioDe(p) {
  if (p.precio !== null && p.precio !== undefined && p.precio !== "" && Number.isFinite(Number(p.precio))) {
    return Number(p.precio);
  }
  return PRECIOS[p.categoria] || null;
}

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* ---------- 3. ENLACES DE WHATSAPP (data-wa) ---------- */

function activarEnlacesWhatsApp() {
  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.href = waLink(el.dataset.wa);
    el.target = "_blank";
    el.rel = "noopener";
  });
}

/* ---------- 4. CATÁLOGO ---------- */

const bloques = document.querySelectorAll(".cat-block");
const mensajeVacio = document.getElementById("vacio");
const conteo = document.getElementById("conteo");
const inputBuscar = document.getElementById("buscar");
const selectMarca = document.getElementById("marca");
const botonesTipo = document.querySelectorAll(".seg");

window.addEventListener("error", () => {
  if (conteo.textContent.includes("Cargando catálogo")) {
    conteo.classList.add("is-error");
    conteo.textContent = "No se pudo cargar el catálogo. Recarga la página para volver a intentarlo.";
  }
});

let categoriaActual = "integrales";

// Pinta la imagen de un producto dentro de un contenedor (tarjeta o ventana).
function pintarImagen(media, p, src) {
  media.replaceChildren();
  media.classList.remove("is-photo", "is-empty");

  const sinFoto = () => {
    media.replaceChildren();
    media.classList.remove("is-photo");
    media.classList.remove("is-loading");
    media.classList.add("is-empty");
    media.textContent = ETIQUETA_SIN_FOTO[p.categoria] || "Producto";
  };

  if (!src) { sinFoto(); return; }
  const esTarjeta = media.classList.contains("card-media");
  if (esTarjeta) media.classList.add("is-loading");
  if (p.foto) media.classList.add("is-photo");
  const img = document.createElement("img");
  img.loading = esTarjeta ? "lazy" : "eager";
  img.decoding = "async";
  img.alt = (p.marca ? p.marca + " " : "") + p.nombre;
  img.addEventListener("load", () => {
    if (esTarjeta) {
      media.classList.remove("is-loading");
      img.classList.add("is-loaded");
    }
  }, { once: true });
  img.addEventListener("error", sinFoto);
  img.src = src;
  media.appendChild(img);
  if (esTarjeta && img.complete && img.naturalWidth > 0) {
    media.classList.remove("is-loading");
    img.classList.add("is-loaded");
  }
}

function crearTarjeta(p) {
  const card = document.createElement("article");
  card.className = "card";

  const media = document.createElement("div");
  media.className = "card-media";
  pintarImagen(media, p, p.imagen);

  if (p.marca) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = p.marca;
    media.appendChild(badge);
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const titulo = document.createElement("h3");
  titulo.textContent = p.nombre;
  body.appendChild(titulo);

  const valor = precioDe(p);
  const precio = document.createElement("p");
  precio.className = "card-price";
  if (valor !== null) {
    precio.textContent = formatoPrecio(valor) + " ";
    const cop = document.createElement("small");
    cop.textContent = "COP";
    precio.appendChild(cop);
  } else {
    precio.textContent = "Precio por consultar";
  }
  body.appendChild(precio);

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "btn-link";
  boton.textContent = "Ver detalles";
  body.appendChild(boton);

  card.append(media, body);
  card.addEventListener("click", () => abrirModal(p, boton));
  return card;
}

function renderCatalogo() {
  const q = normalizar(inputBuscar.value.trim());
  const marca = selectMarca.value;

  const lista = PRODUCTOS.filter((p) => {
    const okCat = categoriaActual === "todos" || p.categoria === categoriaActual;
    const okMarca = marca === "todas" || p.marca === marca;
    const texto = normalizar([p.nombre, p.marca, p.referencia].join(" "));
    return okCat && okMarca && (!q || texto.includes(q));
  });

  bloques.forEach((bloque) => {
    const delBloque = lista.filter((p) => p.categoria === bloque.dataset.cat);
    bloque.querySelector(".grid").replaceChildren(...delBloque.map(crearTarjeta));
    bloque.hidden = delBloque.length === 0;
  });

  mensajeVacio.hidden = lista.length > 0;
  conteo.textContent = lista.length === 1 ? "1 producto" : lista.length + " productos";
}

async function cargarCatalogoAdministrado() {
  if (!database) return;
  const { data, error } = await database
    .from("products")
    .select("id,name,category,brand,description,price_cop,image_path,image_style,visor,active")
    .eq("active", true)
    .order("name");

  if (error) {
    const aviso = document.getElementById("catalog-error");
    aviso.hidden = false;
    aviso.textContent = "No se pudo cargar el catálogo actualizado. " + error.message;
    return;
  }

  PRODUCTOS.splice(0, PRODUCTOS.length, ...data.map((producto) => ({
    id: producto.id,
    nombre: producto.name,
    categoria: producto.category,
    marca: producto.brand || "",
    descripcion: producto.description || "",
    precio: producto.price_cop,
    imagen: producto.image_path || "",
    visor: producto.visor || "",
    foto: producto.image_style === "cover",
  })));
  renderCatalogo();
}

botonesTipo.forEach((boton) => {
  boton.addEventListener("click", () => {
    categoriaActual = boton.dataset.cat;
    botonesTipo.forEach((b) => {
      const activo = b === boton;
      b.classList.toggle("is-active", activo);
      b.setAttribute("aria-pressed", String(activo));
    });
    renderCatalogo();
  });
});
selectMarca.addEventListener("change", renderCatalogo);
inputBuscar.addEventListener("input", renderCatalogo);

/* ---------- 4b. VENTANA FLOTANTE DEL PRODUCTO ---------- */

const modal = document.getElementById("modal");
const mMedia = document.getElementById("m-media");
const mThumbs = document.getElementById("m-thumbs");
const mMarca = document.getElementById("m-marca");
const mTitulo = document.getElementById("m-titulo");
const mPrecio = document.getElementById("m-precio");
const mDesc = document.getElementById("m-desc");
const mDetalles = document.getElementById("m-detalles");
const mAcordeon = document.getElementById("m-acordeon");
const mWa = document.getElementById("m-wa");

let focoPrevio = null;

function filaDetalle(etiqueta, valor) {
  const fila = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = etiqueta;
  dd.textContent = valor;
  fila.append(dt, dd);
  return fila;
}

function abrirModal(p, origen) {
  focoPrevio = origen || document.activeElement;
  const tipo = TIPOS[p.categoria] || TIPOS.otros;
  const vistas = p.imagenes && p.imagenes.length ? p.imagenes : [p.imagen];

  // Imagen principal y miniaturas (si hay varias vistas)
  pintarImagen(mMedia, p, vistas[0]);
  mThumbs.replaceChildren();
  mThumbs.hidden = vistas.length < 2;
  if (vistas.length > 1) {
    vistas.forEach((src, i) => {
      const t = document.createElement("button");
      t.type = "button";
      t.className = "thumb";
      t.setAttribute("aria-label", "Ver vista " + (i + 1));
      t.setAttribute("aria-current", String(i === 0));
      const im = document.createElement("img");
      im.src = src; im.alt = "";
      t.appendChild(im);
      t.addEventListener("click", () => {
        pintarImagen(mMedia, p, src);
        mThumbs.querySelectorAll(".thumb").forEach((x) => x.setAttribute("aria-current", String(x === t)));
      });
      mThumbs.appendChild(t);
    });
  }

  // Texto
  mMarca.textContent = p.marca || tipo.nombre;
  mMarca.hidden = false;
  mTitulo.textContent = p.nombre;

  const valor = precioDe(p);
  mPrecio.textContent = valor !== null ? formatoPrecio(valor) + " " : "Precio por consultar";
  if (valor !== null) {
    const cop = document.createElement("small");
    cop.textContent = "COP";
    mPrecio.appendChild(cop);
  }

  mDesc.textContent = (p.descripcion || "") + (p.descripcion ? " " : "") + tipo.info;

  // Los Arai full face llevan la ficha completa (calidad, certificación, qué incluye).
  const esAraiFullFace = p.marca === "Arai" && p.categoria === "integrales";

  const filas = esAraiFullFace
    ? [
        filaDetalle("Marca", "Arai"),
        filaDetalle("Tipo", tipo.nombre),
        filaDetalle("Calidad", "Top Quality"),
        filaDetalle("Certificación", "DOT y E3"),
        filaDetalle("Incluye", "1 visor del color que prefieras y tula para transportarlo y protegerlo"),
        filaDetalle("Tallas", "Disponible en todas las tallas"),
        filaDetalle("Disponibilidad", "Pregunta por la disponibilidad y los diferentes tonos de visores"),
        filaDetalle("Envío y crédito", "Consulta condiciones"),
      ]
    : [
        p.marca ? filaDetalle("Marca", p.marca) : null,
        filaDetalle("Tipo", tipo.nombre),
        p.visor ? filaDetalle("Visor (en la foto)", p.visor) : null,
        filaDetalle("Tallas", p.tallas && p.tallas.length ? p.tallas.join(", ") : "Consulta las disponibles"),
        filaDetalle("Disponibilidad", "Confírmala por WhatsApp"),
        filaDetalle("Envío y crédito", "Consulta condiciones"),
      ].filter(Boolean);

  mDetalles.replaceChildren(...filas);

  const resumen = (p.marca ? p.marca + " " : "") + p.nombre + " (" + tipo.nombre + ")" +
    (valor !== null ? " – " + formatoPrecio(valor) : "");
  mWa.href = waLink("Hola, quiero consultar por: " + resumen);
  mWa.target = "_blank";
  mWa.rel = "noopener";

  mAcordeon.open = false; // los detalles siempre empiezan cerrados
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modal.querySelector(".modal-close").focus();
}

function cerrarModal() {
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  if (focoPrevio && document.contains(focoPrevio)) focoPrevio.focus();
}

modal.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) cerrarModal();
});

document.addEventListener("keydown", (e) => {
  if (modal.hidden) return;
  if (e.key === "Escape") { cerrarModal(); return; }
  if (e.key === "Tab") {
    // Mantiene el foco dentro de la ventana
    const items = [...modal.querySelectorAll("button, a[href], input")].filter((el) => !el.hidden && el.offsetParent !== null);
    if (!items.length) return;
    const primero = items[0], ultimo = items[items.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }
});

/* ---------- 4c. VISORES PERSONALIZADOS ---------- */

const COLORES_VISOR = [
  { nombre: "Azul",      fondo: "linear-gradient(120deg, #0a2a8a, #2f6bff 45%, #7cc4ff)" },
  { nombre: "Arcoíris",  fondo: "linear-gradient(120deg, #2f6bff, #19c3b1 22%, #f0e130 46%, #ff7a18 68%, #e5372b 84%, #a23bff)" },
  { nombre: "Dorado",    fondo: "linear-gradient(120deg, #6b4a0a, #e0b04a 45%, #fff0b3)" },
  { nombre: "Rojo",      fondo: "linear-gradient(120deg, #5a0a0f, #e5372b 50%, #ff9a8a)" },
  { nombre: "Verde",     fondo: "linear-gradient(120deg, #04361c, #1fb855 50%, #b6f5c8)" },
  { nombre: "Morado",    fondo: "linear-gradient(120deg, #2a0a5a, #8a3bff 50%, #d9b8ff)" },
  { nombre: "Plateado",  fondo: "linear-gradient(120deg, #6e6e73, #d8d8de 50%, #ffffff)" },
  { nombre: "Humo",      fondo: "linear-gradient(120deg, #0b0b0d, #3a3a40 55%, #8a8a92)" },
];

(function iniciarVisores() {
  const contenedor = document.getElementById("swatches");
  const vista = document.getElementById("visor-preview");
  const etiqueta = document.getElementById("visor-nombre");
  const casco = document.getElementById("v-casco");
  const enviar = document.getElementById("v-enviar");
  if (!contenedor || !vista) return;

  let elegido = COLORES_VISOR[0];

  function elegir(color, boton) {
    elegido = color;
    vista.style.setProperty("--visor", color.fondo);
    etiqueta.textContent = "Visor " + color.nombre.toLowerCase();
    contenedor.querySelectorAll(".swatch").forEach((b) => b.setAttribute("aria-checked", String(b === boton)));
    vista.classList.remove("glint");
    void vista.offsetWidth; // reinicia el destello
    vista.classList.add("glint");
  }

  COLORES_VISOR.forEach((color, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", color.nombre);
    b.title = color.nombre;
    b.style.background = color.fondo;
    b.addEventListener("click", () => elegir(color, b));
    contenedor.appendChild(b);
    if (i === 0) elegir(color, b);
  });

  enviar.addEventListener("click", () => {
    const modeloCasco = casco.value.trim();
    const mensaje = "Hola, quiero cotizar un visor personalizado de color " + elegido.nombre.toLowerCase() +
      (modeloCasco ? " para mi casco: " + modeloCasco : ".");
    window.open(waLink(mensaje), "_blank", "noopener");
  });
})();

/* ---------- 5. MENÚ EN CELULAR ---------- */

const botonMenu = document.querySelector(".nav-toggle");
const menu = document.getElementById("menu");

function cerrarMenu() {
  menu.classList.remove("is-open");
  botonMenu.setAttribute("aria-expanded", "false");
  botonMenu.querySelector(".sr-only").textContent = "Abrir menú";
}

botonMenu.addEventListener("click", () => {
  const abierto = menu.classList.toggle("is-open");
  botonMenu.setAttribute("aria-expanded", String(abierto));
  botonMenu.querySelector(".sr-only").textContent = abierto ? "Cerrar menú" : "Abrir menú";
});

menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", cerrarMenu));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarMenu(); });

/* ---------- 6. FORMULARIO DE ENCARGOS ---------- */

const form = document.getElementById("form-encargo");
const errorForm = document.getElementById("form-error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!database) {
    errorForm.textContent = "La base de datos aún no está configurada. No se guardó ni se envió tu solicitud.";
    errorForm.hidden = false;
    return;
  }

  const datos = Object.fromEntries(new FormData(form).entries());
  const obligatorios = ["nombre", "producto", "contacto"];
  const faltantes = obligatorios.filter((campo) => !String(datos[campo] || "").trim());
  const consentimiento = form.elements.consentimiento.checked;

  obligatorios.forEach((campo) => {
    form.elements[campo].setAttribute("aria-invalid", String(faltantes.includes(campo)));
  });
  form.elements.consentimiento.setAttribute("aria-invalid", String(!consentimiento));

  if (faltantes.length || !consentimiento) {
    errorForm.textContent = faltantes.length
      ? "Completa tu nombre, el producto que buscas y tu teléfono para enviar el encargo."
      : "Debes autorizar el tratamiento de tus datos para enviar el encargo.";
    errorForm.hidden = false;
    (faltantes.length ? form.elements[faltantes[0]] : form.elements.consentimiento).focus();
    return;
  }

  errorForm.replaceChildren();
  errorForm.hidden = true;

  const lineas = [
    "Hola, quiero hacer un encargo.",
    "Nombre: " + datos.nombre.trim(),
    "Producto: " + datos.producto.trim(),
  ];
  if (datos.referencia && datos.referencia.trim()) lineas.push("Marca/referencia: " + datos.referencia.trim());
  if (datos.talla && datos.talla.trim()) lineas.push("Talla: " + datos.talla.trim());
  lineas.push("Mi contacto: " + datos.contacto.trim());

  const botonEnviar = form.querySelector('button[type="submit"]');
  const ventanaWhatsApp = window.open("about:blank", "_blank");
  if (ventanaWhatsApp) ventanaWhatsApp.opener = null;
  botonEnviar.disabled = true;
  botonEnviar.textContent = "Guardando solicitud…";

  try {
    const { error } = await database.from("inquiries").insert({
      customer_name: datos.nombre.trim(),
      phone: datos.contacto.trim(),
      product_name: datos.producto.trim(),
      reference: datos.referencia ? datos.referencia.trim() : null,
      size: datos.talla ? datos.talla.trim() : null,
      consent_given: true,
      source: "sitio_web",
    });
    if (error) {
      if (ventanaWhatsApp) ventanaWhatsApp.close();
      errorForm.textContent = "No pudimos guardar tu solicitud. No se envió por WhatsApp; inténtalo de nuevo o escríbenos directamente.";
      errorForm.hidden = false;
      console.error("Supabase rechazó el encargo:", error.message);
      return;
    }

    const enlaceWhatsApp = waLink(lineas.join("\n"));
    if (ventanaWhatsApp) {
      ventanaWhatsApp.location.href = enlaceWhatsApp;
    } else {
      errorForm.replaceChildren(document.createTextNode("La solicitud quedó guardada. El navegador bloqueó la nueva pestaña; "));
      const enlace = document.createElement("a");
      enlace.href = enlaceWhatsApp;
      enlace.target = "_blank";
      enlace.rel = "noopener";
      enlace.textContent = "continúa por WhatsApp";
      errorForm.appendChild(enlace);
      errorForm.hidden = false;
    }
  } catch (error) {
    if (ventanaWhatsApp) ventanaWhatsApp.close();
    errorForm.textContent = "No se pudo conectar con la base de datos. No se guardó ni envió la solicitud; inténtalo de nuevo.";
    errorForm.hidden = false;
    console.error("No se pudo guardar el encargo:", error);
  } finally {
    botonEnviar.disabled = false;
    botonEnviar.textContent = "Enviar encargo por WhatsApp";
  }
});

/* ---------- 7. INICIO ---------- */

document.getElementById("anio").textContent = new Date().getFullYear();
activarEnlacesWhatsApp();
renderCatalogo();
cargarCatalogoAdministrado().catch((error) => {
  const aviso = document.getElementById("catalog-error");
  aviso.hidden = false;
  aviso.textContent = "No se pudo cargar el catálogo actualizado. " + error.message;
  console.error("No se pudo cargar el catálogo:", error);
});