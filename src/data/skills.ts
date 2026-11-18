// Skills table on the home page: each skill, and the projects or jobs on the
// page where it was used. Skill text matches the resume exactly.
//
// A skill is listed only if a project's stack row or a job's bullets or stack
// row already name it. `projects` are folder names under src/content/projects;
// `jobs` are file names under src/content/experience.
export type Skill = { name: string; projects?: string[]; jobs?: string[] };

export const skills: Skill[] = [
  { name: 'Python', projects: ['pickleiq'] },
  { name: 'C', jobs: ['badger-solar-racing'] },
  { name: 'SQL (PostgreSQL)', projects: ['reaxe'] },
  { name: 'React', projects: ['pickleiq'], jobs: ['reaxe'] },
  { name: 'Node.js', projects: ['reaxe'] },
  { name: 'FastAPI', projects: ['pickleiq', 'surg-f', 'synapse'] },
  { name: 'Anthropic API', jobs: ['reaxe'] },
  { name: 'PyTorch', projects: ['pickleiq', 'surg-f'] },
  { name: 'AWS (EC2, S3, Lambda)', projects: ['reaxe'] },
  { name: 'Docker', projects: ['reaxe'] },
  { name: 'Supabase', jobs: ['wisconsin-tech-consulting'] },
];

// TODO(Rohan): resume skills with no project or job on the page to point to.
// Left out of the table until you decide: link them to something or drop them.
//   C++, Java, JavaScript, HTML/CSS, Verilog (Synapse lists SystemVerilog),
//   REST APIs, TensorFlow, NumPy, Pandas, Git, Linux, JUnit 5, ModelSim,
//   Quartus, Altium, Digital logic design, Microcontroller programming,
//   PCB design
