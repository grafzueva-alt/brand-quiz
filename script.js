(function () {
  "use strict";

  var CFG = window.QUIZ_CONFIG || {};

  var SPHERES = ["Бухгалтерия или юристы", "Клиника", "Салон", "Агентство", "Сервисный центр", "Другое"];
  var SIZES = ["До 10 человек", "10–30 человек", "Больше 30 человек"];

  // Баллы: порядок вариантов = 0, 1, 2
  var QUESTIONS = [
    { zone: "Источники клиентов", title: "Откуда приходят клиенты?",
      options: ["Рекомендуют знакомые, да здравствует сарафан", "Сарафан плюс один канал", "Из нескольких стабильных каналов, и не только по знакомству"] },
    { zone: "Продажи без владельца", title: "Кто у вас главный по продажам?",
      options: ["Я. И за директора, и за менеджера, и за того парня", "Менеджеры есть, но холодные продажи не любит никто, и они тоже", "Команда, сайт и материалы справляются без меня. Всё нормально"] },
    { zone: "Позиционирование", title: "Если конкурент спросит, чем вы лучше, что ответите одной фразой?",
      options: ["Конечно, индивидуальный подход и качество. Всё как у всех", "Каждый раз придумываю на ходу", "Есть фраза, и клиенты повторяют её за нами"] },
    { zone: "Сайт", title: "Сайт объясняет, почему выбирают именно вас?",
      options: ["У меня сайт-визитка: адрес есть, и этого достаточно", "Там всё подробно: услуги и даже цены. Отвечает ли он на вопросы клиентов, вопрос открытый", "Да, клиенты сами присылают его знакомым как подсказку"] },
    { zone: "Соцсети и визуал", title: "Как выглядят ваши соцсети и визуал?",
      options: ["Как у всех. Симпатично, мне так кажется. Делали своими силами", "Аккуратно, но без характера. С этим можно жить", "Нас узнают сразу, даже без подписи"] },
    { zone: "Коммерческие предложения и презентации", title: "Что с коммерческими предложениями и презентациями?",
      options: ["Всё объясняю на словах: предложений и материалов у меня нет", "Отправляю, а в ответ слышу: «мы подумаем»", "Материалы сами продают и отвечают на возражения"] },
    { zone: "Понимание клиента", title: "Вы знаете, за что клиенты платят вам на самом деле?",
      options: ["За качество, индивидуальный подход и сроки, конечно", "Да, есть несколько тёплых отзывов, из них видно, за что выбирают", "Регулярно опрашиваю клиентов и использую их слова в продвижении"] },
    // Вопрос про запрос: баллы считаются, но в «зону риска» он не попадает
    { zone: null, title: "Мечтаете, чтобы продавали не вы, а инструменты?",
      options: ["Да, это главная мечта", "Да, иногда хочется поспать. Хотя бы в выходные", "Нет, меня всё устраивает. Мне и так хорошо"] }
  ];

  var MAX_SCORE = QUESTIONS.length * 2;

  // Состояния зоны по баллу вопроса: 0, 1, 2
  var ZONE_STATES = [
    { cls: "weak", label: "Слабо", width: 18 },
    { cls: "mid", label: "Средне", width: 58 },
    { cls: "strong", label: "Сильно", width: 100 }
  ];

  var LEVELS = [
    { max: 4, title: "Бизнес держится на вас",
      symptoms: [
        "Цену обсуждают раньше, чем ценность.",
        "Каждому новому клиенту приходится рассказывать о вас лично.",
        "Сайт и соцсети есть, но заявки с них случайны."
      ],
      text: "Клиенты приходят на вас, а не на компанию. Упаковка пока почти не помогает продавать, поэтому каждая сделка проходит через вас лично. Это нормальный этап, но дальше расти на сарафане и личной энергии трудно." },
    { max: 7, title: "Упаковка работает частично",
      symptoms: [
        "Клиенты вас хвалят, но не могут объяснить, чем вы отличаетесь.",
        "На сайте, в соцсетях и в предложениях вы звучите по-разному.",
        "Часть продаж идёт сама, остальное по-прежнему держится на вас."
      ],
      text: "Часть инструментов уже помогает, но в других местах упаковка противоречит тому, за что вас на самом деле выбирают. Клиент слышит разные версии вас на сайте, в соцсетях и в предложениях." },
    { max: 10, title: "Основа есть, нужна огранка",
      symptoms: [
        "Клиенты понимают, чем вы хороши, но у каждого свои слова.",
        "Инструменты работают по отдельности, а не усиливают друг друга.",
        "Рост упирается не в упаковку, а в точность посыла."
      ],
      text: "У вас сильная база. Скорее всего, не хватает точной формулировки, за что вас выбирают, чтобы все инструменты говорили одним голосом." }
  ];

  var state = { sphere: "", sphereOther: "", size: "", answers: [], step: 0 };

  var $ = function (id) { return document.getElementById(id); };
  var screens = document.querySelectorAll(".screen");

  /* ---------- Метрика ---------- */
  function initMetrika() {
    if (!CFG.metrikaId) return;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(CFG.metrikaId, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }
  function goal(name) {
    try { if (CFG.metrikaId && window.ym) window.ym(CFG.metrikaId, "reachGoal", name); } catch (e) {}
  }

  /* ---------- Навигация ---------- */
  function show(name) {
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle("active", screens[i].getAttribute("data-screen") === name);
    }
    $("progress").hidden = !(name === "question");
    window.scrollTo(0, 0);
  }

  function makeOptions(container, list, onPick, selected) {
    container.innerHTML = "";
    list.forEach(function (label, idx) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "option" + (selected === idx ? " selected" : "");
      b.textContent = label;
      b.addEventListener("click", function () { onPick(idx, label, b); });
      container.appendChild(b);
    });
  }

  /* ---------- Вводные ---------- */
  var sphereIdx = null, sizeIdx = null;

  function updateIntroReady() {
    var otherNeeded = sphereIdx === SPHERES.length - 1;
    var ok = sphereIdx !== null && sizeIdx !== null && (!otherNeeded || $("sphereOther").value.trim());
    $("introNext").disabled = !ok;
  }

  function pickSphere(idx) {
    sphereIdx = idx;
    $("sphereOther").hidden = idx !== SPHERES.length - 1;
    makeOptions($("sphereOptions"), SPHERES, pickSphere, idx);
    updateIntroReady();
  }

  function pickSize(idx) {
    sizeIdx = idx;
    makeOptions($("sizeOptions"), SIZES, pickSize, idx);
    updateIntroReady();
  }

  function renderIntro() {
    makeOptions($("sphereOptions"), SPHERES, pickSphere, sphereIdx);
    makeOptions($("sizeOptions"), SIZES, pickSize, sizeIdx);
  }

  /* ---------- Вопросы ---------- */
  function renderQuestion() {
    var q = QUESTIONS[state.step];
    $("qTitle").textContent = q.title;
    $("count").textContent = (state.step + 1) + " из " + QUESTIONS.length;
    $("barFill").style.width = ((state.step) / QUESTIONS.length * 100) + "%";
    makeOptions($("qOptions"), q.options, function (idx, label, btn) {
      state.answers[state.step] = idx;
      btn.classList.add("selected");
      goal("quiz_q" + (state.step + 1));
      setTimeout(function () {
        if (state.step < QUESTIONS.length - 1) {
          state.step++;
          renderQuestion();
        } else {
          $("barFill").style.width = "100%";
          goal("quiz_finish");
          show("contact");
        }
      }, 180);
    }, state.answers[state.step]);
  }

  function goBack() {
    if (state.step > 0) {
      state.step--;
      renderQuestion();
    } else {
      show("intro");
    }
  }

  /* ---------- Подсчёт ---------- */
  function calculate() {
    var sum = 0;
    state.answers.forEach(function (a) { sum += a; });
    var score10 = Math.round(sum / MAX_SCORE * 10);
    var level = LEVELS.filter(function (l) { return score10 <= l.max; })[0];

    // Зона риска: самый низкий балл среди зон; при равенстве берём первую
    var worst = null, worstScore = 99;
    QUESTIONS.forEach(function (q, i) {
      if (q.zone && state.answers[i] < worstScore) { worst = q.zone; worstScore = state.answers[i]; }
    });
    return { sum: sum, score10: score10, level: level, zone: worst };
  }

  /* ---------- Форма ---------- */
  function validContact(v) {
    v = v.trim();
    if (/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v)) return true;
    var digits = v.replace(/\D/g, "");
    return /^[+\d][\d\s()\-]*$/.test(v) && digits.length >= 10 && digits.length <= 15;
  }

  function utm() {
    var p = new URLSearchParams(location.search), out = {};
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { if (p.get(k)) out[k] = p.get(k); });
    return out;
  }

  function buildPayload(res) {
    return {
      name: $("fName").value.trim(),
      contact: $("fContact").value.trim(),
      company: $("fCompany").value.trim(),
      sphere: sphereIdx === SPHERES.length - 1 ? ("Другое: " + $("sphereOther").value.trim()) : SPHERES[sphereIdx],
      size: SIZES[sizeIdx],
      answers: QUESTIONS.map(function (q, i) { return { q: q.title, a: q.options[state.answers[i]], score: state.answers[i] }; }),
      sum: res.sum, score10: res.score10, level: res.level.title, riskZone: res.zone,
      utm: utm(), date: new Date().toISOString()
    };
  }

  function sendLead(payload) {
    try { localStorage.setItem("quiz_last_lead", JSON.stringify(payload)); } catch (e) {}
    if (!CFG.endpoint) {
      console.log("Заявка (тестовый режим, не отправлена):", payload);
      return;
    }
    fetch(CFG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (r.ok) { try { localStorage.removeItem("quiz_pending_lead"); } catch (e) {} }
      else throw new Error("HTTP " + r.status);
    }).catch(function () {
      // Заявку не теряем: сохраняем, повторим при следующем открытии
      try { localStorage.setItem("quiz_pending_lead", JSON.stringify(payload)); } catch (e) {}
    });
  }

  function retryPending() {
    if (!CFG.endpoint) return;
    try {
      var p = localStorage.getItem("quiz_pending_lead");
      if (p) sendLead(JSON.parse(p));
    } catch (e) {}
  }

  function showResult(res) {
    $("rScore").textContent = res.score10;
    $("rTitle").textContent = res.level.title;
    $("rText").textContent = res.level.text;
    $("rRisk").textContent = "Больше всего вопросов у нас возникло к зоне: " + res.zone;

    // Карта зон: полоска по каждой из семи зон
    var map = $("zoneMap");
    map.innerHTML = "";
    var fills = [];
    QUESTIONS.forEach(function (q, i) {
      if (!q.zone) return;
      var st = ZONE_STATES[state.answers[i]];
      var li = document.createElement("li");
      li.className = "zone " + st.cls + (q.zone === res.zone ? " is-risk" : "");
      li.innerHTML = '<div class="zone-head"><span></span><span class="zone-state"></span></div>' +
        '<div class="zone-track"><span class="zone-fill"></span></div>';
      li.querySelector(".zone-head span").textContent = q.zone;
      li.querySelector(".zone-state").textContent = st.label;
      fills.push([li.querySelector(".zone-fill"), st.width]);
      map.appendChild(li);
    });

    var sym = $("rSymptoms");
    sym.innerHTML = "";
    res.level.symptoms.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      sym.appendChild(li);
    });
    $("rSpots").textContent = CFG.pilotSpotsLeft;
    $("tgBtn").href = CFG.telegramLink || "#";
    show("result");
    // Полоски заполняются после показа экрана, чтобы сработала анимация
    setTimeout(function () {
      fills.forEach(function (f) { f[0].style.width = f[1] + "%"; });
    }, 80);
  }

  function setError(id, on) { $(id).hidden = !on; }

  function onSubmit(e) {
    e.preventDefault();
    var okName = $("fName").value.trim().length > 0;
    var okContact = validContact($("fContact").value);
    var okConsent = $("fConsent").checked;
    setError("eName", !okName);
    setError("eContact", !okContact);
    setError("eConsent", !okConsent);
    if (!(okName && okContact && okConsent)) return;

    var res = calculate();
    sendLead(buildPayload(res));
    goal("lead_submit");
    showResult(res);
  }

  /* ---------- Запуск ---------- */
  function init() {
    initMetrika();
    retryPending();

    // Фото: если файла нет, остаётся заглушка с инициалами
    if (CFG.photo) {
      var holders = document.querySelectorAll(".photo");
      Array.prototype.forEach.call(holders, function (holder) {
        var img = new Image();
        img.alt = "Светлана Зуева";
        img.onload = function () { holder.innerHTML = ""; holder.appendChild(img); };
        img.src = CFG.photo;
      });
    }

    if (CFG.privacyUrl) {
      $("privacyLink").href = CFG.privacyUrl;
      $("privacyFooter").href = CFG.privacyUrl;
    }
    $("tgBtn").href = CFG.telegramLink || "#";

    renderIntro();

    $("startBtn").addEventListener("click", function () { goal("quiz_start"); show("intro"); });
    $("sphereOther").addEventListener("input", updateIntroReady);
    $("introNext").addEventListener("click", function () {
      state.step = 0; state.answers = [];
      show("question"); renderQuestion();
    });
    $("backBtn").addEventListener("click", goBack);
    $("tgBtn").addEventListener("click", function () { goal("tg_click"); });
    $("leadForm").addEventListener("submit", onSubmit);
  }

  init();
})();
