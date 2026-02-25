"use client";

import { useState } from "react";

export function EvaluationForm({
    subjectId,
    teacherId,
    action
}: {
    subjectId: string,
    teacherId: string,
    action: (formData: FormData) => void
}) {
    const [step, setStep] = useState(1);
    const stepsCount = 3;

    const nextStep = () => setStep(s => Math.min(s + 1, stepsCount));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const getLabel = (val: number) => {
        if (val === 1) return "M";
        if (val === 3) return "B";
        if (val === 5) return "E";
        return val.toString();
    };

    return (
        <form action={action} className="w-full space-y-8 animate-in fade-in duration-700">
            <input type="hidden" name="subjectId" value={subjectId} />
            <input type="hidden" name="teacherId" value={teacherId} />

            {/* Paso 1: Facilitador */}
            <div className={`${step === 1 ? "block" : "hidden"} space-y-6`}>
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase italic">Sección 01</span>
                            <h2 className="text-2xl font-black text-slate-800">1. Evaluación del Facilitador</h2>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">11 Ítems</span>
                    </div>
                    <p className="text-slate-500 mb-8 leading-relaxed">Desempeño general, puntualidad y cumplimiento de objetivos institucionales según el estándar FDA-24.5.</p>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700 italic underline decoration-blue-200">
                            Calificación promedio de esta sección:
                        </label>
                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <label key={num} className="flex flex-col items-center gap-3 cursor-pointer group/item">
                                    <input
                                        type="radio"
                                        name="facilitadorAvg"
                                        value={num}
                                        required
                                        className="w-6 h-6 text-blue-600 border-slate-300 focus:ring-blue-500 transition-all cursor-pointer"
                                    />
                                    <span className="text-sm font-black text-slate-400 group-hover/item:text-blue-600 transition-colors">
                                        {getLabel(num)}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-between px-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <span>Deficiente</span>
                            <span>Regular</span>
                            <span>Excelente</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Paso 2: Habilidades y Medios */}
            <div className={`${step === 2 ? "block" : "hidden"} space-y-6`}>
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-indigo-600 font-bold text-sm tracking-widest uppercase italic">Sección 02</span>
                            <h2 className="text-2xl font-black text-slate-800">2. Habilidades y Medios</h2>
                        </div>
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">10 Ítems</span>
                    </div>
                    <p className="text-slate-500 mb-8">Dominio del tema, capacidad de comunicación y uso efectivo de recursos didácticos.</p>

                    <div className="space-y-8">
                        {/* Habilidades */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 italic underline decoration-indigo-200">
                                Calificación en Habilidades Docentes:
                            </label>
                            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <label key={num} className="flex flex-col items-center gap-3 cursor-pointer group/item">
                                        <input type="radio" name="habilidadesAvg" value={num} required className="w-6 h-6 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                                        <span className="text-sm font-black text-slate-400 group-hover/item:text-indigo-600 transition-colors">{getLabel(num)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Medios */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 italic underline decoration-indigo-200">
                                Calificación en Medios Didácticos:
                            </label>
                            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <label key={num} className="flex flex-col items-center gap-3 cursor-pointer group/item">
                                        <input type="radio" name="mediosAvg" value={num} required className="w-6 h-6 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                                        <span className="text-sm font-black text-slate-400 group-hover/item:text-indigo-600 transition-colors">{getLabel(num)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teoría/Práctica */}
                <div className="bg-indigo-900 p-8 rounded-3xl shadow-xl text-white">
                    <label className="block text-lg font-black mb-4 flex items-center gap-2">
                        <span className="bg-white/20 p-2 rounded-lg">⚖️</span>
                        ¿Relación Teoría / Práctica?
                    </label>
                    <div className="relative">
                        <select name="teoriaPractica" required className="w-full p-4 bg-white/10 border border-white/20 rounded-xl appearance-none focus:ring-2 focus:ring-white/50 outline-none font-bold">
                            <option value="5" className="text-slate-800">Excelente equilibrio (80/20)</option>
                            <option value="4" className="text-slate-800">Muy Bueno</option>
                            <option value="3" className="text-slate-800">Regular</option>
                            <option value="2" className="text-slate-800">Casi nada de práctica</option>
                            <option value="1" className="text-slate-800">Deficiente</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                    </div>
                </div>
            </div>

            {/* Paso 3: Autoevaluación y Comentarios */}
            <div className={`${step === 3 ? "block" : "hidden"} space-y-6`}>
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-emerald-600 font-bold text-sm tracking-widest uppercase italic">Sección 03</span>
                            <h2 className="text-2xl font-black text-slate-800">3. Autoevaluación del Alumno</h2>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">11 Ítems</span>
                    </div>
                    <p className="text-slate-500 mb-8 leading-relaxed">Tu compromiso, asistencia y desempeño personal en la asignatura.</p>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700 italic underline decoration-emerald-200">
                            Tu calificación promedio personal:
                        </label>
                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <label key={num} className="flex flex-col items-center gap-3 cursor-pointer group/item">
                                    <input type="radio" name="autoEvalAvg" value={num} required className="w-6 h-6 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer" />
                                    <span className="text-sm font-black text-slate-400 group-hover/item:text-emerald-600 transition-colors">{getLabel(num)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 italic">
                    <label className="block text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <span>💬</span> Comentarios Adicionales
                    </label>
                    <textarea
                        name="comentarios"
                        placeholder="Escribe aquí tu retroalimentación cualitativa... (Opcional)"
                        className="w-full p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none h-32 bg-slate-50/50"
                    ></textarea>
                </div>
            </div>

            {/* Navegación Premium */}
            <div className="flex items-center justify-between pt-4">
                <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className={`h-2 rounded-full transition-all duration-500 ${step === num ? "w-10 bg-blue-600" : "w-2 bg-slate-300"}`}></div>
                    ))}
                </div>

                <div className="flex gap-4">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="bg-white text-slate-600 px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-50 border border-slate-100 active:scale-95 transition-all"
                        >
                            Anterior
                        </button>
                    )}

                    {step < stepsCount ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2"
                        >
                            Siguiente ⮕
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-12 py-4 rounded-2xl font-black shadow-2xl hover:shadow-blue-500/40 active:scale-95 transition-all text-lg"
                        >
                            Finalizar Evaluación FDA-24.5
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}
