// Courses shown on the home page, lowest catalogue number first. `term` is
// set only while a course is in progress.
export type Course = { number: string; title: string; term?: string };

/** "COMP SCI / E C E 354" -> 354 */
export function catalogNumber(course: Course): number {
  return Number(course.number.match(/(\d{3})\s*$/)?.[1] ?? 0);
}

export const coursework: Course[] = [
  { number: 'E C E / COMP SCI 352', title: 'Digital System Fundamentals' },
  { number: 'COMP SCI / E C E 354', title: 'Machine Organization and Programming' },
  { number: 'COMP SCI 400', title: 'Programming III' },
  { number: 'COMP SCI 577', title: 'Introduction to Algorithms' },
];
