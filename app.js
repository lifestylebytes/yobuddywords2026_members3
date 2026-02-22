// app.js


function getTodayKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

const TODAY = getTodayKST();
const FINAL_BUTTON_DATE = "2026-02-01";

// questions.js에서 QUESTIONS 사용 (전역)
const QUESTIONS_SOURCE =
  (typeof QUESTIONS !== "undefined" && Array.isArray(QUESTIONS))
    ? QUESTIONS
    : [];

const AVAILABLE_QUESTIONS = QUESTIONS_SOURCE.filter(
  q => q.addedDate && q.addedDate <= TODAY
);

// 실제 사용자에게 제시할 문제들 (visible !== false)
const PLAYABLE_QUESTIONS = AVAILABLE_QUESTIONS.filter(
  q => q.visible !== false
);


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
const mobileInput = document.getElementById("mobileInput");
const finalLinkWrap = document.getElementById("finalLinkWrap");

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
let wrongWords = [];

// -------------------- 유틸 & 세션 문제 선택 --------------------

// 배열 섞기
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 세션용 문제 10개 (질문이 10개 미만이면 전체 사용)
// visible !== false인 항목만 사용
function pickSessionQuestions(limit = 10) {
  const copy = [...PLAYABLE_QUESTIONS];
  shuffle(copy);
  const realLimit = Math.min(limit, copy.length);
  return copy.slice(0, realLimit);
}

