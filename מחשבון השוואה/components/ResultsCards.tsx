
import React from 'react';
import { SummaryData } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ResultsCardsProps {
  summary: SummaryData;
  years: number;
}

const ResultsCards: React.FC<ResultsCardsProps> = ({ summary, years }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card 
        title="מערכת סולארית" 
        subtitle="סך רווח נקי (מעבר לעלות)"
        value={summary.solarTotalValue} 
        color="blue"
        description={`סך הרווח שנשאר ביד לאחר החזר מלא של עלות ההקמה לאורך ${years} שנה.`}
      />
      <Card 
        title="השקעה בבורסה" 
        subtitle="סך הון נמשך (כולל קרן)"
        value={summary.stockTotalValue} 
        color="emerald"
        description="הסכום הסופי שיתקבל במשיכת התיק, כולל הקרן המקורית ולאחר תשלום מס רווחי הון."
      />
      <Card 
        title="היברידי: סולאר + בורסה" 
        subtitle="סך הון בסוף התקופה"
        value={summary.hybridTotalValue} 
        color="amber"
        description="הסכום הסופי הכולל את החזר ההשקעה הראשוני בתוספת רווחי הבורסה שנצברו מהכנסות הסולאר (לאחר מס)."
      />
    </div>
  );
};

const Card: React.FC<{ title: string, subtitle: string, value: number, color: 'blue' | 'emerald' | 'amber', description: string }> = ({ title, subtitle, value, color, description }) => {
  const colorMap = {
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800'
  };

  const textMap = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600'
  };

  return (
    <div className={`p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] cursor-default shadow-sm ${colorMap[color]}`}>
      <h3 className="text-lg font-bold mb-1 opacity-80">{title}</h3>
      <p className="text-sm mb-4 opacity-70">{subtitle}</p>
      <div className={`text-3xl font-black mb-4 ${textMap[color]}`}>
        {formatCurrency(value)}
      </div>
      <p className="text-xs leading-relaxed opacity-60">
        {description}
      </p>
    </div>
  );
};

export default ResultsCards;
