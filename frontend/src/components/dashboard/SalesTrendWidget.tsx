import React from "react";
import { TrendingUp } from "lucide-react";

interface SalesTrendProps {
  salesTrend: Array<{
    date: string;
    revenue: number | string;
    orders: number | string;
  }>;
  currency: string;
}

export default function SalesTrendWidget({ salesTrend, currency }: SalesTrendProps) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Sales Trend Overview</h2>
          <p className="text-xs text-slate-500">Daily revenue and order volume for the past 7 days</p>
        </div>
        <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          7-Day Trend
        </span>
      </div>

      {/* Daily Bar Representation */}
      {salesTrend && salesTrend.length > 0 ? (
        <div className="space-y-3 pt-2">
          {salesTrend.map((day, i) => {
            const maxRev = Math.max(...salesTrend.map((d) => parseFloat(String(d.revenue)) || 1));
            const percentage = Math.min(100, Math.round(((parseFloat(String(day.revenue)) || 0) / maxRev) * 100));

            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{day.date}</span>
                  <span>
                    {currency}{parseFloat(String(day.revenue)).toLocaleString()} ({day.orders} bills)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-xs text-slate-400">
          No transactions recorded in the last 7 days.
        </div>
      )}
    </div>
  );
}
