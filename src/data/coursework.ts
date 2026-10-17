// Courses shown on the home page level ruler, grouped by department. The
// level column (200/300/400/500) is read from the catalogue number, so a new
// course only needs its number and title. `term` is set only while in progress.
export type Course = { number: string; title: string; term?: string };

export const levels = [200, 300, 400, 500] as const;

/** "COMP SCI / E C E 354" -> 354 */
export function catalogNumber(course: Course): number {
  return Number(course.number.match(/(\d{3})\s*$/)?.[1] ?? 0);
}

/** "COMP SCI / E C E 354" -> 300 */
export function levelOf(course: Course): number {
  return Math.floor(catalogNumber(course) / 100) * 100;
}

export const coursework: { department: string; courses: Course[] }[] = [
  {
    department: 'Computer Science',
    courses: [
      { number: 'COMP SCI 200', title: 'Programming I' },
      { number: 'COMP SCI 300', title: 'Programming II' },
      { number: 'COMP SCI / E C E 354', title: 'Machine Organization and Programming' },
      { number: 'COMP SCI 400', title: 'Programming III' },
      { number: 'COMP SCI 577', title: 'Introduction to Algorithms' },
    ],
  },
  {
    department: 'Electrical & Computer Engineering',
    courses: [
      { number: 'E C E 222', title: 'Electrodynamics I' },
      { number: 'E C E 270', title: 'Circuits Laboratory I' },
      { number: 'E C E 340', title: 'Electronic Circuits I' },
      { number: 'E C E / COMP SCI 352', title: 'Digital System Fundamentals' },
    ],
  },
];
