import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("❌ VITE_ANTHROPIC_API_KEY not found in .env.local");
  process.exit(1);
}

const client = new Anthropic({ apiKey });

async function generateTriviaQuestions(category: string, count: number = 15) {
  console.log(`\n📚 Generating ${count} ${category} trivia questions...\n`);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `Generate ${count} multiple-choice trivia questions in the ${category} category.
Format EXACTLY like this (one per line):
mc("difficulty", "Question text?", "Correct answer", ["Wrong 1", "Wrong 2", "Wrong 3"])

- Mix easy/medium/hard questions
- Make questions interesting and specific
- Ensure correct answers are unambiguous
- Vary the question styles`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  console.log(text);
  console.log("\n✅ Copy the above into your question file\n");
}

async function generateChessQuestions(count: number = 10) {
  console.log(`\n♟️  Generating ${count} chess trivia questions...\n`);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `Generate ${count} multiple-choice chess trivia questions for intermediate+ players.
Format EXACTLY like this (one per line):
mc("difficulty", "Question text?", "Correct answer", ["Wrong 1", "Wrong 2", "Wrong 3"])

Topics: famous games, openings, endgames, chess history, famous players, tactics.
- Mix easy/medium/hard
- Make answers specific and educational
- Ensure only ONE correct answer`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  console.log(text);
  console.log("\n✅ Copy the above into your chess questions file\n");
}

async function generateLogicPatterns(count: number = 8) {
  console.log(
    `\n🧩 Generating ${count} logic/pattern sequence questions...\n`
  );

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `Generate ${count} sequence pattern questions (like "what comes next?") as multiple choice.
Format EXACTLY like this (one per line):
mc("difficulty", "Sequence: 2, 4, 8, 16, __?", "32", ["30", "24", "64"])

Types: arithmetic, geometric, fibonacci, squares, primes, alternating, etc.
- Mix easy/medium/hard/expert difficulty
- Each should have ONE clearly correct answer
- Distractors should be plausible but wrong`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  console.log(text);
  console.log("\n✅ Copy the above into your logic questions\n");
}

async function generateDirectionQuestions(count: number = 12) {
  console.log(`\n🗺️  Generating ${count} direction/navigation questions...\n`);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `Generate ${count} geography/direction questions about real places and routes.
Format EXACTLY like this (one per line):
mc("difficulty", "If traveling from Paris to Berlin, which direction is mostly north/east/etc?", "Northeast", ["Northwest", "Southeast", "South"])

- Include famous landmarks, cities, countries
- Ask about: directions between places, which way is closest, distances
- Mix difficulty levels
- Ensure factually accurate answers`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  console.log(text);
  console.log("\n✅ Copy the above into your direction questions\n");
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const gameType = args[0] || "all";
    const count = parseInt(args[1] || "15", 10);

    if (gameType === "trivia" || gameType === "all") {
      await generateTriviaQuestions("history", count);
      await generateTriviaQuestions("science", count);
    }

    if (gameType === "chess" || gameType === "all") {
      await generateChessQuestions(count);
    }

    if (gameType === "logic" || gameType === "all") {
      await generateLogicPatterns(count);
    }

    if (gameType === "direction" || gameType === "all") {
      await generateDirectionQuestions(count);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
