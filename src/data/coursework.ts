// Courses shown on the home page, grouped by department, in display order.
export type Course = { number: string; title: string };

export const coursework: { department: string; courses: Course[] }[] = [
  {
    department: 'Computer Science',
    courses: [
      { number: 'COMP SCI 577', title: 'Introduction to Algorithms' },
      { number: 'COMP SCI 400', title: 'Programming III' },
      { number: 'COMP SCI 300', title: 'Programming II' },
      { number: 'COMP SCI / E C E 354', title: 'Machine Organization and Programming' },
    ],
  },
  {
    department: 'Electrical & Computer Engineering',
    courses: [
      { number: 'E C E / COMP SCI 352', title: 'Digital System Fundamentals' },
      { number: 'E C E 340', title: 'Electronic Circuits I' },
      { number: 'E C E 270', title: 'Circuits Laboratory I' },
      { number: 'E C E 222', title: 'Electrodynamics I' },
    ],
  },
];
