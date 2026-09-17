export const GRADE_POINTS = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, 'U/RA': 0 };
export function calculateSemester(rows) {
  const completed = rows.filter((row) => row.grade && row.grade in GRADE_POINTS);
  const credits = completed.reduce((sum, row) => sum + Number(row.credits), 0);
  const weighted = completed.reduce((sum, row) => sum + Number(row.credits) * GRADE_POINTS[row.grade], 0);
  return { sgpa: credits ? Number((weighted / credits).toFixed(2)) : 0, credits, weighted, completed: completed.length };
}
export function calculateCumulative(semesters) {
  const credits = semesters.reduce((sum, item) => sum + item.credits, 0);
  const weighted = semesters.reduce((sum, item) => sum + item.weighted, 0);
  return { cgpa: credits ? Number((weighted / credits).toFixed(2)) : 0, credits, weighted };
}
