// Everything about Rohan that is not a project or a role lives here.
// Edit the values; the components read them.
import headshot from '../assets/profile-skyline.jpg';
import akpsiMark from '../assets/akpsi-mark.png';

export const site = {
  name: 'Rohan Nuthi',
  url: 'https://rohannuthi7.github.io',
  title: 'Rohan Nuthi — Software Engineer',
  // One line under your name, shown as "Currently: …". Leave empty to hide it.
  currently: '',
  // TODO(Rohan): the visible bio under your name. 2-3 sentences in your own
  // voice. Shown as bracketed placeholder text until you replace it.
  bio: '[Write 2-3 sentences in your own voice: what you build, what you are looking for (Summer 2027 SWE internship), one personal detail. Say here that you study CS + CompE at UW-Madison and graduate May 2028.]',
  // ≤ 50 words. The meta description for search and link previews only.
  description:
    'Co-founder and lead software engineer at Reaxe, a multi-tenant SaaS platform for home-remodeling contractors covering quoting, scheduling and customer portals. Software engineering lead at Wisconsin Tech Consulting.',
  // The small fact table under the bio, label left and value right.
  facts: [
    { label: 'School', value: 'UW-Madison, CS + CompE' },
    { label: 'GPA', value: '3.83' },
    { label: 'Honors', value: "Dean's List" },
    { label: 'Graduating', value: 'May 2028' },
  ],
  fraternity: { name: 'Alpha Kappa Psi', mark: akpsiMark },
  headshot: { src: headshot, alt: 'Rohan Nuthi sitting on a lawn in front of a city skyline at night' },
  location: 'Madison, WI',
  resume: '/rohan-nuthi-resume.pdf',
  source: 'https://github.com/rohannuthi7/rohannuthi7.github.io',
  github: { label: 'github.com/rohannuthi7', href: 'https://github.com/rohannuthi7' },
  linkedin: { label: 'linkedin.com/in/rohan-nuthi', href: 'https://linkedin.com/in/rohan-nuthi' },
  email: 'rohannuthi.rn@gmail.com',
} as const;

export const navLinks = [
  { label: 'About', href: '/#about' },
  { label: 'Coursework', href: '/#coursework' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Skills', href: '/#skills' },
] as const;
