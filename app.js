// app.js

// questions.js에서 QUESTIONS 사용 (전역)
const QUESTIONS_SOURCE =
  (typeof QUESTIONS !== "undefined" && Array.isArray(QUESTIONS))
    ? QUESTIONS
    : [];

// DOM 요소
const card = document.getElementById("card");
const prefixEl = document.getElementById("sentencePrefix");
const suffixEl = document.getElementById("sentenceSuffix");
const meaningEl = document.getElementById("meaning");
const slotsContainer = document.getElementById("slotsContainer");
const statusEl = document.getElementById("status");
const progressEl = document.getElementById("progress");
const scoreEl = document.getElementById("score");
const skipBtn = document.getElementById("skipBtn");
const resetBtn = document.getElementById("resetBtn");

// 상태값
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;

// 한 글자 박스 정보
let slots = [];      // [{ isSpace: true/false }]
let totalSlots = 0;  // 실제 글자(공백 제외) 수
let typedRaw = "";   // 사용자가 지금까지 친 문자열
let finished = false;
let currentAnswer = "";

// -------------------- 유틸 & 세션 문제 선택 --------------------

// 배열 섞기
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 세션용 문제 10개 (질문이 10개 미만이면 전체 사용)
function pickSessionQuestions(limit = 10) {
  const copy = [...QUESTIONS_SOURCE];
  shuffle(copy);
  const realLimit = Math.min(limit, copy.length);
  return copy.slice(0, realLimit);
}

// 문자열 정규화
function normaliseBase(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")    // 따옴표 통일
    .replace(/[^a-z\s]/g, "") // 알파벳 + 공백만 허용
    .trim()
    .replace(/\s+/g, " ");    // 여러 칸 → 한 칸
}

// 공백 유지 버전
function normaliseWithSpace(str) {
  return normaliseBase(str);
}

// 공백 제거 버전 (띄어쓰기 없어도 정답 인정용)
function normaliseWithoutSpace(str) {
  return normaliseBase(str).replace(/\s+/g, "");
}

// -------------------- 패턴(언더바) 세팅 --------------------

// 정답 문자열로부터 슬롯 구조 만들기
function setupPattern(answer) {
  currentAnswer = answer || "";
  slots = [];
  totalSlots = 0;

  const trimmed = currentAnswer.trim();
  if (!trimmed) {
    slotsContainer.innerHTML = "";
    return;
  }

  const words = trimmed.split(/\s+/);

  words.forEach((word, wi) => {
    for (let i = 0; i < word.length; i++) {
      slots.push({ isSpace: false });
      totalSlots++;
    }
    if (wi < words.length - 1) {
      slots.push({ isSpace: true }); // 단어 사이 시각적 공백
    }
  });

  typedRaw = "";
}

// 현재 typedRaw를 기준으로 슬롯 렌더링
function renderSlots() {
  const typed = typedRaw.replace(/\s/g, ""); // 공백 제거
  const caretIndex = Math.min(typed.length, totalSlots);

  slotsContainer.innerHTML = "";
  let letterIndex = 0;

  slots.forEach((slot) => {
    const span = document.createElement("span");

    if (slot.isSpace) {
      span.className = "char-slot space-slot";
      span.textContent = "";
    } else {
      span.className = "char-slot";

      if (letterIndex < typed.length) {
        span.textContent = typed[letterIndex];
      } else {
        span.textContent = "_";
      }

      if (letterIndex === caretIndex) {
        span.classList.add("caret-slot");
      }

      letterIndex++;
    }

    slotsContainer.appendChild(span);
  });
}

// 정답 전체를 슬롯 스타일로 보여주기 (폰트/스타일 동일)
function renderFullAnswer(answer) {
  const text = answer || "";
  slotsContainer.innerHTML = "";

  const trimmed = text.trim();
  if (!trimmed) return;

  const words = trimmed.split(/\s+/);

  words.forEach((word, wi) => {
    for (let i = 0; i < word.length; i++) {
      const span = document.createElement("span");
      span.className = "char-slot";
      span.textContent = word[i];
      slotsContainer.appendChild(span);
    }
    if (wi < words.length - 1) {
      const spaceSpan = document.createElement("span");
      spaceSpan.className = "char-slot space-slot";
      spaceSpan.textContent = "";
      slotsContainer.appendChild(spaceSpan);
    }
  });
}

// -------------------- 문제 세팅/진행 --------------------

function setSentence(q) {
  if (!q) return;

  wrongCount = 0;
  typedRaw = "";
  finished = false;

  prefixEl.textContent = q.prefix || "";
  suffixEl.textContent = q.suffix || "";
  meaningEl.textContent = q.meaning || "";

  setupPattern(q.answer);
  renderSlots();

  statusEl.textContent = "";
  statusEl.className = "status";

  progressEl.textContent = `Q ${currentIndex + 1} / ${questions.length}`;
  scoreEl.textContent = `Score: ${correctCount}`;
}

