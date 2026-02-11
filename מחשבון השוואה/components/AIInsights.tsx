
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SummaryData, SolarInputs, StockInputs } from '../types';
import { formatCurrency } from '../utils/calculations';

interface AIInsightsProps {
  summary: SummaryData;
  solar: SolarInputs;
  stock: StockInputs;
}

const AIInsights: React.FC<AIInsightsProps> = ({ summary, solar, stock }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        נתח את נתוני ההשקעה הבאים בעברית עבור משקיע פוטנציאלי:
        - השקעה בסולאר: ${solar.cost}₪, רווח צפוי שנה א': ${solar.revenueY1}₪.
        - הצמדה למדד: ${solar.isIndexed ? `כן (${solar.inflationRate}%)` : 'לא'}.
        - השקעה בשוק ההון: ${stock.initial}₪, תשואה שנתית: ${stock.yield}%.
        - תקופה: ${solar.years} שנים.
        
        תוצאות סופיות (כולל קרן והצמדה):
        1. סולאר בלבד (תקבולים נטו): ${formatCurrency(summary.solarTotalValue)}
        2. בורסה בלבד (לאחר מס): ${formatCurrency(summary.stockTotalValue)}
        3. היברידי (סולאר מושקע בבורסה): ${formatCurrency(summary.hybridTotalValue)}
        
        אנא ספק:
        1. מהי האופציה המנצחת ולמה?
        2. ניתוח סיכונים קצר (למשל תנודתיות שוק מול בלאי מערכת והגנה אינפלציונית).
        3. המלצה פרקטית למשקיע שרוצה לשלב ביטחון וצמיחה.
        כתוב בנימה מקצועית, אופטימית וקצרה. השתמש בסימני Markdown.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setInsight(response.text || "לא ניתן היה להפיק ניתוח כרגע.");
    } catch (error) {
      console.error("AI Insight Error:", error);
      setInsight("אופס! חלה שגיאה בחיבור לבינה המלאכותית. וודא שהגדרת API_KEY ב-Netlify.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          ✨ ניתוח AI חכם
        </h3>
        <button 
          onClick={generateInsight}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-l from-indigo-600 to-blue-600 text-white rounded-lg font-medium shadow-md hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              מנתח...
            </>
          ) : 'קבל תובנות מהירות'}
        </button>
      </div>
      
      {insight ? (
        <div className="prose prose-slate max-w-none text-right text-slate-700 leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: insight.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        </div>
      ) : (
        <p className="text-slate-500 text-center py-4 text-sm">לחץ על הכפתור כדי לקבל ניתוח עומק של הנתונים בעזרת Gemini.</p>
      )}
    </div>
  );
};

export default AIInsights;
