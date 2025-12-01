// scriptEngine_v1.js
// Hybrid Smart-Hype Script Engine – CTO Mode
// Generates thousands of variations dynamically

import fetch from "node-fetch";

const OPENERS = [
  "You're gonna love this one.",
  "This thing is blowing up everywhere.",
  "Stop scrolling. This is worth it.",
  "I didn’t believe it until I tried it.",
  "Here’s what everyone is suddenly talking about.",
  "If you want something that actually works, check this out.",
  "You’re seeing this everywhere for a reason."
];

const PROBLEM_FRAMES = [
  "Most people struggle with this every single day.",
  "Everyone has this problem but nobody knows the fix.",
  "This is something we all wish worked better.",
  "People waste so much money trying to solve this.",
  "You already know how annoying this issue is."
];

const SOLUTION_FRAMES = [
  "This solves it instantly.",
  "This is the easiest fix I’ve seen.",
  "This is actually smart.",
  "Finally something that makes sense.",
  "This actually does what it says."
];

const BENEFIT_FRAMES = [
  "It saves you money.",
  "It saves a ton of time.",
  "It just makes your day smoother.",
  "It actually makes life easier.",
  "The results show fast."
];

const CTA_LINES = [
  "I dropped the link for you.",
  "Link’s in the description.",
  "Grab it before the price jumps.",
  "Had to share this one.",
  "Check the link, thank me later."
];

// Micro-variations for natural language
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Small twist injections
const MICRO_TWISTS = [
  "no fluff.",
  "I keep it real.",
  "here’s the truth.",
  "you know I don’t recommend trash.",
  "this one surprised me."
];

export function generateScript({ keyword, category }) {
  const opener = pick(OPENERS);
  const problem = pick(PROBLEM_FRAMES);
  const solution = pick(SOLUTION_FRAMES);
  const benefit = pick(BENEFIT_FRAMES);
  const twist = pick(MICRO_TWISTS);
  const cta = pick(CTA_LINES);

  // Final dynamic script assembly
  const text = `
${opener}
People are going crazy over "${keyword}" right now.
${problem}
But ${twist} ${solution}
The best part is that ${benefit}
If you want to check it out, ${cta}
  `.trim();

  return {
    category,
    keyword,
    script: text
  };
}