import Link from "next/link";
import { ArrowLeft, ShieldCheck, Database, Lock, UserCheck } from "lucide-react";

export const metadata = {
  title: "Políticas de Privacidad | UPTEX Eval",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-slate-900 text-white py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full filter blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <div className="max-w-4xl mx-auto px-8 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white transition-colors text-sm font-bold mb-8">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-indigo-300" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Políticas de Privacidad</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Aviso de Privacidad Integral del Sistema de Evaluación Docente Institucional de la Universidad Politécnica de Texcoco (UPTX).
          </p>
        </div>
      </div>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-8 py-16 -mt-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 lg:p-12 space-y-12 relative z-20">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-3">1. Identidad y Domicilio del Responsable</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              La <strong>Universidad Politécnica de Texcoco (UPTX)</strong>, con marco en las Leyes de Protección de Datos Personales, es la entidad responsable del tratamiento y resguardo de los datos recabados a través del <span className="font-bold text-indigo-600">Sistema Web de Evaluación Docente Institucional</span>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-3">2. Datos Personales Recabados</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              Para llevar a cabo las finalidades descritas en el presente aviso, el sistema recopila los siguientes datos:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <li className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                <UserCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700"><strong>Alumnos:</strong> Matrícula institucional, nombres, apellidos y carrera inscrita.</span>
              </li>
              <li className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Lock className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700"><strong>Docentes:</strong> Correo electrónico institucional, nombres, apellidos y número de empleado.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-3">3. Finalidades del Tratamiento</h2>
            <div className="space-y-3 bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl">
              <p className="text-sm font-bold text-indigo-900 mb-2">Sus datos serán utilizados exclusivamente para:</p>
              <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
                <li>Gestión del acceso unificado y seguro a la plataforma de evaluaciones.</li>
                <li>Asignación de asignaturas y grupos correctos acorde a la carga académica.</li>
                <li>Generación de los reportes agregados y estadísticos (sin exponer la identidad del electorado) para mejorar el modelo educativo institucional.</li>
                <li>Registro técnico para auditorías del sistema mediante bitácoras de acciones administrativas (Logs).</li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-3">4. Anonimato y Seguridad</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-bold">Evaluaciones Anónimas</h3>
                </div>
                <p className="text-slate-600 text-sm">
                  Las contestaciones al instrumento <strong className="text-slate-800">FDA-24.5</strong> no son vinculables públicamente al estudiante ante el personal docente, garantizando libertad de expresión y confidencialidad en el proceso.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <Database className="w-5 h-5" />
                  <h3 className="font-bold">Cifrado Estándar</h3>
                </div>
                <p className="text-slate-600 text-sm">
                  Las contraseñas de las cuentas institucionales en el aplicativo se resguardan mediante <strong className="text-slate-800">hash bcrypt unidireccional</strong>, y los motores de bases de datos operan con políticas de prevención contra accesos no autorizados e inyecciones lógicas.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-3">5. Uso de Cookies y Tecnologías de Rastreo</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              La plataforma emplea cookies de sesión puramente técnicas e indispensables para mantener activa la sesión de inicio seguro del usuario. No se recopila telemetría de comportamiento para fines publicitarios ni se comparten datos de rastreo con terceros.
            </p>
          </section>

          <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100 mt-12 text-sm text-slate-500">
            <p className="font-bold text-slate-700 mb-1">Actualización del Aviso de Privacidad</p>
            <p>Última actualización: Marzo 2026. Cualquier modificación será publicada directamente en este apartado.</p>
          </div>

        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-8 py-10 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
        Sistema Web de Evaluación Docente · UPTX
      </footer>
    </div>
  );
}
