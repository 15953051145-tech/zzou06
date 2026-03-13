/**
 * 智商测试问答游戏
 */
(function () {
  const STORAGE_KEY = "zl_iq_scores_v1";

  const QUESTIONS = [
    { text: "2, 4, 6, 8, 10，下一个数字是？", options: ["11", "12", "14", "16"], correct: 1 },
    { text: "如果所有的 A 都是 B，所有的 B 都是 C，那么所有的 A 一定是？", options: ["C", "B", "A", "无法确定"], correct: 0 },
    { text: "1 + 1 = 2，2 + 2 = 4，3 + 3 = 6，那么 4 + 4 = ？", options: ["7", "8", "9", "10"], correct: 1 },
    { text: "猫对狗，如同鸟对？", options: ["鱼", "虫", "兽", "飞"], correct: 1 },
    { text: "3, 6, 9, 12，下一个数字是？", options: ["14", "15", "16", "18"], correct: 1 },
    { text: "一本书有 100 页，小明每天看 10 页，几天能看完？", options: ["8 天", "9 天", "10 天", "11 天"], correct: 2 },
    { text: "如果今天是周一，3 天后是星期几？", options: ["周三", "周四", "周五", "周六"], correct: 1 },
    { text: "1, 1, 2, 3, 5, 8，下一个数字是？（斐波那契数列）", options: ["11", "12", "13", "14"], correct: 2 },
    { text: "哥哥比弟弟大 3 岁，弟弟今年 10 岁，哥哥今年几岁？", options: ["12 岁", "13 岁", "14 岁", "15 岁"], correct: 1 },
    { text: "正方形有 4 条边，五边形有几条边？", options: ["3 条", "4 条", "5 条", "6 条"], correct: 2 },
    { text: "2, 4, 8, 16，下一个数字是？", options: ["24", "28", "32", "36"], correct: 2 },
    { text: "小明有 5 个苹果，吃了 2 个，又买了 3 个，现在有几个？", options: ["5 个", "6 个", "7 个", "8 个"], correct: 1 },
    { text: "如果 A > B，B > C，那么 A 和 C 的关系是？", options: ["A = C", "A < C", "A > C", "无法确定"], correct: 2 },
    { text: "1, 4, 9, 16，下一个数字是？（平方数列）", options: ["20", "24", "25", "36"], correct: 2 },
    { text: "一个班级有 30 人，其中 60% 是女生，女生有多少人？", options: ["16 人", "18 人", "20 人", "22 人"], correct: 1 },
  ];

  const IQ_DESCRIPTIONS = [
    { min: 0, max: 79, text: "你的得分偏低，可能是状态不佳。放松心情，再试一次吧！" },
    { min: 80, max: 89, text: "略低于平均，可能是题目类型不太适合你。多练习逻辑题会有帮助。" },
    { min: 90, max: 109, text: "处于平均水平，说明你的思维能力正常。继续保持！" },
    { min: 110, max: 119, text: "高于平均，你的逻辑和推理能力不错。" },
    { min: 120, max: 129, text: "优秀！你的思维敏捷，善于分析问题。" },
    { min: 130, max: 200, text: "非常出色！你的智商表现卓越。" },
  ];

  const TOTAL = QUESTIONS.length;
  const BASE_IQ = 85;
  const POINTS_PER_CORRECT = 3;

  let currentIndex = 0;
  let answers = [];
  let lastIqScore = 0;

  const $ = (id) => document.getElementById(id);
  const startScreen = $("iqStartScreen");
  const quizScreen = $("iqQuizScreen");
  const resultScreen = $("iqResultScreen");
  const iqTestSection = $("iqTestSection");
  const startBtn = $("iqStartBtn");
  const prevBtn = $("iqPrevBtn");
  const nextBtn = $("iqNextBtn");
  const restartBtn = $("iqRestartBtn");
  const progressFill = $("iqProgressFill");
  const currentNumEl = $("iqCurrentNum");
  const questionText = $("iqQuestionText");
  const optionsList = $("iqOptionsList");
  const scoreValueEl = $("iqScoreValue");
  const resultDescEl = $("iqResultDesc");
  const nicknameInput = $("iqNickname");
  const submitScoreBtn = $("iqSubmitScoreBtn");
  const leaderboardList = $("iqLeaderboardList");
  const leaderboardBtn = $("iqLeaderboardBtn");
  const leaderboardPanel = $("iqLeaderboardPanel");
  const leaderboardClose = $("iqLeaderboardClose");

  function readScores() {
    if (window.ZLStorage && typeof window.ZLStorage.read === "function") {
      return window.ZLStorage.read(STORAGE_KEY) || [];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  async function writeScores(data) {
    const arr = Array.isArray(data) ? data : [];
    if (window.ZLStorage && typeof window.ZLStorage.write === "function") {
      await window.ZLStorage.write(STORAGE_KEY, arr);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }
  }

  function nowLabel() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function renderLeaderboard(listEl) {
    if (!listEl) return;
    const scores = readScores()
      .slice()
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10);
    listEl.innerHTML = "";
    if (!scores.length) {
      listEl.innerHTML = "<li>暂无记录</li>";
      return;
    }
    scores.forEach((item, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1}. ${item.score || 0} 分`;
      listEl.appendChild(li);
    });
  }

  const iqStartLayout = $("iqStartLayout");

  function showScreen(screen) {
    [startScreen, quizScreen, resultScreen].forEach((s) => (s && (s.hidden = true)));
    if (iqStartLayout) iqStartLayout.hidden = !screen || screen !== startScreen;
    if (screen) screen.hidden = false;
  }

  function renderQuestion() {
    const q = QUESTIONS[currentIndex];
    questionText.textContent = q.text;
    currentNumEl.textContent = currentIndex + 1;
    progressFill.style.width = `${((currentIndex + 1) / TOTAL) * 100}%`;

    optionsList.innerHTML = "";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "iq-option-btn";
      btn.textContent = opt;
      btn.dataset.index = i;
      const hasAnswered = answers[currentIndex] !== undefined;
      btn.classList.toggle("is-selected", answers[currentIndex] === i);
      if (hasAnswered) {
        btn.classList.toggle("is-correct", answers[currentIndex] === q.correct && i === q.correct);
        btn.classList.toggle("is-wrong", answers[currentIndex] !== q.correct && i === answers[currentIndex]);
      }
      btn.addEventListener("click", () => selectOption(i));
      optionsList.appendChild(btn);
    });

    prevBtn.disabled = currentIndex === 0;
    nextBtn.textContent = currentIndex === TOTAL - 1 ? "提交" : "下一题";
  }

  function selectOption(index) {
    answers[currentIndex] = index;
    document.querySelectorAll(".iq-option-btn").forEach((btn, i) => {
      btn.classList.toggle("is-selected", i === index);
    });
  }

  function goPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
    }
  }

  function goNext() {
    if (currentIndex < TOTAL - 1) {
      if (answers[currentIndex] === undefined) return;
      currentIndex++;
      renderQuestion();
    } else {
      if (answers[currentIndex] === undefined) return;
      showResult();
    }
  }

  function showResult() {
    const correctCount = answers.reduce((acc, a, i) => acc + (a === QUESTIONS[i].correct ? 1 : 0), 0);
    const rawScore = BASE_IQ + correctCount * POINTS_PER_CORRECT;
    lastIqScore = Math.min(145, Math.max(70, Math.round(rawScore)));

    scoreValueEl.textContent = lastIqScore;
    const desc = IQ_DESCRIPTIONS.find((d) => lastIqScore >= d.min && lastIqScore <= d.max);
    resultDescEl.textContent = desc ? desc.text : IQ_DESCRIPTIONS[0].text;

    renderLeaderboard(leaderboardList);
    showScreen(resultScreen);
  }

  function toggleLeaderboard() {
    if (!leaderboardPanel) return;
    const isHidden = leaderboardPanel.hidden;
    leaderboardPanel.hidden = !isHidden;
    if (!isHidden) return;
    renderLeaderboard(leaderboardList);
  }

  function startQuiz() {
    currentIndex = 0;
    answers = [];
    showScreen(quizScreen);
    renderQuestion();
  }

  function restart() {
    startQuiz();
  }

  const iqTestContent = $("iqTestContent");

  function closeIqTest() {
    if (leaderboardPanel) leaderboardPanel.hidden = true;
    showScreen(startScreen);
  }

  startBtn?.addEventListener("click", () => startQuiz());
  prevBtn?.addEventListener("click", goPrev);
  nextBtn?.addEventListener("click", goNext);
  restartBtn?.addEventListener("click", restart);

  $("iqCloseBtn")?.addEventListener("click", closeIqTest);
  $("iqQuizCloseBtn")?.addEventListener("click", () => {
    if (confirm("确定退出测试？当前进度将丢失。")) closeIqTest();
  });
  $("iqResultCloseBtn")?.addEventListener("click", closeIqTest);

  submitScoreBtn?.addEventListener("click", async () => {
    const nickname = (nicknameInput?.value || "").trim() || "匿名";
    const scores = readScores();
    scores.push({ nickname, score: lastIqScore, createdAt: nowLabel() });
    await writeScores(scores);
    if (nicknameInput) nicknameInput.value = "";
    submitScoreBtn.textContent = "已提交";
    submitScoreBtn.disabled = true;
  });

  leaderboardBtn?.addEventListener("click", toggleLeaderboard);
  leaderboardClose?.addEventListener("click", () => {
    if (leaderboardPanel) leaderboardPanel.hidden = true;
  });
})();
