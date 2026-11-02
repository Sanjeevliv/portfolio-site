// Incremental Learn -> Test CLI Mastery Engine
// Stage 0 (Learn): Teaches the command & grammar first; user types it once to practice.
// Stage 1 (Test): Re-queues 2-4 turns later with NO tool spoiler and NO study card; user recalls from memory.
// Stage 2 (Mastered): Passed cold in Test mode; unlocks higher Incremental Levels (L1 -> L2 -> L3 -> L4).
(function () {
  "use strict";

  const STORAGE_KEY = "sre_lab_incremental_v4";

  const state = {
    session: "all",
    levelFilter: "auto", // "auto" | "1" | "2" | "3" | "4"
    modeFilter: "adaptive", // "adaptive" (Learn -> Test) | "test" | "learn"
    currentQuestion: null,
    currentPhase: "learn", // "learn" | "test"
    stepIndex: 0,
    stepHistory: [],
    revealedSolutionOnCurrent: false,
    turnCounter: 0,
    streak: 0,
    // memory[id] = { stage: 0(learn) | 1(ready_for_test) | 2(mastered), lastTurn: number, failedTest: boolean }
    memory: {},
    cmdHistory: [],
    cmdHistoryIdx: -1,
    feedback: null,
  };

  function loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
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
        ${
          missingParts.length
            ? `<span class="ms-2">${missingParts.join(" ")}</span>`
            : ""
        }
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
          message:
            state.currentPhase === "learn"
              ? "Practiced! We'll test your recall on this command shortly."
              : "Mastered! You recalled this command without spoilers.",
        };
      }
    }

    return {
      status: "incorrect",
      userCmd: trimmed,
      diffHtml: buildTokenDiffHtml(trimmed, target.canonical),
      message: "Compare your command tokens against the solution below.",
    };
  }

  function getTopicPool() {
    const all = window.SRE_LAB_QUESTIONS || [];
    if (state.session === "all") return all;
    return all.filter((q) => q.session === state.session);
  }

  // Compute the current unlocked incremental level (1..4) based on progress in the active topic pool
  function getUnlockedLevel(topicPool) {
    for (let lvl = 1; lvl <= 3; lvl++) {
      const inLevel = topicPool.filter((q) => (q.level || 1) === lvl);
      if (inLevel.length === 0) continue;
      // Unlock the next level once at least 50% (or at least 4) of the current level have been practiced/mastered
      const progressed = inLevel.filter(
        (q) => state.memory[q.id] && state.memory[q.id].stage >= 1
      ).length;
      const threshold = Math.min(4, Math.ceil(inLevel.length * 0.5));
      if (progressed < threshold) {
        return lvl;
      }
    }
    return 4;
  }

  function pickNextQuestion() {
    const topicPool = getTopicPool();
    if (topicPool.length === 0) {
      state.currentQuestion = null;
      return;
    }

    state.turnCounter += 1;
    const unlockedLevel = getUnlockedLevel(topicPool);

    let levelPool = topicPool;
    if (state.levelFilter !== "auto") {
      const targetLvl = Number(state.levelFilter);
      const exact = topicPool.filter((q) => (q.level || 1) === targetLvl);
      if (exact.length > 0) levelPool = exact;
    } else {
      const allowed = topicPool.filter(
        (q) => (q.level || 1) <= unlockedLevel
      );
      if (allowed.length > 0) levelPool = allowed;
    }

    const prevId = state.currentQuestion ? state.currentQuestion.id : null;
    const candidates =
      levelPool.length > 1
        ? levelPool.filter((q) => q.id !== prevId)
        : levelPool;

    // Bucket candidates by Learn -> Test lifecycle:
    // 1. dueForTest: stage === 1 (learned, waiting to be tested cold after >= 2 turns)
    // 2. failedRetry: stage === 0 && failedTest (missed in Test mode, needs Learn reinforcement)
    // 3. unseenLearn: no memory entry yet (needs initial Learn phase)
    // 4. mastered: stage === 2
    const dueForTest = [];
    const failedRetry = [];
    const unseenLearn = [];
    const waitingCooldown = [];
    const mastered = [];

    for (const q of candidates) {
      const mem = state.memory[q.id];
      if (!mem) {
        unseenLearn.push(q);
      } else if (mem.stage === 0) {
        failedRetry.push(q);
      } else if (mem.stage === 1) {
        if (state.turnCounter - mem.lastTurn >= 2) {
          dueForTest.push(q);
        } else {
          waitingCooldown.push(q);
        }
      } else {
        mastered.push(q);
      }
    }

    let chosen = null;
    let phase = "learn";

    if (state.modeFilter === "test") {
      const nonMastered = [...dueForTest, ...failedRetry, ...unseenLearn, ...waitingCooldown];
      const pool = nonMastered.length > 0 ? nonMastered : candidates;
      chosen = pool[Math.floor(Math.random() * pool.length)];
      phase = "test";
    } else if (state.modeFilter === "learn") {
      const unlearned = [...failedRetry, ...unseenLearn];
      const pool = unlearned.length > 0 ? unlearned : candidates;
      chosen = pool[Math.floor(Math.random() * pool.length)];
      phase = "learn";
    } else {
      // Adaptive Learn -> Test mode:
      // Alternate naturally between testing recently learned commands and introducing new ones!
      if (dueForTest.length > 0 && (Math.random() < 0.65 || (unseenLearn.length === 0 && failedRetry.length === 0))) {
        chosen = dueForTest[Math.floor(Math.random() * dueForTest.length)];
        phase = "test";
      } else if (failedRetry.length > 0 && Math.random() < 0.7) {
        chosen = failedRetry[Math.floor(Math.random() * failedRetry.length)];
        phase = "learn";
      } else if (unseenLearn.length > 0) {
        // Pick from the lowest uncompleted incremental level first so learning is genuinely incremental!
        unseenLearn.sort((a, b) => (a.level || 1) - (b.level || 1));
        const minLevel = unseenLearn[0].level || 1;
        const lowestTier = unseenLearn.filter((q) => (q.level || 1) === minLevel);
        chosen = lowestTier[Math.floor(Math.random() * lowestTier.length)];
        phase = "learn";
      } else if (waitingCooldown.length > 0) {
        chosen = waitingCooldown[Math.floor(Math.random() * waitingCooldown.length)];
        phase = "test";
      } else {
        chosen = candidates[Math.floor(Math.random() * candidates.length)];
        phase = "test";
      }
    }

    state.currentQuestion = chosen;
    state.currentPhase = phase;
    state.stepIndex = 0;
    state.stepHistory = [];
    state.revealedSolutionOnCurrent = false;
    state.feedback = null;
  }

  function recordOutcome(questionId, isSuccess) {
    const prev = state.memory[questionId] || {
      stage: 0,
      lastTurn: 0,
      failedTest: false,
    };

    if (state.currentPhase === "learn") {
      if (isSuccess) {
        // Graduated from Learn (0) -> Ready for Test (1)
        state.memory[questionId] = {
          stage: Math.max(1, prev.stage),
          lastTurn: state.turnCounter,
          failedTest: false,
        };
      }
      return;
    }

    // In Test mode:
    if (isSuccess && !state.revealedSolutionOnCurrent) {
      state.memory[questionId] = {
        stage: 2, // Mastered!
        lastTurn: state.turnCounter,
        failedTest: false,
      };
    } else {
      // Missed in Test mode -> drop back to Stage 0 (Learn) so it gets re-taught and re-tested!
      state.memory[questionId] = {
        stage: 0,
        lastTurn: state.turnCounter,
        failedTest: true,
      };
    }
  }

  function getSessionTitle(sessionId) {
    const sessions = window.SRE_LAB_SESSIONS || [];
    const found = sessions.find((s) => s.id === sessionId);
    return found ? found.title.replace(/^\d+\.\s*/, "") : sessionId;
  }

  function renderHeaderStats() {
    const topicPool = getTopicPool();
    const masteredCount = topicPool.filter(
      (q) => state.memory[q.id] && state.memory[q.id].stage === 2
    ).length;
    const unlockedLvl = getUnlockedLevel(topicPool);

    const levelEl = document.getElementById("lab-stat-level");
    const solvedEl = document.getElementById("lab-stat-solved");
    const streakEl = document.getElementById("lab-stat-streak");

    if (levelEl) {
      levelEl.textContent =
        state.levelFilter === "auto"
          ? `L${unlockedLvl}`
          : `L${state.levelFilter}`;
    }
    if (solvedEl) {
      solvedEl.textContent = `${masteredCount}/${topicPool.length}`;
    }
    if (streakEl) {
      streakEl.textContent = `${state.streak} 🔥`;
    }
  }

  function renderLearnStudyBox(q, target) {
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

    return `
      <div class="lab-study-box mb-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div>
            <span class="lab-study-label"><i class="fas fa-book-open me-1"></i>Learn Command</span>
            <code class="lab-canonical-code">${escapeHtml(
              target.canonical
            )}</code>
          </div>
          <span class="small text-secondary">Type this command below to practice it</span>
        </div>
        <div class="lab-grammar-list">${grammarRows}</div>
        <div class="small text-secondary mt-2">
          <strong class="text-body">Why:</strong> ${formatInlineCode(
            q.explanation
          )}
        </div>
      </div>
    `;
  }

  function renderFeedback(q, fb) {
    if (!fb) return "";

    const target = getActiveTarget(q);
    const isEvaluated = fb.status === "correct" || fb.status === "incorrect";
    const showSolution =
      state.currentPhase === "test" && (isEvaluated || fb.revealed);
    const isMultiStep = Boolean(q.steps && q.steps.length > 0);
    const isLastStep = !isMultiStep || state.stepIndex >= q.steps.length - 1;

    let banner = "";
    if (fb.status === "correct") {
      const btnLabel = isLastStep ? "Continue" : "Next Step";
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
              <strong>Not quite.</strong> ${formatInlineCode(fb.message)}
            </div>
            <button type="button" class="btn btn-sm btn-primary fw-semibold" id="lab-next-inline-btn">
              Next <kbd class="ms-1">↵</kbd>
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

    // In Learn mode, the Study Box is already visible above the terminal—just show the simulated output on success!
    if (state.currentPhase === "learn") {
      const outputPreview = target.output || q.sampleOutput || "";
      return `
        ${banner}
        ${
          fb.status === "correct" && outputPreview
            ? `<pre class="lab-sample-output mt-2 mb-0"><code>${escapeHtml(
                outputPreview
              )}</code></pre>`
            : ""
        }
      `;
    }

    if (!showSolution) {
      return banner;
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
      <div class="lab-solution-panel mt-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span class="lab-solution-label"><i class="fas fa-check me-1"></i>Solution</span>
            <code class="lab-canonical-code">${escapeHtml(
              target.canonical
            )}</code>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="lab-badge lab-badge-tool"><i class="fas fa-terminal me-1"></i>${escapeHtml(
              q.tool
            )}</span>
            ${
              altList
                ? `<span class="small text-secondary">Aliases: ${altList}</span>`
                : ""
            }
          </div>
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
    const isLearnPhase = state.currentPhase === "learn";
    const mem = state.memory[q.id];

    const phaseBadge = isLearnPhase
      ? `<span class="lab-badge lab-badge-learn"><i class="fas fa-graduation-cap me-1"></i>Learn Phase</span>`
      : `<span class="lab-badge lab-badge-test"><i class="fas fa-bolt me-1"></i>Test Recall (No Spoilers)</span>`;

    const levelBadge = `<span class="lab-badge lab-badge-session">${escapeHtml(
      q.difficulty || "Level " + (q.level || 1)
    )}</span>`;

    // Only show the tool badge during Learn phase—hide it during Test phase so it never spoils the answer!
    const toolBadge = isLearnPhase
      ? `<span class="lab-badge lab-badge-tool"><i class="fas fa-terminal me-1"></i>${escapeHtml(
          q.tool
        )}</span>`
      : "";

    const retryBadge =
      mem && mem.failedTest
        ? `<span class="lab-badge lab-badge-weak">Reviewing Missed Command 🔁</span>`
        : "";

    const symptomHtml =
      !isMultiStep && q.symptomOutput
        ? `
        <div class="lab-symptom-box mb-3">
          <div class="lab-symptom-label">Observed Terminal Output</div>
          <pre class="lab-sample-output mb-0"><code>${escapeHtml(
            q.symptomOutput
          )}</code></pre>
        </div>
      `
        : "";

    const studyHtml = isLearnPhase ? renderLearnStudyBox(q, target) : "";

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
            ${phaseBadge}
            ${levelBadge}
            ${toolBadge}
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
            ${retryBadge}
          </div>
          <button type="button" class="btn btn-sm lab-btn-ghost" id="lab-skip-btn">
            Skip →
          </button>
        </div>

        <h2 class="lab-q-title mb-2">${escapeHtml(q.title)}</h2>
        ${symptomHtml}
        <p class="lab-q-prompt mb-3">${formatInlineCode(target.prompt)}</p>
        ${studyHtml}

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
                placeholder="${
                  isLearnPhase
                    ? "Type the command above and press Enter to practice..."
                    : "Recall and type the command, then press Enter..."
                }"
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
            <div>
              ${
                !isLearnPhase
                  ? `<button type="button" class="btn btn-sm lab-btn-ghost" id="lab-reveal-btn">
                      <i class="fas fa-eye me-1"></i>Show Solution
                    </button>`
                  : `<span class="small text-secondary">After practicing this once, we'll test you without spoilers.</span>`
              }
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
            state.streak += 1;
            recordOutcome(q.id, true);
          }
          saveStats();
          renderHeaderStats();
        } else if (result.status === "incorrect") {
          state.streak = 0;
          recordOutcome(q.id, false);
          saveStats();
          renderHeaderStats();
        }

        state.feedback = {
          ...result,
          revealed: result.status !== "empty",
        };

        updateFeedbackSlot();
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", () => {
        pickNextQuestion();
        renderHeaderStats();
        renderCard();
      });
    }

    if (revealBtn) {
      revealBtn.addEventListener("click", () => {
        state.revealedSolutionOnCurrent = true;
        recordOutcome(q.id, false);
        saveStats();
        const prev = state.feedback || {};
        state.feedback = {
          ...prev,
          revealed: !prev.revealed,
        };
        revealBtn.innerHTML = `<i class="fas fa-eye me-1"></i>${
          state.feedback.revealed ? "Hide Solution" : "Show Solution"
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

    pickNextQuestion();
    renderHeaderStats();
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

  function initDropdowns() {
    const topicSelect = document.getElementById("lab-topic-select");
    if (topicSelect) {
      const sessions = window.SRE_LAB_SESSIONS || [];
      topicSelect.innerHTML = sessions
        .map(
          (s) =>
            `<option value="${escapeHtml(s.id)}">${escapeHtml(
              s.title
            )}</option>`
        )
        .join("");

      topicSelect.addEventListener("change", () => {
        state.session = topicSelect.value || "all";
        pickNextQuestion();
        renderHeaderStats();
        renderCard();
      });
    }

    const levelSelect = document.getElementById("lab-level-select");
    if (levelSelect) {
      levelSelect.addEventListener("change", () => {
        state.levelFilter = levelSelect.value || "auto";
        pickNextQuestion();
        renderHeaderStats();
        renderCard();
      });
    }

    const modeSelect = document.getElementById("lab-mode-select");
    if (modeSelect) {
      modeSelect.addEventListener("change", () => {
        state.modeFilter = modeSelect.value || "adaptive";
        pickNextQuestion();
        renderHeaderStats();
        renderCard();
      });
    }
  }

  function init() {
    if (!document.getElementById("sre-cli-lab-root")) return;
    loadStats();
    initDropdowns();
    pickNextQuestion();
    renderHeaderStats();
    renderCard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
