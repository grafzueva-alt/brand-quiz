(function () {
  "use strict";

  var CFG = window.QUIZ_CONFIG || {};

  var SPHERES = ["Бухгалтерия или юристы", "Клиника", "Салон", "Агентство", "Сервисный центр", "Другое"];
  var SIZES = ["До 10 человек", "10–30 человек", "Больше 30 человек"];

  // Баллы: порядок вариантов = 0, 1, 2
  var QUESTIONS = [
    { zone: "Источники клиентов", title: "Откуда приходят клиенты?",
      options: ["Почти только по рекомендациям", "По рекомендациям и немного из других каналов", "Из нескольких стабильных каналов"] },
    { zone: "Продажи без владельца", title: "Кто продаёт вашу компанию?",
      options: ["Я лично", "Я и менеджеры, но без меня сделка буксует", "Сайт, материалы и команда справляются без меня"] },
    { zone: "Позиционирование", title: "Можете ли вы одной фразой сказать, чем отличаетесь от конкурентов?",
      options: ["С трудом", "Примерно, но каждый раз по-разному", "Легко, фраза есть и работает"] },
    { zone: "Сайт", title: "Сайт объясняет, почему выбирают именно вас?",
      options: ["Это визитка или сайта нет", "Частично", "Да, клиенты сами это отмечают"] },
    { zone: "Соцсети и визуал", title: "Как выглядят ваши соцсети и визуал?",
      options: ["Как у десятков других", "Аккуратно, но без характера", "Узнаваемо и отражает суть компании"] },
    { zone: "Коммерческие предложения и презентации", title: "Как работают ваши коммерческие предложения и презентации?",
      options: ["Приходится объяснять голосом", "Работают, но не цепляют", "Сами продают и отвечают на возражения"] },
    { zone: "Понимание клиента", title: "Вы знаете, за что клиенты вас на самом деле выбирают?",
      options: ["Предполагаю, не проверял(а)", "Знаю по отдельным отзывам", "Спрашивал(а) клиентов и использую это в продвижении"] },
    // Вопрос про запрос: баллы считаются, но в «зону риска» он не попадает
    { zone: null, title: "Хотите, чтобы продавали не вы лично, а инструменты?",
      options: ["Да, это главная задача", "Отчасти", "Нет, меня всё устраивает"] }
  ];

  var MAX_SCORE = QUESTIONS.length * 2;

  var LEVELS = [
    { max: 4, title: "Бизнес держится на вас",
      text: "Клиенты приходят на вас, а не на компанию. Упаковка пока почти не помогает продавать, поэтому каждая сделка проходит через вас лично. Это нормальный этап, но дальше расти на сарафане и личной энергии трудно." },
    { max: 7, title: "Упаковка работает частично",
      text: "Часть инструментов уже помогает, но в других местах упаковка противоречит тому, за что вас на самом деле выбирают. Клиент слышит разные версии вас на сайте, в соцсетях и в предложениях." },
    { max: 10, title: "Основа есть, нужна огранка",
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
    $("rSpots").textContent = CFG.pilotSpotsLeft;
    $("tgBtn").href = CFG.telegramLink || "#";
    show("result");
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
      var img = new Image();
      img.alt = "Светлана Зуева";
      img.onload = function () { $("photo").innerHTML = ""; $("photo").appendChild(img); };
      img.src = CFG.photo;
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
