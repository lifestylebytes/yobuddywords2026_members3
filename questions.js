// questions.js

const QUESTIONS = [
  {
    "answer": "hand off",
    "prefix": "I want to double-check if we need to review this before we",
    "suffix": ".",
    "meaning": "hand off",
    "translation": "넘기기 전에 이걸 검토해야 하는지 다시 한번 확인하고 싶어요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "by any chance",
    "prefix": "",
    "suffix": ", would you mind checking the message I sent earlier?",
    "meaning": "by any chance",
    "translation": "혹시, 제가 아까 보낸 메시지 확인해 주실 수 있을까요?",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "out of scope",
    "prefix": "I really don't like it when we need to support tasks that are actually",
    "suffix": ".",
    "meaning": "out of scope",
    "translation": "사실 범위 밖인 일을 지원해야 할 때 정말 별로예요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "loop in",
    "prefix": "Could you",
    "suffix": "the whole team for further discussion?",
    "meaning": "loop in",
    "translation": "추가 논의를 위해 팀 전체를 포함시켜 줄 수 있을까요?",
    "addedDate": "2026-02-10"
  },
  {
    "answer": "touch base",
    "prefix": "I'd like to",
    "suffix": "before the meeting.",
    "meaning": "touch base",
    "translation": "회의 전에 간단히 한번 연락하고 싶어요.",
    "addedDate": "2026-02-10"
  },
  {
    "answer": "follow up",
    "prefix": "Let me",
    "suffix": "on that and get back to you.",
    "meaning": "follow up",
    "translation": "그 부분은 제가 후속 확인하고 다시 연락드릴게요.",
    "addedDate": "2026-02-10"
  },
  {
    "answer": "That reminds me",
    "prefix": "Oh,",
    "suffix": ". I promised myself I'd stop being a coffee addict... starting tomorrow!",
    "meaning": "That reminds me",
    "translation": "아, 그거 보니 생각났는데. 커피 중독 끊겠다고 나 자신과 약속했거든… 내일부터!",
    "addedDate": "2026-02-11"
  },
  {
    "answer": "I've been meaning to",
    "prefix": "",
    "suffix": "talk to you, but my brain needs a caffeine jumpstart before it completely shuts down!",
    "meaning": "I've been meaning to",
    "translation": "너랑 얘기하려고 했는데, 뇌가 완전히 꺼지기 전에 카페인으로 시동을 좀 걸어야겠어!",
    "addedDate": "2026-02-11"
  },
  {
    "answer": "Same old, same old",
    "prefix": "",
    "suffix": ", pretty busy these days. How about you?",
    "meaning": "Same old, same old",
    "translation": "늘 똑같지 뭐, 요즘 꽤 바빠. 너는 어때?",
    "addedDate": "2026-02-11"
  },
  {
    "answer": "One thing to consider is",
    "prefix": "",
    "suffix": "our team's bandwidth.",
    "meaning": "One thing to consider is",
    "translation": "고려해볼 점은 우리 팀의 여유(리소스)예요.",
    "addedDate": "2026-02-12"
  },
  {
    "answer": "From my perspective",
    "prefix": "",
    "suffix": ", the schedule is a bit tight, so we may not reach the goal we set at the beginning of this week.",
    "meaning": "From my perspective",
    "translation": "제 관점에서는 일정이 조금 타이트해서, 이번 주 초에 세운 목표를 달성하지 못할 수도 있어요.",
    "addedDate": "2026-02-12"
  },
  {
    "answer": "I might be wrong, but",
    "prefix": "",
    "suffix": "could you have another pair of eyes look at the document?",
    "meaning": "I might be wrong, but",
    "translation": "제가 틀릴 수도 있지만, 이 문서 한번 더 봐주실 수 있을까요?",
    "addedDate": "2026-02-12"
  },
  {
    "answer": "tight deadline",
    "prefix": "We already have a lot of tasks on our plate with",
    "suffix": "s.",
    "meaning": "tight deadline",
    "translation": "우리는 이미 촉박한 마감이 있는 업무가 많이 쌓여 있어요.",
    "addedDate": "2026-02-13"
  },
  {
    "answer": "prioritize",
    "prefix": "",
    "suffix": "I am prioritizing tasks that have already been scheduled.",
    "meaning": "prioritize",
    "translation": "이미 일정이 잡혀 있는 업무에 우선순위를 두고 있어요.",
    "addedDate": "2026-02-13"
  },
  {
    "answer": "bandwidth",
    "prefix": "We can assign this task to someone who has enough",
    "suffix": ".",
    "meaning": "bandwidth",
    "translation": "이 업무는 여유가 있는 사람에게 배정할 수 있어요.",
    "addedDate": "2026-02-13"
  },
  {
    "answer": "run into",
    "prefix": "We've",
    "suffix": "an issue with the timeline.",
    "meaning": "run into",
    "translation": "일정과 관련해 문제가 생겼어요.",
    "addedDate": "2026-02-18"
  },
  {
    "answer": "tackle",
    "prefix": "Let's",
    "suffix": "this problem first.",
    "meaning": "tackle",
    "translation": "이 문제부터 먼저 해결해 봅시다.",
    "addedDate": "2026-02-18"
  },
  {
    "answer": "work around",
    "prefix": "",
    "suffix": "Let's find a workaround for now.",
    "meaning": "work around",
    "translation": "일단은 임시 대안을 찾아보죠.",
    "addedDate": "2026-02-18"
  },
  {
    "answer": "action items",
    "prefix": "I'll send the",
    "suffix": "after the meeting.",
    "meaning": "action items",
    "translation": "회의 후 실행 항목을 공유할게요.",
    "addedDate": "2026-02-19"
  },
  {
    "answer": "next steps",
    "prefix": "Let's confirm the",
    "suffix": "by EOD.",
    "meaning": "next steps",
    "translation": "오늘 업무 종료 전까지 다음 단계를 확정하죠.",
    "addedDate": "2026-02-19"
  },
  {
    "answer": "FYI",
    "prefix": "",
    "suffix": ", I've shared the updated deck.",
    "meaning": "FYI",
    "translation": "참고로, 업데이트된 발표 자료를 공유했어요.",
    "addedDate": "2026-02-19"
  },
  {
    "answer": "put through",
    "prefix": "",
    "suffix": "Could you put me through to Alex?",
    "meaning": "put through",
    "translation": "Alex에게 전화 연결해 주실 수 있나요?",
    "addedDate": "2026-02-20"
  },
  {
    "answer": "leave a message",
    "prefix": "If they're not available, I'll",
    "suffix": ".",
    "meaning": "leave a message",
    "translation": "부재중이면 메시지를 남길게요.",
    "addedDate": "2026-02-20"
  },
  {
    "answer": "get back to",
    "prefix": "I'll",
    "suffix": "you by tomorrow.",
    "meaning": "get back to",
    "translation": "내일까지 답변드릴게요.",
    "addedDate": "2026-02-20"
  },
  {
    "answer": "sync up",
    "prefix": "Let's",
    "suffix": "quickly before we move forward.",
    "meaning": "sync up",
    "translation": "진행하기 전에 잠깐만 빠르게 맞춰보죠.",
    "addedDate": "2026-02-23"
  },
  {
    "answer": "heads up",
    "prefix": "Just a",
    "suffix": ", the deadline has moved up.",
    "meaning": "heads up",
    "translation": "미리 말씀드리면, 마감 일정이 앞당겨졌어요.",
    "addedDate": "2026-02-23"
  },
  {
    "answer": "would you mind reviewing",
    "prefix": "",
    "suffix": "the attached document?",
    "meaning": "would you mind reviewing",
    "translation": "첨부한 문서 검토해 주실 수 있을까요?",
    "addedDate": "2026-02-23"
  },
  {
    "answer": "inform you",
    "prefix": "I'm writing to",
    "suffix": "that the schedule has changed.",
    "meaning": "inform you",
    "translation": "일정 변경을 알려드리기 위해 연락드립니다.",
    "addedDate": "2026-02-23"
  },
  {
    "answer": "look into",
    "prefix": "I'll",
    "suffix": "it and share an update.",
    "meaning": "look into",
    "translation": "제가 확인해보고 업데이트 공유할게요.",
    "addedDate": "2026-02-23"
  },
  {
    "answer": "schedule a call",
    "prefix": "Would you like to",
    "suffix": "to discuss this?",
    "meaning": "schedule a call",
    "translation": "이걸 논의하기 위해 통화 일정을 잡을까요?",
    "addedDate": "2026-02-23"
  },
  {
    "answer": "dive into",
    "prefix": "Let's",
    "suffix": "the details.",
    "meaning": "dive into",
    "translation": "이제 세부 내용으로 들어가 보죠.",
    "addedDate": "2026-02-24"
  },
  {
    "answer": "wrap up",
    "prefix": "Let's",
    "suffix": "here and move to Q&A.",
    "meaning": "wrap up",
    "translation": "여기서 마무리하고 Q&A로 넘어가죠.",
    "addedDate": "2026-02-24"
  },
  {
    "answer": "walk through",
    "prefix": "",
    "suffix": "I'll walk you through the key points.",
    "meaning": "walk through",
    "translation": "핵심 포인트를 차근차근 설명드릴게요.",
    "addedDate": "2026-02-24"
  }
];
