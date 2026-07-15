/**
 * VARNIS — reusable quiz engine (LEARN pillar)
 * ------------------------------------------------------------
 * Implements the SRS learning-quiz rules in one place so every lesson,
 * zone and the daily challenge behave identically:
 *   FR-12  award XP for each correct answer
 *   FR-13  5 lives per session; each wrong answer costs one life; 0 = game over
 *   FR-14  70% (configurable) required to pass / advance
 *
 * Usage:
 *   CyvoraQuiz.mount(containerEl, {
 *     title, questions, lives, passPct, xpPerCorrect, quizId,
 *     onComplete: function (result) { ... }   // { score, total, xp, passed, ranOut }
 *   });
 *
 * Each question: { q, options:[...], correctIndex, explanation }
 *
 * The engine renders its own UI (hearts, progress, options, explanation,
 * results) using the shared design-system classes. It never throws on bad
 * data; missing fields fall back to safe defaults.
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function hearts(lives, max) {
    var out = "";
    for (var i = 0; i < max; i++) {
      var filled = i < lives;
      out += '<span class="material-symbols-outlined text-[22px] ' +
        (filled ? "text-error" : "text-outline-variant") + '"' +
        (filled ? ' style="font-variation-settings:\'FILL\' 1"' : "") +
        ">favorite</span>";
    }
    return out;
  }

  function mount(container, opts) {
    opts = opts || {};
    if (typeof container === "string") container = document.querySelector(container);
    if (!container) return null;

    var questions = (opts.questions || []).filter(function (q) { return q && q.options && q.options.length; });
    var maxLives = opts.lives || 5;
    var passPct = opts.passPct != null ? opts.passPct : 70;
    var xpPerCorrect = opts.xpPerCorrect != null ? opts.xpPerCorrect : 20;
    var title = opts.title || "Quiz";

    var state = { idx: 0, lives: maxLives, correct: 0, answered: false, xp: 0 };

    if (!questions.length) {
      container.innerHTML = '<div class="card"><p class="text-body-md text-on-surface-variant">This quiz has no questions yet.</p></div>';
      return null;
    }

    function finish(ranOut) {
      var total = questions.length;
      var pct = Math.round((state.correct / total) * 100);
      var passed = pct >= passPct && !ranOut;
      var result = { score: state.correct, total: total, percent: pct, xp: state.xp, passed: passed, ranOut: !!ranOut };

      container.innerHTML =
        '<div class="card card-lg text-center">' +
          '<span class="material-symbols-outlined text-[56px] ' + (passed ? "text-secondary" : "text-error") + '">' +
            (passed ? "workspace_premium" : (ranOut ? "heart_broken" : "sentiment_dissatisfied")) + '</span>' +
          '<h3 class="mt-2 text-headline-lg text-primary">' + (passed ? "Passed!" : (ranOut ? "Out of lives" : "Not quite")) + '</h3>' +
          '<p class="mt-1 text-body-lg text-on-surface-variant">You scored <strong class="text-on-surface">' + state.correct + '/' + total + '</strong> (' + pct + '%).</p>' +
          '<div class="mt-4 flex justify-center gap-3">' +
            '<span class="chip chip-secure">+' + state.xp + ' XP</span>' +
            '<span class="chip ' + (passed ? "chip-secure" : "chip-pending") + '">Pass mark: ' + passPct + '%</span>' +
          '</div>' +
          (passed
            ? '<p class="mt-4 text-body-md text-secondary">Great work — you can advance to the next zone.</p>'
            : '<p class="mt-4 text-body-md text-on-surface-variant">You need ' + passPct + '% to advance. Review the lesson and try again.</p>') +
          '<div class="mt-6 flex justify-center gap-3">' +
            '<button type="button" class="btn btn-outline" data-quiz-retry>Try again</button>' +
            '<a href="learn.html" class="btn btn-primary">Back to Learn</a>' +
          '</div>' +
        '</div>';

      var retry = container.querySelector("[data-quiz-retry]");
      if (retry) retry.addEventListener("click", function () {
        state = { idx: 0, lives: maxLives, correct: 0, answered: false, xp: 0 };
        render();
      });

      // Bank XP + record result when a backend/mock is available.
      if (opts.quizId && window.CyvoraAPI && window.CyvoraAPI.learning && window.CyvoraAPI.learning.submitQuiz) {
        window.CyvoraAPI.learning.submitQuiz(opts.quizId, result).catch(function () {});
      }
      if (typeof opts.onComplete === "function") opts.onComplete(result);
    }

    function render() {
      var total = questions.length;
      var item = questions[state.idx];
      state.answered = false;

      container.innerHTML =
        '<div class="card card-lg">' +
          '<div class="mb-4 flex items-center justify-between">' +
            '<div>' +
              '<p class="text-label-md uppercase tracking-wider text-on-surface-variant">' + esc(title) + '</p>' +
              '<p class="text-label-lg text-on-surface">Question ' + (state.idx + 1) + ' of ' + total + '</p>' +
            '</div>' +
            '<div class="flex items-center gap-1" aria-label="Lives remaining" data-hearts>' + hearts(state.lives, maxLives) + '</div>' +
          '</div>' +
          '<div class="mb-5 h-2 w-full overflow-hidden rounded-full bg-surface-container">' +
            '<div class="h-full rounded-full bg-secondary transition-all" style="width:' + Math.round(((state.idx) / total) * 100) + '%"></div>' +
          '</div>' +
          '<h3 class="text-headline-md text-on-surface">' + esc(item.q) + '</h3>' +
          '<div class="mt-5 flex flex-col gap-3" data-options></div>' +
          '<div class="mt-4 hidden rounded-md bg-surface-container-low p-4 text-body-md" data-explanation></div>' +
          '<div class="mt-5 flex items-center justify-between">' +
            '<span class="text-label-md text-on-surface-variant" data-feedback></span>' +
            '<button type="button" class="btn btn-primary hidden" data-next>Continue <span class="material-symbols-outlined text-[18px]">arrow_forward</span></button>' +
          '</div>' +
        '</div>';

      var optsHost = container.querySelector("[data-options]");
      item.options.forEach(function (opt, i) {
        var label = typeof opt === "string" ? opt : (opt.text || "");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-option w-full rounded-md border border-outline-variant px-5 py-4 text-left text-body-md text-on-surface transition hover:border-primary hover:bg-primary/5";
        btn.textContent = label;
        btn.addEventListener("click", function () { choose(i, btn); });
        optsHost.appendChild(btn);
      });
    }

    function choose(i, btn) {
      if (state.answered) return;
      state.answered = true;
      var item = questions[state.idx];
      var correctIndex = item.correctIndex;
      if (correctIndex == null && item.options && item.options[0] && typeof item.options[0] === "object") {
        // support { text, correct } shape
        item.options.forEach(function (o, k) { if (o && o.correct) correctIndex = k; });
      }
      var isCorrect = i === correctIndex;

      var all = container.querySelectorAll(".quiz-option");
      all.forEach(function (b, k) {
        b.disabled = true;
        b.classList.remove("hover:border-primary", "hover:bg-primary/5");
        if (k === correctIndex) b.classList.add("border-secondary", "bg-secondary/10", "text-secondary");
        else if (k === i) b.classList.add("border-error", "bg-error/10", "text-error");
      });

      var feedback = container.querySelector("[data-feedback]");
      var explanation = container.querySelector("[data-explanation]");
      if (isCorrect) {
        state.correct++;
        state.xp += xpPerCorrect;
        if (feedback) { feedback.textContent = "Correct  ·  +" + xpPerCorrect + " XP"; feedback.className = "text-label-md text-secondary"; }
      } else {
        state.lives--;
        var hEl = container.querySelector("[data-hearts]");
        if (hEl) hEl.innerHTML = hearts(state.lives, maxLives);
        if (feedback) { feedback.textContent = state.lives > 0 ? ("Not quite  ·  " + state.lives + " lives left") : "Not quite  ·  no lives left"; feedback.className = "text-label-md text-error"; }
      }
      if (explanation && item.explanation) {
        explanation.textContent = item.explanation;
        explanation.classList.remove("hidden");
      }

      var next = container.querySelector("[data-next]");
      var last = state.idx >= questions.length - 1;
      if (next) {
        next.classList.remove("hidden");
        if (state.lives <= 0) next.innerHTML = 'See results';
        else if (last) next.innerHTML = 'See results';
        next.addEventListener("click", function () {
          if (state.lives <= 0) return finish(true);   // FR-13 game over
          if (last) return finish(false);
          state.idx++;
          render();
        });
      }
    }

    render();
    return { restart: function () { state = { idx: 0, lives: maxLives, correct: 0, answered: false, xp: 0 }; render(); } };
  }

  window.CyvoraQuiz = { mount: mount };
})();
