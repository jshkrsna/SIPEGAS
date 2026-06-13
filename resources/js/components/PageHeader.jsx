import React from 'react'

export default function PageHeader({ title, description, icon, action }) {
    return (
        <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 flex items-center justify-center">{icon}</span>
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
                    {description && <p className="text-slate-400 text-sm mt-0.5">{description}</p>}
                </div>
            </div>
            {action && (
                <div className="flex-shrink-0">
                    {action}
                </div>
            )}
        </div>
    )
}
