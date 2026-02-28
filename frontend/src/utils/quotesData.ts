export const quotes: string[] = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "Believe you can and you're halfway there.",
  "Education is the most powerful weapon which you can use to change the world.",
  "The more that you read, the more things you will know.",
  "Learning is not attained by chance; it must be sought for with ardor and attended to with diligence.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "An investment in knowledge pays the best interest.",
  "Study hard, for the well is deep, and our brains are shallow.",
  "The expert in anything was once a beginner.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big days.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't wait for opportunity. Create it.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "The key to success is to focus on goals, not obstacles.",
  "Dream bigger. Do bigger.",
  "You don't have to be great to start, but you have to start to be great.",
  "Opportunities don't happen, you create them.",
  "Your limitation—it's only your imagination.",
  "Sometimes later becomes never. Do it now.",
  "Great minds discuss ideas; average minds discuss events; small minds discuss people.",
  "Strive for progress, not perfection.",
  "You are braver than you believe, stronger than you seem, and smarter than you think.",
  "The only way to do great work is to love what you do.",
  "It always seems impossible until it's done.",
  "Hardships often prepare ordinary people for an extraordinary destiny.",
];

export function getQuoteOfTheDay(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return quotes[dayOfYear % quotes.length];
}
