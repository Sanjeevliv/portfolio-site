// Clean Single-Card Random CLI Drill Engine
// Features: Spaced Repetition, Symptom Output, Multi-Step Incident Chains, and Visual Token Diff
(function () {
  "use strict";

  const STORAGE_KEY = "sre_lab_smart_v3";

  const state = {
    session: "all",
    currentQuestion: null,
    stepIndex: 0, // For multi-step incident chains
    stepHistory: [], // Completed steps in current chain: [{ cmd, output }]
    usedHelpOnCurrent: false,
    turnCounter: 0,
    solvedCount: 0,
    streak: 0,
    memory: {}, // { [id]: { box: 1(weak)|2(learning)|3(mastered), lastTurn: number } }
    cmdHistory: [],
    cmdHistoryIdx: -1,
    feedback: null, // { status, userCmd, message, showHint, revealed, diffHtml }
  };

  function loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        state.solvedCount = Number(parsed.solvedCount) || 0;
        state.streak = Number(parsed.streak) || 0;
        state.turnCounter = Number(parsed.turnCounter) || 0;
        state.memory = parsed.memory || {};
      }
    } catch (_) {}
  }

  function saveStats() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          solvedCount: state.solvedCount,
          streak: state.streak,
          turnCounter: state.turnCounter,
          memory: state.memory,
        })
      );
    } catch (_) {}
  }

  const BUNDLE_FLAG_TOOLS = new Set([
    "ls",
    "ss",
    "grep",
    "du",
    "df",
    "free",
    "nc",
    "ps",
    "tcpdump",
    "journalctl",
    "dmesg",
    "tar",
  ]);

  function tokenizeCommand(cmd) {
    const tokens = [];
    let current = "";
    let quote = null;
    for (let i = 0; i < cmd.length; i++) {
      const ch = cmd[i];
      if (quote) {
        if (ch === quote && cmd[i - 1] !== "\\") {
          quote = null;
        } else {
          current += ch;
        }
      } else if (ch === "'" || ch === '"') {
        quote = ch;
      } else if (/\s/.test(ch)) {
        if (current.length > 0) {
          tokens.push(current);
          current = "";
        }
      } else {
        current += ch;
      }
    }
    if (current.length > 0) tokens.push(current);
    return tokens;
  }

  function canonicalizeSingleCommand(cmdStr) {
    const tokens = tokenizeCommand(cmdStr);
    if (tokens.length === 0) return "";

    const baseTool = tokens[0];
    if (!BUNDLE_FLAG_TOOLS.has(baseTool)) {
      return tokens.join(" ");
    }

    const VALUED_SHORT_FLAGS = {
      tcpdump: new Set(["-i", "-c", "-s", "-w", "-r"]),
      journalctl: new Set(["-u", "-n", "-S", "-U", "-p", "-b"]),
      grep: new Set(["-e", "-f", "-m", "-A", "-B", "-C"]),
      du: new Set(["-d"]),
      nc: new Set(["-w", "-p", "-s"]),
      tar: new Set(["-f", "-C"]),
    };

    const valuedSet = VALUED_SHORT_FLAGS[baseTool] || new Set();
    const shortFlags = new Set();
    const otherTokens = [baseTool];

    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (
        tok.startsWith("-") &&
        !tok.startsWith("--") &&
        tok.length > 1 &&
        !/^-\d+$/.test(tok) &&
        !valuedSet.has(tok) &&
        /^-[a-zA-Z]+$/.test(tok)
      ) {
        if (baseTool === "tcpdump" && (tok === "-nn" || tok === "-n")) {
          shortFlags.add("n");
        } else {
          for (const ch of tok.slice(1)) {
            shortFlags.add(ch);
          }
        }
        continue;
      }
      otherTokens.push(tok);
    }

    if (shortFlags.size > 0) {
      const sortedBundle = "-" + Array.from(shortFlags).sort().join("");
      return [baseTool, sortedBundle, ...otherTokens.slice(1)].join(" ");
    }
    return otherTokens.join(" ");
  }

  function canonicalizeCommand(raw) {
    if (!raw) return "";
    const cleaned = raw
      .trim()
      .replace(/^[$#]\s*/, "")
      .replace(/^sudo\s+/, "")
      .replace(/\s+/g, " ");

    if (cleaned.includes("|")) {
      return cleaned
        .split("|")
        .map((part) => canonicalizeSingleCommand(part.trim()))
        .join(" | ");
    }
    return canonicalizeSingleCommand(cleaned);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatInlineCode(text) {
    return escapeHtml(text).replace(
      /`([^`]+)`/g,
      '<code class="lab-inline-code">$1</code>'
    );
  }

  // Build a clean visual token diff comparing user tokens against canonical tokens
  function buildTokenDiffHtml(rawUserCmd, canonicalCmd) {
    const cleanedUser = rawUserCmd
      .trim()
      .replace(/^[$#]\s*/, "")
      .replace(/^sudo\s+/, "");
    const userTokens = tokenizeCommand(cleanedUser);
    const canonTokens = tokenizeCommand(canonicalCmd);
    const canonSet = new Set(canonTokens);
    const userSet = new Set(userTokens);

    const userParts = userTokens.map((tok) => {
      if (canonSet.has(tok)) {
        return `<span class="lab-diff-tok lab-diff-tok--ok">${escapeHtml(
          tok
        )}</span>`;
      }
      return `<span class="lab-diff-tok lab-diff-tok--err">${escapeHtml(
        tok
      )}</span>`;
    });

    const missingParts = canonTokens
      .filter((tok) => !userSet.has(tok))
      .map(
        (tok) =>
          `<span class="lab-diff-tok lab-diff-tok--miss">+${escapeHtml(
            tok
          )}</span>`
      );

    return `
      <div class="lab-diff-bar mt-2">
        <span class="text-secondary small me-2">Diff:</span>
        ${userParts.join(" ")}
        ${missingParts.length ? `<span class="ms-2">${missingParts.join(" ")}</span>` : ""}
      </div>
    `;
  }

  function getActiveTarget(question) {
    if (question.steps && question.steps.length > 0) {
      return question.steps[state.stepIndex] || question.steps[0];
    }
    return question;
  }

  function evaluateAnswer(question, rawUserCmd) {
    const target = getActiveTarget(question);
    const trimmed = (rawUserCmd || "").trim();
    if (!trimmed) {
      return {
        status: "empty",
        userCmd: "",
        message: "Type a command above and press Enter.",
      };
    }

    const userCanon = canonicalizeCommand(trimmed);
    const candidates = [target.canonical, ...(target.accepted || [])];

    for (const candidate of candidates) {
      if (
        trimmed.toLowerCase() === candidate.toLowerCase() ||
        userCanon === canonicalizeCommand(candidate)
      ) {
        return {
          status: "correct",
          userCmd: trimmed,
          message: "Correct!",
        };
      }
    }

    return {
      status: "incorrect",
      userCmd: trimmed,
      diffHtml: buildTokenDiffHtml(trimmed, target.canonical),
      message: "Not quite — compare your command with the solution below.",
    };
  }

  function getPool() {
    const all = window.SRE_LAB_QUESTIONS || [];
    if (state.session === "all") return all;
    return all.filter((q) => q.session === state.session);
  }

  // Spaced Repetition Picker:
  // Prioritizes due Weak Spots (box === 1), then Unseen (no box), then Learning (box === 2), then Mastered (box === 3)
  function pickNextRandomQuestion() {
    const pool = getPool();
    if (pool.length === 0) {
      state.currentQuestion = null;
      return;
    }

    state.turnCounter += 1;
    const prevId = state.currentQuestion ? state.currentQuestion.id : null;
    const candidates = pool.length > 1 ? pool.filter((q) => q.id !== prevId) : pool;

    const dueWeak = [];
    const unseen = [];
    const learning = [];
    const mastered = [];

    for (const q of candidates) {
      const mem = state.memory[q.id];
      if (!mem) {
        unseen.push(q);
      } else if (mem.box === 1 && state.turnCounter - mem.lastTurn >= 3) {
        dueWeak.push(q);
      } else if (mem.box <= 2) {
        learning.push(q);
      } else {
        mastered.push(q);
      }
    }

    let bucket = candidates;
    const roll = Math.random();
    if (dueWeak.length > 0 && roll < 0.65) {
      bucket = dueWeak;
    } else if (unseen.length > 0 && roll < 0.85) {
      bucket = unseen;
    } else if (learning.length > 0) {
      bucket = learning;
    } else if (unseen.length > 0) {
      bucket = unseen;
    } else if (mastered.length > 0) {
      bucket = mastered;
    }

    const chosen = bucket[Math.floor(Math.random() * bucket.length)];
    state.currentQuestion = chosen;
    state.stepIndex = 0;
    state.stepHistory = [];
    state.usedHelpOnCurrent = false;
    state.feedback = null;
  }

  function updateSpacedMemory(questionId, wasCleanSuccess) {
    const prev = state.memory[questionId] || { box: 0, lastTurn: 0 };
    let nextBox = prev.box;
    if (wasCleanSuccess && !state.usedHelpOnCurrent) {
      nextBox = prev.box === 0 ? 2 : Math.min(3, prev.box + 1);
    } else {
      nextBox = 1; // Tag as Weak Spot so it comes back after 3+ questions
      state.usedHelpOnCurrent = true;
    }
    state.memory[questionId] = {
      box: nextBox,
      lastTurn: state.turnCounter,
    };
  }

  function getSessionTitle(sessionId) {
    const sessions = window.SRE_LAB_SESSIONS || [];
    const found = sessions.find((s) => s.id === sessionId);
    return found ? found.title.replace(/^\d+\.\s*/, "") : sessionId;
  }

  function renderHeaderStats() {
    const solvedEl = document.getElementById("lab-stat-solved");
    const streakEl = document.getElementById("lab-stat-streak");
    if (solvedEl) solvedEl.textContent = String(state.solvedCount);
    if (streakEl) streakEl.textContent = `${state.streak} 🔥`;
  }

  function renderFeedback(q, fb) {
    if (!fb) return "";

    const target = getActiveTarget(q);
    const isEvaluated = fb.status === "correct" || fb.status === "incorrect";
    const showSolution = isEvaluated || fb.revealed;
    const isMultiStep = Boolean(q.steps && q.steps.length > 0);
    const isLastStep = !isMultiStep || state.stepIndex >= q.steps.length - 1;

    let banner = "";
    if (fb.status === "correct") {
      const btnLabel = isLastStep ? "Next Question" : "Next Step";
      banner = `
        <div class="lab-feedback-banner lab-feedback-banner--correct d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <i class="fas fa-circle-check me-2"></i>
            <strong>${escapeHtml(fb.message)}</strong>
          </div>
          <button type="button" class="btn btn-sm btn-success fw-semibold" id="lab-next-inline-btn">
            ${btnLabel} <kbd class="ms-1">↵</kbd>
          </button>
        </div>
      `;
    } else if (fb.status === "incorrect") {
      banner = `
        <div class="lab-feedback-banner lab-feedback-banner--incorrect">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <i class="fas fa-circle-xmark me-2"></i>
              <strong>Incorrect.</strong> ${formatInlineCode(fb.message)}
            </div>
            <button type="button" class="btn btn-sm btn-primary fw-semibold" id="lab-next-inline-btn">
              Skip / Next <kbd class="ms-1">↵</kbd>
            </button>
          </div>
          ${fb.diffHtml || ""}
        </div>
      `;
    } else if (fb.status === "empty") {
      banner = `
        <div class="lab-feedback-banner lab-feedback-banner--partial">
          <i class="fas fa-terminal me-2"></i>${escapeHtml(fb.message)}
        </div>
      `;
    }

    const hintHtml = fb.showHint
      ? `
        <div class="lab-hint-box mt-2">
          <i class="fas fa-lightbulb me-2 text-warning"></i>
          <strong>Hint:</strong> ${formatInlineCode(target.hint)}
        </div>
      `
      : "";

    if (!showSolution) {
      return banner + hintHtml;
    }

    const grammarRows = (q.grammar || [])
      .map(
        (g) => `
        <div class="lab-grammar-item">
          <code class="lab-grammar-token">${escapeHtml(g.token)}</code>
          <span class="lab-grammar-desc">${escapeHtml(g.desc)}</span>
        </div>
      `
      )
      .join("");

    const altList = (target.accepted || [])
      .filter((a) => a !== target.canonical)
      .slice(0, 3)
      .map((a) => `<code class="lab-alt-cmd">${escapeHtml(a)}</code>`)
      .join(" ");

    const outputPreview = target.output || q.sampleOutput || "";

    return `
      ${banner}
      ${hintHtml}
      <div class="lab-solution-panel mt-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span class="lab-solution-label"><i class="fas fa-check me-1"></i>Solution</span>
            <code class="lab-canonical-code">${escapeHtml(
              target.canonical
            )}</code>
          </div>
          ${
            altList
              ? `<div class="small"><span class="text-secondary me-1">Aliases:</span>${altList}</div>`
              : ""
          }
        </div>

        ${
          outputPreview
            ? `<pre class="lab-sample-output mt-2 mb-2"><code>${escapeHtml(
                outputPreview
              )}</code></pre>`
            : ""
        }

        <div class="lab-grammar-list mt-2">${grammarRows}</div>

        <div class="lab-insight-box mt-2">
          <strong>Key takeaway:</strong> ${formatInlineCode(q.explanation)}
        </div>
      </div>
    `;
  }

  function renderCard() {
    const mount = document.getElementById("lab-question-mount");
    if (!mount) return;

    const q = state.currentQuestion;
    if (!q) {
      mount.innerHTML = `<div class="lab-question-card text-center p-4">No questions found.</div>`;
      return;
    }

    const target = getActiveTarget(q);
    const isMultiStep = Boolean(q.steps && q.steps.length > 0);
    const mem = state.memory[q.id];
    const isWeakSpot = mem && mem.box === 1;

    const diffClass =
      q.difficulty === "Core"
        ? "lab-badge-core"
        : q.difficulty === "Intermediate"
        ? "lab-badge-inter"
        : "lab-badge-war";

    const symptomHtml =
      !isMultiStep && q.symptomOutput
        ? `
        <div class="lab-symptom-box mb-3">
          <div class="lab-symptom-label">Observed Terminal Symptom</div>
          <pre class="lab-sample-output mb-0"><code>${escapeHtml(
            q.symptomOutput
          )}</code></pre>
        </div>
      `
        : "";

    const stepHistoryHtml =
      isMultiStep && state.stepHistory.length > 0
        ? `
        <div class="lab-step-history">
          ${state.stepHistory
            .map(
              (item) => `
            <div class="lab-step-history-entry">
              <div class="lab-step-cmd"><span class="lab-prompt-prefix">sanjeev@sre-lab:~$</span> ${escapeHtml(
                item.cmd
              )}</div>
              <pre class="lab-step-out mb-0"><code>${escapeHtml(
                item.output
              )}</code></pre>
            </div>
          `
            )
            .join("")}
        </div>
      `
        : "";

    mount.innerHTML = `
      <div class="lab-question-card">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div class="d-flex align-items-center flex-wrap gap-2">
            <span class="lab-badge ${diffClass}">${escapeHtml(
              q.difficulty
            )}</span>
            <span class="lab-badge lab-badge-tool"><i class="fas fa-terminal me-1"></i>${escapeHtml(
              q.tool
            )}</span>
            <span class="lab-badge lab-badge-session">${escapeHtml(
              getSessionTitle(q.session)
            )}</span>
            ${
              isMultiStep
                ? `<span class="lab-badge lab-badge-war">Step ${
                    state.stepIndex + 1
                  } / ${q.steps.length}</span>`
                : ""
            }
            ${
              isWeakSpot
                ? `<span class="lab-badge lab-badge-weak" title="Re-queued for spaced repetition practice">Weak Spot 🔁</span>`
                : ""
            }
          </div>
          <button type="button" class="btn btn-sm lab-btn-ghost" id="lab-skip-btn" title="Skip to another random question">
            Next Random →
          </button>
        </div>

        <h2 class="lab-q-title mb-2">${escapeHtml(q.title)}</h2>
        ${symptomHtml}
        <p class="lab-q-prompt mb-3">${formatInlineCode(target.prompt)}</p>

        <form id="lab-command-form" autocomplete="off" spellcheck="false">
          <div class="lab-terminal-box">
            <div class="lab-terminal-bar">
              <span class="lab-dot lab-dot--red"></span>
              <span class="lab-dot lab-dot--yellow"></span>
              <span class="lab-dot lab-dot--green"></span>
              <span class="lab-terminal-title">sanjeev@sre-lab: ~</span>
            </div>
            ${stepHistoryHtml}
            <div class="lab-terminal-input-row">
              <label for="lab-cmd-input" class="lab-prompt-prefix">sanjeev@sre-lab:~$</label>
              <input
                id="lab-cmd-input"
                type="text"
                class="lab-terminal-input"
                placeholder="Type command and press Enter..."
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
              />
              <button type="submit" class="btn btn-sm lab-btn-enter" id="lab-submit-btn">
                Check <kbd class="ms-1">↵</kbd>
              </button>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-sm lab-btn-ghost" id="lab-hint-btn">
                <i class="far fa-lightbulb me-1"></i>Hint
              </button>
              <button type="button" class="btn btn-sm lab-btn-ghost" id="lab-reveal-btn">
                <i class="fas fa-eye me-1"></i>Solution
              </button>
            </div>
            <span class="small text-secondary" id="lab-enter-tip">Press <kbd>Enter</kbd> to verify</span>
          </div>
        </form>

        <div id="lab-feedback-slot"></div>
      </div>
    `;

    const form = document.getElementById("lab-command-form");
    const input = document.getElementById("lab-cmd-input");
    const skipBtn = document.getElementById("lab-skip-btn");
    const hintBtn = document.getElementById("lab-hint-btn");
    const revealBtn = document.getElementById("lab-reveal-btn");

    if (input) {
      input.focus();
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp" && state.cmdHistory.length > 0) {
          e.preventDefault();
          if (state.cmdHistoryIdx < state.cmdHistory.length - 1) {
            state.cmdHistoryIdx += 1;
          }
          input.value =
            state.cmdHistory[
              state.cmdHistory.length - 1 - state.cmdHistoryIdx
            ] || "";
        } else if (e.key === "ArrowDown" && state.cmdHistory.length > 0) {
          e.preventDefault();
          if (state.cmdHistoryIdx > 0) {
            state.cmdHistoryIdx -= 1;
            input.value =
              state.cmdHistory[
                state.cmdHistory.length - 1 - state.cmdHistoryIdx
              ] || "";
          } else {
            state.cmdHistoryIdx = -1;
            input.value = "";
          }
        }
      });
    }

    if (form && input) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const prev = state.feedback;

        // If already evaluated and user presses Enter again without editing, advance!
        if (
          prev &&
          (prev.status === "correct" || prev.status === "incorrect") &&
          input.value.trim() === prev.userCmd
        ) {
          advanceStepOrQuestion();
          return;
        }

        const rawVal = input.value.trim();
        if (rawVal) {
          state.cmdHistory.push(rawVal);
          state.cmdHistoryIdx = -1;
        }

        const result = evaluateAnswer(q, rawVal);
        if (result.status === "correct") {
          const isFinalStep =
            !q.steps || state.stepIndex >= q.steps.length - 1;
          if (isFinalStep) {
            state.solvedCount += 1;
            state.streak += 1;
            updateSpacedMemory(q.id, true);
          }
          saveStats();
          renderHeaderStats();
        } else if (result.status === "incorrect") {
          state.streak = 0;
          updateSpacedMemory(q.id, false);
          saveStats();
          renderHeaderStats();
        }

        state.feedback = {
          ...result,
          showHint: prev ? prev.showHint : false,
          revealed: result.status !== "empty",
        };

        updateFeedbackSlot();
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", () => {
        pickNextRandomQuestion();
        renderCard();
      });
    }

    if (hintBtn) {
      hintBtn.addEventListener("click", () => {
        state.usedHelpOnCurrent = true;
        const prev = state.feedback || {};
        state.feedback = {
          ...prev,
          showHint: !prev.showHint,
        };
        hintBtn.innerHTML = `<i class="far fa-lightbulb me-1"></i>${
          state.feedback.showHint ? "Hide Hint" : "Hint"
        }`;
        updateFeedbackSlot();
        if (input) input.focus();
      });
    }

    if (revealBtn) {
      revealBtn.addEventListener("click", () => {
        state.usedHelpOnCurrent = true;
        updateSpacedMemory(q.id, false);
        saveStats();
        const prev = state.feedback || {};
        state.feedback = {
          ...prev,
          revealed: !prev.revealed,
        };
        revealBtn.innerHTML = `<i class="fas fa-eye me-1"></i>${
          state.feedback.revealed ? "Hide Solution" : "Solution"
        }`;
        updateFeedbackSlot();
        if (input) input.focus();
      });
    }
  }

  function advanceStepOrQuestion() {
    const q = state.currentQuestion;
    if (
      q &&
      q.steps &&
      state.feedback &&
      state.feedback.status === "correct" &&
      state.stepIndex < q.steps.length - 1
    ) {
      const completedStep = q.steps[state.stepIndex];
      state.stepHistory.push({
        cmd: state.feedback.userCmd || completedStep.canonical,
        output: completedStep.output || "",
      });
      state.stepIndex += 1;
      state.feedback = null;
      renderCard();
      return;
    }

    pickNextRandomQuestion();
    renderCard();
  }

  function updateFeedbackSlot() {
    const slot = document.getElementById("lab-feedback-slot");
    const submitBtn = document.getElementById("lab-submit-btn");
    const tipEl = document.getElementById("lab-enter-tip");
    if (!slot || !state.currentQuestion) return;

    slot.innerHTML = renderFeedback(state.currentQuestion, state.feedback);

    const isEvaluated =
      state.feedback &&
      (state.feedback.status === "correct" ||
        state.feedback.status === "incorrect");

    if (submitBtn && isEvaluated) {
      submitBtn.innerHTML = `Next <kbd class="ms-1">↵</kbd>`;
    }
    if (tipEl && isEvaluated) {
      tipEl.innerHTML = `Press <kbd>Enter</kbd> to continue (or edit command to retry)`;
    }

    const nextInlineBtn = document.getElementById("lab-next-inline-btn");
    if (nextInlineBtn) {
      nextInlineBtn.addEventListener("click", () => {
        advanceStepOrQuestion();
      });
    }
  }

  function initTopicDropdown() {
    const select = document.getElementById("lab-topic-select");
    if (!select) return;

    const sessions = window.SRE_LAB_SESSIONS || [];
    select.innerHTML = sessions
      .map(
        (s) =>
          `<option value="${escapeHtml(s.id)}">${escapeHtml(s.title)}</option>`
      )
      .join("");

    select.addEventListener("change", () => {
      state.session = select.value || "all";
      pickNextRandomQuestion();
      renderCard();
    });
  }

  function init() {
    if (!document.getElementById("sre-cli-lab-root")) return;
    loadStats();
    initTopicDropdown();
    renderHeaderStats();
    pickNextRandomQuestion();
    renderCard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
