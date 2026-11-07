/* ==========================================================
   Aviso de cookies y analítica (Google Analytics 4)
   ----------------------------------------------------------
   Para activar la analítica, pega tu ID de medición de GA4
   (empieza por "G-") en GA4_ID. Mientras esté vacío:
   - no se carga ninguna analítica;
   - el aviso solo informa de los servicios externos del sitio.
   Con el ID puesto, Google Analytics se carga ÚNICAMENTE si la
   persona pulsa "Aceptar analítica".
   ========================================================== */
(function () {
  "use strict";

  var GA4_ID = ""; // Ejemplo: "G-ABC123XYZ9"

  var CLAVE = "melallos-cookies"; // guarda la elección: "accepted", "rejected" o "seen"
  var banner = null;

  function leer() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(valor) { try { localStorage.setItem(CLAVE, valor); } catch (e) { /* sin almacenamiento */ } }
  function borrar() { try { localStorage.removeItem(CLAVE); } catch (e) { /* sin almacenamiento */ } }

  function cargarAnalitica() {
    if (!GA4_ID || window.__gaCargado) return;
    window.__gaCargado = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID, { anonymize_ip: true });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
    document.head.appendChild(s);
  }

  function borrarCookiesAnalitica() {
    document.cookie.split(";").forEach(function (c) {
      var nombre = c.split("=")[0].trim();
      if (nombre.indexOf("_ga") === 0) {
        var partes = location.hostname.split(".");
        for (var i = 0; i < partes.length - 1 || i === 0; i++) {
          var dominio = partes.slice(i).join(".");
          document.cookie = nombre + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + dominio;
          document.cookie = nombre + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=." + dominio;
        }
        document.cookie = nombre + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      }
    });
  }

  function cerrar() { if (banner) { banner.remove(); banner = null; } }

  function elegir(valor) {
    var estabaActiva = Boolean(window.__gaCargado);
    guardar(valor);
    cerrar();
    if (valor === "accepted") {
      cargarAnalitica();
    } else if (estabaActiva) {
      borrarCookiesAnalitica();
      location.reload(); // detiene la analítica ya cargada en esta página
    }
  }

  function boton(texto, clase, valor) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cookie-btn " + clase;
    b.textContent = texto;
    b.addEventListener("click", function () { elegir(valor); });
    return b;
  }

  function mostrar() {
    if (banner) return;
    banner = document.createElement("section");
    banner.className = "cookie-banner glass";
    banner.setAttribute("aria-label", "Aviso de cookies");

    var texto = document.createElement("p");
    texto.className = "cookie-text";
    var enlace = document.createElement("a");
    enlace.href = "cookies.html";
    enlace.textContent = "Política de cookies";

    var acciones = document.createElement("div");
    acciones.className = "cookie-actions";

    if (GA4_ID) {
      texto.append("Usamos cookies de analítica (Google Analytics) para saber cómo se usa el sitio y mejorarlo. Solo se activan si las aceptas. El mapa y las tipografías son servicios de Google. Más información en la ");
      texto.append(enlace, ".");
      acciones.append(boton("Solo necesarias", "cookie-secondary", "rejected"), boton("Aceptar analítica", "cookie-primary", "accepted"));
    } else {
      texto.append("Este sitio no usa cookies de analítica ni de publicidad. Algunos servicios externos, como el mapa de Google y las tipografías de Google Fonts, pueden usar cookies o tecnologías similares. Más información en la ");
      texto.append(enlace, ".");
      acciones.append(boton("Entendido", "cookie-primary", "seen"));
    }

    banner.append(texto, acciones);
    document.body.appendChild(banner);
  }

  function iniciar() {
    var eleccion = leer();
    if (eleccion === "accepted") cargarAnalitica();
    if (!eleccion) mostrar();

    document.querySelectorAll("[data-cookie-settings]").forEach(function (el) {
      el.addEventListener("click", function () {
        borrar();
        mostrar();
        var primero = banner && banner.querySelector("button");
        if (primero) primero.focus();
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
