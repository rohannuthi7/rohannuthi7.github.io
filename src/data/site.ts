// Everything about Rohan that is not a project or a role lives here.
// Edit the values; the components read them.
import headshot from '../assets/profile-skyline.jpg';
import akpsiMark from '../assets/akpsi-mark.png';

export const site = {
  name: 'Rohan Nuthi',
  url: 'https://rohannuthi7.github.io',
  title: 'Rohan Nuthi — Software & Embedded Engineer',
  kicker: 'CS + CompE @ UW-Madison · May 2028',
  // ≤ 50 words. Also used as the meta description.
  description:
    'Co-founder and lead software engineer at Reaxe, a multi-tenant SaaS platform for home-remodeling contractors. Hardware on Wisconsin Humanoid and embedded systems on Badger Solar Racing. Interested in systems that touch real hardware and real users, and looking for a Summer 2027 software engineering internship.',
  honours: ['GPA 3.83', "Dean's List"],
  fraternity: { name: 'Alpha Kappa Psi', mark: akpsiMark },
  headshot: { src: headshot, alt: 'Rohan Nuthi sitting on a lawn in front of a city skyline at night' },
  location: 'Madison, WI',
  resume: '/rohan-nuthi-resume.pdf',
  resumeJson: '/resume.json',
  source: 'https://github.com/rohannuthi7/rohannuthi7.github.io',
  github: { label: 'github.com/rohannuthi7', href: 'https://github.com/rohannuthi7' },
  linkedin: { label: 'linkedin.com/in/rohan-nuthi', href: 'https://linkedin.com/in/rohan-nuthi' },
  email: 'rohannuthi.rn@gmail.com',
  phone: { label: '262-444-2159', href: 'tel:+12624442159' },
  // Footer line.
  footer: 'CS + CompE @ UW-Madison · May 2028',
} as const;

export const navLinks = [
  { label: 'About', href: '/#about' },
  { label: 'Coursework', href: '/#coursework' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Skills', href: '/#skills' },
] as const;
