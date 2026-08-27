with open('src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

bad_block = '''                      <div 
                        key={m.id} 
                        className={isSuspended ? "p-3.5 rounded-2xl border transition-all bg-amber-50/70 border-amber-200 opacity-80" : "p-3.5 rounded-2xl border transition-all bg-emerald-50/50 border-emerald-200"}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                        className={isSuspended ? "p-3.5 rounded-2xl border transition-all bg-amber-50/70 border-amber-200 opacity-80" : "p-3.5 rounded-2xl border transition-all bg-emerald-50/50 border-emerald-200"}
                              {isSuspended ? '⏸️ Suspenso' : '✅ Ativo (Autorizado)'}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-850 mt-1">💊 {m.nome}</h4>
                            <p className="text-xs text-slate-600 font-medium">{m.dosagem}</p>
                          </div>
                          <button
                            onClick={() => onNavigate && onNavigate('medicacoes')}
                            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-[10px] font-bold cursor-pointer shrink-0"
                            title="Gerenciar medicamento na página dedicada"
                          >
                            Editar
                          </button>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <span>⏰ {Array.isArray(m.horarios) ? m.horarios.join(', ') : m.horarios}</span>
                          <span>{m.via || 'Via oral'}</span>
                        </div>
                      </div>'''

good_block = '''                      <div 
                        key={m.id} 
                        className={isSuspended ? "p-3.5 rounded-2xl border transition-all bg-amber-50/70 border-amber-200 opacity-80" : "p-3.5 rounded-2xl border transition-all bg-emerald-50/50 border-emerald-200"}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={isSuspended ? "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-900" : "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900"}>
                              {isSuspended ? '⏸️ Suspenso' : '✅ Ativo (Autorizado)'}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-850 mt-1">💊 {m.nome}</h4>
                            <p className="text-xs text-slate-600 font-medium">{m.dosagem}</p>
                          </div>
                          <button
                            onClick={() => onNavigate && onNavigate('medicacoes')}
                            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-[10px] font-bold cursor-pointer shrink-0"
                            title="Gerenciar medicamento na página dedicada"
                          >
                            Editar
                          </button>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <span>⏰ {Array.isArray(m.horarios) ? m.horarios.join(', ') : m.horarios}</span>
                          <span>{m.via || 'Via oral'}</span>
                        </div>
                      </div>'''

if bad_block in text:
    text = text.replace(bad_block, good_block)
    with open('src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed bad_block successfully!")
else:
    print("bad_block not found")
