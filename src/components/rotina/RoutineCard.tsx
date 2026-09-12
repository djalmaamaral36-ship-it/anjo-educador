import React from 'react';

interface Props {
  id: string;
  title: string;
  icon: string;
  badge: string;
  badgeColor?: string;
  summary: string;
  details?: string[];
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export default function RoutineCard({
  title,
  icon,
  badge,
  badgeColor = 'bg-slate-100 text-slate-700',
  summary,
  details = [],
  actionLabel,
  onAction,
  children,
}: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{icon}</span>
            <h4 className="font-black text-slate-800 text-base sm:text-lg">{title}</h4>
          </div>
          <span className={`text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeColor}`}>
            {badge}
          </span>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
            {summary}
          </p>
        </div>

        {details.length > 0 && (
          <ul className="space-y-1.5 pl-1">
            {details.map((item, index) => (
              <li key={index} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {children}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-black text-xs transition cursor-pointer active:scale-98"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
