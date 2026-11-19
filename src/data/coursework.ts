// Courses shown on the home page, highest catalogue number first.
//
// `name` is the plain-English name; `number` is the catalogue listing.
// TODO(Rohan): `built` is one sentence, in your words, on what you built or
// solved in the class. `project` is the slug of a project on this site that
// used the course (a folder name under src/content/projects). The table shows
// the "What I built" and "Used in" columns once any course has them. `term` is set only while a course is in
// progress.
export type Course = {
  number: string;
  name: string;
  topics: string;
  built?: string;
  project?: string;
  term?: string;
};

/** "COMP SCI / E C E 354" -> 354 */
export function catalogNumber(course: Course): number {
  return Number(course.number.match(/(\d{3})\s*$/)?.[1] ?? 0);
}

export const coursework: Course[] = [
  {
    number: 'COMP SCI 577',
    name: 'Algorithms',
    topics: 'Greedy, divide and conquer, dynamic programming, network flow',
  },
  {
    number: 'COMP SCI 400',
    name: 'Data structures',
    topics: 'Balanced trees, hash tables, graphs, in Java',
  },
  {
    number: 'COMP SCI / E C E 354',
    name: 'How computers run code',
    topics: 'C, x86 assembly, memory, caches',
  },
  {
    number: 'E C E / COMP SCI 352',
    name: 'Digital logic',
    topics: 'Logic gates, circuits, state machines',
  },
];
