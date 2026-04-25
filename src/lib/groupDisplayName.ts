const CAREER_ACRONYMS: Record<string, string> = {
  "14": "SC",
  "21": "TII",
};

type GroupDisplayNameResult = {
  displayName: string;
  hasAlias: boolean;
};

type GroupDisplayMetadataResult = GroupDisplayNameResult & {
  accessibilityLabel: string;
};

export function getGroupDisplayName(
  groupName: string,
  careerCode: string,
): GroupDisplayNameResult {
  const normalizedGroupName = groupName.trim().toUpperCase();
  const normalizedCareerCode = careerCode.trim().toUpperCase();
  const acronym = CAREER_ACRONYMS[normalizedCareerCode];

  if (!acronym) {
    return { displayName: groupName, hasAlias: false };
  }

  const match = normalizedGroupName.match(/^(\d{1,2})([A-Z])(\d{2})(\d)$/);

  if (!match) {
    return { displayName: groupName, hasAlias: false };
  }

  const [, cuatrimestre, shift, embeddedCareerCode, section] = match;

  if (embeddedCareerCode !== normalizedCareerCode) {
    return { displayName: groupName, hasAlias: false };
  }

  return {
    displayName: `${cuatrimestre}${shift}${acronym}${section}`,
    hasAlias: true,
  };
}

export function getGroupDisplayMetadata(
  groupName: string,
  careerCode: string,
): GroupDisplayMetadataResult {
  const result = getGroupDisplayName(groupName, careerCode);

  return {
    ...result,
    accessibilityLabel: result.hasAlias
      ? `Grupo ${result.displayName} (código interno: ${groupName})`
      : `Grupo ${groupName}`,
  };
}
