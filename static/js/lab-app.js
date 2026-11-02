// Incremental Learn -> Test CLI Mastery Engine
// Stage 0 (Learn): Teaches the command & grammar first; user types it once to practice.
// Stage 1 (Test): Re-queues 2-4 turns later with NO tool spoiler and NO study card; user recalls from memory.
// Stage 2 (Mastered): Passed cold in Test mode; unlocks higher Incremental Levels (L1 -> L2 -> L3 -> L4).
(function () {
  "use strict";

  const STORAGE_KEY = "sre_lab_incremental_v4";
  const SPRINT_LENGTH = 10;

  const state = {
    session: "all",
    levelFilter: "auto", // "auto" | "1" | "2" | "3" | "4"
    modeFilter: "adaptive", // "adaptive" (Learn -> Test) | "test" | "learn" | "sprint"
    currentQuestion: null,
    currentPhase: "learn", // "learn" | "test"
    stepIndex: 0,
    stepHistory: [],
    revealedSolutionOnCurrent: false,
    failedStepOnCurrent: false,
    turnCounter: 0,
    streak: 0,
    // memory[id] = { stage: 0(learn) | 1(ready_for_test) | 2(mastered), lastTurn: number, failedTest: boolean }
    memory: {},
    cmdHistory: [],
    cmdHistoryIdx: -1,
    feedback: null,
    sprint: {
      active: false,
      finished: false,
      questions: [],
      index: 0,
      results: [],
      startTime: 0,
      elapsedSec: 0,
      timerId: null,
    },
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

  // Order-Independent Flag & Alias Canonicalizer Across ALL Tools
  const K8S_RESOURCE_ALIASES = {
    po: "pods",
    pod: "pods",
    pods: "pods",
    svc: "services",
    service: "services",
    services: "services",
    deploy: "deployments",
    deployment: "deployments",
    deployments: "deployments",
    ep: "endpoints",
    endpoint: "endpoints",
    endpoints: "endpoints",
    ev: "events",
    event: "events",
    events: "events",
    no: "nodes",
    node: "nodes",
    nodes: "nodes",
    netpol: "networkpolicies",
    networkpolicy: "networkpolicies",
    networkpolicies: "networkpolicies",
    ns: "namespaces",
    namespace: "namespaces",
    namespaces: "namespaces",
  };

  const IP_OBJECT_ALIASES = {
    a: "addr",
    addr: "addr",
    address: "addr",
    l: "link",
    link: "link",
    r: "route",
    route: "route",
    n: "neigh",
    neigh: "neigh",
    neighbor: "neigh",
    neighbour: "neigh",
  };

  const FLAG_ALIASES = {
    "--all-namespaces": "-A",
    "--previous": "-p",
    "--namespace": "-n",
    "--output": "-o",
    "--selector": "-l",
    "--follow": "-f",
    "--max-depth": "-d",
  };

  // Flags that consume the following token as their value (per tool)
  const TOOL_VALUED_FLAGS = {
    kubectl: new Set([
      "-n",
      "-o",
      "-l",
      "-c",
      "--sort-by",
      "--field-selector",
      "--tail",
    ]),
    helm: new Set(["-n", "-f", "--values", "--revision"]),
    hubble: new Set([
      "--verdict",
      "--pod",
      "--namespace",
      "-n",
      "--protocol",
      "--to-pod",
      "--from-pod",
      "--last",
      "-o",
    ]),
    ping: new Set(["-c", "-M", "-s", "-i", "-W", "-w", "-I"]),
    tcpdump: new Set(["-i", "-c", "-s", "-w", "-r"]),
    journalctl: new Set([
      "-u",
      "-n",
      "-S",
      "-U",
      "-p",
      "-b",
      "--since",
      "--until",
      "--vacuum-size",
      "--vacuum-time",
    ]),
    curl: new Set([
      "-o",
      "-w",
      "-H",
      "-X",
      "-d",
      "--resolve",
      "--connect-timeout",
      "-m",
    ]),
    find: new Set([
      "-type",
      "-size",
      "-name",
      "-iname",
      "-mtime",
      "-mmin",
      "-maxdepth",
      "-mindepth",
      "-user",
      "-perm",
    ]),
    nsenter: new Set(["-t"]),
    strace: new Set(["-p", "-e", "-o", "-s"]),
    grep: new Set(["-e", "-f", "-m", "-A", "-B", "-C"]),
    du: new Set(["-d"]),
    nc: new Set(["-w", "-p", "-s"]),
    tar: new Set(["-f", "-C"]),
    docker: new Set(["-f", "--format", "--tail", "--since", "-n"]),
    crictl: new Set(["--tail", "-n"]),
    git: new Set(["-n", "--grep"]),
    go: new Set(["-bench", "-run", "-cpuprofile", "-memprofile"]),
    lsof: new Set(["-i", "-p", "-u"]),
  };

  // Multi-letter single-dash boolean flags that should NOT be split into individual characters
  const MULTI_CHAR_SINGLE_DASH_BOOLS = new Set([
    "-delete",
    "-print",
    "-empty",
    "-race",
    "-benchmem",
    "-no-headers",
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

  function normalizeFlagKey(flag) {
    return FLAG_ALIASES[flag] || flag;
  }

  function canonicalizeSingleCommand(cmdStr) {
    const rawTokens = tokenizeCommand(cmdStr);
    if (rawTokens.length === 0) return "";

    const baseTool = rawTokens[0];
    const valuedSet = TOOL_VALUED_FLAGS[baseTool] || new Set();

    const positional = [];
    const shortBoolFlags = new Set();
    const longBoolFlags = new Set();
    const valuedFlags = [];

    for (let i = 1; i < rawTokens.length; i++) {
      const tok = rawTokens[i];

      // 1. Handle --flag=val or -f=val
      if (tok.startsWith("-") && tok.includes("=")) {
        const eqIdx = tok.indexOf("=");
        const rawKey = tok.slice(0, eqIdx);
        const val = tok.slice(eqIdx + 1);
        const normKey = normalizeFlagKey(rawKey);
        valuedFlags.push(`${normKey}=${val}`);
        continue;
      }

      const normTok = normalizeFlagKey(tok);

      // 2. Handle valued flags taking the next token (e.g. -n kube-system, -c 4, -type f)
      if (valuedSet.has(normTok) && i + 1 < rawTokens.length) {
        valuedFlags.push(`${normTok}=${rawTokens[i + 1]}`);
        i += 1;
        continue;
      }

      // 3. Handle attached numeric short flags for valued flags (e.g. -c4, -n20, -C3, -d1)
      const attachedMatch = /^(-[a-zA-Z])(\d+)$/.exec(tok);
      if (attachedMatch && valuedSet.has(attachedMatch[1])) {
        valuedFlags.push(`${attachedMatch[1]}=${attachedMatch[2]}`);
        continue;
      }

      // 4. Handle multi-char single-dash boolean flags (e.g. find -delete, go test -race)
      if (MULTI_CHAR_SINGLE_DASH_BOOLS.has(normTok)) {
        longBoolFlags.add(normTok);
        continue;
      }

      // 5. Handle long boolean flags (--something)
      if (normTok.startsWith("--")) {
        longBoolFlags.add(normTok);
        continue;
      }

      // 6. Handle short boolean flag or bundled short flags (-tulpn, -la, -A, -p)
      if (
        normTok.startsWith("-") &&
        normTok.length > 1 &&
        /^-[a-zA-Z0-9]+$/.test(normTok)
      ) {
        if (baseTool === "tcpdump" && (normTok === "-nn" || normTok === "-n")) {
          shortBoolFlags.add("n");
        } else {
          for (const ch of normTok.slice(1)) {
            shortBoolFlags.add(ch);
          }
        }
        continue;
      }

      // 7. Positional token normalization per tool
      if (baseTool === "kubectl") {
        // Expand resource/name syntax (e.g. deployment/payment-api -> deployments payment-api)
        if (tok.includes("/") && !tok.startsWith("/") && !tok.startsWith(".")) {
          const slashIdx = tok.indexOf("/");
          const resType = tok.slice(0, slashIdx).toLowerCase();
          const resName = tok.slice(slashIdx + 1);
          if (K8S_RESOURCE_ALIASES[resType]) {
            positional.push(K8S_RESOURCE_ALIASES[resType], resName);
            continue;
          }
        }
        const lower = tok.toLowerCase();
        if (K8S_RESOURCE_ALIASES[lower]) {
          positional.push(K8S_RESOURCE_ALIASES[lower]);
          continue;
        }
      } else if (baseTool === "helm") {
        if (positional.length === 0 && tok === "ls") {
          positional.push("list");
          continue;
        }
      } else if (baseTool === "ip") {
        if (positional.length === 0 && IP_OBJECT_ALIASES[tok]) {
          positional.push(IP_OBJECT_ALIASES[tok]);
          continue;
        }
        if (
          positional.length === 1 &&
          (tok === "show" || tok === "list") &&
          ["addr", "link", "route", "neigh"].includes(positional[0])
        ) {
          // Omit default 'show'/'list' action so `ip a`, `ip addr`, and `ip addr show` match
          continue;
        }
      }

      positional.push(tok);
    }

    const parts = [baseTool, ...positional];
    if (shortBoolFlags.size > 0) {
      parts.push("-" + Array.from(shortBoolFlags).sort().join(""));
    }
    if (longBoolFlags.size > 0) {
      parts.push(...Array.from(longBoolFlags).sort());
    }
    if (valuedFlags.length > 0) {
      parts.push(...valuedFlags.sort());
    }
    return parts.join(" ");
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

  function formatSeconds(sec) {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
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

  // --- 10-Question Mock Sprint Mode ---
  function stopSprintTimer() {
    if (state.sprint.timerId) {
      clearInterval(state.sprint.timerId);
      state.sprint.timerId = null;
    }
  }

  function startSprint() {
    stopSprintTimer();
    const topicPool = getTopicPool();
    let pool = topicPool;
    if (state.levelFilter !== "auto") {
      const targetLvl = Number(state.levelFilter);
      const exact = topicPool.filter((q) => (q.level || 1) === targetLvl);
      if (exact.length > 0) pool = exact;
    }

    // Shuffle and pick up to SPRINT_LENGTH diverse questions across sessions
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = [];
    const seenSessions = new Set();

    // First pass: one per session for broad coverage
    for (const q of shuffled) {
      if (picked.length >= SPRINT_LENGTH) break;
      if (!seenSessions.has(q.session)) {
        seenSessions.add(q.session);
        picked.push(q);
      }
    }
    // Second pass: fill remaining slots up to SPRINT_LENGTH
    for (const q of shuffled) {
      if (picked.length >= SPRINT_LENGTH) break;
      if (!picked.includes(q)) {
        picked.push(q);
      }
    }

    state.sprint = {
      active: true,
      finished: false,
      questions: picked,
      index: 0,
      results: [],
      startTime: Date.now(),
      elapsedSec: 0,
      timerId: setInterval(() => {
        if (!state.sprint.active || state.sprint.finished) return;
        state.sprint.elapsedSec = Math.floor(
          (Date.now() - state.sprint.startTime) / 1000
        );
        const timerEl = document.getElementById("lab-sprint-timer");
        if (timerEl) {
          timerEl.textContent = formatSeconds(state.sprint.elapsedSec);
        }
      }, 1000),
    };

    state.currentQuestion = picked[0] || null;
    state.currentPhase = "test";
    state.stepIndex = 0;
    state.stepHistory = [];
    state.revealedSolutionOnCurrent = false;
    state.failedStepOnCurrent = false;
    state.feedback = null;
  }

  function recordSprintQuestionResult(wasCorrect, userCmd) {
    if (!state.sprint.active || state.sprint.finished) return;
    const q = state.currentQuestion;
    if (!q) return;
    if (state.sprint.results.length <= state.sprint.index) {
      state.sprint.results.push({
        question: q,
        correct: Boolean(
          wasCorrect &&
            !state.revealedSolutionOnCurrent &&
            !state.failedStepOnCurrent
        ),
        userCmd: userCmd || "",
      });
    }
  }

  function pickNextQuestion() {
    if (state.modeFilter === "sprint") {
      if (!state.sprint.active) {
        startSprint();
      }
      return;
    }

    stopSprintTimer();
    state.sprint.active = false;

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
      const nonMastered = [
        ...dueForTest,
        ...failedRetry,
        ...unseenLearn,
        ...waitingCooldown,
      ];
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
      if (
        dueForTest.length > 0 &&
        (Math.random() < 0.65 ||
          (unseenLearn.length === 0 && failedRetry.length === 0))
      ) {
        chosen = dueForTest[Math.floor(Math.random() * dueForTest.length)];
        phase = "test";
      } else if (failedRetry.length > 0 && Math.random() < 0.7) {
        chosen = failedRetry[Math.floor(Math.random() * failedRetry.length)];
        phase = "learn";
      } else if (unseenLearn.length > 0) {
        unseenLearn.sort((a, b) => (a.level || 1) - (b.level || 1));
        const minLevel = unseenLearn[0].level || 1;
        const lowestTier = unseenLearn.filter(
          (q) => (q.level || 1) === minLevel
        );
        chosen = lowestTier[Math.floor(Math.random() * lowestTier.length)];
        phase = "learn";
      } else if (waitingCooldown.length > 0) {
        chosen =
          waitingCooldown[Math.floor(Math.random() * waitingCooldown.length)];
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
    state.failedStepOnCurrent = false;
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
        state.memory[questionId] = {
          stage: Math.max(1, prev.stage),
          lastTurn: state.turnCounter,
          failedTest: false,
        };
      }
      return;
    }

    // In Test / Sprint mode:
    if (
      isSuccess &&
      !state.revealedSolutionOnCurrent &&
      !state.failedStepOnCurrent
    ) {
      state.memory[questionId] = {
        stage: 2, // Mastered!
        lastTurn: state.turnCounter,
        failedTest: false,
      };
    } else {
      // Missed in Test/Sprint mode -> drop back to Stage 0 (Learn) so it gets re-taught and re-tested!
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

  function renderSprintSummary() {
    const mount = document.getElementById("lab-question-mount");
    if (!mount) return;

    const results = state.sprint.results;
    const total = results.length || 1;
    const correctCount = results.filter((r) => r.correct).length;
    const pct = Math.round((correctCount / total) * 100);
    const timeStr = formatSeconds(state.sprint.elapsedSec);

    // Per-domain aggregation
    const bySession = {};
    for (const r of results) {
      const sid = r.question.session;
      if (!bySession[sid]) {
        bySession[sid] = { total: 0, correct: 0 };
      }
      bySession[sid].total += 1;
      if (r.correct) bySession[sid].correct += 1;
    }

    const domainPills = Object.keys(bySession)
      .map((sid) => {
        const d = bySession[sid];
        const ok = d.correct === d.total;
        return `
          <span class="lab-badge ${ok ? "lab-badge-test" : "lab-badge-weak"}">
            ${escapeHtml(getSessionTitle(sid))}: ${d.correct}/${d.total}
          </span>
        `;
      })
      .join("");

    const missed = results.filter((r) => !r.correct);
    const missedHtml =
      missed.length === 0
        ? `<div class="lab-feedback-banner lab-feedback-banner--correct mt-3">
             <i class="fas fa-trophy me-2"></i><strong>Flawless Sprint!</strong> All ${total} commands recalled cold with zero spoilers.
           </div>`
        : `
          <div class="mt-3">
            <div class="small fw-bold text-uppercase text-secondary mb-2">
              Missed Commands (Queued into Learn → Test)
            </div>
            <div class="d-flex flex-column gap-2">
              ${missed
                .map((r) => {
                  const q = r.question;
                  const target =
                    q.steps && q.steps.length > 0
                      ? q.steps.map((s) => s.canonical).join("  →  ")
                      : q.canonical;
                  return `
                    <div class="lab-study-box py-2 px-3">
                      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <strong class="small">${escapeHtml(q.title)}</strong>
                        <span class="lab-badge lab-badge-session">${escapeHtml(
                          getSessionTitle(q.session)
                        )}</span>
                      </div>
                      <div class="mt-1">
                        <code class="lab-canonical-code">${escapeHtml(
                          target
                        )}</code>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        `;

    mount.innerHTML = `
      <div class="lab-question-card">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <span class="lab-badge lab-badge-war"><i class="fas fa-flag-checkered me-1"></i>On-Call Sprint Scorecard</span>
          <span class="small text-secondary font-monospace"><i class="fas fa-clock me-1"></i>Elapsed: <strong>${timeStr}</strong></span>
        </div>

        <h2 class="lab-q-title mb-1">Score: ${correctCount} / ${results.length} (${pct}%)</h2>
        <p class="small text-secondary mb-3">
          Blind recall across ${Object.keys(bySession).length} SRE domains in ${timeStr}.
        </p>

        <div class="d-flex flex-wrap gap-2 mb-2">
          ${domainPills}
        </div>

        ${missedHtml}

        <div class="d-flex flex-wrap gap-2 mt-4">
          <button type="button" class="btn btn-sm lab-btn-enter" id="lab-sprint-restart-btn">
            <i class="fas fa-rotate-right me-1"></i>New 10-Q Sprint
          </button>
          ${
            missed.length > 0
              ? `<button type="button" class="btn btn-sm lab-btn-ghost" id="lab-sprint-learn-missed-btn">
                   <i class="fas fa-graduation-cap me-1"></i>Practice Missed in Learn → Test
                 </button>`
              : ""
          }
        </div>
      </div>
    `;

    const restartBtn = document.getElementById("lab-sprint-restart-btn");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        startSprint();
        renderHeaderStats();
        renderCard();
      });
    }

    const learnMissedBtn = document.getElementById(
      "lab-sprint-learn-missed-btn"
    );
    if (learnMissedBtn) {
      learnMissedBtn.addEventListener("click", () => {
        stopSprintTimer();
        state.sprint.active = false;
        state.modeFilter = "adaptive";
        const modeSelect = document.getElementById("lab-mode-select");
        if (modeSelect) modeSelect.value = "adaptive";
        // Immediately load the first missed question in Learn Phase
        state.currentQuestion = missed[0].question;
        state.currentPhase = "learn";
        state.stepIndex = 0;
        state.stepHistory = [];
        state.revealedSolutionOnCurrent = false;
        state.failedStepOnCurrent = false;
        state.feedback = null;
        renderHeaderStats();
        renderCard();
      });
    }
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

    if (state.modeFilter === "sprint" && state.sprint.finished) {
      renderSprintSummary();
      return;
    }

    const q = state.currentQuestion;
    if (!q) {
      mount.innerHTML = `<div class="lab-question-card text-center p-4">No questions found.</div>`;
      return;
    }

    const target = getActiveTarget(q);
    const isMultiStep = Boolean(q.steps && q.steps.length > 0);
    const isLearnPhase = state.currentPhase === "learn";
    const mem = state.memory[q.id];

    let phaseBadge = "";
    if (state.modeFilter === "sprint" && state.sprint.active) {
      phaseBadge = `<span class="lab-badge lab-badge-war"><i class="fas fa-stopwatch me-1"></i>Sprint ${
        state.sprint.index + 1
      }/${state.sprint.questions.length} · <span id="lab-sprint-timer" class="ms-1 font-monospace">${formatSeconds(
        state.sprint.elapsedSec
      )}</span></span>`;
    } else if (isLearnPhase) {
      phaseBadge = `<span class="lab-badge lab-badge-learn"><i class="fas fa-graduation-cap me-1"></i>Learn Phase</span>`;
    } else {
      phaseBadge = `<span class="lab-badge lab-badge-test"><i class="fas fa-bolt me-1"></i>Test Recall (No Spoilers)</span>`;
    }

    const levelBadge = `<span class="lab-badge lab-badge-session">${escapeHtml(
      q.difficulty || "Level " + (q.level || 1)
    )}</span>`;

    // Only show the tool badge during Learn phase—hide it during Test/Sprint phase so it never spoils the answer!
    const toolBadge = isLearnPhase
      ? `<span class="lab-badge lab-badge-tool"><i class="fas fa-terminal me-1"></i>${escapeHtml(
          q.tool
        )}</span>`
      : "";

    const retryBadge =
      mem && mem.failedTest && state.modeFilter !== "sprint"
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
            recordSprintQuestionResult(true, rawVal);
          }
          saveStats();
          renderHeaderStats();
        } else if (result.status === "incorrect") {
          state.streak = 0;
          state.failedStepOnCurrent = true;
          recordOutcome(q.id, false);
          recordSprintQuestionResult(false, rawVal);
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
        if (state.modeFilter === "sprint" && state.sprint.active) {
          recordOutcome(q.id, false);
          recordSprintQuestionResult(false, "");
          saveStats();
          advanceSprintStep();
          return;
        }
        pickNextQuestion();
        renderHeaderStats();
        renderCard();
      });
    }

    if (revealBtn) {
      revealBtn.addEventListener("click", () => {
        state.revealedSolutionOnCurrent = true;
        recordOutcome(q.id, false);
        recordSprintQuestionResult(false, "");
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

  function advanceSprintStep() {
    if (state.sprint.index < state.sprint.questions.length - 1) {
      state.sprint.index += 1;
      state.currentQuestion = state.sprint.questions[state.sprint.index];
      state.currentPhase = "test";
      state.stepIndex = 0;
      state.stepHistory = [];
      state.revealedSolutionOnCurrent = false;
      state.failedStepOnCurrent = false;
      state.feedback = null;
      renderHeaderStats();
      renderCard();
    } else {
      state.sprint.finished = true;
      stopSprintTimer();
      renderHeaderStats();
      renderSprintSummary();
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

    if (state.modeFilter === "sprint" && state.sprint.active) {
      recordSprintQuestionResult(
        state.feedback && state.feedback.status === "correct",
        state.feedback ? state.feedback.userCmd : ""
      );
      advanceSprintStep();
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
        if (state.modeFilter === "sprint") {
          startSprint();
        } else {
          pickNextQuestion();
        }
        renderHeaderStats();
        renderCard();
      });
    }

    const levelSelect = document.getElementById("lab-level-select");
    if (levelSelect) {
      levelSelect.addEventListener("change", () => {
        state.levelFilter = levelSelect.value || "auto";
        if (state.modeFilter === "sprint") {
          startSprint();
        } else {
          pickNextQuestion();
        }
        renderHeaderStats();
        renderCard();
      });
    }

    const modeSelect = document.getElementById("lab-mode-select");
    if (modeSelect) {
      modeSelect.addEventListener("change", () => {
        state.modeFilter = modeSelect.value || "adaptive";
        if (state.modeFilter === "sprint") {
          startSprint();
        } else {
          pickNextQuestion();
        }
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