// 문자열 정규화 기본
function normaliseBase(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")          // 따옴표 통일
    .replace(/[^a-z\s;:'-]/g, "")   // 알파벳 + 공백 + ;:'- 만 허용
    .trim()
    .replace(/\s+/g, " ");          // 여러 칸 → 한 칸
}

// 공백 유지
function normaliseWithSpace(str) {
  return normaliseBase(str);
}

// 공백 제거 (띄어쓰기 없이 쳐도 정답 인정용)
function normaliseWithoutSpace(str) {
  // remove spaces, hyphens and apostrophes so "I've" == "ive"
  return normaliseBase(str).replace(/[\s\-']/g, "");
}

// -------------------- 패턴(언더바) 세팅 --------------------

// 정답 문자열로부터 슬롯 구조 만들기
function setupPattern(answer) {
  currentAnswer = answer || "";
  // store a normalized copy for comparisons (case-insensitive)
  currentAnswerNormalized = normaliseWithSpace(currentAnswer);
  slots = [];
  totalSlots = 0;

  const trimmed = currentAnswer.trim();
  if (!trimmed) {
    slotsContainer.innerHTML = "";
    return;
  }

  // 🔥 핵심: 글자 단위로 슬롯 구조만 생성
  const chars = trimmed.split("");
  chars.forEach((ch) => {
    if (ch === " ") {
      slots.push({ type: "space" });
    } else if (ch === "-") {
      // keep hyphen as fixed character (not user-typed)
      slots.push({ type: "fixed", value: "-" });
    } else if (/^[a-zA-Z]$/.test(ch)) {
      // only alphabetic letters require user input
      slots.push({ type: "char" });
      totalSlots++;
    } else {
      // punctuation or symbols (.,~ etc.) should be shown but not typed
      slots.push({ type: "fixed", value: ch });
    }
  });

  typedRaw = "";
}

// 현재 typedRaw를 기준으로 슬롯 렌더링
function renderSlots() {
  const typed = typedRaw.replace(/[\s-]/g, "");
  const caretIndex = Math.min(typed.length, totalSlots);

  slotsContainer.innerHTML = "";
  let letterIndex = 0;

  slots.forEach((slot) => {
    const span = document.createElement("span");

    if (slot.type === "space") {
      span.className = "char-slot space-slot";
      span.textContent = "";
    } 
    else if (slot.type === "fixed") {
      span.className = "char-slot fixed-slot";
      span.textContent = slot.value || "";
    } 
    else {
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

} // ✅ 이 닫는 중괄호가 빠져 있었음
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


function cleanMeaning(text) {
  return text.replace(/^(뜻\s*:\s*)\d+\.\s*/, '$1');
}

function setSentence(q) {
  if (!q) return;

  wrongCount = 0;
  typedRaw = "";
  finished = false;

  // If suffix starts with punctuation and there is an existing prefix,
  // attach the punctuation to the prefix to avoid it sitting alone.
  // If prefix is empty, keep punctuation in suffix so the blank stays before it.
  const suffixText = q.suffix || "";
  const prefixText = q.prefix || "";
  if (suffixText && prefixText) {
    const trimmed = suffixText.trimStart();
    if (/^[\.,!\?:;~\-]/.test(trimmed)) {
      const punct = trimmed[0];
      // If suffix is only a single punctuation character (e.g. '.')
      // or prefix already ends with punctuation, leave the punctuation in suffix
      // so it appears after the blank. Otherwise attach the punctuation to prefix
      // and keep the rest as suffix.
      const prefixEndsWithPunct = /[\.,!\?:;~\-]\s*$/.test(prefixText);
      if (trimmed.length === 1 || prefixEndsWithPunct) {
        prefixEl.textContent = q.prefix || "";
        suffixEl.textContent = q.suffix || "";
      } else {
        const newSuffix = trimmed.slice(1).replace(/^\s+/, " ");
        const prefixNoTrailing = prefixText.replace(/\s+$/,'');
        prefixEl.textContent = `${prefixNoTrailing}${punct}`;
        suffixEl.textContent = newSuffix || "";
      }
    } else {
      prefixEl.textContent = q.prefix || "";
      suffixEl.textContent = q.suffix || "";
    }
  } else {
    prefixEl.textContent = q.prefix || "";
    suffixEl.textContent = q.suffix || "";
  }

  // 예문 해석 + 뜻 : ~ 형태로 보여주기 (뜻은 밑에 + 보라색)
  if (q.translation && q.meaning) {
    meaningEl.innerHTML = `
      <div class="translation-line">${q.translation}</div>
      <div class="meaning-line">${cleanMeaning(`뜻 : ${q.meaning}`)}</div>
    `;
  } else if (q.translation) {
    meaningEl.innerHTML = `<div class="translation-line">${q.translation}</div>`;
  } else if (q.meaning) {
    meaningEl.innerHTML = `<div class="meaning-line">${cleanMeaning(`뜻 : ${q.meaning}`)}</div>`;
  } else {
    meaningEl.textContent = "";
  }

  setupPattern(q.answer);
  renderSlots();

  statusEl.textContent = "";
  statusEl.className = "status";

  progressEl.textContent = `Q ${currentIndex + 1} / ${questions.length}`;
  scoreEl.textContent = `Score: ${correctCount}`;

  progressEl.textContent =
    `오늘까지 공개된 단어 ${AVAILABLE_QUESTIONS.length}개 중 Q ${currentIndex + 1}`;
}

// 다음 문제
function nextQuestion() {
  currentIndex++;
  if (currentIndex >= questions.length) {
    showResultPopup();
    return;
  }
  setSentence(questions[currentIndex]);
}

// 정답 보여주고 자동 다음
function revealAndNext() {
  if (finished) return;
  const q = questions[currentIndex];
  if (!q) return;

  // 스킵도 복습 대상에 포함
  if (!wrongWords.includes(q.answer)) {
    wrongWords.push(q.answer);
  }

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

  const q = questions[currentIndex];

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

    // suffix가 ? . ! , 등 "문장부호 1글자"인 경우 → 답칸 옆에 붙이기
  const isPunctuation =
    q.suffix && /^[?.!,]$/.test(q.suffix.trim());

    if (isPunctuation) {
      suffixEl.classList.add("inline-suffix");
    } else {
      suffixEl.classList.remove("inline-suffix");
    }

    prefixEl.textContent = q.prefix || "";
    suffixEl.textContent = q.suffix || "";


  // explicit case-insensitive comparison (normalise functions already lowercase,
  // but compare defensively)
  const isCorrect =
    userWithSpace.toLowerCase() === correctWithSpace.toLowerCase() ||
    userNoSpace.toLowerCase() === correctNoSpace.toLowerCase();

  // ✅ 정답
  if (isCorrect) {
    correctCount++;
    statusEl.textContent = "굳, 맞았습니다. 다음 문장으로 넘어갈게요.";
    statusEl.className = "status correct";
    card.classList.add("flash");
    scoreEl.textContent = `Score: ${correctCount}`;
    finished = true;

    setTimeout(() => {
      card.classList.remove("flash");
      nextQuestion();
    }, 450);
    return;
  }

  // ❌ 오답
  wrongCount++;

  if (!wrongWords.includes(q.answer)) {
    wrongWords.push(q.answer);
  }

  if (wrongCount >= 3) {
    revealAndNext();
    return;
  }

  statusEl.textContent = `음… 이건 아닌 것 같아요. (${wrongCount}/3)`;
  statusEl.className = "status wrong";
  card.classList.add("shake");
  setTimeout(() => card.classList.remove("shake"), 250);
}

// -------------------- 결과 팝업 --------------------

function showResultPopup() {
  const total = questions.length;
  const modal = document.getElementById("resultModal");
  const msg = document.getElementById("modalMessage");
  const list = document.getElementById("reviewList");

  msg.textContent = `🎉오늘의 ${total}개 랜덤 퀴즈 끝!🎉\n${total}개 중에 ${correctCount}개 맞추었습니다 :)`;

  // 복습 리스트 구성
  list.innerHTML = "";
  const title = document.createElement("div");
  title.className = "review-title";
  title.textContent = "[복습할 단어]";
  list.appendChild(title);
  list.appendChild(document.createElement("br"));

  if (wrongWords.length > 0) {
    wrongWords.forEach(w => {
      const li = document.createElement("li");
      li.textContent = w;
      list.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = "💯 완벽합니다! 복습할 단어가 없어요 🎉";
    list.appendChild(li);
  }

  modal.classList.remove("hidden");
}

// -------------------- 모바일 포커스 --------------------

function focusMobileInput() {
  if (!mobileInput) return;
  try {
    mobileInput.focus();
  } catch (e) {}
}

// -------------------- Reset --------------------

function resetAll() {
  questions = pickSessionQuestions(10);


  if (questions.length === 0) {
    prefixEl.textContent = "⏳ 오늘의 단어는 자정에 공개됩니다";
    suffixEl.textContent = "";
    meaningEl.textContent = "";
    slotsContainer.innerHTML = "";
    progressEl.textContent = "";
    statusEl.textContent = "";
    scoreEl.textContent = "";
    return;
  }

  
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  finished = false;
  typedRaw = "";
  currentAnswer = "";
  wrongWords = [];

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
  focusMobileInput();   // ✅ 모바일 인풋 포커스
}

function updateFinalLinkVisibility() {
  if (!finalLinkWrap) return;
  // Temporarily keep Final Test link hidden per request
  finalLinkWrap.classList.add("hidden");
}

// 🔤 실제로 한 글자 입력 처리 (PC/모바일 공통)
function applyChar(rawCh) {
  let ch = rawCh;

  // 지금까지 입력한 글자 수(공백 제외)
  const lettersCount = typedRaw.replace(/[\s-]/g, "").length;
  if (lettersCount >= totalSlots) return; // 슬롯 초과 방지

  // 스페이스 처리
  if (ch === " ") {
    typedRaw += " ";
    finished = false;
    renderSlots();
    return;
  }

  // 허용 문자만 입력 (알파벳 + ; : ' -)
  if (!/[a-zA-Z;:'-]/.test(ch)) return;

  typedRaw += ch.toLowerCase();
  finished = false;
  renderSlots();

 // ⭐⭐⭐ 모든 빈칸 채움 + 정답 자동 체크 ⭐⭐⭐
  const typedNoSpace = normaliseWithoutSpace(typedRaw);
  const answerNoSpace = normaliseWithoutSpace(currentAnswer);

  // 모든 칸이 채워졌는지?
  const filledAll = typedNoSpace.length === totalSlots;

  if (filledAll && typedNoSpace === answerNoSpace) {
    // 자동 정답 처리
    setTimeout(() => {
      checkAnswer();
    }, 80); // 살짝 딜레이 주면 UX가 부드러움
  }
}

// -------------------- 키보드 입력 --------------------

function handleKey(e) {
  if (!questions.length) return;
  if (currentIndex >= questions.length) return;

  const key = e.key;
  const code = e.code;

  // 단축키 등은 무시 (command, ctrl, alt 조합)
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  // Enter → 정답 체크
  if (key === "Enter") {
    e.preventDefault();
    checkAnswer();
    return;
  }

  // Backspace → 마지막 글자 삭제
  if (key === "Backspace") {
    e.preventDefault();
    typedRaw = typedRaw.slice(0, -1);
    finished = false;
    renderSlots();
    return;
  }

  // Space
  if (key === " ") {
    e.preventDefault();
    applyChar(" ");
    return;
  }

  // 1) PC — 한/영 상관없이 물리 키 위치 기준 (KeyA, KeyB…)
  if (code && code.startsWith("Key")) {
    e.preventDefault();
    applyChar(code.slice(3)); // "KeyA" → "A"
    return;
  }

  // 2) 그 외(모바일 포함) — e.key 기준으로 한 글자 처리
  if (key.length === 1) {
    e.preventDefault();
    applyChar(key);
    return;
  }
}

// 📱 안드로이드 등에서 keydown 대신 input 이벤트만 오는 경우 대응
if (mobileInput) {
  mobileInput.addEventListener("input", (e) => {
    const value = e.target.value;
    if (!value) return;

    // 들어온 문자열을 한 글자씩 applyChar로 전달
    for (const ch of value) {
      applyChar(ch);
    }

    // 인풋 값은 매번 비워서 계속 새 글자만 받도록
    e.target.value = "";
  });
}

// -------------------- 이벤트 연결 & 시작 --------------------

document.addEventListener("keydown", handleKey);
skipBtn.addEventListener("click", revealAndNext);
resetBtn.addEventListener("click", resetAll);

card.addEventListener("click", focusMobileInput);
card.addEventListener("touchstart", focusMobileInput);

// 팝업 다시하기 버튼 (단 한 번만 등록)
document.getElementById("retryBtn").addEventListener("click", () => {
  document.getElementById("resultModal").classList.add("hidden");
  resetAll();
});

// 시작
resetAll()
updateFinalLinkVisibility();
