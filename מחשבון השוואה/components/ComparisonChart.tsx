
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { YearData } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ComparisonChartProps {
  data: YearData[];
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-xl font-bold text-slate-800 mb-6">התפתחות ההון לאורך השנים</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="year" 
              label={{ value: 'שנה', position: 'insideBottom', offset: -5 }} 
              stroke="#64748b"
            />
            <YAxis 
              tickFormatter={(val) => `₪${val / 1000}k`} 
              stroke="#64748b"
            />
            <Tooltip 
              formatter={(val: number) => [formatCurrency(val), '']}
              labelFormatter={(label) => `שנה: ${label}`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <Line 
              name="בורסה (ברוטו)" 
              type="monotone" 
              dataKey="stockValueGross" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              name="היברידי (סולאר מושקע)" 
              type="monotone" 
              dataKey="hybridValueGross" 
              stroke="#f59e0b" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line 
              name="סולאר מצטבר" 
              type="monotone" 
              dataKey="solarCumulativeFlow" 
              stroke="#3b82f6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComparisonChart;
