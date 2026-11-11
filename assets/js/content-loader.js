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

    // 仅 Resources 首页
    renderHero(res);
    renderArticles(res);
    renderDownloads(res);
    renderFaq(res);
    renderComingNext(res);
    renderCta(res);

    // 最后接管全站正文文字：此时动态区块已渲染完毕，排除规则与索引构建时一致
    renderPageTexts(data);
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

  function boot() {
    fixLegacyLogos();
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
