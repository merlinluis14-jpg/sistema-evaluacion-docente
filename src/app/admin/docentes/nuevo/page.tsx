"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Copy, Mail, PlusCircle } from "lucide-react";

import { formatAcademicText } from "@/lib/text/academicText";
import { createTeacher } from "../actions";

type Career = { id: string; code: string; name: string };

type CreatedTeacherAccount = {
  teacherId: string;
  teacherName: string;
  email: string;
  temporaryPassword: string;
};

export default function NuevoDocentePage() {
  const [loading, setLoading] = useState(false);
  const [careers, setCareers] = useState<Career[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdAccount, setCreatedAccount] = useState<CreatedTeacherAccount | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch("/api/careers")
      .then((response) => response.json())
      .then(setCareers)
      .catch(() => setCareers([]));
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await createTeacher(formData);

      if (
        result.success
        && result.teacherId
        && result.teacherName
        && result.email
        && result.careerId
        && result.temporaryPassword
      ) {
        setCreatedAccount({
          teacherId: result.teacherId,
          teacherName: result.teacherName,
          email: result.email,
          temporaryPassword: result.temporaryPassword,
        });
        formRef.current?.reset();
        return;
      }

      setErrorMessage(result.error || "Error al registrar docente");
    } catch {
      setErrorMessage("Error al registrar docente");
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword() {
    if (!createdAccount) {
      return;
    }

    await navigator.clipboard.writeText(createdAccount.temporaryPassword);
  }

  async function copyMessage() {
    if (!createdAccount) {
      return;
    }

    const message = [
      `Cuenta docente creada para: ${createdAccount.teacherName}`,
      `Correo: ${createdAccount.email}`,
      `Contraseña temporal: ${createdAccount.temporaryPassword}`,
      "",
      "Comparte esta informacion solo por un canal seguro.",
    ].join("\n");

    await navigator.clipboard.writeText(message);
  }

  const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500";
  const labelClass = "text-sm font-semibold text-gray-700";

  return (
    <div className="mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4 p-8 pb-20 duration-500 sm:p-12">
      <div className="mb-8">
        <Link
          href="/admin/docentes"
          className="group mb-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Volver a la lista
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
          Registrar Nuevo Docente
        </h1>
        <p className="mt-2 text-gray-500">
          Se creará un usuario con rol DOCENTE y una contraseña temporal aleatoria para entrega segura.
        </p>
      </div>

      {createdAccount ? (
        <div className="mb-6 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-slate-900 via-blue-700 to-cyan-500 px-6 py-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">
              Cuenta docente creada
            </p>
            <h2 className="mt-2 text-3xl font-black">{createdAccount.teacherName}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-50 break-all">
              <Mail className="h-4 w-4 flex-shrink-0" />
              {createdAccount.email}
            </p>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                Contraseña temporal
              </p>
              <p className="mt-3 break-all text-3xl font-black text-slate-800">
                {createdAccount.temporaryPassword}
              </p>
            </div>

            <p className="text-sm text-slate-600">
              El docente ya quedó registrado. El siguiente paso recomendado es asignarle al menos una materia
              y, si lo necesitas, definir manualmente sus grupos desde esa misma materia.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyPassword}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition-all hover:bg-slate-800"
              >
                <Copy className="h-4 w-4" />
                Copiar contraseña
              </button>
              <button
                type="button"
                onClick={copyMessage}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition-all hover:bg-blue-100"
              >
                <Mail className="h-4 w-4" />
                Copiar mensaje
              </button>
              <Link
                href={`/admin/materias/nueva?teacherId=${createdAccount.teacherId}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition-all hover:bg-blue-800 sm:col-span-2"
              >
                <PlusCircle className="h-4 w-4" />
                Asignar materia a este docente
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
        <form ref={formRef} action={handleSubmit} className="space-y-6 p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className={labelClass}>Nombre(s)</label>
              <input type="text" id="name" name="name" required className={inputClass} placeholder="Ej. Juan" />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className={labelClass}>Apellidos</label>
              <input type="text" id="lastName" name="lastName" required className={inputClass} placeholder="Ej. Perez Garcia" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className={labelClass}>Correo Electrónico Institucional</label>
            <input type="email" id="email" name="email" required className={inputClass} placeholder="juan.perez@uptx.edu.mx" />
            <p className="text-xs text-gray-400">Este será el usuario de inicio de sesión del docente.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="employeeId" className={labelClass}>Número de Empleado</label>
              <input type="text" id="employeeId" name="employeeId" required className={inputClass} placeholder="Ej. E1234567" />
              <p className="text-xs text-gray-400">Se conserva para identificación institucional, no como contraseña.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="careerId" className={labelClass}>Carrera Principal / Adscripción</label>
              <select id="careerId" name="careerId" required className={inputClass} defaultValue="">
                <option value="">Selecciona una carrera</option>
                {careers.map((career) => (
                  <option key={career.id} value={career.id}>
                    {career.code} - {formatAcademicText(career.name)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400">Este dato identifica la adscripción del docente, pero no limita las carreras de sus materias.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="position" className={labelClass}>Tipo de Docente</label>
            <select id="position" name="position" required className={inputClass} defaultValue="PA">
              <option value="PA">PA - Profesor(a) de Asignatura</option>
              <option value="PTC">PTC - Profesor(a) de Tiempo Completo</option>
            </select>
            <p className="text-xs text-gray-400">Este dato se usa en la evaluación y reportes institucionales.</p>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <Link
              href="/admin/docentes"
              className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-blue-800 active:scale-95 disabled:scale-100 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Guardando...
                </span>
              ) : "Guardar Docente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
