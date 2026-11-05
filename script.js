/* Shared bottle drawing used in cards (colour passed in) */
function bottleSvg(tone, w, h) {
  return '<svg aria-hidden="true" width="' + w + '" height="' + h + '" viewBox="0 0 120 200">' +
    '<rect x="44" y="8" width="32" height="26" rx="3" fill="#B38B3D"/>' +
    '<rect x="52" y="34" width="16" height="12" fill="#8C9893"/>' +
    '<rect x="14" y="46" width="92" height="142" rx="10" fill="' + tone + '"/>' +
    '<rect x="26" y="68" width="68" height="60" rx="3" fill="#FFFFFF" opacity="0.22"/></svg>';
}

/* ---------- Home page: language toggle, brand filter, cart ---------- */
(function () {
  var grid = document.getElementById('product-grid');
  if (!grid) return;

  var COPY = {
    en: {
      logo: '[YOUR SHOP NAME]',
      announce: 'Delivery across Saudi Arabia · Pay online or cash on delivery',
      search: 'Search perfumes, brands or notes',
      langBtn: 'العربية', cart: 'Cart', cartAria: 'Shopping cart', navAria: 'Categories',
      nav: ['New arrivals', 'Men', 'Women', 'Unisex', 'Oud & attar', 'Gift sets'],
      eyebrow: 'MULTI-BRAND PERFUME HOUSE', h1: 'Find your signature scent',
      heroP: 'Arabian and designer fragrances from the brands you ask for, together in one shop.',
      cta1: 'Shop all perfumes', cta2: 'Shop by brand',
      shopTitle: 'Shop by brand', shopSub: 'Choose a brand to filter the collection.',
      filterAria: 'Filter by brand', add: 'Add to cart',
      trust: [
        ['Delivery across the Kingdom', 'We pack your order at our shop and deliver it to your door.'],
        ['Pay online or on delivery', 'Mada, Apple Pay, STC Pay (depends on the gateway you enable).'],
        ['Pickup from the shop', 'Collect your order from our shop in [CITY].']
      ],
      footAbout: 'Original perfumes from leading Arabian and international houses, delivered across the Kingdom.',
      footCols: [
        ['Shop', ['New arrivals', 'Men', 'Women', 'Gift sets']],
        ['Help', ['Shipping and delivery', 'Returns and exchanges', 'WhatsApp: [NUMBER]']]
      ],
      legal: 'Mockup with sample prices and placeholder details. CR: [CR NUMBER] · VAT: [VAT NUMBER]',
      spec: 'Eau de Parfum · 100 ml', pname: '[Product name]',
      price: function (n) { return 'SAR ' + n; },
      brands: { all: 'All brands', afnan: 'Afnan', lattafa: 'Lattafa', aam: 'Ahmed Al Maghribi', armaf: 'Armaf', haramain: 'Al Haramain' },
      brandUpper: { afnan: 'AFNAN', lattafa: 'LATTAFA', aam: 'AHMED AL MAGHRIBI', armaf: 'ARMAF', haramain: 'AL HARAMAIN' }
    },
    ar: {
      logo: '[اسم المتجر]',
      announce: 'توصيل لجميع مناطق المملكة · الدفع أونلاين أو عند الاستلام',
      search: 'ابحث عن عطر أو ماركة أو نوتة',
      langBtn: 'English', cart: 'السلة', cartAria: 'سلة التسوق', navAria: 'الأقسام',
      nav: ['وصل حديثاً', 'رجالي', 'نسائي', 'للجنسين', 'عود ودهن عود', 'هدايا'],
      eyebrow: 'بيت عطور متعدد الماركات', h1: 'اكتشف عطرك المميز',
      heroP: 'عطور عربية وعالمية من الماركات التي تفضلها، مجتمعة في متجر واحد.',
      cta1: 'تسوق كل العطور', cta2: 'تسوق حسب الماركة',
      shopTitle: 'تسوق حسب الماركة', shopSub: 'اختر ماركة لعرض عطورها.',
      filterAria: 'تصفية حسب الماركة', add: 'أضف إلى السلة',
      trust: [
        ['توصيل لجميع أنحاء المملكة', 'نجهز طلبك من متجرنا ونوصله إلى باب بيتك.'],
        ['الدفع أونلاين أو عند الاستلام', 'مدى، أبل باي، STC Pay (حسب بوابة الدفع المفعلة).'],
        ['الاستلام من المتجر', 'استلم طلبك من متجرنا في [المدينة].']
      ],
      footAbout: 'عطور أصلية من أشهر البيوت العربية والعالمية، نوصلها إلى جميع أنحاء المملكة.',
      footCols: [
        ['التسوق', ['وصل حديثاً', 'رجالي', 'نسائي', 'هدايا']],
        ['المساعدة', ['الشحن والتوصيل', 'الاستبدال والاسترجاع', 'واتساب: [الرقم]']]
      ],
      legal: 'نموذج تجريبي بأسعار وبيانات تجريبية. السجل التجاري: [رقم السجل] · الضريبة: [الرقم الضريبي]',
      spec: 'أو دو بارفان · 100 مل', pname: '[اسم المنتج]',
      price: function (n) { return n + ' ر.س'; },
      brands: { all: 'كل الماركات', afnan: 'أفنان', lattafa: 'لطافة', aam: 'أحمد المغربي', armaf: 'أرماف', haramain: 'الحرمين' },
      brandUpper: { afnan: 'أفنان', lattafa: 'لطافة', aam: 'أحمد المغربي', armaf: 'أرماف', haramain: 'الحرمين' }
    }
  };

  var CATALOG = [
    { brand: 'afnan', name: '9PM', price: 139, tone: '#3E5C76' },
    { brand: 'afnan', name: 'Turathi Blue', price: 159, tone: '#2D4F6E' },
    { brand: 'lattafa', name: 'Khamrah', price: 129, tone: '#7A3B3B' },
    { brand: 'lattafa', name: 'Asad', price: 119, tone: '#5E3A2A' },
    { brand: 'aam', name: null, price: 99, tone: '#7A5C2E' },
    { brand: 'aam', name: null, price: 149, tone: '#6B4F25' },
    { brand: 'armaf', name: 'Club de Nuit Intense Man', price: 169, tone: '#2E4F4A' },
    { brand: 'haramain', name: 'Amber Oud', price: 189, tone: '#5B4A6B' }
  ];

  var state = { lang: 'en', brand: 'all', cart: 0 };

  function setText(sel, text) {
    var el = document.querySelector(sel);
    if (el) el.textContent = text;
  }

  function render() {
    var t = COPY[state.lang];
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-t]').forEach(function (el) {
      var key = el.getAttribute('data-t');
      if (typeof t[key] === 'string') el.textContent = t[key];
    });
    document.querySelectorAll('[data-t-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t[el.getAttribute('data-t-placeholder')]);
      el.setAttribute('aria-label', t[el.getAttribute('data-t-placeholder')]);
    });
    document.getElementById('cart-btn').setAttribute('aria-label', t.cartAria);
    document.getElementById('main-nav').setAttribute('aria-label', t.navAria);
    document.getElementById('chips').setAttribute('aria-label', t.filterAria);
    document.getElementById('cart-count').textContent = state.cart;

    // nav links
    document.getElementById('nav-list').innerHTML = t.nav.map(function (n) {
      return '<a href="index.html">' + n + '</a>';
    }).join('');

    // brand strip
    document.getElementById('brand-strip-list').innerHTML = ['afnan', 'lattafa', 'aam', 'armaf', 'haramain'].map(function (b) {
      return '<span>' + t.brandUpper[b] + '</span>';
    }).join('');

    // filter chips
    var chipsEl = document.getElementById('chips');
    chipsEl.innerHTML = '';
    ['all', 'afnan', 'lattafa', 'aam', 'armaf', 'haramain'].forEach(function (id) {
      var b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.textContent = t.brands[id];
      b.setAttribute('aria-pressed', state.brand === id ? 'true' : 'false');
      b.addEventListener('click', function () { state.brand = id; render(); });
      chipsEl.appendChild(b);
    });

    // products
    grid.innerHTML = '';
    CATALOG.filter(function (p) { return state.brand === 'all' || p.brand === state.brand; }).forEach(function (p) {
      var card = document.createElement('article');
      card.className = 'card';
      var name = p.name || t.pname;
      card.innerHTML =
        '<a class="card-img" href="product.html" aria-label="' + name + '">' + bottleSvg(p.tone, 110, 170) + '</a>' +
        '<div class="card-body">' +
          '<div class="card-brand">' + t.brandUpper[p.brand] + '</div>' +
          '<a class="card-name" href="product.html">' + name + '</a>' +
          '<div class="card-spec">' + t.spec + '</div>' +
          '<div class="card-price">' + t.price(p.price) + '</div>' +
          '<button class="btn-add" type="button">' + t.add + '</button>' +
        '</div>';
      card.querySelector('.btn-add').addEventListener('click', function () { state.cart += 1; render(); });
      grid.appendChild(card);
    });

    // trust boxes
    document.getElementById('trust-list').innerHTML = t.trust.map(function (x) {
      return '<div class="trust-box"><h3>' + x[0] + '</h3><p>' + x[1] + '</p></div>';
    }).join('');

    // footer columns
    document.getElementById('foot-cols').innerHTML = t.footCols.map(function (c) {
      return '<div class="footer-col"><h4>' + c[0] + '</h4><div>' +
        c[1].map(function (i) { return '<span>' + i + '</span>'; }).join('') + '</div></div>';
    }).join('');
  }

  document.getElementById('lang-btn').addEventListener('click', function () {
    state.lang = state.lang === 'en' ? 'ar' : 'en';
    render();
  });

  render();
})();

