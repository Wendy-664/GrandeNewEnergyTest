/* ===========================================================
   gmtne.com 内容加载器 (content-loader.js)
   -----------------------------------------------------------
   作用：从 assets/data/content.json 读取内容，动态填充页面。
   以后只需改 content.json，不用改 HTML。

   设计原则：
   1. 渐进增强 —— JSON 加载失败时，页面保留原有硬编码内容，不会白屏。
   2. 用 [data-content="..."] / [data-c="..."] 标记要替换的元素。
   3. 自动适配页面层级：根目录页与 resources/ 子目录页的
      相对链接前缀不同，导航会自动补 ../，避免 404。

   更新内容：在 GitHub 网页编辑 assets/data/content.json 并提交。
   =========================================================== */

(function () {
  'use strict';

  /* ---------- 路径解析 ----------
     站点只有两层：根目录页 / resources 子目录页。
     - 根目录页    -> 前缀 ''      content.json = assets/data/content.json
     - resources/ -> 前缀 '../'   content.json = ../assets/data/content.json
     若将来新增更深层目录，可在 <body> 上加 data-root-prefix="../.." 覆盖。
  */
  var ROOT_PREFIX = '';
  var IS_RESOURCES = false;

  (function resolvePath() {
    var p = window.location.pathname.replace(/\\/g, '/');
    IS_RESOURCES = /\/resources\//.test(p) || /\/resources\/[^/]*\.html$/.test(p);
    var override = document.body && document.body.getAttribute('data-root-prefix');
    ROOT_PREFIX = (override !== null && override !== undefined && override !== '')
      ? (override.charAt(override.length - 1) === '/' ? override : override + '/')
      : (IS_RESOURCES ? '../' : '');
  })();

  var CONTENT_PATH = ROOT_PREFIX + 'assets/data/content.json';

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* 把 content.json 里「站点根目录相对路径」转成当前页面可用的相对路径 */
  function resolveHref(href) {
    href = href || '#';
    if (/^(https?:|mailto:|tel:|#)/.test(href)) return href;   // 绝对/协议链接不动
    if (!ROOT_PREFIX) return href;                              // 根目录页直接用
    if (href.indexOf('resources/') === 0) {
      // 目标本来就在 resources/ 里，当前页也在这一层 -> 去掉前缀
      return href.substring('resources/'.length);
    }
    return ROOT_PREFIX + href;                                  // 其余目标在上一层
  }

  /* ---------- 站点通用信息：导航 / footer / 悬浮按钮 ---------- */

  function renderNav(site) {
    var navs = document.querySelectorAll('nav.nav');
    if (!navs.length || !site.nav || !site.nav.length) return;

    var activeHref = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var currentFull = (IS_RESOURCES ? 'resources/' : '') + activeHref;
    var hasExactMatch = site.nav.some(function (item) {
      return (item.href || '').toLowerCase() === currentFull;
    });

    navs.forEach(function (nav) {
      var html = '';
      site.nav.forEach(function (item) {
        var href = resolveHref(item.href);
        var raw = (item.href || '').toLowerCase();
        var isActive = raw === currentFull;
        // 技术文章页没有对应菜单项时，兜底高亮 Resources
        if (!hasExactMatch && IS_RESOURCES && raw.indexOf('resources/') === 0) isActive = true;
        html += '<a href="' + esc(href) + '"' + (isActive ? ' class="active"' : '') + '>' +
          esc(item.label) + '</a>';
      });
      nav.innerHTML = html;
    });
  }

  function renderFooterContact(site) {
    function txt(key, value) {
      document.querySelectorAll('[data-c="' + key + '"]').forEach(function (el) {
        el.textContent = value;
      });
    }

    document.querySelectorAll('[data-c="email"]').forEach(function (el) {
      el.setAttribute('href', 'mailto:' + (site.email || ''));
      el.textContent = site.email || '';
    });
    document.querySelectorAll('[data-c="phone"]').forEach(function (el) {
      el.setAttribute('href', 'tel:' + (site.phoneLink || site.phone || ''));
      el.textContent = site.phone || '';
    });

    // 地址：公司名 + 两行地址，与页面原有排版保持一致
    document.querySelectorAll('[data-c="address"]').forEach(function (el) {
      var a = site.address || {};
      el.innerHTML = [site.legalName, a.line1, a.line2]
        .filter(function (x) { return x; })
        .map(esc).join('<br>');
    });

    // 注意：footer 的「简介 / 标语」各页文案不同（exporter / solutions company 等），
    // 属于页面级文案，不在本轮统一范围内，避免静默改掉现有文案。
    var f = site.footer || {};
    if (f.copyright) txt('copyright', f.copyright);
    if (f.domainNote) txt('domainNote', f.domainNote);
    if (site.legalName) txt('legalName', site.legalName);
  }

  function renderWhatsApp(site) {
    if (!site.whatsapp) return;
    var text = site.whatsappMessage || 'Hello, I am interested in your solutions.';
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
      a.setAttribute('href', 'https://wa.me/' + site.whatsapp + '?text=' + encodeURIComponent(text));
    });
  }

  function renderLinkedIn(site) {
    if (!site.linkedin) return;
    document.querySelectorAll('a[href*="linkedin.com"]').forEach(function (a) {
      a.setAttribute('href', site.linkedin);
    });
  }

  /* ---------- Resources 页 ---------- */

  function renderHero(res) {
    if (!res.hero) return;
    var map = {
      resourcesTag: res.hero.tag,
      resourcesTitle: res.hero.title,
      resourcesStandfirst: res.hero.standfirst
    };
    Object.keys(map).forEach(function (key) {
      var el = document.querySelector('[data-content="' + key + '"]');
      if (el && map[key] !== undefined) el.textContent = map[key];
    });
  }

  function renderArticles(res) {
    var wrap = document.querySelector('[data-content="articles"]');
    if (!wrap || !res.articles) return;
    wrap.innerHTML = res.articles.map(function (a) {
      // 文章页与 resources 首页同目录，直接写文件名即可
      return '<a href="' + esc(a.href) + '"><span>' + esc(a.tag) + '</span><strong>' +
        esc(a.title) + '</strong></a>';
    }).join('');
  }

  function renderDownloads(res) {
    var tbody = document.querySelector('[data-content="downloads"]');
    if (!tbody || !res.downloads) return;
    tbody.innerHTML = res.downloads.map(function (d) {
      var isPdf = d.type === 'pdf';
      var target = isPdf ? ' target="_blank" rel="noopener"' : '';
      var action = d.action || (isPdf ? 'PDF' : 'View page');
      return '<tr><td>' + esc(d.title) + '</td><td>' + esc(d.product) + '</td><td>' +
        esc(d.pages) + '</td><td><a href="' + esc(d.href) + '"' + target +
        ' style="color:#B45309;font-weight:700">' + esc(action) + '</a></td></tr>';
    }).join('');
  }

  function renderFaq(res) {
    var wrap = document.querySelector('[data-content="faq"]');
    if (!wrap || !res.faq || !res.faq.length) return;
    wrap.innerHTML = res.faq.map(function (item, idx) {
      return '<details class="faq-item"' + (idx === 0 ? ' open' : '') + '>' +
        '<summary>' + esc(item.q) + '</summary>' +
        '<div class="faq-answer"><p>' + esc(item.a) + '</p></div>' +
        '</details>';
    }).join('');
  }

  function renderComingNext(res) {
    var wrap = document.querySelector('[data-content="comingNext"]');
    if (!wrap || !res.comingNext) return;
    wrap.innerHTML = res.comingNext.map(function (item) {
      return '<li>' + esc(item) + '</li>';
    }).join('');
  }

  function renderCta(res) {
    var box = document.querySelector('[data-content="resourcesCta"]');
    if (!box || !res.cta) return;
    box.innerHTML =
      '<h3>' + esc(res.cta.title) + '</h3>' +
      '<p>' + esc(res.cta.text) + '</p>' +
      '<a class="btn" href="' + esc(res.cta.href) + '">' + esc(res.cta.button) + '</a>';
  }

  /* ---------- 主流程 ---------- */

  function apply(data) {
    var site = data.site || {};
    var res = data.resources || {};

    // 全站通用
    renderNav(site);
    renderFooterContact(site);
    renderWhatsApp(site);
    renderLinkedIn(site);

    // 仅 Resources 首页
    renderHero(res);
    renderArticles(res);
    renderDownloads(res);
    renderFaq(res);
    renderComingNext(res);
    renderCta(res);
  }

  function load() {
    fetch(CONTENT_PATH)
      .then(function (resp) {
        if (!resp.ok) throw new Error('content.json HTTP ' + resp.status);
        return resp.json();
      })
      .then(apply)
      .catch(function (err) {
        // 降级：保留页面原有硬编码内容，不白屏
        if (window.console && console.warn) {
          console.warn('[content-loader] 未能加载 content.json，使用页面内置内容。', err);
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
