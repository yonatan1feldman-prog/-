
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ResultsCards from './components/ResultsCards';
import ComparisonChart from './components/ComparisonChart';
import { SolarInputs, StockInputs } from './types';
import { calculateFinancials } from './utils/calculations';

const App: React.FC = () => {
  const [solar, setSolar] = useState<SolarInputs>({
    cost: 50000,
    revenueY1: 8500,
    maintenance: 1000,
    maintenanceItems: [
      { id: 'initial-maint', label: '2 שטיפות ע"י בעל מקצוע', value: 1000 }
    ],
    misc: 0,
    miscItems: [],
    years: 25,
    isIndexed: true,
    inflationRate: 2.5
  });

  const [stock, setStock] = useState<StockInputs>({
    initial: 50000,
    yield: 4.5,
    managementFee: 0.7,
    taxRate: 25.0
  });

  const results = useMemo(() => calculateFinancials(solar, stock), [solar, stock]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      <aside className="w-full md:w-[350px] lg:w-[400px] md:h-screen md:sticky md:top-0 p-4 md:p-6 overflow-hidden">
        <Sidebar 
          solar={solar} 
          setSolar={setSolar} 
          stock={stock} 
          setStock={setStock} 
        />
      </aside>

      <main className="flex-1 p-4 md:p-8 lg:p-12 space-y-8 max-w-7xl mx-auto w-full">
        <header className="mb-8 text-right">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2 leading-tight">
            ☀️ מחשבון השוואה: מערכת סולארית מול שוק ההון 📈
          </h1>
          <p className="text-slate-500 max-w-2xl">
            כלי מתקדם להשוואת השקעה במערכת סולארית לבין תיק מניות. 
            בחישוב זה, רווחי הסולאר מוצגים ומושקעים **רק לאחר החזר מלא של עלות המערכת**.
          </p>
        </header>

        <ResultsCards summary={results.summary} years={solar.years} />
        
        <ComparisonChart data={results.data} />
        
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <h3 className="text-xl font-bold text-slate-800 mb-6">פירוט שנתי (טבלה)</h3>
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b">
                <th className="p-3 font-medium">שנה</th>
                <th className="p-3 font-medium">רווח סולאר (לאחר החזר)</th>
                <th className="p-3 font-medium">שווי תיק בורסה (ברוטו)</th>
                <th className="p-3 font-medium">שווי תיק היברידי (לאחר החזר)</th>
                <th className="p-3 font-medium">רווח סולאר מצטבר</th>
              </tr>
            </thead>
            <tbody>
              {results.data.map((row) => (
                <tr key={row.year} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-3">{row.year}</td>
                  <td className="p-3 font-medium text-blue-600">
                    {row.solarNetYear > 0 ? `₪${row.solarNetYear.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3 font-medium text-emerald-600">₪{row.stockValueGross.toLocaleString()}</td>
                  <td className="p-3 font-medium text-amber-600">
                    {row.hybridValueGross > 0 ? `₪${row.hybridValueGross.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3 text-slate-400">
                    {row.solarCumulativeFlow > 0 ? `₪${row.solarCumulativeFlow.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        
        <footer className="text-center text-slate-400 text-sm py-8 border-t border-slate-200">
          * כל הנתונים הינם הערכה בלבד. רווח סולארי מוצג רק לאחר שסך התקבולים מכסה את עלות ההקמה.
        </footer>
      </main>
    </div>
  );
};

export default App;
