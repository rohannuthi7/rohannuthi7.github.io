// Everything about Rohan that is not a project or a role lives here.
// Edit the values; the components read them.
import headshot from '../assets/profile.jpg';
import akpsiMark from '../assets/akpsi-mark.png';

export const site = {
  name: 'Rohan Nuthi',
  url: 'https://rohannuthi.com',
  title: 'Rohan Nuthi — Software & Embedded Engineer',
  kicker: 'B.S. Computer Engineering & Computer Science · University of Wisconsin–Madison · May 2028',
  // ≤ 50 words. Also used as the meta description.
  description:
    'Co-founder and lead software engineer at Reaxe, a multi-tenant SaaS platform for home-remodeling contractors. Hardware on Wisconsin Humanoid and embedded systems on Badger Solar Racing. Interested in systems that touch real hardware and real users, and looking for a Summer 2027 software engineering internship.',
  honours: ['GPA 3.83', "Dean's List"],
  fraternity: { name: 'Alpha Kappa Psi', mark: akpsiMark },
  headshot: { src: headshot, alt: 'Rohan Nuthi' },
  location: 'Madison, WI',
  resume: '/resume.pdf',
  github: { label: 'github.com/rohannuthi7', href: 'https://github.com/rohannuthi7' },
  linkedin: { label: 'linkedin.com/in/rohan-nuthi', href: 'https://linkedin.com/in/rohan-nuthi' },
  email: 'rohannuthi.rn@gmail.com',
  phone: { label: '262-444-2159', href: 'tel:+12624442159' },
  // Footer line.
  footer: 'B.S. Computer Engineering & Computer Science · May 2028',
} as const;

export const navLinks = [
  { label: 'About', href: '/#about' },
  { label: 'Coursework', href: '/#coursework' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Skills', href: '/#skills' },
] as const;
