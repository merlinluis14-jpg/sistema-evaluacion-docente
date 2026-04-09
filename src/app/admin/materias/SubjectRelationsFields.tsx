"use client";

import { useMemo, useState } from "react";

type CareerOption = {
  id: string;
  code: string;
  name: string;
};

type TeacherOption = {
  id: string;
  name: string;
  lastName: string;
  careerId: string;
  careerCode: string;
};

type GroupOption = {
  id: string;
  name: string;
  period: string;
  careerId: string;
  careerCode: string;
};

type SubjectRelationsFieldsProps = {
  careers: CareerOption[];
  teachers: TeacherOption[];
  groups: GroupOption[];
  initialCuatrimestre?: number;
  initialCareerId?: string;
  initialTeacherId?: string;
  initialAssignmentMode?: "auto" | "manual";
  initialGroupIds?: string[];
};

function extractCuatrimestreFromGroupName(groupName: string) {
  const match = groupName.trim().match(/^(\d+)/);
  if (!match) {
    return null;
  }

  const cuatrimestre = Number(match[1]);
  return Number.isNaN(cuatrimestre) ? null : cuatrimestre;
}

export function SubjectRelationsFields({
  careers,
  teachers,
  groups,
  initialCuatrimestre,
  initialCareerId = "",
  initialTeacherId = "",
  initialAssignmentMode = "auto",
  initialGroupIds = [],
}: SubjectRelationsFieldsProps) {
  const cuatrimestreSelectId = "subject-cuatrimestre-select";
  const careerSelectId = "subject-career-select";
  const teacherSelectId = "subject-teacher-select";

  const [selectedCuatrimestre, setSelectedCuatrimestre] = useState<number | "">(
    initialCuatrimestre ?? "",
  );
  const [selectedCareerId, setSelectedCareerId] = useState(initialCareerId);
  const [selectedTeacherId, setSelectedTeacherId] = useState(initialTeacherId);
  const [assignmentMode, setAssignmentMode] = useState<"auto" | "manual">(initialAssignmentMode);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(initialGroupIds);

  const filteredGroups = useMemo(
    () =>
      groups.filter((group) => {
        if (selectedCareerId && group.careerId !== selectedCareerId) {
          return false;
        }

        if (selectedCuatrimestre === "") {
          return false;
        }

        return extractCuatrimestreFromGroupName(group.name) === selectedCuatrimestre;
      }),
    [groups, selectedCareerId, selectedCuatrimestre],
  );

  const filteredGroupIdSet = useMemo(
    () => new Set(filteredGroups.map((group) => group.id)),
    [filteredGroups],
  );

  const effectiveTeacherId = teachers.some((teacher) => teacher.id === selectedTeacherId)
    ? selectedTeacherId
    : "";

  const effectiveGroupIds = selectedGroupIds.filter((groupId) => filteredGroupIdSet.has(groupId));

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((currentIds) => {
      const normalizedIds = currentIds.filter((currentId) => filteredGroupIdSet.has(currentId));

      return normalizedIds.includes(groupId)
        ? normalizedIds.filter((currentId) => currentId !== groupId)
        : [...normalizedIds, groupId];
    });
  }

  return (
    <>
      <div>
        <label
          htmlFor={cuatrimestreSelectId}
          className="mb-1.5 block text-sm font-bold text-slate-700"
        >
          Cuatrimestre <span className="text-red-500">*</span>
        </label>
        <select
          id={cuatrimestreSelectId}
          name="cuatrimestre"
          value={selectedCuatrimestre}
          onChange={(event) => {
            const value = event.target.value;
            setSelectedCuatrimestre(value ? Number(value) : "");
          }}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          <option value="" disabled>
            Selecciona el cuatrimestre
          </option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((numero) => (
            <option key={numero} value={numero}>
              {numero}° Cuatrimestre
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={careerSelectId} className="mb-1.5 block text-sm font-bold text-slate-700">
          Carrera <span className="text-red-500">*</span>
        </label>
        <select
          id={careerSelectId}
          name="careerId"
          value={selectedCareerId}
          onChange={(event) => setSelectedCareerId(event.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          <option value="" disabled>
            Selecciona una carrera
          </option>
          {careers.map((career) => (
            <option key={career.id} value={career.id}>
              {career.code} - {career.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={teacherSelectId} className="mb-1.5 block text-sm font-bold text-slate-700">
          Docente asignado <span className="text-red-500">*</span>
        </label>
        <select
          id={teacherSelectId}
          name="teacherId"
          value={effectiveTeacherId}
          onChange={(event) => setSelectedTeacherId(event.target.value)}
          required
          disabled={teachers.length === 0}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="" disabled>
            {teachers.length === 0
              ? "No hay docentes activos disponibles"
              : "Selecciona un docente"}
          </option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name} {teacher.lastName} - Adscripcion {teacher.careerCode}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">
          La adscripcion del docente no limita las carreras en las que puede impartir materias.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-800">Asignacion de grupos</p>
            <p className="mt-1 text-xs text-slate-500">
              Puedes dejar que el sistema relacione grupos por carrera y cuatrimestre, o elegirlos manualmente.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              <input
                type="radio"
                name="assignmentMode"
                value="auto"
                checked={assignmentMode === "auto"}
                onChange={() => setAssignmentMode("auto")}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Automatica
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              <input
                type="radio"
                name="assignmentMode"
                value="manual"
                checked={assignmentMode === "manual"}
                onChange={() => setAssignmentMode("manual")}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Manual
            </label>
          </div>
        </div>

        {assignmentMode === "auto" ? (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Si no eliges grupos manualmente, al guardar la materia se enlazaran automaticamente
            los grupos activos de la misma carrera y del cuatrimestre correspondiente.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {selectedCuatrimestre === "" ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Selecciona primero el cuatrimestre para mostrar los grupos disponibles.
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No hay grupos activos disponibles para la carrera y cuatrimestre seleccionados.
              </div>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Grupos activos disponibles: {effectiveGroupIds.length} seleccionados
                </p>
                <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                  {filteredGroups.map((group) => {
                    const isChecked = effectiveGroupIds.includes(group.id);

                    return (
                      <label
                        key={group.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-all ${
                          isChecked
                            ? "border-blue-300 bg-blue-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="groupIds"
                          value={group.id}
                          checked={isChecked}
                          onChange={() => toggleGroup(group.id)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{group.name}</span>
                          <span className="text-xs text-slate-500">
                            {group.period} - {group.careerCode}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400">
                  Usa este modo cuando necesites controlar exactamente en que grupos se imparte la materia.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
