(function () {
  "use strict";

  var CFG = window.QUIZ_CONFIG || {};

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
    { max: 4, title: "Всё держится на вас",
      symptoms: [
        "Цену обсуждают раньше, чем ценность.",
        "Каждому новому клиенту приходится рассказывать, кто вы, лично.",
        "Сайт и соцсети есть, но заявки с них случаются как погода: то да, то нет."
      ],
      text: "Клиенты приходят на вас, а не на компанию. Упаковка пока молчит, поэтому каждую сделку приходится закрывать лично. Для старта это нормально. Но отпуск превращается в удалённую работу, а рост упирается в ваши 24 часа в сутках." },
    { max: 7, title: "Упаковка работает вполсилы",
      symptoms: [
        "Клиенты вас хвалят, но на вопрос «чем вы отличаетесь» пожимают плечами.",
        "На сайте вы один, в соцсетях другой, в предложении третий.",
        "Часть продаж идёт сама, а остальное по-прежнему ждёт вас."
      ],
      text: "Что-то уже продаёт само, что-то делает вид. Сайт говорит одно, соцсети другое, предложение третье, и клиент слышит три разные компании. Основа при этом есть, и это хорошая новость." },
    { max: 10, title: "Основа есть, нужна огранка",
      symptoms: [
        "Клиенты понимают, чем вы хороши, но у каждого свои слова.",
        "Инструменты работают по отдельности, как хорошие музыканты без дирижёра.",
        "Рост упирается не в упаковку, а в точность посыла."
      ],
      text: "База у вас сильная, и это не комплимент для вежливости. Скорее всего, не хватает точных формулировок того, за что вас выбирают, чтобы сайт, соцсети и предложения говорили одним голосом." }
  ];

  // Ответы живут только в памяти страницы: никуда не отправляются и не сохраняются
  var state = { answers: [], step: 0 };

  var $ = function (id) { return document.getElementById(id); };
  var screens = document.querySelectorAll(".screen");

  /* ---------- Метрика (включается, только если в config.js указан номер счётчика) ---------- */
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
          showResult(calculate());
        }
      }, 180);
    }, state.answers[state.step]);
  }

  function goBack() {
    if (state.step > 0) {
      state.step--;
      renderQuestion();
    } else {
      show("start");
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

  /* ---------- Кнопка в Telegram с готовым текстом ---------- */
  function telegramUrl(res) {
    if (!CFG.telegramUser) return "#";
    var text = "Здравствуйте, Светлана! Хочу записаться на бренд-диагностику. Результат квиза: " +
      res.score10 + " из 10, главная зона риска: " + res.zone + ".";
    return "https://t.me/" + CFG.telegramUser + "?text=" + encodeURIComponent(text);
  }

  /* ---------- Результат ---------- */
  function showResult(res) {
    $("rScore").textContent = res.score10;
    $("rTitle").textContent = res.level.title;
    $("rText").textContent = res.level.text;
    $("rRisk").textContent = "Больше всего вопросов у нас возникло к зоне: " + res.zone;
    $("rSpots").textContent = CFG.pilotSpotsLeft;
    $("tgBtn").href = telegramUrl(res);

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

    show("result");
    // Полоски заполняются после показа экрана, чтобы сработала анимация
    setTimeout(function () {
      fills.forEach(function (f) { f[0].style.width = f[1] + "%"; });
    }, 80);
  }

  /* ---------- Запуск ---------- */
  // Метрика запускается только после согласия на cookies
  function cookieChoice() {
    try { return localStorage.getItem("quiz_cookies"); } catch (e) { return null; }
  }
  function saveCookieChoice(v) {
    try { localStorage.setItem("quiz_cookies", v); } catch (e) {}
  }
  function initAnalytics() {
    if (!CFG.metrikaId) return;
    var choice = cookieChoice();
    if (choice === "yes") { initMetrika(); return; }
    if (choice === "no") return;
    $("cookie").hidden = false;
    $("cookieOk").addEventListener("click", function () {
      saveCookieChoice("yes"); $("cookie").hidden = true; initMetrika();
    });
    $("cookieNo").addEventListener("click", function () {
      saveCookieChoice("no"); $("cookie").hidden = true;
    });
  }

  function init() {
    initAnalytics();

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

    if (CFG.privacyUrl) { $("privacyFooter").href = CFG.privacyUrl; }

    $("startBtn").addEventListener("click", function () {
      goal("quiz_start");
      state.step = 0; state.answers = [];
      show("question"); renderQuestion();
    });
    $("backBtn").addEventListener("click", goBack);
    $("tgBtn").addEventListener("click", function () { goal("tg_click"); });
  }

  init();
})();
