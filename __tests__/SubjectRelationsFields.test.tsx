import { fireEvent, render, screen } from "@testing-library/react";

import { SubjectRelationsFields } from "@/app/admin/materias/SubjectRelationsFields";

describe("SubjectRelationsFields", () => {
  it("mantiene visibles docentes de otras carreras al cambiar la carrera de la materia", () => {
    render(
      <SubjectRelationsFields
        careers={[
          { id: "career_1", code: "ISC", name: "Ingenieria en Sistemas Computacionales" },
          { id: "career_2", code: "IET", name: "Ingenieria en Electronica y Telecomunicaciones" },
        ]}
        teachers={[
          {
            id: "teacher_1",
            name: "Ana",
            lastName: "Lopez",
            careerId: "career_1",
            careerCode: "ISC",
          },
          {
            id: "teacher_2",
            name: "Luis",
            lastName: "Martinez",
            careerId: "career_2",
            careerCode: "IET",
          },
        ]}
        groups={[
          {
            id: "group_1",
            name: "3A",
            period: "Enero-Abril 2026",
            careerId: "career_1",
            careerCode: "ISC",
          },
        ]}
        initialCareerId="career_1"
      />,
    );

    const teacherSelect = screen.getByLabelText("Docente asignado *") as HTMLSelectElement;
    fireEvent.change(teacherSelect, { target: { value: "teacher_2" } });

    expect(screen.getByRole("option", { name: "Ana Lopez - Adscripcion ISC" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Luis Martinez - Adscripcion IET" })).toBeTruthy();
    expect(teacherSelect.value).toBe("teacher_2");
  });
});
