document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      menuToggle.classList.toggle('active');
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuToggle.classList.remove('active');
      });
    });
  }

  // Header shadow on scroll
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  // Fade in animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Product filter tabs
  const filterTabs = document.querySelectorAll('.filter-tabs button');
  const productCards = document.querySelectorAll('[data-category]');
  if (filterTabs.length && productCards.length) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.dataset.filter;
        productCards.forEach(card => {
          const show = cat === 'all' || card.dataset.category === cat;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // Exploded view interaction
  initExplodedView();
});

function initExplodedView() {
  const lists = document.querySelectorAll('.exploded-list');
  lists.forEach(list => {
    const wrap = list.closest('.exploded-wrap');
    if (!wrap) return;
    const svg = wrap.querySelector('.exploded-svg svg');
    if (!svg) return;
    const items = list.querySelectorAll('li');
    items.forEach((item, idx) => {
      item.addEventListener('mouseenter', () => highlightLayer(idx, items, svg));
      item.addEventListener('click', () => highlightLayer(idx, items, svg));
    });
  });
}

function highlightLayer(idx, items, svg) {
  items.forEach((it, i) => it.classList.toggle('active', i === idx));
  const layers = svg.querySelectorAll('[data-layer]');
  layers.forEach(layer => {
    const isTarget = parseInt(layer.dataset.layer, 10) === idx;
    layer.style.opacity = isTarget ? '1' : '0.45';
    layer.style.filter = isTarget ? 'none' : 'grayscale(60%)';
  });
}

// WhatsApp click handler helper
function openWhatsApp(message) {
  const num = document.documentElement.dataset.whatsapp || '';
  if (!num) return;
  const text = encodeURIComponent(message || 'Hello, I am interested in your power semiconductor solutions for India market.');
  window.open(`https://wa.me/${num}?text=${text}`, '_blank');
}
