import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* Navegación Superpuesta */}
      <nav className="flex items-center justify-between px-8 py-8 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-xl shadow-indigo-200 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">🎓</div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-slate-900 leading-none">UPT <span className="text-indigo-600">Eval</span></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">U. Politécnica de Texcoco</span>
          </div>
        </div>
        <Link href="/login" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-slate-200">
          Entrar al Sistema
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12 flex flex-col lg:flex-row items-center gap-16 relative">
        {/* Decoración de fondo */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-40 -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100 rounded-full filter blur-3xl opacity-30 -z-10"></div>

        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left duration-1000">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
            🚀 Instrumento FDA-24.5 Oficial
          </div>
          <h1 className="text-6xl lg:text-[5.5rem] font-black text-slate-900 leading-[0.95] tracking-tight">
            Mejora la <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500">Educación</span> <br />
            con un clic.
          </h1>
          <p className="text-xl text-slate-500 max-w-xl leading-relaxed font-medium">
            Plataforma avanzada de evaluación docente diseñada para elevar los estándares académicos de la Universidad Politécnica de Texcoco.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 pt-6">
            <Link href="/login" className="bg-indigo-600 text-white px-12 py-5 rounded-3xl font-black text-xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-300 transform hover:-translate-y-1 text-center">
              Comenzar Ahora
            </Link>
            <div className="flex flex-col justify-center px-2">
              <div className="flex -space-x-3 mb-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-slate-${200 + i * 100} shadow-sm`}></div>
                ))}
              </div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">+1,200 Alumnos Activos</span>
            </div>
          </div>
        </div>

        {/* Mockup visual representativo */}
        <div className="flex-1 w-full max-w-2xl animate-in fade-in slide-in-from-right duration-1000 delay-200">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden min-h-[450px] flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-slate-100 rounded-full animate-pulse"></div>
                  <div className="h-8 w-8 bg-indigo-50 rounded-xl"></div>
                </div>
                <div className="h-16 w-full bg-indigo-50/50 rounded-3xl border border-indigo-100 border-dashed flex items-center px-6">
                  <div className="h-2 w-2/3 bg-indigo-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-slate-50 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="h-2 w-1/2 bg-slate-200 rounded-full"></div>
                    <div className="h-8 w-8 bg-white rounded-xl shadow-sm"></div>
                  </div>
                  <div className="h-32 bg-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="h-2 w-1/2 bg-slate-700 rounded-full"></div>
                    <div className="h-8 w-8 bg-indigo-500 rounded-xl shadow-lg"></div>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-indigo-600 rounded-full"></div>
                </div>
                <div className="flex justify-between mt-3">
                  <div className="h-2 w-16 bg-slate-100 rounded-full"></div>
                  <div className="h-2 w-10 bg-slate-100 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="max-w-7xl mx-auto px-8 py-12 mt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose">
          © 2026 Sistema de Evaluación Docente <br />
          <span className="text-slate-300">Universidad Politécnica de Texcoco · Proyecto de Tesina</span>
        </p>
        <div className="flex gap-8 text-xs font-black text-slate-400 uppercase tracking-widest">
          <span className="hover:text-indigo-600 cursor-pointer">Privacidad</span>
          <span className="hover:text-indigo-600 cursor-pointer">Soporte Técnico</span>
        </div>
      </footer>
    </div>
  );
}
