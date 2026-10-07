/* Épsilon Soluciones — interacciones */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* 3. Tarjetas de "cómo es trabajar con nosotros": cerradas, se abren al tocar */
  function plegables() {
    document.querySelectorAll('.plegable').forEach(function (tarjeta) {
      var boton = tarjeta.querySelector('.plegable-btn');
      var texto = document.getElementById(boton.getAttribute('aria-controls'));
      boton.addEventListener('click', function () {
        var abrir = boton.getAttribute('aria-expanded') !== 'true';
        boton.setAttribute('aria-expanded', String(abrir));
        texto.hidden = !abrir;
      });
    });
  }

  /* 4. Servicios: al tocar una situacion se abre su respuesta; tocarla de
     nuevo la cierra. En celular la respuesta se inserta debajo del chip. */
  function servicios() {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-servicio]'));
    var panel = document.getElementById('panel-servicio');
    if (!chips.length || !panel) return;
    var textos = JSON.parse(document.getElementById('datos-servicios').textContent);
    var desc = panel.querySelector('.panel-desc');
    var idx = -1;
    var listaChips = chips[0].parentNode;
    var acordeon = window.matchMedia('(max-width: 720px)');

    function desplazar(px, modo) {
      try { window.scrollBy({ top: px, left: 0, behavior: modo }); }
      catch (e) { window.scrollBy(0, px); }
    }

    /* Mueve el panel a su lugar sin que el chip tocado salte en pantalla */
    function ubicarPanel() {
      var ref = (acordeon.matches && idx >= 0) ? chips[idx] : listaChips;
      if (panel.previousElementSibling === ref) return;
      var antes = ref.getBoundingClientRect().top;
      ref.parentNode.insertBefore(panel, ref.nextSibling);
      var corrimiento = ref.getBoundingClientRect().top - antes;
      if (corrimiento) desplazar(corrimiento, 'instant');
    }

    /* Si la respuesta recien abierta se corta abajo, acercamos lo justo */
    function acercarPanel() {
      if (idx < 0) return;
      var sobra = panel.getBoundingClientRect().bottom - window.innerHeight + 16;
      if (sobra <= 8) return;
      var mover = Math.min(sobra, chips[idx].getBoundingClientRect().top - 84);
      if (mover > 8) desplazar(mover, 'smooth');
    }

    function elegir(i) {
      idx = (idx === i) ? -1 : i;
      chips.forEach(function (c, k) { c.setAttribute('aria-expanded', String(k === idx)); });
      if (idx < 0) { panel.hidden = true; return; }
      desc.textContent = textos[idx];
      panel.hidden = false;
      ubicarPanel();
      panel.style.animation = 'none';
      void panel.offsetWidth;
      panel.style.animation = '';
      acercarPanel();
    }

    chips.forEach(function (c, i) {
      c.addEventListener('click', function () { elegir(i); });
    });
    if (acordeon.addEventListener) acordeon.addEventListener('change', ubicarPanel);
    else if (acordeon.addListener) acordeon.addListener(ubicarPanel);
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

  /* Circulos de clientes del inicio: con video abren la ventana; sin video
     todavia, llevan a la seccion de testimonios. */
  function historias() {
    var modal = document.getElementById('modal-video');
    var lugar = modal && modal.querySelector('.modal-marco');
    function cerrar() { if (modal.open) modal.close(); }
    if (modal) {
      modal.addEventListener('close', function () { lugar.innerHTML = ''; });
      modal.querySelector('.modal-cerrar').addEventListener('click', cerrar);
      modal.addEventListener('click', function (e) { if (e.target === modal) cerrar(); });
    }
    document.querySelectorAll('.historia').forEach(function (h) {
      h.addEventListener('click', function () {
        var id = (h.getAttribute('data-youtube') || '').trim();
        if (!id || !modal || typeof modal.showModal !== 'function') {
          var destino = document.getElementById('testimonios');
          if (destino) destino.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
          return;
        }
        modal.classList.toggle('vertical', h.getAttribute('data-formato') === 'vertical');
        lugar.innerHTML = '';
        lugar.appendChild(reproductor(id, h.getAttribute('data-titulo')));
        modal.showModal();
      });
    });
  }

  /* Carrusel de testimonios: avanza solo mientras esta a la vista y nadie
     lo esta usando; flechas y puntos para moverlo a mano. */
  function carrusel() {
    var raiz = document.querySelector('.carrusel');
    if (!raiz) return;
    var pista = raiz.querySelector('.carrusel-pista');
    var items = pista.children;
    var puntos = raiz.querySelector('.carrusel-puntos');
    var visible = false, ocupado = false, reanudar = null;

    function paso() { return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : pista.clientWidth; }
    function ultimo() { return Math.max(0, Math.round((pista.scrollWidth - pista.clientWidth) / paso())); }
    function actual() { return Math.round(pista.scrollLeft / paso()); }
    function ir(i) { pista.scrollTo({ left: i * paso(), behavior: reduce ? 'auto' : 'smooth' }); }

    function dibujarPuntos() {
      var n = ultimo() + 1;
      if (puntos.children.length !== n) {
        puntos.innerHTML = '';
        for (var k = 0; k < n; k++) puntos.appendChild(document.createElement('i'));
      }
      var a = Math.min(actual(), n - 1);
      Array.prototype.forEach.call(puntos.children, function (p, k) { p.classList.toggle('activo', k === a); });
      raiz.querySelector('.carrusel-nav').hidden = n < 2;
    }

    function pausar() {
      ocupado = true;
      clearTimeout(reanudar);
      reanudar = setTimeout(function () { ocupado = false; }, 8000);
    }

    raiz.querySelectorAll('.carrusel-flecha').forEach(function (b) {
      b.addEventListener('click', function () {
        pausar();
        var destino = actual() + Number(b.getAttribute('data-dir'));
        if (destino > ultimo()) destino = 0;
        if (destino < 0) destino = ultimo();
        ir(destino);
      });
    });
    pista.addEventListener('scroll', dibujarPuntos, { passive: true });
    pista.addEventListener('pointerdown', pausar, { passive: true });
    pista.addEventListener('touchstart', pausar, { passive: true });
    /* solo con mouse: en pantallas tactiles el "mouse encima" simulado no se va nunca */
    raiz.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { ocupado = true; clearTimeout(reanudar); } });
    raiz.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') ocupado = false; });
    raiz.addEventListener('focusin', pausar);
    window.addEventListener('resize', dibujarPuntos);
    dibujarPuntos();

    if (reduce || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.5 }).observe(pista);
    setInterval(function () {
      if (!visible || ocupado || document.hidden) return;
      ir(actual() >= ultimo() ? 0 : actual() + 1);
    }, 5000);
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
    plegables();
    servicios();
    videos();
    historias();
    carrusel();
    preguntas();
    menu();
  });
})();
