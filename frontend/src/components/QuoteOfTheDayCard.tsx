import { getQuoteOfTheDay } from '../utils/quotesData';
import { Quote } from 'lucide-react';

export default function QuoteOfTheDayCard() {
  const quote = getQuoteOfTheDay();

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-accent p-4 md:p-5 text-white">
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <Quote className="w-full h-full" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
        ✨ Quote of the Day
      </p>
      <p className="text-sm md:text-base font-medium italic leading-relaxed text-white/95 relative z-10">
        "{quote}"
      </p>
    </div>
  );
}
