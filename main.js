/* Épsilon Soluciones — interacciones */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function altoNav() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 0; }

  /* 1. Aparición de bloques al entrar en pantalla */
  function reveals() {
    var targets = [];
    document.querySelectorAll('[data-rv]').forEach(function (grupo) {
      var hijos = grupo.hasAttribute('data-rv-hijos') ? grupo.children : [grupo];
      Array.prototype.forEach.call(hijos, function (el, i) {
        el.classList.add('rv');
        el.style.transitionDelay = (Math.min(i, 4) * 90) + 'ms';
        targets.push(el);
      });
    });
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* 2. Números que cuentan desde cero */
  function contadores() {
    var nodos = Array.prototype.slice.call(document.querySelectorAll('[data-contador]'));
    if (!nodos.length || reduce || !('IntersectionObserver' in window)) return;
    nodos.forEach(function (n) { n.dataset.full = n.textContent; n.dataset.armado = '1'; });

    function animar(nodo, retraso) {
      var full = nodo.dataset.full;
      var m = full.match(/^(\D*)([\d.]+)(.*)$/);
      if (!m) return;
      var objetivo = parseInt(m[2].replace(/\./g, ''), 10);
      if (!objetivo) return;
      nodo.dataset.corriendo = '1';
      nodo.textContent = m[1] + '0' + m[3];
      var inicio = Date.now() + retraso;
      var dur = 1600;
      (function paso() {
        var p = Math.min(1, Math.max(0, (Date.now() - inicio) / dur));
        var suave = 1 - Math.pow(1 - p, 3);
        nodo.textContent = m[1] + Math.round(objetivo * suave).toLocaleString('es-AR') + m[3];
        if (p < 1) { requestAnimationFrame(paso); }
        else { nodo.textContent = full; nodo.dataset.corriendo = ''; }
      })();
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var n = e.target;
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          if (n.dataset.armado === '1' && !n.dataset.corriendo) {
            n.dataset.armado = '0';
            var grupo = n.closest('section') ? n.closest('section').querySelectorAll('[data-contador]') : [n];
            animar(n, Math.max(0, Array.prototype.indexOf.call(grupo, n)) * 220);
          }
        } else if (!e.isIntersecting) {
          n.dataset.armado = '1';
        }
      });
    }, { threshold: [0, 0.6] });
    nodos.forEach(function (n) { io.observe(n); });
  }

  /* 3. Las tarjetas apiladas de "cómo es trabajar" son solo CSS (sticky). */

  /* 4. Servicios en modo teleprompter: se ilumina la situacion que pasa por el
     centro de la pantalla y su respuesta aparece en el recuadro fijo. */
  function teleprompter() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.tele-item'));
    var texto = document.querySelector('.tele-texto');
    var datos = document.getElementById('datos-servicios');
    if (!items.length || !texto || !datos) return;
    var textos = JSON.parse(datos.textContent);
    var actual = 0, pendiente = false, mirando = false;

    function activar(i) {
      if (i === actual) return;
      actual = i;
      items.forEach(function (it, k) { it.classList.toggle('activa', k === i); });
      texto.textContent = textos[i];
      texto.classList.remove('cambio');
      void texto.offsetWidth;
      texto.classList.add('cambio');
    }
    function medir() {
      pendiente = false;
      var centro = medio(), mejor = 0, dist = Infinity;
      items.forEach(function (it, k) {
        var r = it.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - centro);
        if (d < dist) { dist = d; mejor = k; }
      });
      activar(mejor);
    }
    function alScroll() { if (!pendiente) { pendiente = true; requestAnimationFrame(medir); } }
    /* el centro del area visible, debajo del menu fijo */
    function medio() { return (altoNav() + window.innerHeight) / 2; }

    items.forEach(function (it, k) {
      it.addEventListener('click', function () {
        activar(k);
        var r = it.getBoundingClientRect();
        window.scrollBy({ top: r.top + r.height / 2 - medio(), left: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
      it.addEventListener('focus', function () { activar(k); });
    });
    /* solo se escucha el scroll mientras la lista esta en pantalla */
    if (!('IntersectionObserver' in window)) { window.addEventListener('scroll', alScroll, { passive: true }); return; }
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting && !mirando) { window.addEventListener('scroll', alScroll, { passive: true }); mirando = true; alScroll(); }
      else if (!e[0].isIntersecting && mirando) { window.removeEventListener('scroll', alScroll); mirando = false; }
    }).observe(items[0].parentNode);
  }

  /* 5. Videos de YouTube: el reproductor se crea recien al tocar el play, asi
     la home no carga los scripts de YouTube de entrada. */
  function reproductor(id, titulo) {
    var marco = document.createElement('iframe');
    marco.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    marco.title = titulo || 'Video';
    marco.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    marco.setAttribute('allowfullscreen', '');
    marco.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    return marco;
  }

  function videos() {
    document.querySelectorAll('.play[data-youtube]').forEach(function (boton) {
      boton.addEventListener('click', function () {
        var id = (boton.getAttribute('data-youtube') || '').trim();
        if (!id) return;
        var caja = boton.parentElement;
        if (caja.querySelector('.video-marco')) return;
        var marco = reproductor(id, boton.getAttribute('data-titulo'));
        marco.className = 'video-marco';
        caja.appendChild(marco);
        caja.classList.add('reproduciendo');
        marco.focus();
      });
    });
  }

  /* Escenario del inicio: los videos arrancan solos, sin sonido y con
     subtitulos, y rotan cada 15 s. Tocar la pantalla lo reproduce con sonido.
     Nada de YouTube se carga hasta que la pagina termino y el escenario se ve. */
  function escenario() {
    var raiz = document.querySelector('.escenario');
    if (!raiz) return;
    raiz.querySelectorAll('.escena').forEach(function (e) {
      if (!(e.getAttribute('data-youtube') || '').trim()) e.parentNode.removeChild(e);
    });
    var escenas = Array.prototype.slice.call(raiz.querySelectorAll('.escena'));
    if (!escenas.length) return;
    var marco = raiz.querySelector('.escenario-marco');
    var titulo = raiz.querySelector('.escenario-titulo');
    var sub = raiz.querySelector('.escenario-sub');
    var TURNO = 15000;
    var ahorro = navigator.connection && navigator.connection.saveData;
    var idx = 0, modo = 'portada', aVista = false, reloj = null, encender = null;
    raiz.style.setProperty('--turno', TURNO / 1000 + 's');

    var minis = escenas.length < 2 ? [] : escenas.map(function (e, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mini';
      b.setAttribute('aria-label', 'Ver: ' + e.getAttribute('data-titulo'));
      var img = document.createElement('img');
      img.src = e.querySelector('img').getAttribute('src');
      img.alt = '';
      var nombre = document.createElement('span');
      nombre.textContent = e.getAttribute('data-mini') || e.getAttribute('data-nombre');
      b.appendChild(img);
      b.appendChild(nombre);
      b.appendChild(document.createElement('i'));
      b.addEventListener('click', function () { elegir(i); });
      raiz.querySelector('.escenario-minis').appendChild(b);
      return b;
    });

    function idActual() { return escenas[idx].getAttribute('data-youtube').trim(); }
    function pintar() {
      escenas.forEach(function (e, k) { e.classList.toggle('activa', k === idx); });
      minis.forEach(function (b, k) { b.classList.toggle('activa', k === idx); b.setAttribute('aria-pressed', String(k === idx)); });
      titulo.textContent = escenas[idx].getAttribute('data-nombre');
      sub.textContent = escenas[idx].getAttribute('data-sub');
    }
    function vaciar() {
      clearTimeout(reloj);
      clearTimeout(encender);
      marco.innerHTML = '';
      raiz.classList.remove('en-vivo', 'rotando');
    }
    function previa() {
      vaciar();
      var id = encodeURIComponent(idActual());
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&mute=1&controls=0&playsinline=1' +
        '&rel=0&cc_load_policy=1&cc_lang_pref=es&hl=es&disablekb=1&iv_load_policy=3&loop=1&playlist=' + id;
      f.title = 'Vista previa sin sonido: ' + escenas[idx].getAttribute('data-titulo');
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.setAttribute('tabindex', '-1');
      f.setAttribute('aria-hidden', 'true');
      /* la portada tapa el arranque de YouTube (barra de titulo, negro) */
      f.addEventListener('load', function () { encender = setTimeout(function () { raiz.classList.add('en-vivo'); }, 1500); });
      marco.appendChild(f);
      void raiz.offsetWidth;
      raiz.classList.add('rotando');
      if (escenas.length > 1) {
        reloj = setTimeout(function () { idx = (idx + 1) % escenas.length; pintar(); previa(); }, TURNO);
      }
    }
    function conSonido() {
      vaciar();
      modo = 'sonido';
      raiz.classList.add('con-sonido');
      marco.appendChild(reproductor(idActual(), escenas[idx].getAttribute('data-titulo')));
    }
    function elegir(i) {
      idx = i;
      pintar();
      if (modo === 'sonido') conSonido();
      else if (modo === 'previa' && aVista && !document.hidden) previa();
    }

    raiz.querySelector('.escenario-pantalla').addEventListener('click', function () {
      if (modo !== 'sonido') conSonido();
    });
    pintar();
    if (reduce || ahorro || !('IntersectionObserver' in window)) return;

    function arrancar() {
      modo = 'previa';
      new IntersectionObserver(function (e) {
        aVista = e[0].isIntersecting;
        if (modo !== 'previa') return;
        if (aVista && !document.hidden) previa(); else vaciar();
      }, { threshold: 0.35 }).observe(raiz);
      document.addEventListener('visibilitychange', function () {
        if (modo !== 'previa') return;
        if (document.hidden) vaciar(); else if (aVista) previa();
      });
    }
    if (document.readyState === 'complete') setTimeout(arrancar, 1500);
    else window.addEventListener('load', function () { setTimeout(arrancar, 1500); });
  }

  /* Testimonios en seccion horizontal: mientras la seccion queda fija, el
     scroll vertical mueve las tarjetas de costado. Si algo no entra en la
     pantalla, o hay movimiento reducido, queda una fila con scroll nativo. */
  function horizontal() {
    var alto = document.querySelector('.horiz');
    if (!alto) return;
    var seccion = alto.parentNode;
    var pegado = alto.querySelector('.horiz-pegado');
    var ventana = alto.querySelector('.horiz-ventana');
    var tren = alto.querySelector('.horiz-tren');
    var barra = alto.querySelector('.horiz-barra i');
    var recorrido = 0, activo = false, pendiente = false, medidas = '';

    function pintar() {
      pendiente = false;
      if (activo) {
        var avance = Math.min(recorrido, Math.max(0, altoNav() - alto.getBoundingClientRect().top));
        tren.style.transform = 'translate3d(' + (-avance) + 'px,0,0)';
        barra.style.width = (recorrido ? avance / recorrido * 100 : 100) + '%';
      } else {
        var max = ventana.scrollWidth - ventana.clientWidth;
        barra.style.width = (max > 0 ? ventana.scrollLeft / max * 100 : 100) + '%';
      }
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); } }
    function preparar(forzar) {
      /* en celular la barra del navegador cambia el alto al scrollear:
         solo se rearma si cambia el ancho o el alto cambia de verdad */
      var clave = window.innerWidth + 'x' + Math.round(window.innerHeight / 150);
      if (!forzar && clave === medidas) return;
      medidas = clave;
      seccion.classList.remove('horiz-activo');
      alto.style.height = '';
      tren.style.transform = '';
      var disponible = window.innerHeight - altoNav();
      activo = !reduce && disponible >= 480 && pegado.scrollHeight <= disponible - 16;
      if (activo) {
        seccion.classList.add('horiz-activo');
        recorrido = Math.max(0, tren.scrollWidth - pegado.clientWidth);
        alto.style.height = (pegado.clientHeight + recorrido) + 'px';
      }
      pintar();
    }
    window.addEventListener('scroll', pedir, { passive: true });
    ventana.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', function () { clearTimeout(preparar.t); preparar.t = setTimeout(function () { preparar(false); }, 150); });
    window.addEventListener('load', function () { preparar(true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { preparar(true); });
    preparar(true);
  }

  /* 6. Preguntas frecuentes */
  function preguntas() {
    document.querySelectorAll('.faq-item > button').forEach(function (b) {
      b.addEventListener('click', function () {
        var item = b.parentElement;
        var abierto = item.classList.contains('abierto');
        if (item.dataset.solo !== 'no') {
          item.parentElement.querySelectorAll('.faq-item').forEach(function (o) {
            o.classList.remove('abierto');
            o.querySelector('button').setAttribute('aria-expanded', 'false');
          });
        }
        item.classList.toggle('abierto', !abierto);
        b.setAttribute('aria-expanded', String(!abierto));
      });
    });
  }

  /* 7. Menú en celular */
  function menu() {
    var burger = document.querySelector('.nav-burger');
    var links = document.querySelector('.nav-links');
    if (!burger || !links) return;
    burger.addEventListener('click', function () {
      var visible = links.style.display === 'flex';
      links.style.display = visible ? '' : 'flex';
      links.style.flexDirection = 'column';
      links.style.position = 'absolute';
      links.style.top = '64px';
      links.style.left = '0';
      links.style.right = '0';
      links.style.background = 'var(--crema)';
      links.style.padding = '18px 20px';
      links.style.gap = '16px';
      links.style.borderBottom = '1px solid var(--borde)';
      burger.setAttribute('aria-expanded', String(!visible));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    reveals();
    contadores();
    teleprompter();
    videos();
    escenario();
    horizontal();
    preguntas();
    menu();
  });
})();
