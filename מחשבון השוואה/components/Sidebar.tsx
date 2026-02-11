
import React, { useState } from 'react';
import { SolarInputs, StockInputs, CostItem } from '../types';

interface SidebarProps {
  solar: SolarInputs;
  setSolar: (s: SolarInputs) => void;
  stock: StockInputs;
  setStock: (s: StockInputs) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ solar, setSolar, stock, setStock }) => {
  const updateSolar = (key: keyof SolarInputs, value: any) => {
    const newSolar = { ...solar, [key]: value };
    setSolar(newSolar);
    
    if (key === 'cost') {
      setStock({ ...stock, initial: value });
    }
  };

  const updateStock = (key: keyof StockInputs, value: any) => {
    setStock({ ...stock, [key]: value });
  };

  const handleItemsChange = (key: 'maintenanceItems' | 'miscItems', items: CostItem[]) => {
    const sum = items.reduce((acc, item) => acc + item.value, 0);
    const totalKey = key === 'maintenanceItems' ? 'maintenance' : 'misc';
    setSolar({
      ...solar,
      [key]: items,
      [totalKey]: sum
    });
  };

  const maintenancePresets = [
    { label: '2 שטיפות ע"י בעל מקצוע', value: 1000 },
    { label: '3 שטיפות ע"י בעל מקצוע (אזור מאובק)', value: 1500 },
    { label: 'ביטוח מערכת', value: 400 },
  ];

  const miscPresets = [
    { label: 'ממיר חדש', value: 5300, year: 12 },
    { label: 'בדיקה תקופתית', value: 700, year: 5 },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          ☀️ נתוני מערכת סולארית
        </h2>
        <div className="space-y-6">
          <InputGroup label="עלות מערכת (₪)" value={solar.cost} onChange={(v) => updateSolar('cost', v)} step={1000} />
          <InputGroup label="תפוקה שנתית שנה א' (₪)" value={solar.revenueY1} onChange={(v) => updateSolar('revenueY1', v)} step={100} />
          
          <MultiCostInput 
            label="עלויות תחזוקה שנתית" 
            items={solar.maintenanceItems} 
            presets={maintenancePresets}
            onChange={(items) => handleItemsChange('maintenanceItems', items)}
            showYear={false}
          />

          <MultiCostInput 
            label="עלויות נוספות (חד פעמי)" 
            items={solar.miscItems} 
            presets={miscPresets}
            onChange={(items) => handleItemsChange('miscItems', items)}
            showYear={true}
          />
          
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-blue-800 cursor-pointer select-none" htmlFor="isIndexed">
                הצמדה למדד המחירים
              </label>
              <input 
                type="checkbox" 
                id="isIndexed"
                className="w-5 h-5 accent-blue-600 rounded"
                checked={solar.isIndexed}
                onChange={(e) => updateSolar('isIndexed', e.target.checked)}
              />
            </div>
            {solar.isIndexed && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <InputGroup 
                  label="עליית מדד שנתית ממוצעת (%)" 
                  value={solar.inflationRate} 
                  onChange={(v) => updateSolar('inflationRate', v)} 
                  step={0.1} 
                />
              </div>
            )}
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-sm font-medium text-slate-600 flex justify-between">
              <span>תקופת השקעה (שנים)</span>
              <span className="font-bold">{solar.years}</span>
            </label>
            <input 
              type="range" min="5" max="30" step="1" 
              className="w-full accent-blue-600" 
              value={solar.years} 
              onChange={(e) => updateSolar('years', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-8 border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          📈 נתוני שוק ההון
        </h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 block">השקעה ראשונית (₪)</label>
            <input
              type="number"
              value={stock.initial}
              readOnly
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-400">מושפע אוטומטית מעלות המערכת</p>
          </div>
          <InputGroup label="תשואה שנתית (%)" value={stock.yield} onChange={(v) => updateStock('yield', v)} step={0.1} />
          <InputGroup label="דמי ניהול (%)" value={stock.managementFee} onChange={(v) => updateStock('managementFee', v)} step={0.1} />
          <InputGroup label="מס רווחי הון (%)" value={stock.taxRate} onChange={(v) => updateStock('taxRate', v)} step={1} />
        </div>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{ label: string, value: number, onChange: (v: number) => void, step?: number }> = ({ label, value, onChange, step = 1 }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-600 block">{label}</label>
    <input
      type="number"
      value={value}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    />
  </div>
);

const MultiCostInput: React.FC<{ 
  label: string, 
  items: CostItem[], 
  presets: { label: string, value: number, year?: number }[],
  onChange: (items: CostItem[]) => void,
  showYear?: boolean
}> = ({ label, items, presets, onChange, showYear }) => {
  const [manualLabel, setManualLabel] = useState('');
  const [manualValue, setManualValue] = useState<number | ''>('');
  const [manualYear, setManualYear] = useState<number | ''>(1);

  const addItem = (itemLabel: string, itemValue: number, itemYear?: number) => {
    const newItem: CostItem = {
      id: Math.random().toString(36).substr(2, 9),
      label: itemLabel,
      value: itemValue,
      year: itemYear
    };
    onChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleManualAdd = () => {
    if (manualLabel && manualValue !== '') {
      addItem(manualLabel, Number(manualValue), showYear ? Number(manualYear) : undefined);
      setManualLabel('');
      setManualValue('');
      if (showYear) setManualYear(1);
    }
  };

  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">₪{total.toLocaleString()}</span>
      </div>
      
      {/* Presets Grid */}
      <div className="grid grid-cols-1 gap-1.5">
        {presets.map((p, i) => (
          <button 
            key={i} 
            onClick={() => addItem(p.label, p.value, p.year || (showYear ? 1 : undefined))}
            className="text-[11px] text-right px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group flex justify-between items-center"
          >
            <div className="flex flex-col text-right">
              <span className="group-hover:text-blue-700">{p.label}</span>
              {p.year && <span className="text-[9px] text-slate-400">ברירת מחדל: שנה {p.year}</span>}
            </div>
            <span className="font-bold text-slate-500 group-hover:text-blue-600">₪{p.value.toLocaleString()} +</span>
          </button>
        ))}
      </div>

      {/* Manual Input */}
      <div className="space-y-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
        <div className="flex flex-wrap gap-2">
          <input 
            type="text" 
            placeholder="תיאור..."
            className="flex-1 min-w-[120px] text-xs px-2 py-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
            value={manualLabel}
            onChange={(e) => setManualLabel(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="סכום"
            className="w-16 text-xs px-2 py-2 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
          />
          <button 
            onClick={handleManualAdd}
            className="px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-bold"
          >
            הוסף
          </button>
        </div>
        
        {showYear && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
               <label className="text-[10px] font-bold text-slate-500 whitespace-nowrap">בחר שנה לתוספת העלות:</label>
               <input 
                type="number" 
                placeholder="שנה"
                className="w-14 text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                value={manualYear}
                min={1}
                max={30}
                onChange={(e) => setManualYear(e.target.value === '' ? '' : parseInt(e.target.value))}
              />
            </div>
            <p className="text-[9px] text-blue-500 font-medium">כאן בוחרים את השנה שבה תתווסף העלות לתחשיב</p>
          </div>
        )}
      </div>

      {/* Selected Items List */}
      {items.length > 0 && (
        <ul className="space-y-1 mt-2 max-h-32 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between bg-white p-2 rounded text-[11px] border border-slate-100 shadow-sm">
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  ✕
                </button>
                <div className="flex flex-col">
                  <span className="text-slate-700 font-medium">{item.label}</span>
                  {item.year && <span className="text-[9px] text-blue-500">שנה: {item.year}</span>}
                </div>
              </div>
              <span className="font-bold">₪{item.value.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sidebar;
