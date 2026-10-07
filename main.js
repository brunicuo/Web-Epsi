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

  /* Escenario del inicio. Los videos arrancan solos, sin sonido y con
     subtitulos, y rotan cada 15 s. Tocar activa el audio sobre el mismo
     reproductor, sin recargarlo. Si se baja con un video andando, sigue en una
     ventana flotante que se puede cerrar: en computadora siempre, en celular
     solo si se activo el sonido. */
  function escenario() {
    var raiz = document.querySelector('.escenario');
    if (!raiz) return;
    raiz.querySelectorAll('.escena').forEach(function (e) {
      if (!(e.getAttribute('data-youtube') || '').trim()) e.parentNode.removeChild(e);
    });
    var escenas = Array.prototype.slice.call(raiz.querySelectorAll('.escena'));
    if (!escenas.length) return;
    var pantalla = raiz.querySelector('.escenario-pantalla');
    var lugar = raiz.querySelector('.escenario-video');
    var pausa = raiz.querySelector('.marco-pausa');
    var titulo = raiz.querySelector('.escenario-titulo');
    var sub = raiz.querySelector('.escenario-sub');
    var YT = 'https://www.youtube-nocookie.com';
    var TURNO = 15000;
    var ahorro = navigator.connection && navigator.connection.saveData;
    var escritorio = window.matchMedia('(min-width: 721px)');
    var idx = 0, modo = 'portada', autoActivo = false, aVista = true, cerrado = false;
    var yt = null, reloj = null, encender = null, escuchar = null, verificar = null;
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
    function mandar(func, args) {
      if (yt && yt.frame.contentWindow) {
        yt.frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: args || [] }), YT);
      }
    }
    function vaciar() {
      clearTimeout(reloj); clearTimeout(encender); clearTimeout(verificar); clearInterval(escuchar);
      yt = null;
      lugar.innerHTML = '';
      raiz.classList.remove('en-vivo', 'rotando', 'con-sonido', 'propio', 'nativo');
      pausa.classList.remove('pausado');
    }
    function crear(conAudio) {
      var id = encodeURIComponent(idActual());
      var f = document.createElement('iframe');
      f.src = YT + '/embed/' + id + '?' +
        (conAudio ? 'autoplay=1&controls=1' : 'autoplay=1&mute=1&controls=0&disablekb=1&loop=1&playlist=' + id) +
        '&playsinline=1&rel=0&cc_load_policy=1&cc_lang_pref=es&hl=es&iv_load_policy=3' +
        '&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
      f.title = (conAudio ? '' : 'Vista previa sin sonido: ') + escenas[idx].getAttribute('data-titulo');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      if (conAudio) f.setAttribute('allowfullscreen', '');
      else { f.setAttribute('tabindex', '-1'); f.setAttribute('aria-hidden', 'true'); }
      var este = { frame: f, listo: false, estado: -1, muted: !conAudio };
      yt = este;
      f.addEventListener('load', function () {
        /* se le pide al reproductor que avise su estado (protocolo de la API de YouTube) */
        var n = 0;
        escuchar = setInterval(function () {
          if (yt !== este || este.listo || ++n > 20) { clearInterval(escuchar); return; }
          f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YT);
        }, 250);
        /* respaldo: si YouTube no avisa que arranco, se muestra igual */
        encender = setTimeout(function () { raiz.classList.add('en-vivo'); }, 4000);
      });
      lugar.appendChild(f);
    }

    window.addEventListener('message', function (e) {
      if (!yt || e.source !== yt.frame.contentWindow) return;
      var d;
      try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
      if (!d || !d.event) return;
      var estado = null;
      if (d.event === 'onReady' || d.event === 'initialDelivery') yt.listo = true;
      if (d.event === 'onStateChange' && typeof d.info === 'number') estado = d.info;
      if (d.event === 'infoDelivery' && d.info) {
        yt.listo = true;
        if (typeof d.info.playerState === 'number') estado = d.info.playerState;
        if (typeof d.info.muted === 'boolean') yt.muted = d.info.muted;
      }
      if (estado === null) return;
      yt.estado = estado;
      pausa.classList.toggle('pausado', estado === 2);
      /* la portada se va cuando el video corre de verdad; el margen tapa la barra de titulo del arranque */
      if (estado === 1 && !raiz.classList.contains('en-vivo')) {
        clearTimeout(encender);
        encender = setTimeout(function () { raiz.classList.add('en-vivo'); }, 600);
      }
    });

    function previa() {
      vaciar();
      modo = 'previa';
      crear(false);
      void raiz.offsetWidth;
      raiz.classList.add('rotando');
      if (escenas.length > 1) {
        reloj = setTimeout(function () { idx = (idx + 1) % escenas.length; pintar(); previa(); }, TURNO);
      }
    }
    /* respaldo: reproductor nuevo con sonido y los controles de YouTube */
    function nativo() {
      vaciar();
      modo = 'sonido';
      raiz.classList.add('con-sonido', 'nativo', 'en-vivo');
      crear(true);
    }
    function conSonido() {
      cerrado = false;
      if (!yt || !yt.listo || yt.frame.src.indexOf('mute=1') < 0) { nativo(); return; }
      clearTimeout(reloj);
      raiz.classList.remove('rotando');
      modo = 'sonido';
      raiz.classList.add('con-sonido', 'propio', 'en-vivo');
      mandar('unMute');
      mandar('setVolume', [100]);
      mandar('seekTo', [0, true]);
      mandar('playVideo');
      /* si el navegador no dejo activar el audio, se pasa al reproductor completo */
      verificar = setTimeout(function () { if (modo === 'sonido' && yt && yt.muted) nativo(); }, 1200);
    }
    function alternarPausa() {
      if (!yt) return;
      var pausado = yt.estado === 2;
      mandar(pausado ? 'playVideo' : 'pauseVideo');
      yt.estado = pausado ? 1 : 2;
      pausa.classList.toggle('pausado', !pausado);
      pausa.setAttribute('aria-label', pausado ? 'Pausar' : 'Reproducir');
    }
    function cerrar() {
      cerrado = true;
      raiz.classList.remove('flotando');
      vaciar();
      modo = 'portada';
    }
    function elegir(i) {
      idx = i;
      pintar();
      if (modo === 'sonido') nativo();
      else if (autoActivo) previa();
      else vaciar();
    }
    function alVer(visible) {
      aVista = visible;
      if (visible) {
        raiz.classList.remove('flotando');
        if (autoActivo && modo !== 'sonido' && !yt && !document.hidden) previa();
        return;
      }
      if (!yt) return;
      if (!cerrado && (modo === 'sonido' || escritorio.matches)) raiz.classList.add('flotando');
      else if (modo !== 'sonido') { vaciar(); modo = 'portada'; }
    }

    pantalla.addEventListener('click', function () { if (modo !== 'sonido') conSonido(); });
    raiz.querySelector('.marco-tapa').addEventListener('click', function (e) {
      e.stopPropagation();
      if (modo === 'sonido') alternarPausa(); else conSonido();
    });
    raiz.querySelector('.marco-escuchar').addEventListener('click', function (e) { e.stopPropagation(); conSonido(); });
    pausa.addEventListener('click', function (e) { e.stopPropagation(); alternarPausa(); });
    raiz.querySelector('.marco-cerrar').addEventListener('click', function (e) { e.stopPropagation(); cerrar(); });
    pintar();

    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (e) {
      alVer(e[0].isIntersecting && e[0].intersectionRatio >= 0.2);
    }, { threshold: [0, 0.2] }).observe(pantalla);
    document.addEventListener('visibilitychange', function () {
      if (modo === 'sonido') return;
      if (document.hidden) { if (yt) { vaciar(); raiz.classList.remove('flotando'); modo = 'portada'; } }
      else if (aVista && autoActivo && !yt) previa();
    });

    if (reduce || ahorro) return;
    function arrancar() {
      autoActivo = true;
      if (aVista && !yt && modo !== 'sonido' && !document.hidden) previa();
    }
    if (document.readyState === 'complete') arrancar();
    else window.addEventListener('load', arrancar);
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
