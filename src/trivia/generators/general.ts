import type { Rng } from "../../game/rng";
import { buildChoices, pick } from "../utils";
import type { TriviaDifficulty, TriviaQuestion } from "../types";

interface Fact {
  prompt: string;
  correct: string;
  distractors: string[];
}

const FACTS: Fact[] = [
  // Geography
  { prompt: "What is the largest ocean on Earth?", correct: "Pacific Ocean", distractors: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] },
  { prompt: "What is the longest river in the world?", correct: "Nile", distractors: ["Amazon", "Yangtze", "Mississippi"] },
  { prompt: "What is the capital of France?", correct: "Paris", distractors: ["London", "Berlin", "Rome"] },
  { prompt: "What is the largest continent by area?", correct: "Asia", distractors: ["Africa", "North America", "Europe"] },
  { prompt: "Which desert is the largest in the world?", correct: "Sahara", distractors: ["Gobi", "Mojave", "Kalahari"] },
  { prompt: "What is the smallest country in the world?", correct: "Vatican City", distractors: ["Monaco", "San Marino", "Liechtenstein"] },
  { prompt: "Which mountain is the tallest in the world?", correct: "Mount Everest", distractors: ["K2", "Kilimanjaro", "Denali"] },
  { prompt: "What is the capital of Japan?", correct: "Tokyo", distractors: ["Kyoto", "Osaka", "Seoul"] },
  // Science
  { prompt: "What gas do plants absorb from the atmosphere for photosynthesis?", correct: "Carbon dioxide", distractors: ["Oxygen", "Nitrogen", "Hydrogen"] },
  { prompt: "What is the closest planet to the sun?", correct: "Mercury", distractors: ["Venus", "Earth", "Mars"] },
  { prompt: "What is the chemical symbol for water?", correct: "H2O", distractors: ["CO2", "O2", "NaCl"] },
  { prompt: "How many bones are in the adult human body?", correct: "206", distractors: ["186", "226", "246"] },
  { prompt: "What is the speed of light approximately?", correct: "300,000 km/s", distractors: ["150,000 km/s", "30,000 km/s", "3,000,000 km/s"] },
  { prompt: "What part of the cell contains its genetic material?", correct: "Nucleus", distractors: ["Mitochondria", "Cytoplasm", "Ribosome"] },
  { prompt: "What is the hardest natural substance on Earth?", correct: "Diamond", distractors: ["Gold", "Quartz", "Iron"] },
  { prompt: "Which planet is known as the Red Planet?", correct: "Mars", distractors: ["Venus", "Jupiter", "Saturn"] },
  // History
  { prompt: "In what year did World War II end?", correct: "1945", distractors: ["1939", "1944", "1950"] },
  { prompt: "Who was the first President of the United States?", correct: "George Washington", distractors: ["Thomas Jefferson", "Abraham Lincoln", "John Adams"] },
  { prompt: "Which ancient civilization built the pyramids of Giza?", correct: "Egyptians", distractors: ["Romans", "Greeks", "Mayans"] },
  { prompt: "In what year did humans first land on the Moon?", correct: "1969", distractors: ["1965", "1972", "1959"] },
  { prompt: "Who wrote the theory of relativity?", correct: "Albert Einstein", distractors: ["Isaac Newton", "Galileo Galilei", "Nikola Tesla"] },
  // Sports
  { prompt: "How many players are on a standard soccer team on the field?", correct: "11", distractors: ["9", "10", "12"] },
  { prompt: "In which sport would you perform a slam dunk?", correct: "Basketball", distractors: ["Volleyball", "Tennis", "Baseball"] },
  { prompt: "How many points is a touchdown worth in American football?", correct: "6", distractors: ["3", "7", "8"] },
  { prompt: "How often are the Summer Olympic Games held?", correct: "Every 4 years", distractors: ["Every 2 years", "Every year", "Every 5 years"] },
  { prompt: "In tennis, what is a score of zero called?", correct: "Love", distractors: ["Ace", "Deuce", "Fault"] },
  // Technology
  { prompt: "What does CPU stand for?", correct: "Central Processing Unit", distractors: ["Computer Power Unit", "Central Program Unit", "Core Processing Utility"] },
  { prompt: "Who co-founded Apple alongside Steve Jobs?", correct: "Steve Wozniak", distractors: ["Bill Gates", "Elon Musk", "Mark Zuckerberg"] },
  { prompt: "What does 'HTTP' stand for?", correct: "HyperText Transfer Protocol", distractors: ["High Transfer Text Protocol", "HyperText Transmission Process", "Host Transfer Text Protocol"] },
  { prompt: "What does 'RAM' stand for in computing?", correct: "Random Access Memory", distractors: ["Read Access Memory", "Rapid Access Module", "Random Allocation Memory"] },
  { prompt: "What company created the Android operating system?", correct: "Google", distractors: ["Apple", "Microsoft", "Samsung"] },
];

export function generateGeneralQuestion(
  _band: number,
  difficulty: TriviaDifficulty,
  rng: Rng,
  id: number,
): TriviaQuestion {
  const fact = pick(FACTS, rng);
  const { choices, correctIndex } = buildChoices(rng, fact.correct, fact.distractors);
  return { id, category: "general", difficulty, prompt: fact.prompt, choices, correctIndex };
}
