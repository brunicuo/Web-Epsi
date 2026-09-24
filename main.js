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
      document.querySelectorAll('.path-draw').forEach(function (p) { p.closest('svg').classList.add('in'); });
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

    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        pio.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.path-draw').forEach(function (p) { pio.observe(p.closest('svg')); });
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

  /* 3. Tarjetas de "cómo es trabajar con nosotros": se destaca una por vez */
  function ciclo() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.cyc'));
    if (!cards.length || reduce) return;
    var i = 0, pausado = false;
    function aplicar() { cards.forEach(function (c, k) { c.classList.toggle('is-active', k === i); }); }
    aplicar();
    cards.forEach(function (c) {
      c.addEventListener('mouseenter', function () { pausado = true; });
      c.addEventListener('mouseleave', function () { pausado = false; });
    });
    setInterval(function () {
      if (pausado) return;
      i = (i + 1) % cards.length;
      aplicar();
    }, 3200);
  }

  /* 4. Servicios: chips + panel, con rotación automática y swipe */
  function servicios() {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-servicio]'));
    var panel = document.getElementById('panel-servicio');
    if (!chips.length || !panel) return;
    var datos = JSON.parse(document.getElementById('datos-servicios').textContent);
    var idx = 0, pausado = false;
    var listaChips = chips[0].parentNode;
    var acordeon = window.matchMedia('(max-width: 720px)');

    /* En celular el panel viaja: se inserta justo debajo del chip elegido,
       asi la respuesta aparece donde el dedo toco y no 400px mas abajo. */
    function ubicarPanel() {
      var destino, refChip;
      if (acordeon.matches) {
        refChip = chips[idx];
        destino = refChip.nextSibling;
        if (panel.previousElementSibling === refChip) return;
      } else {
        refChip = null;
        destino = listaChips.nextSibling;
        if (panel.previousElementSibling === listaChips) return;
      }
      var ancla = refChip || listaChips;
      var antes = ancla.getBoundingClientRect().top;
      (refChip ? listaChips : listaChips.parentNode).insertBefore(panel, destino);
      var corrimiento = ancla.getBoundingClientRect().top - antes;
      if (corrimiento) {
        try { window.scrollBy({ top: corrimiento, left: 0, behavior: 'instant' }); }
        catch (e) { window.scrollBy(0, corrimiento); }
      }
    }

    /* Si el panel recien abierto se corta abajo, acercamos lo justo para que
       entre entero, cuidando que el chip elegido siga a la vista. */
    function acercarPanel() {
      if (!acordeon.matches) return;
      var sobra = panel.getBoundingClientRect().bottom - window.innerHeight + 16;
      if (sobra <= 8) return;
      var margen = chips[idx].getBoundingClientRect().top - 84;
      var mover = Math.min(sobra, margen);
      if (mover > 8) {
        try { window.scrollBy({ top: mover, left: 0, behavior: 'smooth' }); }
        catch (e) { window.scrollBy(0, mover); }
      }
    }

    function pintar() {
      var d = datos[idx];
      panel.querySelector('.tag').textContent = '▸ ' + d.tag;
      panel.querySelector('h3').textContent = d.titulo;
      panel.querySelector('.panel-desc').textContent = d.texto;
      panel.querySelector('.panel-cta .txt').textContent = d.cta;
      document.querySelector('.panel-num').textContent = '0' + (idx + 1);
      chips.forEach(function (c, i) { c.setAttribute('aria-pressed', i === idx ? 'true' : 'false'); });
      ubicarPanel();
      var main = panel.querySelector('.panel-main');
      main.style.animation = 'none';
      void main.offsetWidth;
      main.style.animation = '';
    }
    chips.forEach(function (c, i) {
      c.addEventListener('click', function () { idx = i; pausado = true; pintar(); acercarPanel(); });
    });
    var stage = panel;
    var x0 = null, y0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        idx = (idx + (dx < 0 ? 1 : -1) + datos.length) % datos.length;
        pausado = true;
        pintar();
        acercarPanel();
      }
      x0 = null;
    }, { passive: true });
    pintar();
    if (acordeon.addEventListener) {
      acordeon.addEventListener('change', ubicarPanel);
    } else if (acordeon.addListener) {
      acordeon.addListener(ubicarPanel);
    }
    if (!reduce) {
      setInterval(function () {
        /* La rotacion automatica queda solo en escritorio: en el acordeon
           moveria el panel de lugar mientras la persona esta leyendo. */
        if (pausado || acordeon.matches) return;
        idx = (idx + 1) % datos.length;
        pintar();
      }, 4500);
    }
  }

  /* 5. Preguntas frecuentes */
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

  /* 6. Menú en celular */
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
    ciclo();
    servicios();
    preguntas();
    menu();
  });
})();
