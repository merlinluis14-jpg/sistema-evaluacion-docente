import Link from "next/link";
import { ArrowLeft, Database, Lock, ShieldCheck, UserCheck } from "lucide-react";

export const metadata = {
  title: "Políticas de Privacidad | UPTex Eval",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="relative overflow-hidden bg-slate-900 py-16 text-white">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-indigo-500 opacity-20 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-4xl px-8">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-indigo-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Inicio
          </Link>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <ShieldCheck className="h-6 w-6 text-indigo-300" />
            </div>
            <h1 className="text-4xl font-black tracking-tight lg:text-5xl">
              Políticas de Privacidad
            </h1>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            Aviso de Privacidad Integral del Sistema de Evaluación Docente Institucional
            de la Universidad Politécnica de Texcoco (UPTex).
          </p>
        </div>
      </div>

      <main className="-mt-8 mx-auto max-w-4xl px-8 py-16">
        <div className="relative z-20 space-y-12 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 lg:p-12">
          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-2xl font-black text-slate-900">
              1. Identidad y domicilio del responsable
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              La <strong>Universidad Politécnica de Texcoco (UPTex)</strong> es la entidad
              responsable del tratamiento y resguardo de los datos recabados a través del
              <span className="font-bold text-indigo-600">
                {" "}Sistema Web de Evaluación Docente Institucional
              </span>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-2xl font-black text-slate-900">
              2. Datos personales recabados
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Para operar el sistema se recopilan los datos mínimos necesarios para
              autenticación, asignación académica, captura de evaluaciones y generación de
              reportes institucionales.
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <UserCheck className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">
                  <strong>Alumnos:</strong> matrícula institucional, nombres, apellidos y
                  carrera inscrita.
                </span>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <Lock className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">
                  <strong>Docentes y administradores:</strong> correo institucional,
                  nombres, apellidos y número de empleado cuando aplica.
                </span>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-2xl font-black text-slate-900">
              3. Finalidades del tratamiento
            </h2>
            <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
              <p className="mb-2 text-sm font-bold text-indigo-900">
                Los datos se utilizan exclusivamente para:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                <li>Gestión del acceso seguro a la plataforma.</li>
                <li>Asignación correcta de materias, grupos y períodos.</li>
                <li>Generación de reportes agregados para mejora institucional.</li>
                <li>Registro técnico de auditoría para acciones y accesos administrativos.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="border-b border-slate-100 pb-3 text-2xl font-black text-slate-900">
              4. Anonimato y seguridad
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="mb-1 flex items-center gap-2 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="font-bold">Evaluaciones anónimas</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Las respuestas del instrumento <strong className="text-slate-800">FDA-24.5</strong>
                  no se exponen públicamente al personal docente con identidad del alumno,
                  preservando confidencialidad y libertad de expresión.
                </p>
              </div>
              <div className="space-y-2">
                <div className="mb-1 flex items-center gap-2 text-emerald-600">
                  <Database className="h-5 w-5" />
                  <h3 className="font-bold">Cifrado y resguardo</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Las credenciales se almacenan con <strong className="text-slate-800">hash bcrypt</strong>
                  y la base de datos institucional opera con <strong className="text-slate-800">cifrado en
                  reposo y en tránsito</strong> sobre infraestructura administrada, complementada con control
                  de acceso por roles, bitácoras administrativas y respaldos diarios.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-2xl font-black text-slate-900">
              5. Uso de cookies y tecnologías de rastreo
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              La plataforma emplea cookies de sesión técnicas e indispensables para mantener
              la autenticación activa. No se utiliza telemetría con fines publicitarios ni se
              comparten datos de rastreo con terceros.
            </p>
          </section>

          <div className="mt-12 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">
            <p className="mb-1 font-bold text-slate-700">Actualización del aviso de privacidad</p>
            <p>
              Última actualización: Abril 2026. Cualquier modificación será publicada
              directamente en este apartado.
            </p>
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-4xl px-8 py-10 text-center text-sm font-bold uppercase tracking-widest text-slate-400">
        Sistema Web de Evaluación Docente · UPTex
      </footer>
    </div>
  );
}
