/* ===========================================================
   gmtne.com 站点配置（唯一需要改的地方）
   上线前请把下面几项替换为真实信息，全站会自动生效。
   =========================================================== */
window.SITE_CONFIG = {
  // TODO: 当前为占位号码（8612345678900），上线前必须换成真实的 WhatsApp Business 号码
  // 格式：国家码 + 号码，不带 + 和空格，例如 "8613851234567"
  whatsapp: '8612345678900',

  // TODO: Formspree 表单 endpoint（contact.html 里现在写死为 formspree.io/f/xnqevwrb）
  formEndpoint: 'https://formspree.io/f/xnqevwrb',

  // 印度本地联系信息（如有代理/办事处，填这里；留空则前台不展示该栏）
  indiaOfficeCity: '',
  indiaPhone: ''
};

document.addEventListener('DOMContentLoaded', function () {
  var cfg = window.SITE_CONFIG || {};
  if (!cfg.whatsapp) return;

  document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
    var m = a.getAttribute('href').match(/[?&]text=([^&]*)/);
    var text = m ? decodeURIComponent(m[1]) : 'Hello, I am interested in your power semiconductor solutions for India market.';
    a.setAttribute('href', 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(text));
  });
});
