// Parse seguro: YYYY-MM-DD -> Date local (evita líos de UTC con new Date("YYYY-MM-DD"))
export const parseLocalDate = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d); // local time
  // Validación extra (ej: 2026-02-31)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d)
    return null;
  return dt;
};