/* ---------- Product page: size, quantity, cart ---------- */
(function () {
  var sizesEl = document.getElementById('sizes');
  if (!sizesEl) return;

  var PRICES = { 30: 49, 50: 89, 100: 139 };
  var state = { size: 100, qty: 1, cart: 0 };

  function render() {
    sizesEl.innerHTML = '';
    [30, 50, 100].forEach(function (n) {
      var b = document.createElement('button');
      b.className = 'size';
      b.type = 'button';
      b.textContent = n + ' ml';
      b.setAttribute('aria-pressed', state.size === n ? 'true' : 'false');
      b.addEventListener('click', function () { state.size = n; render(); });
      sizesEl.appendChild(b);
    });
    document.getElementById('qty').textContent = state.qty;
    document.getElementById('price').textContent = 'SAR ' + PRICES[state.size] * state.qty;
    document.getElementById('cart-count').textContent = state.cart;
  }

  document.getElementById('inc').addEventListener('click', function () { state.qty += 1; render(); });
  document.getElementById('dec').addEventListener('click', function () { state.qty = Math.max(1, state.qty - 1); render(); });
  document.getElementById('add-to-cart').addEventListener('click', function () { state.cart += state.qty; render(); });

  var tones = [
    { brand: 'AFNAN', name: 'Turathi Blue', price: 'SAR 159', tone: '#2D4F6E' },
    { brand: 'LATTAFA', name: 'Khamrah', price: 'SAR 129', tone: '#7A3B3B' },
    { brand: 'LATTAFA', name: 'Asad', price: 'SAR 119', tone: '#5E3A2A' },
    { brand: 'ARMAF', name: 'Club de Nuit Intense Man', price: 'SAR 169', tone: '#2E4F4A' }
  ];
  document.getElementById('related-grid').innerHTML = tones.map(function (r) {
    return '<a class="card" href="product.html"><div class="card-img">' + bottleSvg(r.tone, 90, 140) + '</div>' +
      '<div class="card-body"><div class="card-brand">' + r.brand + '</div>' +
      '<div class="card-name">' + r.name + '</div>' +
      '<div class="card-price" style="margin:6px 0 0">' + r.price + '</div></div></a>';
  }).join('');

  render();
})();
