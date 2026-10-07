/* therese.ts frames 2-8. Frame 1 is the static markup inside .code-card, so it
   has exactly one source. Budget per frame: at most 37 characters per line (the
   cursor takes the 38th cell, the most that fits at 320px and 901px) and at most
   14 lines (the card's height today). Run `npm run frames` in portfolio-tools after any
   edit. Every value is a quoted string, so only the existing .k .p .s .c syntax
   colours are needed. */
window.THERESE_FRAMES = [
`const therese = {
  builds: "AI agents + workflows",
  with: [
    "Claude Agent SDK", "MCP",
    "Claude API", "n8n"
  ],
  shipped: [
    "a grounded voice agent",
    "lead research + triage",
    "a content pipeline",
    "an n8n reporting flow"
  ]
};`,

`const therese = {
  degree: "B.Sc. Computer Science",
  result: "First Class, 4.85/5.0",
  school: "Pan-Atlantic University",
  thesis: {
    task: "hypertension detection",
    inputs: "ECG, retina, clinical",
    accuracy: "91.45%"
  },
  intern: "AI & Data, Deloitte NG"
};

// graduated june 2026`,

`const therese = {
  featured: "RelayPay Voice Support",
  type: "voice agent, demo build",
  answers: "grounded in its KB",
  evals: "15/34 → 31/34 passing",
  first_words: "~1.4s (p50)",
  per_turn: "~$0.003 model spend",
  stack: [
    "Agent SDK", "MCP", "Vapi"
  ]
};

// try it: see projects below`,

`const therese = {
  principles: {
    limits: "hard caps, in code",
    grounding: "cite what was read",
    approval: "a human signs off",
    tests: "162 on the lead agent"
  },
  evidence: "github.com/teembama"
};

// guardrails live in code,
// not in the prompt`,

`const therese = {
  ai: ["Claude", "Agent SDK", "MCP"],
  automation: [
    "n8n", "Apify", "Firecrawl"
  ],
  backend: [
    "Node", "Django", "FastAPI"
  ],
  data: ["Supabase", "PostgreSQL"],
  mobile: ["React Native", "Expo"],
  ships_on: ["Vercel", "Railway"]
};`,

`const therese = {
  currently: "Mobile Engineer",
  at: "ShareCar (CodeReset)",
  since: "April 2026",
  shipped: [
    "booking system rebuild",
    "end-to-end KYC flow",
    "server-side OTP migration"
  ]
};

// shipping to production`,

`const therese = {
  status: "open to roles",
  roles: [
    "AI automation engineer",
    "agent engineer",
    "full-stack engineer"
  ],
  remote: "yes, open to it",
  based: "Lagos, Nigeria",
  email: "mbamatherese2005@gmail.com"
};

// say hello ↓ #contact`
];