// 다음 문제
function nextQuestion() {
  currentIndex++;
  if (currentIndex >= questions.length) {
    const total = questions.length;
    finished = true;
    progressEl.textContent = "Done";
    statusEl.innerHTML =
      `모든 문장을 다 쳤어요. 오늘의 You Buddy 세션 끝!<br>` +
      `오늘의 점수는? 두구두구두구 ${total}개 중 ${correctCount}점!`;
    statusEl.className = "status correct";
    return;
  }
  setSentence(questions[currentIndex]);
}

// 정답 보여주고 자동 다음
function revealAndNext() {
  if (finished) return;
  const q = questions[currentIndex];
  if (!q) return;

  renderFullAnswer(q.answer);
  statusEl.innerHTML = `정답: <span class="status-answer">${q.answer}</span>`;
  statusEl.className = "status";
  finished = true;

  setTimeout(nextQuestion, 1200);
}

// 정답 체크 (띄어쓰기 있어도 / 없어도 둘 다 정답 인정)
function checkAnswer() {
  if (finished) return;
  if (!questions.length) return;

  const userWithSpace = normaliseWithSpace(typedRaw);
  const userNoSpace = normaliseWithoutSpace(typedRaw);
  const correctWithSpace = normaliseWithSpace(currentAnswer);
  const correctNoSpace = normaliseWithoutSpace(currentAnswer);

  if (!userWithSpace) {
    statusEl.textContent = "먼저 표현을 한 글자라도 입력해 주세요.";
    statusEl.className = "status wrong";
    card.classList.add("shake");
    setTimeout(() => card.classList.remove("shake"), 250);
    return;
  }

  const isCorrect =
    userWithSpace === correctWithSpace ||
    userNoSpace === correctNoSpace;

  if (isCorrect) {
    correctCount++;
    statusEl.textContent = "딩! 맞았습니다. 다음 문장으로 넘어갈게요.";
    statusEl.className = "status correct";
    card.classList.add("flash");
    scoreEl.textContent = `Score: ${correctCount}`;
    finished = true;

    setTimeout(() => {
      card.classList.remove("flash");
      nextQuestion();
    }, 450);
  } else {
    wrongCount++;
    if (wrongCount >= 3) {
      revealAndNext();
      return;
    }
    statusEl.textContent = `음… 이건 아닌 것 같아요. (${wrongCount}/3)`;
    statusEl.className = "status wrong";
    card.classList.add("shake");
    setTimeout(() => card.classList.remove("shake"), 250);
  }
}

// -------------------- Reset --------------------

function resetAll() {
  questions = pickSessionQuestions(10);
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  finished = false;
  typedRaw = "";
  currentAnswer = "";

  statusEl.textContent = "";
  statusEl.className = "status";
  scoreEl.textContent = "Score: 0";

  if (!questions.length) {
    prefixEl.textContent = "";
    suffixEl.textContent = "";
    meaningEl.textContent = "";
    slotsContainer.innerHTML = "";
    progressEl.textContent = "";
    statusEl.textContent =
      "질문 데이터가 로드되지 않았어요. questions.js 경로를 확인해 주세요.";
    return;
  }

  setSentence(questions[0]);
}

// -------------------- 키보드 입력 --------------------

function handleKey(e) {
  if (!questions.length) return;
  if (currentIndex >= questions.length) return;

  const key = e.key;
  const code = e.code;

  // 단축키 등은 무시 (command, ctrl, alt 조합)
  if (e.metaKey || e.ctrlKey || e.altKey) {
    return;
  }

  // Enter → 정답 체크
  if (key === "Enter") {
    e.preventDefault();
    checkAnswer();
    return;
  }

  // Backspace → 마지막 글자 삭제
  if (key === "Backspace") {
    e.preventDefault();
    if (!typedRaw) return;
    typedRaw = typedRaw.slice(0, -1);
    finished = false;
    renderSlots();
    return;
  }

  // 지금까지 입력한 글자 수(공백 제외)
  const lettersCount = typedRaw.replace(/\s/g, "").length;
  if (lettersCount >= totalSlots) {
    // 슬롯 초과되면 더 못 치게
    return;
  }

  // 스페이스
  if (key === " ") {
    e.preventDefault();
    typedRaw += " ";
    finished = false;
    renderSlots();
    return;
  }

  // ✅ 한글/영문 상관없이 "키보드 물리 위치" 기준으로 알파벳 처리
  // 예: code === "KeyA" → 'a'
  if (code && code.startsWith("Key")) {
    e.preventDefault();
    const letter = code.slice(3).toLowerCase(); // A,B,C → a,b,c
    typedRaw += letter;
    finished = false;
    renderSlots();
  }
}

// -------------------- 이벤트 연결 & 시작 --------------------

document.addEventListener("keydown", handleKey);
skipBtn.addEventListener("click", revealAndNext);
resetBtn.addEventListener("click", resetAll);

// 시작
resetAll();
