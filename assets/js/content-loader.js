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

  /* 图片路径兼容两种写法：
     - '../assets/img/x.jpg' 页面级相对（与下载清单 href 写法一致）
     - 'assets/img/x.jpg'    站点根相对（后台媒体库「复制路径」得到的写法）
     旧版 content.json 没有 image 字段，因此这里不影响任何既有页面。 */
  function resolveMedia(src) {
    if (!src) return '';
    /* 容错：后台手填路径时容易把 assets 写成 asset（少一个 s），统一纠正。
       只匹配路径开头（允许前面已有 ../），不误伤文件名里含 asset 的情况。
       例：asset/img/a.webp -> assets/img/a.webp；../asset/img/a.webp -> ../assets/img/a.webp */
    src = src.replace(/^((?:\.\.\/)*)asset\//, '$1assets/');
    if (/^(https?:|data:|\/|#)/.test(src)) return src;
    if (!ROOT_PREFIX || src.indexOf('../') === 0) return src;
    return ROOT_PREFIX + src;
  }

  /* ==TEXT_ENUM_START==
     全站文字定位算法。后台 admin.html 里的 ptEnumerate() 使用完全相同的一份规则，
     首次启用时读线上真实页面生成索引，运行时也用同一段代码枚举，
     保证顺序完全一致 —— 因此不需要给任何 HTML 加标记。
     排除：脚本/样式/SVG、已由 content.json 驱动的区块、表格（实验室测试数据）、
           含子元素的容器、过短或纯符号文本。
     ⚠ 改动这里的规则时，必须同步改 admin.html 的 ptEnumerate()，否则索引会错位。 */
  function enumerateTextElements(root) {
    var SKIP = {SCRIPT:1,STYLE:1,SVG:1,TITLE:1,META:1,NOSCRIPT:1,TEMPLATE:1,
                TEXTAREA:1,OPTION:1,SELECT:1,BR:1,HR:1,IMG:1,INPUT:1};
    var EXCLUDE = '[data-c],[data-content],nav.nav,table,script,style,svg,noscript,template';
    var out = [], all = root.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (SKIP[el.tagName]) continue;
      if (el.closest(EXCLUDE)) continue;
      if (el.children.length > 0) continue;
      var t = (el.textContent || '').trim();
      if (t.length < 3) continue;
      if (!/[A-Za-z\u4e00-\u9fff]/.test(t)) continue;
      out.push(el);
    }
    return out;
  }
  /* ==TEXT_ENUM_END== */

  /* 页面 id 只取路径末段，兼容自定义域名 / GitHub Pages 项目子路径 / 目录 URL */
  function currentPageId() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    var last = parts[parts.length - 1] || 'index.html';
    if (last === 'resources') return 'resources/index.html';
    if (parts.length >= 2 && parts[parts.length - 2] === 'resources') return 'resources/' + last;
    return last;
  }

  /* 全站正文文字：只在 content.json 带 pages 段时才接管，旧线上 JSON 完全不受影响。
     数量校验防止 HTML 结构变化后把文字写到错误位置 —— 不一致就整页跳过并告警。 */
  function renderPageTexts(data) {
    if (!data.pages) return;
    var arr = data.pages[currentPageId()];
    if (!Array.isArray(arr)) return;
    var els = enumerateTextElements(document.body);
    if (els.length !== arr.length) {
      if (window.console && console.warn) {
        console.warn('[content-loader] 页面结构与文字索引不一致（当前 ' + els.length +
          ' 条 / 索引 ' + arr.length + ' 条），已跳过该页文字渲染，页面仍显示 HTML 原文。' +
          '若刚改过 HTML 结构，请到管理后台「页面文字」点「重新从线上读取」后再发布。');
      }
      return;
    }
    for (var i = 0; i < els.length; i++) {
      if (arr[i] !== null && arr[i] !== undefined && arr[i] !== '' && els[i].textContent !== arr[i]) {
        els[i].textContent = arr[i];
      }
    }
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
    if (f.copyright) {
      var rawCr = String(f.copyright);
      var hasTpl = /\{\{\s*legalName\s*\}\}/.test(rawCr);
      var cr = hasTpl ? rawCr.replace(/\{\{\s*legalName\s*\}\}/g, site.legalName || '') : rawCr;
      // 兼容旧版 content.json：版权行里把公司名写死时，仍以「公司全称」为准，
      // 否则会出现「改了公司全称，页脚最底部那行还是旧名字」。
      if (!hasTpl && site.legalName) {
        cr = cr.replace(/(©\s*\d{4}\s+).*?(\s+All rights reserved\.?\s*$)/i,
          function (m, a, b) { return a + site.legalName + b; });
      }
      txt('copyright', cr);
    }
    if (f.domainNote) txt('domainNote', f.domainNote);
  }

  /* 品牌名称只作用于 logo 图片的替代文字。
     页面 <title> / description / og: / JSON-LD 里的品牌名是给搜索引擎读的，
     用 JS 动态改不会被抓取，所以故意保留在 HTML 中，不纳入后台管理。 */
  function renderBrand(site) {
    if (!site.brandName) return;
    document.querySelectorAll('.logo img, .footer-logo img').forEach(function (img) {
      img.setAttribute('alt', site.brandName);
    });
  }

  function renderWhatsApp(site) {
    if (!site.whatsapp) return;
    var text = site.whatsappMessage || 'Hello, I am interested in your solutions.';
    document.querySelectorAll('a[href*="wa.me"]:not([data-gmtne-float])').forEach(function (a) {
      a.setAttribute('href', 'https://wa.me/' + site.whatsapp + '?text=' + encodeURIComponent(text));
    });
  }

  function renderLinkedIn(site) {
    if (!site.linkedin) return;
    document.querySelectorAll('a[href*="linkedin.com"]:not([data-gmtne-float])').forEach(function (a) {
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
      // 可选封面图：只有 content.json 里填了 image 才输出 <img>。
      // 旧数据没有这个字段时，生成的卡片与改造前逐字节一致。
      var img = a.image
        ? '<img src="' + esc(resolveMedia(a.image)) + '" alt="' + esc(a.title) + '" loading="lazy" ' +
          'style="display:block;width:100%;height:150px;object-fit:cover;border-radius:6px;margin-bottom:10px">'
        : '';
      // 文章页与 resources 首页同目录，直接写文件名即可
      return '<a href="' + esc(a.href) + '">' + img + '<span>' + esc(a.tag) + '</span><strong>' +
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

  /* ---------- Products 页 ----------
     产品列表页不改动 HTML 一个字：检测到页面上有 .cat-jump / .cat-block，
     就用 content.json 的 products.categories 整体重建大类与卡片。
     旧 HTML 里的 6 张卡片保留作兜底（JSON 未加载或没有 products 段时不白屏）。
     动态区块带 data-content 标记，避免被「全站正文文字」枚举规则重复接管。 */
  function renderProductsPage(data) {
    var p = data.products;
    if (!p || !p.categories || !p.categories.length) return;
    var jump = document.querySelector('.cat-jump');
    var first = document.querySelector('.cat-block');
    if (!jump || !first) return;              // 不是产品列表页，直接跳过

    function cardHtml(c) {
      // 卡片参数在后台是一段「每行：名称 | 值」的纯文本，便于直接粘贴 / 调整顺序
      var specs = String(c.specsText || '').split(/\r?\n/).map(function (line) {
        if (!line.trim()) return '';
        var p = line.split('|');
        return '<div class="card-spec"><strong>' + esc((p[0] || '').trim()) + '</strong>' +
          esc((p[1] || '').trim()) + '</div>';
      }).filter(Boolean).join('');
      var img = c.image
        ? '<div class="card-img"><img src="' + esc(resolveMedia(c.image)) + '" alt="' +
          esc(c.alt || c.title) + '" style="object-fit:contain;background:#F1F2F4;"></div>'
        : '';
      // 动态插入的卡片要自带 visible：main.js 的 IntersectionObserver 只在
      // DOMContentLoaded 时观察当时的 .fade-in，异步渲染出来的新卡片不会被观察到，
      // 会永远停在 opacity:0（表现为「图片闪一下就整片空白」）。
      return '<div class="card fade-in visible">' + img +
        '<div class="card-body">' +
          '<span class="card-tag">' + esc(c.tag) + '</span>' +
          '<h3>' + esc(c.title) + '</h3>' +
          '<p>' + esc(c.desc) + '</p>' +
          '<div class="card-specs">' + specs + '</div>' +
          '<a href="' + esc(c.slug) + '.html" class="btn btn-primary btn-sm">View Details</a>' +
        '</div></div>';
    }
    function catHtml(cat) {
      return '<div class="cat-block" id="' + esc(cat.id) + '" data-content="products">' +
        '<div class="cat-head"><span class="num">' + esc(cat.num) + '</span>' +
        '<h2>' + esc(cat.name) + '</h2></div>' +
        '<p class="cat-desc">' + esc(cat.desc) + '</p>' +
        '<div class="card-grid">' + (cat.cards || []).map(cardHtml).join('') + '</div>' +
        '</div>';
    }

    jump.innerHTML = p.categories.map(function (cat) {
      return '<a href="#' + esc(cat.id) + '"><span class="cnt">' + esc(cat.num) +
        '</span> ' + esc(cat.name) + '</a>';
    }).join('');
    jump.setAttribute('data-content', 'products');

    var parent = first.parentNode;
    var olds = Array.prototype.slice.call(parent.querySelectorAll('.cat-block'));
    var tmp = document.createElement('div');
    tmp.innerHTML = p.categories.map(catHtml).join('');
    var news = Array.prototype.slice.call(tmp.children);
    for (var i = 0; i < news.length; i++) parent.insertBefore(news[i], olds[0]);
    for (var j = 0; j < olds.length; j++) parent.removeChild(olds[j]);

    if (p.intro) {
      var box = document.querySelector('.text-center.fade-in');
      if (box) {
        var ip = box.querySelector('p[style*="text-muted"]');
        if (ip) { ip.textContent = p.intro; ip.setAttribute('data-content', 'productsIntro'); }
      }
    }
  }

  /* 所有由 content.json 动态渲染出来的区块都带 data-content 标记。
     它们是 fetch 之后才插入 DOM 的，错过了 main.js 在 DOMContentLoaded 时注册的
     IntersectionObserver，会一直停在 .fade-in 的 opacity:0（整片空白）。
     这里统一补上 visible：不只修产品卡片，以后任何动态模块都不会再白屏。 */
  function revealDynamicFadeIns() {
    var nodes = document.querySelectorAll('[data-content]');
    for (var i = 0; i < nodes.length; i++) {
      var scope = nodes[i];
      if (scope.classList && scope.classList.contains('fade-in')) scope.classList.add('visible');
      var inner = scope.querySelectorAll('.fade-in');
      for (var j = 0; j < inner.length; j++) inner[j].classList.add('visible');
    }
  }


  /* ---------- 悬浮联系按钮（content.json 的 floats 段） ----------
     历史上每个页面里写死两个 <a class="whatsapp-float"> / <a class="linkedin-float">，
     CSS 在 styles.css，改一次要动 20 多个 HTML。现在统一由 floats 数组驱动：
     加载器在运行时整体接管（移除旧按钮 + 生成新的一组），
     因此已发布页面只要同步一次本文件即可全部更新，不用重新发布、不用改 HTML。
     · 旧线上 JSON 没有 floats 段 → 什么都不做，页面保持原样（渐进增强）。
     · 数组顺序 = 显示顺序（后台 ↑↓ 调整）。
     · href 为空或 enabled:false 的项不渲染，避免客户点到无效图标。
     · 容器带 data-content，排除「全站正文文字」枚举，避免 pages 段索引错位。 */
  var FLOAT_ICONS = {
    "whatsapp": "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
    "facebook": "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
    "youtube": "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    "linkedin": "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    "email": "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    "custom": "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
  };
  var FLOAT_COLORS = {
    "whatsapp": "#25D366",
    "email": "#061F32",
    "facebook": "#1877F2",
    "youtube": "#FF0000",
    "linkedin": "#0A66C2",
    "custom": "#475569"
  };
  var FLOAT_CSS = ".gmtne-floats{position:fixed;right:24px;bottom:24px;z-index:999;display:flex;flex-direction:column;align-items:flex-end;gap:12px}.gmtne-fl-item{position:relative;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 6px 18px rgba(6,31,50,.22);text-decoration:none;flex-shrink:0;transition:transform .18s ease,box-shadow .18s ease}.gmtne-fl-item:hover,.gmtne-fl-item:focus-visible{transform:scale(1.08);box-shadow:0 8px 22px rgba(6,31,50,.30)}.gmtne-fl-item svg{width:24px;height:24px;display:block}.gmtne-fl-tip{position:absolute;right:64px;bottom:0;min-width:96px;width:auto;max-width:220px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;box-shadow:0 10px 30px rgba(6,31,50,.18);padding:9px 10px;white-space:nowrap;opacity:0;visibility:hidden;transform:translateX(8px);pointer-events:none;text-align:center;transition:opacity .18s ease,transform .18s ease,visibility .18s}.gmtne-fl-tip.has-img{width:200px;white-space:normal}.gmtne-fl-item:hover .gmtne-fl-tip,.gmtne-fl-item:focus-visible .gmtne-fl-tip{opacity:1;visibility:visible;transform:translateX(0)}.gmtne-fl-tip img{display:block;width:100%;max-height:180px;object-fit:contain;border-radius:6px;margin-bottom:8px;background:#F4F7FA}.gmtne-fl-tip em{display:block;font-style:normal;font-size:12px;font-weight:700;color:#061F32;letter-spacing:.2px}@media(max-width:600px){.gmtne-floats{right:14px;bottom:14px;gap:9px}.gmtne-fl-item{width:46px;height:46px}.gmtne-fl-item svg{width:21px;height:21px}.gmtne-fl-tip{right:56px}.gmtne-fl-tip.has-img{width:160px}}";

  /* 只放行安全协议与站内相对路径，挡住 javascript: 之类 */
  function safeFloatHref(u){
    u = String(u || '').trim();
    if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(u)) return u;
    if (u.indexOf(':') === -1 && /^[A-Za-z0-9_\-./?#=&%~]+$/.test(u)) return u;
    return '#';
  }

  function renderFloats(data){
    var list = data.floats;
    if (!Array.isArray(list)) return;          // 旧 JSON：保留写死的两个按钮，不接管

    if (!document.getElementById('gmtne-floats-css')) {
      var st = document.createElement('style');
      st.id = 'gmtne-floats-css';
      st.textContent = FLOAT_CSS;
      document.head.appendChild(st);
    }

    // 移除页面上所有写死的旧悬浮按钮
    var olds = document.querySelectorAll('a.whatsapp-float, a.linkedin-float');
    for (var o = 0; o < olds.length; o++) olds[o].parentNode.removeChild(olds[o]);

    var box = document.getElementById('gmtneFloats');
    if (!box) {
      box = document.createElement('div');
      box.id = 'gmtneFloats';
      box.className = 'gmtne-floats';
      box.setAttribute('data-content', 'floats');
      document.body.appendChild(box);
    }

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var it = list[i] || {};
      if (it.enabled === false) continue;
      var href = String(it.href || '').trim();
      if (!href) continue;                     // 没填链接就不显示，后台会红字提示
      var pf = FLOAT_ICONS[it.platform] ? it.platform : 'custom';
      var label = it.label || pf;
      var prev = String(it.preview || '').trim();
      var tip = '<span class="gmtne-fl-tip' + (prev ? ' has-img' : '') + '">' +
        (prev ? '<img src="' + esc(resolveMedia(prev)) + '" alt="' + esc(label) + '">' : '') +
        '<em>' + esc(label) + '</em></span>';
      html += '<a class="gmtne-fl-item" data-gmtne-float="1" href="' + esc(safeFloatHref(href)) + '"' +
        ' target="_blank" rel="noopener" aria-label="' + esc(label) + '"' +
        ' style="background:' + esc(FLOAT_COLORS[pf] || FLOAT_COLORS.custom) + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path d="' + FLOAT_ICONS[pf] + '" fill="currentColor"/></svg>' + tip + '</a>';
    }
    box.innerHTML = html;
    box.style.display = html ? '' : 'none';

    // 预览图 404 时只留名称，不显示破图
    var imgs = box.querySelectorAll('.gmtne-fl-tip img');
    for (var m = 0; m < imgs.length; m++) {
      (function (im) {
        im.addEventListener('error', function () { im.style.display = 'none'; });
        if (im.complete && im.naturalWidth === 0) im.style.display = 'none';
      })(imgs[m]);
    }
  }

  /* 页脚左栏的一排小方块图标：与右下角悬浮按钮共用同一份 floats 数据（一次配置，两处显示）。
     · footerSocials.enabled === false 才关闭；旧 JSON 没有该字段 → 默认开启。
     · 容器自带 data-content，排除「全站正文文字」枚举，保证 pages 段索引不错位。
     · 已发布的所有页面只同步一次本文件即可生效，不用改 HTML / 不用重新发布页面。 */
  var FOOTER_SOCIALS_CSS = ".gmtne-footer-socials{display:flex!important;flex-wrap:wrap;gap:8px;margin-top:18px;align-items:center}.gmtne-fs-item{position:relative;width:34px;height:34px;border-radius:7px;display:inline-flex!important;align-items:center!important;justify-content:center!important;line-height:0;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.82);text-decoration:none;flex-shrink:0;transition:background .18s ease,color .18s ease,transform .18s ease,border-color .18s ease}.gmtne-fs-item>svg{width:15px;height:15px;display:block;flex:0 0 auto;margin:auto}.gmtne-fs-item:hover,.gmtne-fs-item:focus-visible{background:#08A6F6;border-color:#08A6F6;color:#fff;transform:translateY(-2px)}.gmtne-fs-tip{position:absolute;left:0;bottom:calc(100% + 10px);transform:translateY(6px);min-width:92px;max-width:220px;background:#fff;border:1px solid #E2E8F0;border-radius:9px;box-shadow:0 10px 28px rgba(6,31,50,.22);padding:8px 10px;opacity:0;visibility:hidden;pointer-events:none;text-align:center;white-space:nowrap;z-index:5;transition:opacity .18s ease,transform .18s ease,visibility .18s}.gmtne-fs-tip.has-img{width:190px;white-space:normal}.gmtne-fs-item:hover .gmtne-fs-tip,.gmtne-fs-item:focus-visible .gmtne-fs-tip{opacity:1;visibility:visible;transform:translateY(0)}.gmtne-fs-tip img{display:block;width:100%;max-height:150px;object-fit:contain;border-radius:6px;margin-bottom:7px;background:#F4F7FA}.gmtne-fs-tip em{display:block;font-style:normal;font-size:12px;font-weight:700;color:#061F32;letter-spacing:.2px}@media(max-width:600px){.gmtne-footer-socials{gap:7px;margin-top:14px}.gmtne-fs-item{width:32px;height:32px}.gmtne-fs-item>svg{width:14px;height:14px}}";

  function renderFooterSocials(data){
    // 幂等：先移除上一次插入的容器，重复调用不会出现两排
    var olds = document.querySelectorAll('.gmtne-footer-socials');
    for (var o = 0; o < olds.length; o++) olds[o].parentNode.removeChild(olds[o]);

    var cfg = data.footerSocials;
    if (cfg && cfg.enabled === false) return;   // 后台关掉页脚这一排
    var list = data.floats;
    if (!Array.isArray(list) || !list.length) return;  // 旧 JSON：页面保持原样

    if (!document.getElementById('gmtne-footer-socials-css')) {
      var st = document.createElement('style');
      st.id = 'gmtne-footer-socials-css';
      st.textContent = FOOTER_SOCIALS_CSS;
      document.head.appendChild(st);
    }

    var grid = document.querySelector('footer.footer .footer-grid') || document.querySelector('.footer-grid');
    if (!grid) return;
    var col = grid.firstElementChild;
    if (!col) return;

    var html = '';
    for (var i = 0; i < list.length; i++) {
      var it = list[i] || {};
      if (it.enabled === false) continue;
      var href = String(it.href || '').trim();
      if (!href) continue;
      var pf = FLOAT_ICONS[it.platform] ? it.platform : 'custom';
      var label = it.label || pf;
      var prev = String(it.preview || '').trim();
      var tip = '<span class="gmtne-fs-tip' + (prev ? ' has-img' : '') + '">' +
        (prev ? '<img src="' + esc(resolveMedia(prev)) + '" alt="' + esc(label) + '">' : '') +
        '<em>' + esc(label) + '</em></span>';
      html += '<a class="gmtne-fs-item" data-gmtne-footer-social="1" href="' +
        esc(safeFloatHref(href)) + '" target="_blank" rel="noopener" ' +
        'aria-label="' + esc(label) + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path d="' + FLOAT_ICONS[pf] + '" fill="currentColor"/></svg>' + tip + '</a>';
    }
    if (!html) return;

    var box = document.createElement('div');
    box.className = 'gmtne-footer-socials';
    box.setAttribute('data-content', 'footerSocials');
    box.innerHTML = html;
    col.appendChild(box);

    // 预览图 404 时只留名称，不显示破图
    var imgs = box.querySelectorAll('.gmtne-fs-tip img');
    for (var m = 0; m < imgs.length; m++) {
      (function (im) {
        im.addEventListener('error', function () { im.style.display = 'none'; });
        if (im.complete && im.naturalWidth === 0) im.style.display = 'none';
      })(imgs[m]);
    }
  }

  /* ---------- 主流程 ---------- */

  function apply(data) {
    var site = data.site || {};
    var res = data.resources || {};

    // 全站通用
    renderNav(site);
    renderBrand(site);
    renderFooterContact(site);
    renderWhatsApp(site);
    renderLinkedIn(site);
    renderFloats(data);
    renderFooterSocials(data);

    // 仅 Resources 首页
    renderHero(res);
    renderArticles(res);
    renderDownloads(res);
    renderFaq(res);
    renderComingNext(res);
    renderCta(res);

    // 产品列表页：由 products 段重建大类与卡片（不用改 HTML，静态卡片作兜底）
    renderProductsPage(data);

    // 最后接管全站正文文字：此时动态区块已渲染完毕，排除规则与索引构建时一致
    renderPageTexts(data);

    // 兜底：动态插入的元素没被 main.js 的淡入观察器注册，统一补 visible 防白屏
    revealDynamicFadeIns();
  }

  function load() {
    // 带时间戳 + no-store：绕过 GitHub Pages 对静态文件约 10 分钟的 CDN 缓存，
    // 保证后台发布后刷新页面即可看到新内容（content.json 仅几 KB，流量可忽略）。
    fetch(CONTENT_PATH + '?v=' + Date.now(), { cache: 'no-store' })
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

  /* ---------- LOGO 兼容兜底 ----------
     后台早期生成的文章页把 logo 路径写成了 .webp，而仓库里实际只有 .png。
     图片加载失败时自动换成 .png，已发布的历史文章页无需重新生成即可恢复。
     只有真正 404 才替换；若以后真的上传了 .webp 文件则不会触发。 */
  function fixLegacyLogos() {
    var imgs = document.querySelectorAll('img[src$="logo.webp"], img[src$="logo-light.webp"]');
    for (var i = 0; i < imgs.length; i++) {
      (function (img) {
        function swap() {
          if (img.getAttribute('data-logo-fixed')) return;
          img.setAttribute('data-logo-fixed', '1');
          img.src = img.getAttribute('src').replace(/\.webp$/, '.png');
        }
        img.addEventListener('error', swap);
        // 本脚本在 </body> 前，图片可能已经失败过了，补一次检查
        if (img.complete && img.naturalWidth === 0) swap();
      })(imgs[i]);
    }
  }

  /* ---------- 文章表格宽度兜底 ----------
     早期生成的文章页里 .data-table 的 th/td 带 white-space:nowrap，
     长内容把表格撑出容器，出现横向滚动条。这里统一改成定宽 + 自动换行，
     已发布的历史文章页无需重新生成即可自适应容器宽度。 */
  function fixArticleTables() {
    var tables = document.querySelectorAll('.art-body .data-table');
    if (!tables.length || document.getElementById('gmtne-table-fix')) return;
    var css =
      '.art-body .data-table{width:100%!important;table-layout:fixed!important;}' +
      '.art-body .data-table th,.art-body .data-table td{' +
      'white-space:normal!important;overflow-wrap:anywhere;word-break:break-word;vertical-align:top;}' +
      '@media(max-width:900px){.art-body .data-table{font-size:.74rem;}' +
      '.art-body .data-table th,.art-body .data-table td{padding:.42rem .4rem;}}';
    var st = document.createElement('style');
    st.id = 'gmtne-table-fix';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function boot() {
    fixLegacyLogos();
    fixArticleTables();
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
