import { mc } from "./seed";
import type { QuestionSeed } from "./seed";

export const LOGIC_SEEDS: QuestionSeed[] = [
  mc("easy", "Which word does not belong: Apple, Banana, Carrot, Grape?", "Carrot", ["Apple", "Banana", "Grape"]),
  mc("easy", "What comes next in the pattern: A, C, E, G, ?", "I", ["H", "J", "F"]),
  mc("easy", "If all cats are animals, and Tom is a cat, what is Tom?", "An animal", ["A dog", "Not an animal", "A plant"]),
  mc("easy", "Which shape has the most sides: triangle, square, pentagon?", "Pentagon", ["Square", "Triangle", "They're equal"]),
  mc("easy", "What is the opposite of 'hot'?", "Cold", ["Warm", "Cool", "Mild"]),
  mc("easy", "If today is Monday, what day was it 2 days ago?", "Saturday", ["Sunday", "Friday", "Tuesday"]),
  mc("easy", "Which number is the odd one out: 2, 4, 6, 7, 8?", "7", ["2", "4", "6"]),
  mc("easy", "Complete the analogy: Bird is to Sky as Fish is to ___.", "Water", ["Land", "Air", "Tree"]),
  mc("medium", "Five people finish a race. Sam finishes before Jo but after Max. Max finishes before Sam but after Lee. Who finishes first?", "Lee", ["Max", "Sam", "Jo"]),
  mc("medium", "Some roses are red. All red things are bright. Which statement must be true?", "Only the red roses are bright", ["All roses are bright", "No roses are bright", "All bright things are roses"]),
  mc("medium", "What number comes next: 1, 4, 9, 16, 25, ?", "36", ["30", "32", "49"]),
  mc("medium", "A is taller than B. B is taller than C. Who is the shortest?", "C", ["A", "B", "Cannot be determined"]),
  mc("medium", "Which word is spelled the same forwards and backwards: LEVEL, HOUSE, TABLE?", "LEVEL", ["HOUSE", "TABLE", "None of them"]),
  mc("medium", "If it takes 5 machines 5 minutes to make 5 widgets, how long does it take 100 machines to make 100 widgets?", "5 minutes", ["100 minutes", "20 minutes", "1 minute"]),
  mc("medium", "What comes next in the sequence: 3, 6, 12, 24, ?", "48", ["36", "42", "30"]),
  mc("hard", "Three friends split a bill evenly and each pay $10, then get $5 back to share — how much did each actually pay?", "$9", ["$10", "$8", "$9.50"]),
  mc("hard", "With only a 3-liter jug and a 5-liter jug (no markings), can you measure out exactly 4 liters?", "Yes", ["No", "Only with a third jug", "Only if you have a measuring cup"]),
  mc("hard", "All squares are rectangles. Some rectangles are not squares. Is every rectangle a square?", "No", ["Yes", "Only large rectangles", "Cannot be determined"]),
  mc("hard", "What is the missing number: 2, 6, 12, 20, 30, ?", "42", ["36", "40", "44"]),
  mc("expert", "A man looks at a photo and says, 'I have no brothers, but that man's father is my father's son.' Who is in the photo?", "His own son", ["His father", "Himself", "His nephew"]),
  mc("expert", "If you rearrange the letters 'CIFAIPC' you get the name of a(n):", "Ocean (Pacific)", ["Country", "Animal", "Planet"]),
  mc("expert", "Two trains 60 miles apart approach each other at 15 mph each. How long until they meet?", "2 hours", ["1 hour", "4 hours", "3 hours"]),
];
