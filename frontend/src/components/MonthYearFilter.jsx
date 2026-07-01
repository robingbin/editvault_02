import React from 'react';
import { Calendar } from 'lucide-react';
import { MONTH_LABEL, availableYears } from '../mock';

export default function MonthYearFilter({ month, year, onChange, className = '' }) {
  const years = availableYears();
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Calendar className="w-4 h-4 text-[#6b8788]" />
      <select
        value={month}
        onChange={(e) => onChange({ month: Number(e.target.value), year })}
        className="focus-teal bg-[#0a1112] border border-[#243334] text-sm text-[#e6f7f6] rounded-md px-2.5 py-1.5 transition-colors"
      >
        <option value={0}>All months</option>
        {MONTH_LABEL.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onChange({ month, year: Number(e.target.value) })}
        className="focus-teal bg-[#0a1112] border border-[#243334] text-sm text-[#e6f7f6] rounded-md px-2.5 py-1.5 transition-colors"
      >
        {years.map((y) => (<option key={y} value={y}>{y}</option>))}
      </select>
    </div>
  );
}
