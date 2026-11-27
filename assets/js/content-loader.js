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
  var OEM_CSS = ".oem-kicker{color:var(--cyan);font-weight:800;letter-spacing:1.2px;font-size:.8rem;text-transform:uppercase;margin-bottom:.6rem}.oem-sub{font-size:1.25rem;color:var(--primary);font-weight:800;margin:2.6rem 0 1.1rem}.oem-routes{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}.oem-route{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;box-shadow:var(--shadow-sm)}.oem-route-tag{display:inline-block;background:var(--cyan-light);color:var(--cyan);font-size:.72rem;font-weight:800;letter-spacing:.8px;padding:.3rem .7rem;border-radius:999px;margin-bottom:.8rem}.oem-route h4{font-size:1.15rem;color:var(--primary);margin:0 0 .5rem}.oem-route p{font-size:.9rem;color:var(--text-muted);margin:0 0 .9rem}.oem-route ul{margin:0;padding-left:1.1rem;color:var(--text-muted);font-size:.86rem;line-height:1.9}.oem-route ul a{text-decoration:none;color:var(--cyan);font-weight:700}.oem-note{margin-top:1rem;font-size:.88rem;color:var(--text-muted);background:var(--bg-alt);border-left:3px solid var(--cyan);padding:.7rem 1rem;border-radius:0 var(--radius) var(--radius) 0}.oem-custom{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}.oem-custom-item{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:1.1rem 1rem;display:flex;flex-direction:column;gap:.3rem;box-shadow:var(--shadow-sm)}.oem-ic{font-size:1.4rem;line-height:1}.oem-custom-item strong{color:var(--primary);font-size:.95rem}.oem-custom-item span:last-child{color:var(--text-muted);font-size:.8rem;line-height:1.5}.oem-moq{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}.oem-moq-card{background:var(--bg-alt);border:1px solid var(--border);border-radius:var(--radius);padding:1.4rem;text-align:center;display:flex;flex-direction:column;gap:.3rem}.oem-moq-num{font-size:1.5rem;font-weight:800;color:var(--primary)}.oem-moq-card strong{font-size:.9rem;color:var(--primary)}.oem-moq-card span:last-child{font-size:.78rem;color:var(--text-muted)}.oem-tbd{color:var(--accent-hover)!important;font-weight:700}.oem-cta{margin-top:2.6rem;background:var(--primary);color:#fff;border-radius:var(--radius);padding:2rem 2.2rem;display:flex;align-items:center;justify-content:space-between;gap:2rem}.oem-cta h3{color:#fff;font-size:1.5rem;margin:0 0 .4rem}.oem-cta p{color:rgba(255,255,255,.75);margin:0;font-size:.95rem}.oem-cta-btns{display:flex;gap:.8rem;flex-shrink:0}.oem-cta-btns .btn-outline{color:#fff;border-color:#fff}.oem-cta-btns .btn-outline:hover{background:#fff;color:var(--primary)}@media(max-width:900px){.oem-routes,.oem-moq{grid-template-columns:1fr}.oem-custom{grid-template-columns:repeat(2,1fr)}.oem-cta{flex-direction:column;align-items:flex-start}}.oem-markets{display:grid;grid-template-columns:repeat(var(--cols,5),minmax(0,1fr));gap:1rem}.oem-markets-lead{font-size:.92rem;color:var(--text-muted);margin:.2rem 0 1.1rem;max-width:780px}.oem-market{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:1.15rem .9rem;text-align:center;display:flex;flex-direction:column;align-items:center;gap:.25rem;box-shadow:var(--shadow-sm);transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}.oem-market:hover{transform:translateY(-2px);border-color:var(--accent);box-shadow:0 10px 22px rgba(10,37,64,.08)}.oem-market-code{font-size:.72rem;font-weight:800;letter-spacing:1.4px;color:var(--text-muted)}.oem-market strong{font-size:.98rem;color:var(--primary);font-weight:800;line-height:1.25}.oem-market-status{display:inline-flex;align-items:center;gap:.34rem;font-size:.76rem;font-weight:700}.oem-market-status::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;flex:0 0 auto}.oem-market-status.is-onboarding{color:#B45309}.oem-market-status.is-live{color:#15803D}.oem-market-status.is-planned{color:#64748B}@media(max-width:1000px){.oem-markets{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:620px){.oem-markets{grid-template-columns:repeat(2,minmax(0,1fr))}}";
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
        // 已废弃的独立页 SKD/CKD 菜单项：内容已并入首页，一律不渲染（含旧版 content.json 兜底）
        if (/skd-ckd\.html/i.test(String(item.href || ''))) return;
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

  /* ===== NAV_PRODUCTS_V1: 顶部 Products 两级下拉（大类 + 横向子类）=====
     数据源同页脚：products.categories[].{name,id,cards[].{title,slug}}。
     后台增删产品后，下拉自动同步。桌面悬停展开、悬停大类切换子类；
     移动端点 ▾ 展开、点大类切换。样式运行时注入（styles.css 不在同步白名单）。*/
  function injectNavProductsCss() {
    if (document.getElementById('gmtne-nav-products-css')) return;
    var css = ''
      + 'nav.nav .np-wrap{position:relative;}'
      + 'nav.nav .np-top{display:inline-flex;align-items:center;gap:5px;}'
      + 'nav.nav .np-caret{display:none;font-size:.72em;line-height:1;color:var(--accent);cursor:pointer;padding:2px 5px;}'
      + 'nav.nav .np-mega{position:absolute;top:100%;left:50%;margin-left:-270px;width:540px;box-sizing:border-box;z-index:1200;display:flex;gap:0;background:#fff;border:1px solid var(--border);border-radius:12px;box-shadow:0 18px 46px rgba(10,37,64,.16);padding:10px;text-align:left;opacity:0;visibility:hidden;transform:translateY(6px);transition:opacity .18s,transform .18s,visibility .18s;}'
      + '@media (hover:hover) and (pointer:fine){nav.nav .np-wrap:hover .np-mega{opacity:1;visibility:visible;transform:translateY(0);}}'
      + 'nav.nav .np-wrap.open .np-mega{opacity:1;visibility:visible;transform:translateY(0);}'
      + 'nav.nav .np-cats{width:38%;border-right:1px solid var(--border);padding-right:8px;}'
      + 'nav.nav .np-cat{display:block;padding:10px 12px;border-radius:8px;color:var(--primary);font-size:.9rem;font-weight:500;text-decoration:none;}'
      + 'nav.nav .np-cat:hover,nav.nav .np-cat.on{color:var(--accent);background:#FFF7E8;}'
      + 'nav.nav .np-subwrap{flex:1;padding:6px 10px;}'
      + 'nav.nav .np-subhead{font-size:.8rem;color:var(--text-muted);margin:2px 0 10px;font-weight:600;}'
      + 'nav.nav .np-subhead[hidden]{display:none;}'
      + 'nav.nav .np-subrow{display:flex;flex-wrap:wrap;gap:8px;}'
      + 'nav.nav .np-subrow[hidden]{display:none;}'
      + 'nav.nav .np-subrow a{display:inline-block;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;color:var(--primary);background:#fff;}'
      + 'nav.nav .np-subrow a:hover{color:var(--accent);border-color:var(--accent);background:#FFF7E8;}'
      + '@media (max-width:1024px){'
      + 'nav.nav .np-wrap{width:100%;}'
      + 'nav.nav .np-top{width:100%;justify-content:space-between;}'
      + 'nav.nav .np-caret{display:inline-flex;}'
      + 'nav.nav .np-mega{position:static;width:100%;min-width:0;margin:8px 0 0;padding:6px 0 6px 12px;border:0;border-left:2px solid var(--accent);border-radius:0;box-shadow:none;opacity:1;visibility:visible;transform:none;display:none;}'
      + 'nav.nav .np-wrap.open .np-mega{display:flex;}'
      + 'nav.nav .np-cats{width:42%;}'
      + '}';
    var st = document.createElement('style');
    st.id = 'gmtne-nav-products-css';
    st.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(st);
  }

  function bindNavProducts() {
    if (window.__gmtneNavProductsBound) return;
    window.__gmtneNavProductsBound = true;
    function activateCat(cat) {
      var mega = cat.closest('.np-mega');
      if (!mega) return;
      var idx = cat.getAttribute('data-np');
      var cats = mega.querySelectorAll('.np-cat');
      for (var i = 0; i < cats.length; i++) cats[i].classList.toggle('on', cats[i] === cat);
      var panels = mega.querySelectorAll('.np-subrow');
      for (var j = 0; j < panels.length; j++) panels[j].hidden = (panels[j].getAttribute('data-np-panel') !== idx);
      var heads = mega.querySelectorAll('.np-subhead');
      for (var h = 0; h < heads.length; h++) heads[h].hidden = (heads[h].getAttribute('data-np-head') !== idx);
    }
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var caret = t.closest('.np-caret');
      if (caret) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = caret.closest('.np-wrap');
        if (!wrap) return;
        var open = !wrap.classList.contains('open');
        wrap.classList.toggle('open', open);
        caret.setAttribute('aria-expanded', open ? 'true' : 'false');
        return;
      }
      var cat = t.closest('.np-cat');
      if (cat) activateCat(cat);   // 大类同时保留链接跳转
    });
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var cat = t.closest('.np-cat');
      if (cat && !cat.classList.contains('on')) activateCat(cat);
    });
  }

  function renderNavProducts(data) {
    var p = data && data.products, cats = p && p.categories;
    if (!cats || !cats.length) return;
    var navs = document.querySelectorAll('nav.nav');
    if (!navs.length) return;
    var prefix = IS_RESOURCES ? '../' : '';
    navs.forEach(function (nav) {
      var links = nav.querySelectorAll('a');
      var prodA = null;
      for (var i = 0; i < links.length; i++) {
        if (/products\.html/i.test(links[i].getAttribute('href') || '') &&
            /products/i.test(links[i].textContent || '')) { prodA = links[i]; break; }
      }
      if (!prodA || prodA.parentNode.querySelector('.np-wrap')) return;  // 已注入 / 找不到锚点
      var activeCls = (prodA.className || '').indexOf('active') > -1 ? ' active' : '';
      var topHref = prodA.getAttribute('href') || (prefix + 'products.html');
      // 顶部导航左侧只分 Outdoor / Indoor 两组；右侧横向列出该组下的所有产品。
      // 归属规则：大类 id/name 含 indoor 的进 Indoor，其余进 Outdoor。
      // 产品文字去掉功率后缀（"Flood Light 50W" -> "Flood Light"），链接直达详情页。
      function shortNameNav(title) {
        return String(title || '').trim().replace(/\s+\d[\d\s–\-\/]*\s*W\b.*$/i, '').trim();
      }
      var groups = [
        { label: 'Outdoor', anchor: '', cards: [] },
        { label: 'Indoor',  anchor: '', cards: [] }
      ];
      for (var c = 0; c < cats.length; c++) {
        var cat = cats[c];
        var gi = /indoor/i.test((cat.id || '') + ' ' + (cat.name || cat.title || '')) ? 1 : 0;
        if (!groups[gi].anchor) groups[gi].anchor = cat.id || '';
        var cards = cat.cards || [];
        for (var k = 0; k < cards.length; k++) {
          if (cards[k] && cards[k].slug) groups[gi].cards.push(cards[k]);
        }
      }
      var megaCats = '', megaPanels = '', wi = 0;
      for (var g = 0; g < groups.length; g++) {
        var grp = groups[g];
        if (!grp.cards.length) continue;           // 空组不渲染，避免出现空的分类
        var idx = wi++;
        var grpHref = prefix + 'products.html' + (grp.anchor ? '#' + grp.anchor : '');
        megaCats += '<a class="np-cat' + (idx === 0 ? ' on' : '') + '" href="' + esc(grpHref) +
          '" data-np="' + idx + '">' + esc(grp.label) + '</a>';
        var row = '<div class="np-subhead"' + (idx === 0 ? '' : ' hidden') +
          ' data-np-head="' + idx + '">' + esc(grp.label) + '</div><div class="np-subrow"' +
          (idx === 0 ? '' : ' hidden') + ' data-np-panel="' + idx + '">';
        for (var m = 0; m < grp.cards.length; m++) {
          var card = grp.cards[m];
          var slug = card.slug || '';
          var href = /\.html$/.test(slug) ? prefix + slug : prefix + slug + '.html';
          var title = shortNameNav(card.title || card.name || slug) || slug;
          row += '<a href="' + esc(href) + '">' + esc(title) + '</a>';
        }
        row += '</div>';
        megaPanels += row;
      }
      var wrap = document.createElement('div');
      wrap.className = 'np-wrap';
      wrap.setAttribute('data-content', 'navproducts');
      wrap.innerHTML = '<a class="np-top' + activeCls + '" href="' + esc(topHref) + '">' +
        esc(prodA.textContent || 'Products') +
        '<span class="np-caret" role="button" aria-label="Expand product categories" aria-expanded="false">&#9662;</span></a>' +
        '<div class="np-mega"><div class="np-cats">' + megaCats + '</div>' +
        '<div class="np-subwrap">' + megaPanels + '</div></div>';
      prodA.parentNode.replaceChild(wrap, prodA);
    });
    injectNavProductsCss();
    bindNavProducts();
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

  /* ---------- 页脚品牌简介（FOOTER_INTRO_V1）----------
     页脚 logo 下方那两段英文简介写死在全部 14 个 HTML 里，现改为后台可编辑：
       · site.footer.intro   主简介（长段）
       · site.footer.tagline 副标语（灰色小字）
     用 .footer-logo 的父容器定位前两个 <p>，首帧打 data-c 标记防止被「全站正文文字」功能重复接管，
     再按数据写入；留空 = 保留 HTML 原文，不冲掉用户没改过的页面。 */
  function fixFooterIntro() {
    var logo = document.querySelector('.footer .footer-logo');
    if (!logo || !logo.parentNode) return;
    var ps = logo.parentNode.querySelectorAll('p');
    if (ps[0] && !ps[0].getAttribute('data-c')) ps[0].setAttribute('data-c', 'footerIntro');
    if (ps[1] && !ps[1].getAttribute('data-c')) ps[1].setAttribute('data-c', 'footerTagline');
  }

  function renderFooterIntro(site) {
    var f = site.footer || {};
    if (f.intro) {
      var a = document.querySelectorAll('[data-c="footerIntro"]');
      for (var i = 0; i < a.length; i++) a[i].textContent = f.intro;
    }
    if (f.tagline) {
      var b = document.querySelectorAll('[data-c="footerTagline"]');
      for (var j = 0; j < b.length; j++) b[j].textContent = f.tagline;
    }
  }

  /* ---------- 产品详情页测试报告下载（PRODUCT_REPORTS_V1）----------
     后台「测试报告」标签页把附件绑定到产品：productReports[slug]=[{title,href,size}]。
     前台按当前产品 slug 取绑定的报告，接管 hero 里的 Download 按钮：
       · 0 份  -> 保留 HTML 原样（静态兜底；顺手修掉 high-bay 的 #Sdownloads 死链）
       · 1 份  -> 点按钮直接下载（不弹框）
       · ≥2 份 -> 点按钮弹多选面板，勾选后逐个下载
     href 兼容 ../assets/dl/x.pdf（下载清单写法）与 assets/dl/x.pdf（根相对），
     产品页在站点根目录，统一去掉开头 ../ 才能真正下到文件。 */
  var PRODUCT_REPORTS_CSS = ''
    + '.pr-modal{position:fixed;inset:0;z-index:2000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(6,31,50,.55);}'
    + '.pr-modal.open{display:flex;}'
    + '.pr-box{background:#fff;border-radius:14px;max-width:460px;width:100%;max-height:80vh;overflow:auto;padding:24px;}'
    + '.pr-box h3{margin:0 0 4px;font-size:1.15rem;color:var(--text,#061F32);}'
    + '.pr-box .pr-sub{margin:0 0 16px;font-size:.85rem;color:var(--text-muted,#64748B);}'
    + '.pr-row{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border:1px solid #E2E8F0;border-radius:9px;margin-bottom:9px;cursor:pointer;}'
    + '.pr-row:hover{border-color:var(--accent,#F59E0B);background:#FFF9EE;}'
    + '.pr-row input{margin-top:3px;accent-color:var(--accent,#F59E0B);width:16px;height:16px;flex:0 0 auto;}'
    + '.pr-row .pr-name{display:block;font-size:.92rem;color:var(--text,#061F32);line-height:1.4;}'
    + '.pr-row .pr-size{display:block;font-size:.76rem;color:var(--text-muted,#64748B);margin-top:2px;}'
    + '.pr-acts{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;}'
    + '.pr-btn{border:0;border-radius:8px;padding:10px 18px;font-size:.9rem;font-weight:600;cursor:pointer;}'
    + '.pr-btn.go{background:var(--accent,#F59E0B);color:#fff;}'
    + '.pr-btn.no{background:#F1F5F9;color:#475569;}'
    + '.pr-tip{font-size:.75rem;color:var(--text-muted,#64748B);margin-top:12px;line-height:1.5;}';

  function reportHref(href) {
    var h = String(href || '').trim();
    // 产品页在站点根：去掉下载清单的 ../ 前缀，避免跳到站点上一级
    while (h.indexOf('../') === 0) h = h.slice(3);
    return h;
  }

  function currentReportSlug() {
    var id = currentPageId();  // 例：product-high-bay.html
    return id.replace(/\.html?$/i, '');
  }

  function renderProductReports(data) {
    var slug = currentReportSlug();
    if (slug.indexOf('product-') !== 0) return;   // 只在产品详情页生效
    var actions = document.querySelector('.pdp-actions');
    if (!actions) return;
    var btn = actions.querySelector('a.btn-primary') || actions.querySelector('a.btn');
    if (!btn) return;

    // 先修 high-bay 写死的 #Sdownloads 死链（不依赖 content.json 是否有 productReports 段）
    if ((btn.getAttribute('href') || '').indexOf('#Sdownloads') >= 0) {
      var dlTarget = document.getElementById('downloads');
      btn.setAttribute('href', dlTarget ? '#downloads' : 'contact.html');
    }

    var map = data.productReports;
    if (!map || typeof map !== 'object') return;
    var list = map[slug];

    // 没有绑定：保留原按钮（死链上面已修）
    if (!Array.isArray(list) || !list.length) return;

    // 归一化有效条目
    var items = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i] || {};
      var href = reportHref(r.href);
      if (!href) continue;
      items.push({ title: r.title || href.split('/').pop(), href: href, size: r.size || '' });
    }
    if (!items.length) return;

    if (!document.getElementById('pr-modal-css')) {
      var st = document.createElement('style');
      st.id = 'pr-modal-css';
      st.textContent = PRODUCT_REPORTS_CSS;
      document.head.appendChild(st);
    }

    // 单份：直接改成直链下载
    if (items.length === 1) {
      btn.setAttribute('href', items[0].href);
      btn.setAttribute('download', '');
      btn.setAttribute('data-content', 'productReports');
      return;
    }

    // 多份：按钮改成触发选择面板
    btn.setAttribute('href', '#');
    btn.setAttribute('data-content', 'productReports');
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    var label = btn.textContent.trim();
    btn.textContent = label;   // 文案不变，仍是 Download Test Report / Download documents

    var modal = document.createElement('div');
    modal.className = 'pr-modal';
    modal.setAttribute('data-content', 'productReports');
    modal.id = 'prModal';
    var rows = '';
    for (var k = 0; k < items.length; k++) {
      rows += '<label class="pr-row"><input type="checkbox" class="pr-cb" data-i="' + k + '">' +
        '<span><span class="pr-name">' + esc(items[k].title) + '</span>' +
        (items[k].size ? '<span class="pr-size">' + esc(items[k].size) + '</span>' : '') +
        '</span></label>';
    }
    modal.innerHTML = '<div class="pr-box" role="dialog" aria-modal="true" aria-label="Select test reports to download">' +
      '<h3>Select Test Reports</h3>' +
      '<p class="pr-sub">Tick the files you need — multiple selection allowed. ' + items.length + ' available.</p>' +
      rows +
      '<div class="pr-acts"><button type="button" class="pr-btn go" id="prDownload">Download Selected</button>' +
      '<button type="button" class="pr-btn no" id="prClose">Cancel</button></div>' +
      '<p class="pr-tip">Your browser may ask to allow multiple downloads. Please allow it, otherwise only the first file will be downloaded.</p>' +
      '</div>';
    document.body.appendChild(modal);

    function openModal(e) {
      if (e && e.preventDefault) e.preventDefault();
      modal.classList.add('open');
    }
    function closeModal() { modal.classList.remove('open'); }
    btn.addEventListener('click', openModal);
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') openModal(e);
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.getElementById('prClose').addEventListener('click', closeModal);
    document.getElementById('prDownload').addEventListener('click', function () {
      var cbs = modal.querySelectorAll('.pr-cb');
      var picked = [];
      for (var n = 0; n < cbs.length; n++) if (cbs[n].checked) picked.push(items[parseInt(cbs[n].getAttribute('data-i'), 10)]);
      if (!picked.length) { alert('Please select at least one report.'); return; }
      // 逐个下载：错开 250ms，避开浏览器对同时下载的合并拦截
      picked.forEach(function (it, idx) {
        setTimeout(function () {
          var a = document.createElement('a');
          a.href = it.href;
          a.setAttribute('download', '');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }, idx * 250);
      });
      closeModal();
    });
  }

  /* ---------- 页脚导览两列：Products / Company（FOOTER_NAV_V1）----------
     content.json 顶层 footerNav 段可后台编辑；有数据时按 <h5> 标题重建两列链接，
     静态 HTML 作兜底。给列容器打 data-content 标记，避免被全站正文文字枚举接管。 */
  function renderFooterNav(data) {
    var fn = data.footerNav;
    if (!fn || fn.enabled === false) return;      // 没配 / 关闭 -> 保留 HTML 静态兜底
    var grid = document.querySelector('footer.footer .footer-grid') || document.querySelector('.footer-grid');
    if (!grid) return;
    function findCol(title) {
      var heads = grid.querySelectorAll('h5');
      for (var i = 0; i < heads.length; i++) {
        if (new RegExp('^' + title + '$', 'i').test((heads[i].textContent || '').trim())) return heads[i].parentNode;
      }
      return null;
    }
    function fill(col, title, items) {
      if (!col || !items || !items.length) return;
      var html = '<h5>' + esc(title) + '</h5>';
      for (var k = 0; k < items.length; k++) {
        var it = items[k];
        var t = it.t || it.text || '';
        var h = it.h || it.href || '#';
        if (t) html += '<a href="' + esc(h) + '">' + esc(t) + '</a>';
      }
      col.innerHTML = html;
      col.setAttribute('data-content', 'footernav');   // 防全站正文文字枚举接管
    }
    fill(findCol('Products'), 'Products', fn.products);
    fill(findCol('Company'), 'Company', fn.company);
  }

  /* ===== FOOTER_PRODUCTS_V2: 页脚产品列 = 后台产品数据二级菜单 ===== */
  function injectFooterProductsCss() {
    if (document.getElementById('gmtne-footer-products-css')) return;
    var css = ''
      + '.footer .fp-group{position:relative;}'
      + '.footer .fp-row{display:flex;align-items:center;gap:4px;}'
      + '.footer .fp-row .fp-cat{display:inline-block;margin-bottom:.45rem;color:rgba(255,255,255,.7);font-size:.9rem;}'
      + '.footer .fp-row .fp-cat:hover{color:var(--accent);}'
      + '.footer .fp-toggle{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;margin:0 0 .45rem 0;padding:0;border:1px solid rgba(255,255,255,.25);border-radius:3px;background:transparent;color:rgba(255,255,255,.75);font-size:.7rem;line-height:1;cursor:pointer;transition:background .18s,color .18s;}'
      + '.footer .fp-toggle:hover{background:rgba(255,255,255,.12);color:#fff;}'
      + '.footer .fp-toggle::after{content:"\\25BE";}'
      + '.footer .fp-toggle[aria-expanded="true"]::after{content:"\\25B4";}'
      + '.footer .fp-sub{display:none;flex-wrap:wrap;gap:6px 10px;padding:2px 0 4px;margin:0 0 10px;}'
      + '.footer .fp-sub a{display:inline-block;margin:0;font-size:.82rem;color:rgba(255,255,255,.58);white-space:nowrap;}'
      + '.footer .fp-sub a:hover{color:var(--accent);}'
      + '@media (hover:hover){.footer .fp-group:hover .fp-sub{display:flex;}}'
      + '.footer .fp-group.open .fp-sub{display:flex;}'
      + '@media(max-width:768px){.footer .fp-sub a{font-size:.8rem;}}';
    var st = document.createElement('style');
    st.id = 'gmtne-footer-products-css';
    st.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(st);
  }

  function bindFooterProductsToggle() {
    if (window.__gmtneFooterProductsBound) return;
    window.__gmtneFooterProductsBound = true;
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var btn = t.closest('.fp-toggle');
      if (!btn) return;
      e.preventDefault();
      var g = btn.closest('.fp-group');
      if (!g) return;
      var open = !g.classList.contains('open');
      g.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function renderFooterProducts(data) {
    var p = data && data.products;
    var cats = p && p.categories;
    if (!cats || !cats.length) return;              // 无产品数据 -> 静态兜底
    var grid = document.querySelector('footer.footer .footer-grid') || document.querySelector('.footer-grid');
    if (!grid) return;
    var heads = grid.querySelectorAll('h5');
    var col = null;
    for (var i = 0; i < heads.length; i++) {
      if (/^Products$/i.test((heads[i].textContent || '').trim())) { col = heads[i].parentNode; break; }
    }
    if (!col) return;
    var prefix = IS_RESOURCES ? '../' : '';
    var html = '<h5>Products</h5>';
    for (var c = 0; c < cats.length; c++) {
      var cat = cats[c];
      var name = cat.name || cat.title || '';
      if (!name) continue;
      var anchor = cat.id || '';
      var catHref = prefix + 'products.html' + (anchor ? '#' + anchor : '');
      var cards = cat.cards || [];
      html += '<div class="fp-group">';
      html += '<div class="fp-row">';
      html += '<a class="fp-cat" href="' + esc(catHref) + '">' + esc(name) + '</a>';
      if (cards.length) {
        html += '<button type="button" class="fp-toggle" aria-label="Expand ' + esc(name) + ' products" aria-expanded="false"></button>';
      }
      html += '</div>';
      if (cards.length) {
        html += '<div class="fp-sub">';
        for (var k = 0; k < cards.length; k++) {
          var card = cards[k];
          var slug = card.slug || '';
          if (!slug) continue;
          var href = /\.html$/.test(slug) ? prefix + slug : prefix + slug + '.html';
          var title = card.title || card.name || slug;
          html += '<a href="' + esc(href) + '">' + esc(title) + '</a>';
        }
        html += '</div>';
      }
      html += '</div>';
    }
    col.innerHTML = html;
    col.setAttribute('data-content', 'footerproducts');   // 防全站正文文字枚举接管
    injectFooterProductsCss();
    bindFooterProductsToggle();
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

  /* ---------- OEM / ODM 首页区块（后台可编辑）----------
     OEM_MODULE_V1
     只在存在 [data-content="oem"] 容器（Home 页）时渲染；别的页面零影响。
     样式由运行时注入（OEM_CSS），已发布的页面无需重生成 HTML。
     动态内容带 data-content 标记，避开「全站正文文字」枚举规则。 */
  function injectOemCss(){
    if(!document.getElementById('gmtne-oem-css')){
      var st=document.createElement('style');
      st.id='gmtne-oem-css'; st.textContent=OEM_CSS;
      document.head.appendChild(st);
    }
  }
  function oemHref(h){
    h = h || '#';
    // 站内相对路径交给 resolveHref 处理（resources 子目录补前缀）；绝对链接原样
    return resolveHref(h);
  }
  function renderOem(data){
    var box = document.querySelector('[data-content="oem"]');
    if(!box) return;
    var o = data.oem;
    if(!o || o.enabled === false){ return; }   // 没配 oem 段 / 关闭时保留 HTML 静态兜底
    injectOemCss();

    function bullets(arrText){
      return String(arrText||'').split(/\r?\n/).map(function(line){
        if(!line.trim()) return '';
        var parts = line.split('|');
        var txt = (parts[0]||'').trim();
        var href = (parts[1]||'').trim();
        return '<li>' + (href ? '<a href="'+esc(oemHref(href))+'">'+esc(txt)+'</a>' : esc(txt)) + '</li>';
      }).filter(Boolean).join('');
    }
    var html = '';
    if(o.kicker)   html += '<p class="oem-kicker fade-in">'+esc(o.kicker)+'</p>';
    if(o.title)    html += '<h2 class="section-title mb-3 fade-in">'+esc(o.title)+'</h2>';
    if(o.lead)     html += '<p class="section-subtitle mb-4 fade-in">'+o.lead+'</p>';

    if(o.routes && o.routes.length){
      html += '<h3 class="oem-sub fade-in">'+esc(o.routesTitle||'')+'</h3>';
      html += '<div class="oem-routes">';
      o.routes.forEach(function(r){
        html += '<div class="oem-route fade-in">';
        if(r.tag)   html += '<span class="oem-route-tag">'+esc(r.tag)+'</span>';
        if(r.title) html += '<h4>'+esc(r.title)+'</h4>';
        if(r.desc)  html += '<p>'+esc(r.desc)+'</p>';
        var bl = bullets(r.bulletsText);
        if(bl) html += '<ul>'+bl+'</ul>';
        html += '</div>';
      });
      html += '</div>';
      if(o.routesNote) html += '<p class="oem-note fade-in">'+esc(o.routesNote)+'</p>';
    }

    if(o.custom && o.custom.length){
      html += '<h3 class="oem-sub fade-in">'+esc(o.customTitle||'')+'</h3>';
      html += '<div class="oem-custom">';
      o.custom.forEach(function(c){
        html += '<div class="oem-custom-item fade-in">';
        html += '<span class="oem-ic">'+esc(c.icon||'')+'</span>';
        html += '<strong>'+esc(c.title||'')+'</strong>';
        html += '<span>'+esc(c.desc||'')+'</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    if(o.moq && o.moq.length){
      html += '<h3 class="oem-sub fade-in">'+esc(o.moqTitle||'')+'</h3>';
      html += '<div class="oem-moq">';
      o.moq.forEach(function(m){
        html += '<div class="oem-moq-card fade-in">';
        html += '<span class="oem-moq-num">'+esc(m.value||'')+'</span>';
        html += '<strong>'+esc(m.title||'')+'</strong>';
        html += '<span>'+esc(m.desc||'')+'</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    /* 服务市场（MARKETS_V1）：并进 OEM 区块，排在 CTA 之前。
       status 三档固定：onboarding=招商中 / live=已落地 / planned=规划中；
       填了别的词就原样显示，颜色按 onboarding 处理（兼容自由文字）。 */
    var mk = o.markets;
    if(mk && mk.enabled !== false && mk.items && mk.items.length){
      var MLBL = {onboarding:'Now onboarding', live:'Live', planned:'Planned'};
      var MCLS = {onboarding:'is-onboarding', live:'is-live', planned:'is-planned'};
      var shown = mk.items.filter(function(x){ return x && x.visible !== false && (x.country || x.code); });
      if(shown.length){
        if(mk.title)    html += '<h3 class="oem-sub fade-in">'+esc(mk.title)+'</h3>';
        if(mk.subtitle) html += '<p class="oem-markets-lead fade-in">'+esc(mk.subtitle)+'</p>';
        html += '<div class="oem-markets fade-in" style="--cols:'+(shown.length>=6?6:5)+'">';
        shown.forEach(function(x){
          var st = x.status || 'onboarding';
          html += '<div class="oem-market">';
          if(x.code) html += '<span class="oem-market-code">'+esc(x.code)+'</span>';
          html += '<strong>'+esc(x.country || x.code || '')+'</strong>';
          html += '<span class="oem-market-status '+(MCLS[st]||'is-onboarding')+'">'+esc(MLBL[st]||st)+'</span>';
          html += '</div>';
        });
        html += '</div>';
        hideLegacyMarkets();
      }
    } else if(mk && mk.enabled === false){
      hideLegacyMarkets();
    }

    var cta = o.cta || {};
    if(cta.title || cta.text){
      html += '<div class="oem-cta fade-in"><div>';
      if(cta.title) html += '<h3>'+esc(cta.title)+'</h3>';
      if(cta.text)  html += '<p>'+esc(cta.text)+'</p>';
      html += '</div><div class="oem-cta-btns">';
      if(cta.button1Text) html += '<a href="'+esc(oemHref(cta.button1Href))+'" class="btn btn-primary">'+esc(cta.button1Text)+'</a>';
      if(cta.button2Text) html += '<a href="'+esc(oemHref(cta.button2Href))+'" class="btn btn-outline">'+esc(cta.button2Text)+'</a>';
      html += '</div></div>';
    }

    if(html){
      box.innerHTML = '<div class="container">'+html+'</div>';
      box.setAttribute('data-content','oem');
    }
  }

  /* 旧首页里「Markets we serve」是写死的一节；现已并进 OEM 区块 → 运行时隐藏，避免出现两遍。
     找不到这个标题（以后 HTML 重发已删掉）也安全返回 false。 */
  function hideLegacyMarkets(){
    var secs = document.getElementsByTagName('section'), i, h2;
    for(i = 0; i < secs.length; i++){
      if(secs[i].getAttribute('data-content') === 'oem') continue;   // 新容器不动
      h2 = secs[i].querySelector('h2');
      if(h2 && /^markets\s+we\s+serve$/i.test((h2.textContent||'').replace(/\s+/g,' ').trim())){
        secs[i].style.display = 'none';
        secs[i].setAttribute('data-legacy-markets','hidden');
        return true;
      }
    }
    return false;
  }

  /* ---------- About 页「合作品牌」区块（后台可编辑）----------
     BRANDS_V1
     线上 about.html 已写好静态兜底（data-content="brands"），本函数按 content.json
     的 brands 段重建两组品牌卡片。无 brands 段 / 无数据时完全不接管，保留静态原文。
     带 data-content 标记，排除「全站正文文字」枚举，避免 pages 段索引错位。
     每张卡：有 logo 显示图片，无 logo 显示文字名。 */
  function renderCoBrands(data) {
    var box = document.querySelector('[data-content="brands"]');
    if (!box) return;                       // 只有 about 页有此容器
    var b = data && data.brands;
    if (!b) return;                         // 线上旧 JSON 无此段 → 保留静态兜底

    function putText(key, value) {
      if (value === undefined || value === null || value === '') return;
      var el = box.querySelector('[data-c="' + key + '"]');
      if (el) el.textContent = value;
    }
    putText('brandsTitle', b.title);
    putText('brandsIntro', b.intro);
    putText('brandsGlobalLabel', b.globalLabel);
    putText('brandsIndiaLabel', b.indiaLabel);

    function renderGroup(key, items) {
      var grid = box.querySelector('[data-brands-group="' + key + '"]');
      if (!grid || !Array.isArray(items) || !items.length) return;
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it) continue;
        var name = it.name || '';
        var logo = it.logo || '';
        // logo 路径归一化：允许 assets/img/brands/x 或 ./assets/... 或裸文件名
        var src = logo;
        if (src && !/^https?:\/\//i.test(src) && !/^\//.test(src) && !/^assets\//i.test(src)) {
          src = 'assets/img/brands/' + src.replace(/^\.\//, '');
        }
        html += '<div class="brand-card">';
        if (src) {
          html += '<img src="' + esc(src) + '" alt="' + esc(name) + '">';
        } else {
          html += '<span>' + esc(name || '&nbsp;') + '</span>';
        }
        html += '</div>';
      }
      if (html) grid.innerHTML = html;
    }
    renderGroup('global', b.global);
    renderGroup('india', b.india);
  }

  /* ---------- Home 页首屏 Hero（后台可编辑）----------
     HOME_HERO_V1
     线上 index.html 的首屏是写死的文字，而 HTML 不在「同步前台文件」白名单里
     （白名单只有 js/css），所以这里**就地改写已有节点**：不新建结构、不重发 HTML。
     没有 homeHero 段 / enabled=false 时完全不接管，保留页面原本文案，不会白屏。
     给 .hero-content 打 data-content 标记，把它排除在「页面文字」枚举之外，
     避免两套后台入口同时改同一段字互相覆盖。 */
  var HOME_HERO_OVERLAY = 'linear-gradient(135deg, rgba(10,37,64,0.92) 0%, rgba(6,24,42,0.88) 100%)';

  function renderHomeHero(data) {
    var h = data && data.homeHero;
    var sec = document.querySelector('section.hero');
    if (!h || !sec) return;
    if (h.enabled === false) return;

    var box = sec.querySelector('.hero-content');
    if (!box) return;
    box.setAttribute('data-content', 'homehero');

    if (h.kicker) {
      var kicker = box.querySelector('.hero-kicker');
      if (kicker) kicker.textContent = h.kicker;
    }

    /* 标题拆两段：h.title 白色 + h.titleAccent 橙色（对应原来的 <span>） */
    if (h.title || h.titleAccent) {
      var h1 = box.querySelector('h1');
      if (h1) {
        h1.innerHTML = esc(h.title || '') +
          (h.titleAccent ? ' <span>' + esc(h.titleAccent) + '</span>' : '');
      }
    }

    /* 说明段落 = hero-content 里第一个非 kicker 的 <p> */
    if (h.lead) {
      var lead = null, kids = box.children, i;
      for (i = 0; i < kids.length; i++) {
        if (kids[i].tagName === 'P' && String(kids[i].className).indexOf('hero-kicker') === -1) {
          lead = kids[i]; break;
        }
      }
      if (lead) lead.textContent = h.lead;
    }

    /* 两个按钮：文字留空 = 不显示该按钮 */
    var btns = box.querySelectorAll('.hero-btns a');
    var pairs = [[h.btn1Text, h.btn1Href], [h.btn2Text, h.btn2Href]];
    for (i = 0; i < pairs.length; i++) {
      var a = btns[i];
      if (!a) continue;
      if (!pairs[i][0]) { a.style.display = 'none'; continue; }
      a.style.display = '';
      a.textContent = pairs[i][0];
      a.setAttribute('href', resolveHref(pairs[i][1] || '#'));
    }

    /* 下方三项数据：整块重建，条数由数据决定 */
    if (h.stats && h.stats.length) {
      var stats = box.querySelector('.hero-stats');
      if (stats) {
        stats.innerHTML = h.stats.map(function (s) {
          return '<div class="hero-stat"><strong>' + esc(s.value || '') +
            '</strong><span>' + esc(s.label || '') + '</span></div>';
        }).join('');
      }
    }

    /* 背景图：留空则清掉内联样式，回落到样式表里的默认图 */
    if (h.bgImage !== undefined) {
      var bg = String(h.bgImage || '').trim();
      sec.style.backgroundImage = bg
        ? HOME_HERO_OVERLAY + ", url('" + resolveMedia(bg) + "')"
        : '';
    }
  }

  /* ---------- Home 页 SKD/CKD 区块（后台可编辑）----------
     只在存在 [data-content="skd"] 容器（Home 页）时渲染；别的页面零影响。
     没有 skd 段 / enabled=false 时保留 HTML 静态兜底，不白屏。
     动态内容带 data-content 标记，排除「全站正文文字」索引，避免 pages 段错位。 */
  function renderSkd(data) {
    var s = data.skd;
    var box = document.querySelector('[data-content="skd"]');
    if (!box || !s) return;
    if (s.enabled === false) { box.innerHTML = ''; return; }

    function btn(txt, href, extra) {
      if (!txt) return '';
      return '<a href="' + esc(resolveHref(href || 'contact.html')) + '" class="btn ' + (extra || 'btn-primary') + '">' + esc(txt) + '</a>';
    }
    function stepsHtml(arr) {
      if (!arr || !arr.length) return '';
      return '<div class="step-grid">' + arr.map(function (it) {
        return '<div class="step-card">' +
          (it.no ? '<span class="step-no">' + esc(it.no) + '</span>' : '') +
          '<h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p></div>';
      }).join('') + '</div>';
    }
    var html = '';

    // 1 为什么本地组装
    if (s.why && (s.why.title || (s.why.items && s.why.items.length))) {
      html += '<div class="skd-block fade-in" style="margin-bottom:3rem;">';
      if (s.why.title) html += '<h2 class="section-title mb-3">' + esc(s.why.title) + '</h2>';
      html += stepsHtml(s.why.items) + '</div>';
    }

    // 2 套件内容（两栏图文）
    if (s.kit && (s.kit.title || s.kit.text)) {
      html += '<div class="two-col skd-block fade-in" style="margin-bottom:3rem;"><div>';
      if (s.kit.title) html += '<h2 class="section-title mb-3">' + esc(s.kit.title) + '</h2>';
      if (s.kit.text) html += '<p style="color:var(--text-muted);margin-bottom:1.25rem;">' + esc(s.kit.text) + '</p>';
      if (s.kit.items && s.kit.items.length) {
        html += '<ul style="list-style:disc;padding-left:1.25rem;color:var(--text-muted);margin-bottom:1.5rem;">' +
          s.kit.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      }
      html += btn(s.kit.buttonText, s.kit.buttonHref) + '</div>';
      if (s.kit.image) {
        html += '<div><img src="' + esc(resolveMedia(s.kit.image)) + '" alt="' + esc(s.kit.imageAlt || 'SKD kit') + '"></div>';
      }
      html += '</div>';
    }

    // 3 组装步骤
    if (s.assembly && (s.assembly.title || (s.assembly.items && s.assembly.items.length))) {
      html += '<div class="skd-block fade-in" style="margin-bottom:3rem;">';
      if (s.assembly.title) html += '<h2 class="section-title mb-3">' + esc(s.assembly.title) + '</h2>';
      if (s.assembly.subtitle) html += '<p class="section-subtitle mb-4">' + esc(s.assembly.subtitle) + '</p>';
      html += stepsHtml(s.assembly.items);
      if (s.assembly.note) html += '<p style="text-align:center;color:var(--text-muted);margin-top:2rem;">' + esc(s.assembly.note) + '</p>';
      html += '</div>';
    }

    // 4 商务条款表
    if (s.terms && (s.terms.title || (s.terms.rows && s.terms.rows.length))) {
      html += '<div class="skd-block fade-in">';
      if (s.terms.title) html += '<h2 class="section-title mb-3">' + esc(s.terms.title) + '</h2>';
      if (s.terms.rows && s.terms.rows.length) {
        html += '<div style="overflow-x:auto;"><table class="terms-table"><tbody>' +
          s.terms.rows.map(function (r) {
            return '<tr><th>' + esc(r.k) + '</th><td>' + esc(r.v) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      var b1 = btn(s.terms.button1Text, s.terms.button1Href);
      var b2 = btn(s.terms.button2Text, s.terms.button2Href, 'btn-outline" style="margin-left:.5rem;');
      if (b1 || b2) html += '<div class="text-center" style="margin-top:2rem;">' + b1 + b2 + '</div>';
      html += '</div>';
    }

    if (html) {
      box.innerHTML = html;
      box.setAttribute('data-content', 'skd'); // 重建后保持标记（innerHTML 不影响自身属性）
    }
  }

  /* ---------- High Bay 页：Why 四卡 + 应用场景（HB_MODULE_V1） ----------
     content.json 的 highBay 段可后台编辑；有数据时重建两块，无数据/关闭时保留 HTML 静态兜底。 */
  var HB_CSS = ''
    + '.hb-sub{font-size:1rem;line-height:1.7;color:var(--text-muted);max-width:820px;margin:0 0 2rem;}'
    + '.hb-why{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}'
    + '.hb-why-card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:26px 24px 28px;position:relative;overflow:hidden;transition:border-color .22s ease,box-shadow .22s ease,transform .22s ease;}'
    + '.hb-why-card::before{content:"";position:absolute;left:0;top:0;width:100%;height:3px;background:linear-gradient(90deg,var(--cyan),var(--accent));opacity:0;transition:opacity .25s ease;}'
    + '.hb-why-card:hover{border-color:var(--accent);box-shadow:0 14px 30px rgba(10,37,64,.10);transform:translateY(-4px);}'
    + '.hb-why-card:hover::before{opacity:1;}'
    + '.hb-why-card .num{font-size:.75rem;font-weight:800;letter-spacing:1.5px;color:var(--cyan);margin-bottom:.7rem;display:block;}'
    + '.hb-why-card h3{font-size:1.05rem;font-weight:700;color:var(--primary);line-height:1.4;margin:0 0 .7rem;}'
    + '.hb-why-card p{margin:0;font-size:.9rem;line-height:1.75;color:#55637A;}'
    + '.hb-scene{display:grid;grid-template-columns:1.6fr 1fr;grid-template-rows:repeat(3,1fr);gap:18px;align-items:stretch;}'
    + '.hb-scene figure{display:flex;flex-direction:column;margin:0;background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;min-height:0;transition:border-color .22s ease,box-shadow .22s ease,transform .22s ease;}'
    + '.hb-scene figure:hover{border-color:var(--accent);box-shadow:0 12px 28px rgba(10,37,64,.09);transform:translateY(-3px);}'
    + '.hb-scene .hb-big{grid-row:span 3;}'
    + '.hb-scene-media{position:relative;overflow:hidden;background:var(--primary);flex:1 1 0;min-height:0;}'
    + '.hb-scene figure:not(.hb-big) .hb-scene-media{flex:0 0 108px;min-height:108px;}'
    + '.hb-scene figure img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .55s ease;}'
    + '.hb-scene figure:hover img{transform:scale(1.05);}'
    + '.hb-scene figcaption{flex:0 0 auto;padding:14px 18px 17px;}'
    + '.hb-scene figcaption .tag{display:inline-block;font-size:.68rem;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--cyan);margin-bottom:.35rem;}'
    + '.hb-scene figcaption strong{display:block;font-size:1rem;font-weight:700;color:var(--primary);line-height:1.4;}'
    + '.hb-scene figcaption span{display:block;margin-top:.3rem;font-size:.83rem;line-height:1.55;color:#55637A;}'
    + '.hb-scene .hb-big figcaption{padding:20px 24px 22px;}'
    + '.hb-scene .hb-big figcaption strong{font-size:1.2rem;}'
    + '.hb-scene .hb-big figcaption span{font-size:.9rem;margin-top:.4rem;}'
    + '@media(max-width:1000px){.hb-why{grid-template-columns:repeat(2,1fr);gap:16px;}.hb-scene{grid-template-columns:1fr;grid-template-rows:auto;}.hb-scene .hb-big{grid-row:auto;}.hb-scene .hb-big .hb-scene-media,.hb-scene figure:not(.hb-big) .hb-scene-media{aspect-ratio:16/9;flex:0 0 auto;}}'
    + '@media(max-width:640px){.hb-why{grid-template-columns:1fr;}}';
  function injectHighBayCss(){
    if(!document.getElementById('gmtne-hb-css')){
      var st=document.createElement('style');
      st.id='gmtne-hb-css'; st.textContent=HB_CSS;
      document.head.appendChild(st);
    }
  }
  function renderHighBay(data){
    var hb = data.highBay;
    if(!hb || hb.enabled === false) return;   // 没配 / 关闭 -> 保留 HTML 静态兜底
    var whyBox = document.querySelector('[data-content="hbwhy"]');
    var sceneBox = document.querySelector('[data-content="hbscenes"]');
    if(!whyBox && !sceneBox) return;          // 不是 high bay 页
    injectHighBayCss();

    // --- Why 四卡 ---
    if(whyBox && hb.why){
      var w = hb.why, wh = '';
      if(w.title) wh += '<h2 class="section-title">'+esc(w.title)+'</h2>';
      if(w.sub)   wh += '<p class="hb-sub">'+esc(w.sub)+'</p>';
      if(w.cards && w.cards.length){
        wh += '<div class="hb-why">';
        w.cards.forEach(function(c){
          wh += '<div class="hb-why-card">'
             + (c.no ? '<span class="num">'+esc(c.no)+'</span>' : '')
             + (c.title ? '<h3>'+esc(c.title)+'</h3>' : '')
             + (c.text ? '<p>'+esc(c.text)+'</p>' : '')
             + '</div>';
        });
        wh += '</div>';
      }
      if(wh){ whyBox.innerHTML = wh; whyBox.setAttribute('data-content','hbwhy'); }
    }

    // --- 应用场景：第一张 big，其余小图 ---
    if(sceneBox && hb.scenes){
      var sc = hb.scenes, sh = '';
      if(sc.title) sh += '<h2 class="section-title">'+esc(sc.title)+'</h2>';
      if(sc.sub)   sh += '<p class="hb-sub">'+esc(sc.sub)+'</p>';
      if(sc.items && sc.items.length){
        sh += '<div class="hb-scene">';
        sc.items.forEach(function(it,i){
          var big = (i === 0);
          sh += '<figure'+(big?' class="hb-big"':'')+'>';
          sh += '<div class="hb-scene-media"><img src="'+esc(resolveMedia(it.image))+'" alt="'+esc(it.alt||it.title||'')+'" decoding="async"></div>';
          sh += '<figcaption>';
          if(big && it.tag) sh += '<span class="tag">'+esc(it.tag)+'</span>';
          sh += '<strong>'+esc(it.title||'')+'</strong>';
          if(it.desc) sh += '<span>'+esc(it.desc)+'</span>';
          sh += '</figcaption></figure>';
        });
        sh += '</div>';
      }
      if(sh){ sceneBox.innerHTML = sh; sceneBox.setAttribute('data-content','hbscenes'); }
    }
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

    /* 类别跳转栏 = 全员展示：每个大类下的每个产品各一个标签（共 6 个），
       不再只显示 4 个大类。Indoor Lighting 展开成 Linear Bulb / Batten Drive / Emergency Lamp。
       标签文字取产品名称去掉功率后缀（如 "Flood Light 50W" -> "Flood Light"），
       链接直接跳该产品详情页；产品名/链接都来自后台 products.categories，增删自动同步。 */
    function shortName(title) {
      // 去掉功率后缀："Flood Light 50W" -> "Flood Light"，"Street Light 40 / 60W" -> "Street Light"
      return String(title || '').trim().replace(/\s+\d[\d\s–\-\/]*\s*W\b.*$/i, '').trim();
    }
    var jumpHtml = '', jumpN = 0;
    p.categories.forEach(function (cat) {
      (cat.cards || []).forEach(function (card) {
        if (!card || !card.slug) return;
        jumpN++;
        var num = ('0' + jumpN).slice(-2);
        var label = shortName(card.title) || card.slug;
        jumpHtml += '<a href="' + esc(card.slug) + '.html"><span class="cnt">' + num +
          '</span> ' + esc(label) + '</a>';
      });
    });
    jump.innerHTML = jumpHtml || p.categories.map(function (cat) {
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

  /* ---------- 产品详情页首图 = 列表卡片图（PRODUCT_HERO_SYNC） ----------
     列表卡片的图存在 content.json 的 products.categories[].cards[].image，
     详情页轮播第一张存在页面里的 <script id="pdpMedia">。两者原本各填各的，
     很容易出现「列表显示 A、点进去显示 B」的不统一。
     这里统一以「卡片图」为唯一来源：后台改一次，列表页和详情页首图同时变，
     已经发布出去的详情页 HTML 不用重新生成。
     · 只在产品详情页执行（页面里没有 #pdpFrame / #pdpMedia 就直接返回）。
     · 首图是视频时不动，避免把视频顶掉。
     · 多图轮播：切到第 2 张时不干扰，切回第 1 张才替换。 */
  function currentProductSlug() {
    var m = String(location.pathname).match(/\/([^\/]+)\.html?$/i);
    return m ? m[1] : '';
  }
  function findProductCard(data, slug) {
    var cats = (data && data.products && data.products.categories) || [];
    for (var i = 0; i < cats.length; i++) {
      var cards = cats[i].cards || [];
      for (var j = 0; j < cards.length; j++) {
        if (cards[j] && cards[j].slug === slug) return cards[j];
      }
    }
    return null;
  }
  function syncProductHero(data) {
    var frame = document.getElementById('pdpFrame');
    var mediaEl = document.getElementById('pdpMedia');
    if (!frame || !mediaEl) return;                  // 不是产品详情页
    var card = findProductCard(data, currentProductSlug());
    if (!card || !card.image) return;

    var items;
    try { items = JSON.parse(mediaEl.textContent) || []; } catch (e) { return; }
    if (!items.length) return;
    if ((items[0].type || 'image') === 'video') return;

    var oldFirst = items[0].src || '';
    if (oldFirst === card.image) return;             // 已经一致，不做任何事

    var caption = card.alt || card.title || items[0].caption || '';
    var target = resolveMedia(card.image);
    // 改写数据副本：角标文字跟着换，避免「图是一个型号、角标写另一个型号」
    items[0] = { type: 'image', src: card.image, caption: caption };
    try { mediaEl.textContent = JSON.stringify(items); } catch (e) {}

    function hit(el) {                               // 只在「当前显示的是第一张」时才换
      if (!el) return false;
      var cur = el.getAttribute('src');
      return oldFirst ? cur === oldFirst : !cur;
    }
    function paint() {
      var im = frame.querySelector('img');
      if (hit(im)) {
        im.setAttribute('src', target);
        im.setAttribute('alt', caption);
        var badge = document.getElementById('pdpBadge');
        if (badge && caption) badge.textContent = caption;
      }
      var thumbs = document.getElementById('pdpThumbs');
      var t0 = thumbs && thumbs.firstElementChild && thumbs.firstElementChild.querySelector('img');
      if (hit(t0)) t0.setAttribute('src', target);
    }
    paint();
    setTimeout(paint, 400);                          // 内联轮播脚本可能稍后才首次渲染

    // 多图时内联脚本闭包里仍是旧地址，切回第一张会闪回旧图；这里按住它
    if (typeof MutationObserver === 'function') {
      new MutationObserver(paint).observe(frame, { childList: true, subtree: true });
    }
  }

  /* ---------- Home 页六张产品卡（HOME_CARDS_LINK，2026-11-19）----------
     首页那 6 张卡原本完全写死在 index.html 里，跟内容数据没关系，所以后台怎么改都动不到它。
     这里做两件事：
     ① 图片永远跟「产品管理 → 产品主图」同源（products.categories[].cards[].image）——
        首页 / 列表页 / 详情页三处因此是同一张，后台传一次三处一起变。
     ② 文案（标签 / 标题 / 描述）由 content.json 的 homeCards.items 覆盖；
        没有该段、或某字段留空，就保留 HTML 原文 —— 首页文案本来就比列表页详细，不强行统一。
     `.tri-card` 只出现在 index.html，并额外做了页面判断，其它页面零影响。 */
  function homeCardSlug(a) {
    var h = (a.getAttribute && a.getAttribute('href')) || '';
    var m = /([^\/?#]+)\.html?(?:[?#]|$)/i.exec(h);
    return m ? m[1] : '';
  }
  function renderHomeTriCards(data) {
    var cards = document.querySelectorAll('.tri-card');
    if (!cards.length) return;                       // 不在首页
    var page = currentProductSlug();
    if (page && page !== 'index') return;            // 保险：万一别的页面也用了 tri-card

    var hc = (data && data.homeCards) || {};
    var items = (hc.enabled === false) ? [] : (hc.items || []);
    var bySlug = {};
    for (var i = 0; i < items.length; i++) {
      if (items[i] && items[i].slug) bySlug[items[i].slug] = items[i];
    }

    /* ① 区块标题与描述（六张卡上方那两行字，如 One platform, six lighting series）：
       只在 homeCards.title / homeCards.intro 填了内容时覆盖，留空 = 保留 HTML 原文。
       定位：从第一张卡往上找它所在的 <section>，只改这个区块里的标题，不误伤别处。 */
    var sec = null;
    if (cards[0] && cards[0].closest) sec = cards[0].closest('section');
    if (sec) {
      var h2El = sec.querySelector('.section-title');
      var subEl = sec.querySelector('.section-subtitle');
      if (hc.title && h2El) h2El.textContent = hc.title;
      if (hc.intro && subEl) subEl.textContent = hc.intro;
    }

    for (var k = 0; k < cards.length; k++) {
      var a = cards[k], slug = homeCardSlug(a);
      if (!slug) continue;

      // ② 图片：跟产品卡片同源；找不到卡片就保留 HTML 里的原图
      var card = findProductCard(data, slug);
      var img = a.querySelector('img');
      if (card && card.image && img) {
        var src = resolveMedia(card.image);
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        var alt = card.alt || card.title;
        if (alt) img.setAttribute('alt', alt);
      }

      // ③ 文案：homeCards 里配了才覆盖，留空 = 保留 HTML 原文
      var it = bySlug[slug];
      if (!it) continue;
      var tagEl = a.querySelector('.tri-tag');
      var titEl = a.querySelector('h3');
      var pEl = a.querySelector('.tri-body p');
      if (it.tag && tagEl) tagEl.textContent = it.tag;
      if (it.title && titEl) titEl.textContent = it.title;
      if (it.desc && pEl) pEl.textContent = it.desc;
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

  /* ---------- 首帧隐藏写死的旧悬浮图标，消除切页"先闪出 2 个旧按钮" ----------
     静态 HTML 每个页面写死 <a class="whatsapp-float">/<a class="linkedin-float">，
     新版 5 个图标要等 content.json fetch 回来由 renderFloats() 注入。
     网络往返期间先看到旧 2 个 = 用户反馈的"闪出初始页面右下角图标"。
     首帧同步隐藏；renderFloats 接管会移除它们；fetch 失败/旧 JSON 由 restoreLegacyFloats 兜底恢复。 */
  function hideLegacyFloatsImmediate() {
    var olds = document.querySelectorAll('a.whatsapp-float, a.linkedin-float');
    for (var i = 0; i < olds.length; i++) {
      if (!olds[i].getAttribute('data-hidden-by-loader')) {
        olds[i].setAttribute('data-hidden-by-loader', '1');
        olds[i].style.setProperty('display', 'none', 'important');
      }
    }
  }
  function restoreLegacyFloats() {
    var olds = document.querySelectorAll('a[data-hidden-by-loader="1"]');
    for (var i = 0; i < olds.length; i++) {
      /* styles.css 已把旧按钮默认 display:none!important（消除首帧闪现）。
         兜底时必须用内联 !important 覆盖它，单纯 removeProperty 会失效。 */
      olds[i].style.setProperty('display', 'flex', 'important');
      olds[i].removeAttribute('data-hidden-by-loader');
    }
  }

  function renderFloats(data){
    var list = data.floats;
    if (!Array.isArray(list)) { restoreLegacyFloats(); return; }  // 旧 JSON：恢复写死的两个按钮，不接管

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

  /* ---------- 浏览器标签图标（Favicon） ----------
     图标路径来自 content.json 的 site.favicon.href，后台「站点信息 → 浏览器标签图标」可改、
     可换成新上传的文件。做成运行时注入而不是只改 HTML，是为了让已经发布出去的历史文章页
     不用重新生成也能立刻显示图标。
     - site.favicon 整个缺失 → 用下面的默认图标
     - href 留空字符串     → 关闭图标（并移除页面上原有的 icon 声明）
     - version 改动         → 给图标地址加 ?v=，强制浏览器丢掉旧图标缓存 */
  var FAVICON_FALLBACK = {
    href: 'assets/img/favicon.ico',
    appleTouch: 'assets/img/apple-touch-icon.png'
  };
  var faviconKey = null;

  function iconUrl(p, ver) {
    var u = resolveMedia(p);
    if (!ver) return u;
    return u + (u.indexOf('?') > -1 ? '&' : '?') + 'v=' + encodeURIComponent(ver);
  }

  function applyFavicon(site) {
    var f = (site && site.favicon) || {};
    var href = (f.href === undefined || f.href === null) ? FAVICON_FALLBACK.href : String(f.href).trim();
    var apple = (f.appleTouch === undefined || f.appleTouch === null)
      ? FAVICON_FALLBACK.appleTouch : String(f.appleTouch).trim();
    var ver = f.version ? String(f.version).trim() : '';

    var key = href + '|' + apple + '|' + ver;
    if (key === faviconKey) return;   // 配置没变就不重复插标签
    faviconKey = key;

    // 先清掉页面里已有的图标声明（含 HTML 里写死的），避免出现两个图标互相抢
    var olds = document.querySelectorAll(
      'link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"],link[data-gmtne-favicon]'
    );
    for (var i = 0; i < olds.length; i++) {
      if (olds[i].parentNode) olds[i].parentNode.removeChild(olds[i]);
    }
    if (!href) return;   // 留空 = 关闭

    var link = document.createElement('link');
    link.setAttribute('data-gmtne-favicon', '1');
    link.rel = 'icon';
    if (/\.svg(\?|$)/i.test(href)) link.type = 'image/svg+xml';
    else if (/\.ico(\?|$)/i.test(href)) link.type = 'image/x-icon';
    link.href = iconUrl(href, ver);
    document.head.appendChild(link);

    if (apple) {
      var al = document.createElement('link');
      al.setAttribute('data-gmtne-favicon', '1');
      al.rel = 'apple-touch-icon';
      al.sizes = '180x180';
      al.href = iconUrl(apple, ver);
      document.head.appendChild(al);
    }
  }

  /* ---------- 主流程 ---------- */

  function apply(data) {
    var site = data.site || {};
    var res = data.resources || {};

    // 全站通用
    applyFavicon(site);
    renderNav(site);
    renderNavProducts(data);   // NAV_PRODUCTS_V1：顶部 Products 两级下拉
    renderBrand(site);
    renderFooterContact(site);
    renderFooterIntro(site);   // FOOTER_INTRO_V1：页脚 logo 下两段简介
    renderFooterNav(data);   // FOOTER_NAV_V1
    renderFooterProducts(data);   // FOOTER_PRODUCTS_V2
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

    // Home 页首屏 Hero：就地改文字/按钮/数据/背景（HOME_HERO_V1）
    renderHomeHero(data);

    // Home 页 SKD/CKD 区块：由 skd 段重建（没有该段时保留 HTML 静态兜底）
    renderSkd(data);
    renderOem(data);   // OEM_MODULE_V1
    renderHighBay(data);   // HB_MODULE_V1
    renderCoBrands(data);   // BRANDS_V1：About 页合作品牌区块

    // 产品列表页：由 products 段重建大类与卡片（不用改 HTML，静态卡片作兜底）
    renderProductsPage(data);

    // Home 页六张产品卡：图片跟随产品主图 + 文案可后台覆盖（HOME_CARDS_LINK）
    renderHomeTriCards(data);

    // 产品详情页：轮播首图强制跟随列表卡片图，两处永远同一张（PRODUCT_HERO_SYNC）
    syncProductHero(data);

    // 产品详情页：测试报告按后台绑定多选下载（PRODUCT_REPORTS_V1）
    renderProductReports(data);

    // 最后接管全站正文文字：此时动态区块已渲染完毕，排除规则与索引构建时一致
    renderPageTexts(data);

    // 兜底：动态插入的元素没被 main.js 的淡入观察器注册，统一补 visible 防白屏
    revealDynamicFadeIns();
  }

  /* ---------- 缓存优先：消除"文字先旧后新" ----------
     根因：每个 HTML 写死一份旧正文，异步 fetch content.json 回来才 apply 成新文字，
     点导览时先看到旧文字、几十~几百 ms 后才变新文字（用户反馈"显示之前的数据"）。
     方案：把 content.json 存进 sessionStorage（同源跨页共享、标签页隔离）。
       · 已访问过 → 缓存存在 → boot 时同步 apply，首帧即新文字，不经网络空档；
       · 后台改了数据 → fetch 结果与缓存不同 → 再 apply 一次新数据并刷新缓存；
       · 首次访问 / 缓存失效 → 走原 fetch 流程，行为不变。
     注意：同步 apply 放在 boot() 里、所有 fixXxx 之后，保证 renderPageTexts 的
     元素索引与实际 DOM 结构一致，不会因结构未就绪而跳过文字渲染。 */
  var CONTENT_CACHE_KEY = 'gmtne_content_v1';
  function readContentCache() {
    try {
      var raw = sessionStorage.getItem(CONTENT_CACHE_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d || typeof d !== 'object' || (!d.site && !d.pages && !d.products)) return null;
      return d;
    } catch (e) { return null; }
  }
  function writeContentCache(data) {
    try { sessionStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function load() {
    var cached = readContentCache();
    var cachedSig = '';
    var appliedFromCache = false;
    if (cached) {
      try {
        cachedSig = JSON.stringify(cached);
        apply(cached);              // 同步应用缓存：首帧即新文字，消除旧→新空档
        appliedFromCache = true;
      } catch (e) { appliedFromCache = false; }
    }

    // 带时间戳 + no-store：绕过 GitHub Pages 对静态文件约 10 分钟的 CDN 缓存，
    // 保证后台发布后刷新页面即可看到新内容（content.json 仅几 KB，流量可忽略）。
    fetch(CONTENT_PATH + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (resp) {
        if (!resp.ok) throw new Error('content.json HTTP ' + resp.status);
        return resp.json();
      })
      .then(function (data) {
        var sig = JSON.stringify(data);
        // 缓存已渲染且线上数据未变：跳过二次 apply，避免重复渲染影响 pages 文字索引
        if (appliedFromCache && sig === cachedSig) return;
        apply(data);
        writeContentCache(data);
      })
      .catch(function (err) {
        // fetch 失败：缓存已 apply 则数据显示正常；否则恢复 HTML 写死的旧图标兜底
        if (!appliedFromCache) restoreLegacyFloats();
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

  /* ---------- 内页首屏 page-hero：补样式 + 首帧可见（双层修法）----------
     线上 products/about 等内页的 <section class="page-hero"> 在 styles.css 里没有任何定义，
     fixed header(72px) 会压住标题；且 .fade-in 初始 opacity:0，切页瞬间只露出段落尾部
     残影（"…kits for local assembly." / "…promise."），表现为白屏/残影闪烁。
     这里运行时补上 page-hero 样式（预留 header 高度 + 合理间距），并把首屏 h1/p
     立即标记 visible，消除首帧闪烁。幂等，不碰 .hero 首页大图。 */
  function fixPageHero() {
    if (!document.getElementById('gmtne-page-hero-css')) {
      var css =
        '.page-hero{padding:calc(var(--header-height,72px) + 56px) 0 56px;}' +
        '.page-hero h1{font-size:2.5rem;font-weight:800;color:var(--primary);margin-bottom:1rem;line-height:1.15;}' +
        '.page-hero p{font-size:1.05rem;color:var(--text-muted);}' +
        '@media(max-width:700px){.page-hero{padding:calc(var(--header-height,72px) + 36px) 0 36px;}' +
        '.page-hero h1{font-size:1.9rem;}}';
      var st = document.createElement('style');
      st.id = 'gmtne-page-hero-css';
      st.textContent = css;
      document.head.appendChild(st);
    }
    // 首屏元素立即可见，不等 IntersectionObserver，消除切页白屏/残影
    var hero = document.querySelector('.page-hero');
    if (hero) {
      var els = hero.querySelectorAll('.fade-in');
      for (var i = 0; i < els.length; i++) els[i].classList.add('visible');
    }
  }

  /* ---------- 内页 footer Company 列：换成站点导览（双层修法）----------
     线上 footer 的 Company 列写死为 SKD/CKD Solutions / About Us / Contact，
     用户要求这里展示站点导览 Home / Products / Resources / About / Contact。
     按 <h5>Company</h5> 定位整列，替换其后的链接组，保留标题与列结构。幂等。 */
  function fixFooterCompany() {
    var heads = document.querySelectorAll('footer h5');
    var col = null;
    var legacyLuminaires = false;
    for (var i = 0; i < heads.length; i++) {
      var ht = (heads[i].textContent || '').trim();
      if (/^Company$/i.test(ht)) { col = heads[i].parentNode; break; }
      // contact 页写死的是 Luminaires（3 个应用链接），也一并对齐为 Company 导览
      if (/^Luminaires$/i.test(ht)) { col = heads[i].parentNode; legacyLuminaires = true; break; }
    }
    if (!col || col.getAttribute('data-nav-fixed') === '1') return;
    // Company 列：只处理仍是旧三项（含 skd-ckd 死链）的，避免覆盖用户在后台改过的内容
    // Luminaires 列：contact 页写死的应用链接，直接统一为站点导览
    if (!legacyLuminaires) {
      var oldText = (col.textContent || '');
      if (!/SKD\s*\/\s*CKD Solutions/i.test(oldText)) return;
    }
    var prefix = IS_RESOURCES ? '../' : '';
    var nav = [
      { t: 'Home', h: 'index.html' },
      { t: 'Products', h: 'products.html' },
      { t: 'Resources', h: 'resources/index.html' },
      { t: 'About', h: 'about.html' },
      { t: 'Contact', h: 'contact.html' }
    ];
    var html = '<h5>Company</h5>';
    for (var j = 0; j < nav.length; j++) {
      html += '<a href="' + prefix + nav[j].h + '">' + nav[j].t + '</a>';
    }
    col.innerHTML = html;
    col.setAttribute('data-nav-fixed', '1');
  }

  /* ---------- 首页 SKD/CKD 区块：历史页面双层修法 ----------
     线上 index.html 从未重发（旧版只有精简的 Why SKD/CKD 两栏）。
     这里在运行时把旧版骨架替换成完整区块并注入样式，
     这样用户只需同步一次 content-loader.js，无需重发 HTML 就能看到新区块。
     已带 [data-content="skd"] 容器（新版 HTML）时跳过。 */
  function fixSkdBlock() {
    if (document.querySelector('[data-content="skd"]')) return;  // 新版 HTML 已就位
    // 只在首页处理：必须有 hero + 旧精简区块标题
    var heroBtn = document.querySelector('.hero-btns a[href="skd-ckd.html"]');
    if (!heroBtn) return;

    // 1) 注入样式（只注入一次）
    if (!document.getElementById('gmtne-skd-css')) {
      var css =
        '.step-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem;}' +
        '@media(max-width:1000px){.step-grid{grid-template-columns:1fr 1fr;}}' +
        '@media(max-width:560px){.step-grid{grid-template-columns:1fr;}}' +
        '.step-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:1.6rem 1.4rem;box-shadow:var(--shadow-sm);position:relative;}' +
        '.step-card .step-no{position:absolute;top:-14px;left:16px;background:var(--accent);color:#fff;font-size:.75rem;font-weight:800;padding:.3rem .7rem;border-radius:999px;letter-spacing:1px;}' +
        '.step-card h3{font-size:1.05rem;color:var(--primary);margin:.5rem 0;}' +
        '.step-card p{font-size:.88rem;color:var(--text-muted);}' +
        '.terms-table{width:100%;border-collapse:collapse;background:#fff;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);}' +
        '.terms-table th{width:260px;background:var(--bg-alt);color:var(--primary);text-align:left;font-size:.88rem;font-weight:700;padding:.95rem 1.25rem;border-bottom:1px solid var(--border);}' +
        '.terms-table td{padding:.95rem 1.25rem;font-size:.92rem;border-bottom:1px solid var(--border);}' +
        '.terms-table tr:last-child th,.terms-table tr:last-child td{border-bottom:none;}' +
        '@media(max-width:700px){.terms-table th{width:45%;}}' +
        '.two-col{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center;}' +
        '@media(max-width:900px){.two-col{grid-template-columns:1fr;}}' +
        '.two-col img{width:100%;border-radius:var(--radius);border:1px solid var(--border);}';
      var st = document.createElement('style');
      st.id = 'gmtne-skd-css'; st.textContent = css;
      document.head.appendChild(st);
    }

    // 2) hero 按钮从死链改为页内锚点
    heroBtn.setAttribute('href', '#skd');

    // 3) 找到旧精简区块 section（含 "Why SKD / CKD?" 标题的 section-alt），替换成完整骨架
    var sections = document.querySelectorAll('section.section-alt');
    var target = null;
    for (var i = 0; i < sections.length; i++) {
      var h2 = sections[i].querySelector('h2.section-title');
      if (h2 && /Why SKD\s*\/\s*CKD/i.test(h2.textContent || '')) { target = sections[i]; break; }
    }
    if (!target) return;
    target.id = 'skd';
    target.innerHTML =
      '<div class="container" data-content="skd">' +
        '<div class="skd-block fade-in" style="margin-bottom:3rem;">' +
          '<h2 class="section-title mb-3">Why assemble locally?</h2>' +
          '<div class="step-grid">' +
            '<div class="step-card"><span class="step-no">01</span><h3>Lower Import Duty</h3><p>Component kits are classified under lower HS codes than finished luminaires — meaningful duty savings on every container.</p></div>' +
            '<div class="step-card"><span class="step-no">02</span><h3>Certification Made Simple</h3><p>Local assembly aligns with national certification schemes such as BIS and SIRIM — government tenders become reachable.</p></div>' +
            '<div class="step-card"><span class="step-no">03</span><h3>"Made Locally" Label</h3><p>Assembled in-country means you can market as a domestic manufacturer — a decisive edge in municipal tenders.</p></div>' +
            '<div class="step-card"><span class="step-no">04</span><h3>Lower Logistics Risk</h3><p>Flat-packed parts survive rough handling better than finished glass fixtures — less breakage, fewer claims.</p></div>' +
          '</div></div>' +
        '<div class="two-col skd-block fade-in" style="margin-bottom:3rem;"><div>' +
          '<h2 class="section-title mb-3">What\'s inside a kit?</h2>' +
          '<p style="color:var(--text-muted);margin-bottom:1.25rem;">Every kit contains everything needed to assemble a complete, working luminaire — down to screws and gaskets. One platform, three product families, one BOM logic.</p>' +
          '<ul style="list-style:disc;padding-left:1.25rem;color:var(--text-muted);margin-bottom:1.5rem;"><li>Die-cast aluminum housing &amp; tempered glass</li><li>LED board with high-efficiency chips</li><li>Pre-tested driver board (our self-developed platform)</li><li>Silicone gasket, screws, cable gland, bracket</li><li>Packing carton with foam protection</li></ul>' +
          '<a href="contact.html" class="btn btn-primary">Request Full BOM &amp; Quote</a></div>' +
          '<div><img src="assets/img/skd-kit-flood.webp" alt="Complete SKD kit contents laid out flat"></div></div>' +
        '<div class="skd-block fade-in" style="margin-bottom:3rem;">' +
          '<h2 class="section-title mb-3">Assembly is simpler than you think</h2>' +
          '<p class="section-subtitle mb-4">No SMT line required. If your team can do screw-driver assembly and basic wiring, they can build our luminaires.</p>' +
          '<div class="step-grid">' +
            '<div class="step-card"><span class="step-no">01</span><h3>Mount LED Board</h3><p>Fix the LED board to the housing with screws and apply thermal paste — about 2 minutes.</p></div>' +
            '<div class="step-card"><span class="step-no">02</span><h3>Connect Driver</h3><p>Plug the pre-tested driver board: two wires to the LED board, two to the input cable. Solder or connector, your choice.</p></div>' +
            '<div class="step-card"><span class="step-no">03</span><h3>Seal &amp; Close</h3><p>Lay the silicone gasket, close the glass cover, torque the perimeter screws evenly.</p></div>' +
            '<div class="step-card"><span class="step-no">04</span><h3>Burn-in Test</h3><p>Power on for 5–10 minutes, check light output and temperature — done. We provide a test checklist with every first order.</p></div>' +
          '</div><p style="text-align:center;color:var(--text-muted);margin-top:2rem;">Typical learning curve: <strong>one day of training</strong> for a new assembly line. Remote support and video guides included.</p></div>' +
        '<div class="skd-block fade-in">' +
          '<h2 class="section-title mb-3">Commercial terms</h2>' +
          '<div style="overflow-x:auto;"><table class="terms-table"><tbody>' +
            '<tr><th>MOQ</th><td>300 pcs per model (mixed container welcome)</td></tr>' +
            '<tr><th>Lead time</th><td>25 days after order confirmation</td></tr>' +
            '<tr><th>Trade terms</th><td>FOB Shanghai / CIF Nhava Sheva &amp; major SEA ports</td></tr>' +
            '<tr><th>Spare parts</th><td>1% free spare driver &amp; LED boards with every order</td></tr>' +
            '<tr><th>Training &amp; support</th><td>Assembly video guides, remote engineering support, first-order test checklist</td></tr>' +
            '<tr><th>Payment</th><td>T/T 30% deposit, 70% against B/L copy (flexible for repeat partners)</td></tr>' +
          '</tbody></table></div>' +
          '<div class="text-center" style="margin-top:2rem;"><a href="contact.html" class="btn btn-primary">Start a Project</a><a href="products.html" class="btn btn-outline" style="margin-left:.5rem;">Browse Luminaires</a></div>' +
        '</div></div>';
    // 4) 页脚/正文里残留的独立页链接统一改为页内锚点（旧版 HTML 兜底）
    var dead = document.querySelectorAll('a[href="skd-ckd.html"], a[href="../skd-ckd.html"]');
    for (var k = 0; k < dead.length; k++) dead[k].setAttribute('href', '#skd');
    // 导航里的 SKD/CKD 项直接移除（线上 content.json 尚未更新前的兜底；
    // 数据发布后 renderNav 会用不含该项的 site.nav 重建，二者一致）
    var navDead = document.querySelectorAll('nav.nav a[href="skd-ckd.html"], nav.nav a[href="../skd-ckd.html"]');
    for (var m = 0; m < navDead.length; m++) navDead[m].parentNode.removeChild(navDead[m]);

    if (window.console && console.info) console.info('[content-loader] 已运行时补齐首页 SKD/CKD 区块（旧版 HTML 双层修法）');
  }

  /* ---------- 导航死链即时清理（消除切页时 "SKD / CKD" 菜单项闪动）----------
     线上历史 HTML 的导航里写死了 <a href="skd-ckd.html">SKD / CKD</a>，
     但独立页已删除、内容已并入首页。清理动作原本只发生在两处：
       ① fixSkdBlock() 内（只在首页、且有 hero 按钮时才跑）；
       ② renderNav() 拿到 content.json 后异步重建导航。
     在 Products / Resources 等页 ① 不执行，只能等 ② —— 于是菜单项先出现、
     content.json 回来后才消失，表现为"闪一下"。
     这里在启动时同步、无条件清掉所有导航死链，首帧即是干净的 5 项菜单。幂等。 */
  function removeDeadNavLinksImmediately() {
    var dead = document.querySelectorAll(
      'nav.nav a[href="skd-ckd.html"], nav.nav a[href="../skd-ckd.html"]'
    );
    for (var i = 0; i < dead.length; i++) {
      if (dead[i].parentNode) dead[i].parentNode.removeChild(dead[i]);
    }
  }

  /* ---------- 移除正文里指向已删除 skd-ckd.html 的报错按钮 ----------
     线上 products.html 正文写死了一段引导文字 + <a href="skd-ckd.html">How SKD / CKD Works</a>，
     该独立页已删除（HTTP 404），按钮点了报错。fixSkdBlock() 只在首页跑、管不到 products 正文，
     这里按文字精确匹配把整块引导容器一起移除，避免只删按钮留一句悬空文案。幂等。 */
  function removeDeadSkdCta() {
    var links = document.querySelectorAll(
      'a[href="skd-ckd.html"], a[href="../skd-ckd.html"]'
    );
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var label = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/How SKD\s*\/\s*CKD Works/i.test(label)) continue;  // 只删这一个按钮，别碰别的死链
      var box = a.parentNode;
      // 整块是 <div class="text-center fade-in"> 里「说明文字 + 按钮」，一起移除
      if (box && box.tagName === 'DIV' && /Need another wattage/i.test(box.textContent || '')) {
        if (box.parentNode) box.parentNode.removeChild(box);
      } else if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
    }

    // footer 的「SKD / CKD Solutions」同为死链，改指首页 #skd 区块（保留入口，消除报错）。
    // 首页自身的链接由 fixSkdBlock() 统一改成页内 #skd，这里只处理非首页，且避开正文已删的按钮。
    var p = window.location.pathname.replace(/\\/g, '/');
    var isHome = !IS_RESOURCES && ((/(^|\/)index\.html$/i.test(p) || /\/$/.test(p)));
    var footerLinks = document.querySelectorAll(
      'footer a[href="skd-ckd.html"], footer a[href="../skd-ckd.html"]'
    );
    for (var j = 0; j < footerLinks.length; j++) {
      var fl = footerLinks[j];
      var flabel = (fl.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/SKD\s*\/\s*CKD Solutions/i.test(flabel)) continue;  // 只改这一个文案
      fl.setAttribute('href', isHome ? '#skd' : (ROOT_PREFIX + 'index.html#skd'));
    }
  }


  /* ---------- 旧版首页运行时补齐 OEM/ODM 骨架（双层修法）----------
     线上首页 HTML 从没重发过，没有 [data-content="oem"] 容器。
     fixSkdBlock() 先把旧 SKD 区块升级成完整骨架并设 id="skd"；
     这里紧随其后，在 #skd 与 "Markets we serve" 之间插入一个空的 OEM 容器，
     随后 apply() 里的 renderOem() 会按 content.json 的 oem 段填充它。
     只同步一次 loader 即生效，不用重发 HTML。幂等。 */
  function fixOemBlock() {
    if (document.querySelector('[data-content="oem"]')) return;  // 新版 HTML 已就位
    var skd = document.getElementById('skd');
    if (!skd) return;                       // 非首页 / SKD 骨架未就位，不处理
    // 找insert锚点：优先 #skd 的下一个 section（应为 Markets we serve）
    var anchor = skd.nextElementSibling;
    var sec = document.createElement('section');
    sec.className = 'section section-alt';
    sec.id = 'oem';
    sec.setAttribute('data-content', 'oem');
    // 静态兜底内容：content.json 未加载/关闭时用，避免空白
    sec.innerHTML = '<div class="container"><p class="section-subtitle">OEM / ODM customization available.</p></div>';
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(sec, anchor);
    else skd.parentNode.appendChild(sec);
    if (window.console && console.info) console.info('[content-loader] 已运行时补齐首页 OEM/ODM 骨架（旧版 HTML 双层修法）');
  }

  /* ---------- SEO 运行时修正（SEO_RUNTIME_V2）----------
     2026-11-22：规范域名改为裸域 gmtne.com（自定义域名已生效，www 与 github.io 均 301 到此）。
     首帧把能安全补齐的项归一到裸域，一次同步全站生效，不用逐页改 HTML。
       ① canonical / og:url / og:image / twitter:image 两套旧域名 -> gmtne.com 裸域
       ①b 已有 JSON-LD 里的旧域名一并归位
       ② 缺 og:image 时补一张（页面首图或 logo，绝对地址）
       ③ 有可见面包屑但缺 BreadcrumbList 时补 JSON-LD
       ④ 正文缺 <main> 时把 header 与 footer 之间的区块包进 main
       ⑤ 纯图标链接补 aria-label
       ⑥ description 过短 / title 堆砌兜底
     刻意不动：skd-ckd.html 死链（fixSkdBlock 已处理）、图片路径（会裂图）、
     H 层级（样式绑定，改了会乱）。
  */
  var SEO_SITE = 'https://gmtne.com';
  var SEO_OLD_HOSTS = ['https://www.gmtne.com', 'https://wendy-664.github.io/GrandeNewEnergyTest'];

  function seoStripOld(u) {
    if (!u) return '';
    for (var i = 0; i < SEO_OLD_HOSTS.length; i++) {
      if (u.indexOf(SEO_OLD_HOSTS[i]) === 0) return SEO_SITE + u.slice(SEO_OLD_HOSTS[i].length);
    }
    return u;
  }

  function seoReplaceAll(u) {
    if (!u) return u;
    for (var i = 0; i < SEO_OLD_HOSTS.length; i++) {
      while (u.indexOf(SEO_OLD_HOSTS[i]) !== -1) u = u.split(SEO_OLD_HOSTS[i]).join(SEO_SITE);
    }
    return u;
  }

  function seoAbsUrl(src, base) {
    if (!src) return '';
    if (/^https?:\/\//i.test(src)) return seoStripOld(src);
    try { return new URL(src, base || (SEO_SITE + '/')).href; }
    catch (e) { return SEO_SITE + '/' + String(src).replace(/^\.\.?\//, ''); }
  }

  function fixSeoRuntime() {
    /* ① 域名归位：canonical / og:url / og:image / twitter:image —— 两套旧域名统一到裸域 */
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon && canon.getAttribute('href')) canon.setAttribute('href', seoStripOld(canon.getAttribute('href')));
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl && ogUrl.getAttribute('content')) ogUrl.setAttribute('content', seoStripOld(ogUrl.getAttribute('content')));
    var ogImgOld = document.querySelector('meta[property="og:image"]');
    if (ogImgOld && ogImgOld.getAttribute('content')) ogImgOld.setAttribute('content', seoStripOld(ogImgOld.getAttribute('content')));
    var twImg = document.querySelector('meta[name="twitter:image"]');
    if (twImg && twImg.getAttribute('content')) twImg.setAttribute('content', seoStripOld(twImg.getAttribute('content')));
    /* ①b 已有 JSON-LD 文本里的旧域名归位（WebSite @id/url 等） */
    var lds = document.querySelectorAll('script[type="application/ld+json"]'), li, tx, nt;
    for (li = 0; li < lds.length; li++) {
      tx = lds[li].textContent || '';
      nt = seoReplaceAll(tx);
      if (nt !== tx) lds[li].textContent = nt;
    }
    var pageBase = (canon && canon.getAttribute('href')) || (SEO_SITE + '/');

    /* ② og:image 兜底 */
    var ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg || !(ogImg.getAttribute('content') || '')) {
      var img = null, imgs = document.querySelectorAll('img[src]'), i;
      for (i = 0; i < imgs.length; i++) {
        var s = imgs[i].getAttribute('src') || '';
        if (/(logo|icon|favicon|pixel)/i.test(s)) continue;
        img = imgs[i]; break;
      }
      var imgSrc = img ? img.getAttribute('src') : 'assets/img/logo.webp';
      if (!ogImg) { ogImg = document.createElement('meta'); ogImg.setAttribute('property', 'og:image'); document.head.appendChild(ogImg); }
      ogImg.setAttribute('content', seoAbsUrl(imgSrc, pageBase));
    }

    /* ③ BreadcrumbList（有可见面包屑才补，避免重复） */
    if (!document.querySelector('script[data-seo-crumb]')) {
      var crumb = document.querySelector('.breadcrumb, .crumb, [class*="breadcrumb"]');
      if (crumb) {
        var links = crumb.querySelectorAll('a[href]');
        if (links.length) {
          var list = [], j;
          for (j = 0; j < links.length; j++) {
            var nm = (links[j].textContent || '').trim();
            if (!nm) continue;
            list.push({ '@type': 'ListItem', position: list.length + 1, name: nm, item: seoAbsUrl(links[j].getAttribute('href'), pageBase) });
          }
          // 当前页 = 最后一个「非分隔符」的 span（纯文本段），不能用 lastIndexOf 找链接文字，
          // 否则「High Bay / High Bay 100W」会被截成「100W」
          var spans = crumb.querySelectorAll('span'), tail = '';
          for (var q = spans.length - 1; q >= 0; q--) {
            var tt = (spans[q].textContent || '').trim();
            if (tt && !/^[\/»›|>·]$/.test(tt)) { tail = tt; break; }
          }
          if (tail && list.length && tail !== list[list.length - 1].name) {
            list.push({ '@type': 'ListItem', position: list.length + 1, name: tail });
          }
          if (list.length >= 2) {
            var sc = document.createElement('script');
            sc.type = 'application/ld+json';
            sc.setAttribute('data-seo-crumb', '1');
            sc.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: list });
            document.head.appendChild(sc);
          }
        }
      }
    }

    /* ④ <main> 兜底：仅当没有 main，且能明确找到 header 与 footer */
    if (!document.querySelector('main')) {
      var body = document.body, kids = [], k;
      for (k = 0; k < body.children.length; k++) kids.push(body.children[k]);
      var hEnd = -1, fStart = -1;
      for (k = 0; k < kids.length; k++) {
        var el = kids[k], tag = el.tagName.toLowerCase(), cls = el.className || '';
        if (tag === 'header' || /(^|\s)(site-header|header)($|\s)/.test(cls)) hEnd = k;
        if (tag === 'footer' || /(^|\s)footer($|\s)/.test(cls)) { fStart = k; break; }
      }
      if (hEnd >= 0 && fStart > hEnd + 1) {
        var main = document.createElement('main');
        body.insertBefore(main, kids[hEnd + 1]);
        for (k = hEnd + 1; k < fStart; k++) {
          var t = kids[k].tagName.toLowerCase();
          if (t === 'script' || t === 'style') continue;
          main.appendChild(kids[k]);
        }
      }
    }

    /* ⑤ 纯图标链接补 aria-label */
    var as = document.querySelectorAll('a'), m;
    for (m = 0; m < as.length; m++) {
      var a = as[m];
      if (a.getAttribute('aria-label')) continue;
      if ((a.textContent || '').trim()) continue;
      var im2 = a.querySelector('img[alt]');
      if (!im2) continue;
      a.setAttribute('aria-label', (im2.getAttribute('alt') || 'Grande New Energy').trim() || 'Grande New Energy');
    }

    /* ⑥ description 过短 / title 堆砌兜底 */
    var desc = document.querySelector('meta[name="description"]');
    if (desc) {
      var dv = (desc.getAttribute('content') || '').trim();
      if (dv.length < 40) desc.setAttribute('content', 'Grande New Energy delivers tested LED lighting drivers, high bay and flood light solutions with SKD/CKD support for local assembly. Explore specs and lab reports.');
    }
    if (/^New product\s*\|\s*Grande New Energy$/i.test((document.title || '').trim())) {
      document.title = 'New Product Introduction | Grande New Energy';
      var ogT = document.querySelector('meta[property="og:title"]');
      if (ogT) ogT.setAttribute('content', document.title);
    }
  }

  function boot() {
    removeDeadNavLinksImmediately();  // 首帧即清掉导航死链，避免切页时 SKD/CKD 闪动
    removeDeadSkdCta();   // 首帧移除 products 正文指向 404 的「How SKD / CKD Works」报错按钮
    hideLegacyFloatsImmediate();  // 首帧隐藏写死的旧 2 个悬浮图标，消除切页闪动（新图标由 renderFloats 注入）
    applyFavicon(null);   // 先按默认图标注入，不等 content.json —— 页面一打开就有图标
    fixLegacyLogos();
    fixPageHero();        // 内页首屏补样式 + 首帧可见，消除切页白屏/段落残影闪烁
    fixArticleTables();
    fixFooterCompany();   // footer Company 列换成站点导览
    fixFooterIntro();     // 首帧给页脚两段简介打 data-c 标记，防正文枚举错位（FOOTER_INTRO_V1）
    fixSkdBlock();        // 旧版首页运行时补齐 SKD/CKD 完整区块（同步一次 loader 即生效）
    fixOemBlock();        // 旧版首页运行时补齐 OEM/ODM 骨架（同步一次 loader 即生效）
    fixSeoRuntime();      // SEO 兜底：域名归位 / OG / 面包屑结构化 / main / aria-label（首帧，不等 JSON）
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
