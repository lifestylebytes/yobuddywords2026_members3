// questions.js

const QUESTIONS = [
  {
    "answer": "hand off",
    "prefix": "I want to double-check if we need to review this before we",
    "suffix": ".",
    "meaning": "",
    "translation": "넘기기 전에 이걸 검토해야 하는지 다시 한번 확인하고 싶어요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "by any chance",
    "prefix": "",
    "suffix": ", would you mind checking the message I sent earlier?",
    "meaning": "",
    "translation": "혹시, 제가 아까 보낸 메시지 확인해 주실 수 있을까요?",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "out of scope",
    "prefix": "I really don't like it when we need to support tasks that are actually",
    "suffix": ".",
    "meaning": "",
    "translation": "사실 범위 밖인 일을 지원해야 할 때 정말 별로예요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "loop in",
    "prefix": "Could you",
    "suffix": "the whole team for further discussion?",
    "meaning": "",
    "translation": "추가 논의를 위해 팀 전체를 포함시켜 줄 수 있을까요?",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "touch base",
    "prefix": "I'd like to",
    "suffix": "before the meeting.",
    "meaning": "",
    "translation": "회의 전에 간단히 한번 연락하고 싶어요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "follow up",
    "prefix": "Let me",
    "suffix": "on that and get back to you.",
    "meaning": "",
    "translation": "그 부분은 제가 후속 확인하고 다시 연락드릴게요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "That reminds me",
    "prefix": "Oh,",
    "suffix": ". I promised myself I'd stop being a coffee addict... starting tomorrow!",
    "meaning": "",
    "translation": "아, 그거 보니 생각났는데. 커피 중독 끊겠다고 나 자신과 약속했거든… 내일부터!",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "I've been meaning to",
    "prefix": "",
    "suffix": "talk to you, but my brain needs a caffeine jumpstart before it completely shuts down!",
    "meaning": "",
    "translation": "너랑 얘기하려고 했는데, 뇌가 완전히 꺼지기 전에 카페인으로 시동을 좀 걸어야겠어!",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "Same old, same old",
    "prefix": "",
    "suffix": ", pretty busy these days. How about you?",
    "meaning": "",
    "translation": "늘 똑같지 뭐, 요즘 꽤 바빠. 너는 어때?",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "One thing to consider is",
    "prefix": "",
    "suffix": "our team's bandwidth.",
    "meaning": "",
    "translation": "고려해볼 점은 우리 팀의 여유(리소스)예요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "From my perspective",
    "prefix": "",
    "suffix": ", the schedule is a bit tight, so we may not reach the goal we set at the beginning of this week.",
    "meaning": "",
    "translation": "제 관점에서는 일정이 조금 타이트해서, 이번 주 초에 세운 목표를 달성하지 못할 수도 있어요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "I might be wrong",
    "prefix": "",
    "suffix": ", but could you have another pair of eyes look at the document?",
    "meaning": "",
    "translation": "제가 틀릴 수도 있지만, 이 문서 한번 더 봐주실 수 있을까요?",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "tight deadlines",
    "prefix": "We already have a lot of tasks on our plate with",
    "suffix": ".",
    "meaning": "",
    "translation": "우리는 이미 촉박한 마감이 있는 업무가 많이 쌓여 있어요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "prioritizing",
    "prefix": "I am",
    "suffix": "tasks that have already been scheduled.",
    "meaning": "",
    "translation": "이미 일정이 잡혀 있는 업무에 우선순위를 두고 있어요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "bandwidth",
    "prefix": "We can assign this task to someone who has enough",
    "suffix": ".",
    "meaning": "",
    "translation": "이 업무는 여유가 있는 사람에게 배정할 수 있어요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "run into",
    "prefix": "We've",
    "suffix": "an issue with the timeline.",
    "meaning": "",
    "translation": "일정과 관련해 문제가 생겼어요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "tackle",
    "prefix": "Let's",
    "suffix": "this problem first.",
    "meaning": "",
    "translation": "이 문제부터 먼저 해결해 봅시다.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "work around",
    "prefix": "Let's find a",
    "suffix": "for now.",
    "meaning": "",
    "translation": "일단은 임시 대안을 찾아보죠.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "action items",
    "prefix": "I'll send the",
    "suffix": "after the meeting.",
    "meaning": "",
    "translation": "회의 후 실행 항목을 공유할게요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "next steps",
    "prefix": "Let's confirm the",
    "suffix": "by EOD.",
    "meaning": "",
    "translation": "오늘 업무 종료 전까지 다음 단계를 확정하죠.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "FYI",
    "prefix": "",
    "suffix": ", I've shared the updated deck.",
    "meaning": "",
    "translation": "참고로, 업데이트된 발표 자료를 공유했어요.",
    "addedDate": "2026-02-09"
  },
  {
    "answer": "put through",
    "prefix": "",
    "suffix": "Could you put me through to Alex?",
    "meaning": "",
    "translation": "Alex에게 전화 연결해 주실 수 있나요?",
    "addedDate": "2026-02-10"
  },
  {
    "answer": "leave a message",
    "prefix": "If they're not available, I'll",
    "suffix": ".",
    "meaning": "",
    "translation": "부재중이면 메시지를 남길게요.",
    "addedDate": "2026-02-10"
  },
  {
    "answer": "get back to",
    "prefix": "I'll",
    "suffix": "you by tomorrow.",
    "meaning": "",
    "translation": "내일까지 답변드릴게요.",
    "addedDate": "2026-02-10"
  },
  {
    "answer": "sync up",
    "prefix": "Let's",
    "suffix": "quickly before we move forward.",
    "meaning": "",
    "translation": "진행하기 전에 잠깐만 빠르게 맞춰보죠.",
    "addedDate": "2026-02-11"
  },
  {
    "answer": "heads up",
    "prefix": "Just a",
    "suffix": ", the deadline has moved up.",
    "meaning": "",
    "translation": "미리 말씀드리면, 마감 일정이 앞당겨졌어요.",
    "addedDate": "2026-02-11"
  },
  {
    "answer": "would you mind reviewing",
    "prefix": "",
    "suffix": "the attached document?",
    "meaning": "",
    "translation": "첨부한 문서 검토해 주실 수 있을까요?",
    "addedDate": "2026-02-11"
  },
  {
    "answer": "inform you",
    "prefix": "I'm writing to",
    "suffix": "that the schedule has changed.",
    "meaning": "",
    "translation": "일정 변경을 알려드리기 위해 연락드립니다.",
    "addedDate": "2026-02-11"
  },
  {
    "answer": "look into",
    "prefix": "I'll",
    "suffix": "it and share an update.",
    "meaning": "",
    "translation": "제가 확인해보고 업데이트 공유할게요.",
    "addedDate": "2026-02-11"
  },
  {
    "answer": "schedule a call",
    "prefix": "Would you like to",
    "suffix": "to discuss this?",
    "meaning": "",
    "translation": "이걸 논의하기 위해 통화 일정을 잡을까요?",
    "addedDate": "2026-02-11"
  },
  {
    "answer": "dive into",
    "prefix": "Let's",
    "suffix": "the details.",
    "meaning": "",
    "translation": "이제 세부 내용으로 들어가 보죠.",
    "addedDate": "2026-02-12"
  },
  {
    "answer": "wrap up",
    "prefix": "Let's",
    "suffix": "here and move to Q&A.",
    "meaning": "",
    "translation": "여기서 마무리하고 Q&A로 넘어가죠.",
    "addedDate": "2026-02-12"
  },
  {
    "answer": "walk through",
    "prefix": "",
    "suffix": "I'll walk you through the key points.",
    "meaning": "",
    "translation": "핵심 포인트를 차근차근 설명드릴게요.",
    "addedDate": "2026-02-12"
  }
];
