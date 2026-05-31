export const navItems = [
  { href: '#solution', label: 'Problem & Solution' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#enterprise', label: 'Enterprise' },
] as const;

export const heroHighlights = [
  'Built for 800+ engineers',
  'AI-generated roadmaps',
  'Smart mentor matching',
  'Gamified progress',
] as const;

export const workflowSteps = [
  {
    step: '01',
    title: 'Progression Blueprint',
    description:
      'Define precise technical and operational career pathways with measurable milestones, system dependencies, and role-specific target competencies built directly into your program config.',
  },
  {
    step: '02',
    title: 'Guided Execution',
    description:
      'Execute seamless mentor-mentee operations through program templates, structured check-ins, AI-generated tasks, and concrete, async progression checkpoints.',
  },
  {
    step: '03',
    title: 'Outcome Intelligence',
    description:
      'Gain direct insights into program wellness, detect mentorship blockages or stumbles instantly, and generate actionable strategic feedback to inform promotion review processes.',
  },
] as const;

export const currentStatePoints = [
  {
    label: 'Ad-hoc matching:',
    body: 'Programs depend heavily on accidental personal connections and individual efforts, leading to unequal opportunity.',
  },
  {
    label: 'No progression blueprint:',
    body: 'Milestones are generic, non-standardized, and untracked. Mentees lack definitive skill targets.',
  },
  {
    label: 'Blind engineering leaders:',
    body: 'Executive teams cannot see capability growth in real-time, resulting in promotion misalignment and talent churn.',
  },
] as const;

export const pathmentSystemPoints = [
  {
    label: 'Smart matching:',
    body: 'Mentees are paired with the right mentors based on skills, goals, and availability, with admin approval.',
  },
  {
    label: 'AI-generated pathways:',
    body: 'Personalized roadmaps break goals into milestones and actionable tasks, adjusting as progress is made.',
  },
  {
    label: 'Gamified progress:',
    body: 'Points, badges, and leaderboards keep mentees motivated while leaders see capability growth in real time.',
  },
] as const;

export const enterprisePillars = [
  {
    icon: 'workspace',
    title: 'Isolated Workspaces',
    description:
      'Every company runs in its own dedicated, isolated workspace on a private subdomain, so each organization’s programs, members, and data stay fully separated.',
  },
  {
    icon: 'roles',
    title: 'Role-Based Programs',
    description:
      'Purpose-built admin, mentor, and mentee experiences with permissions scoped to each role, so the right people see the right tools and information.',
  },
  {
    icon: 'auth',
    title: 'Secure Sign-In',
    description:
      'Straightforward email and password authentication with email verification and secure password reset — scoped to each tenant, with no SSO setup required to get started.',
  },
] as const;

export const footerColumns = [
  {
    title: 'Product',
    links: [
      { href: '#solution', label: 'Problem & Solution' },
      { href: '#how-it-works', label: 'How It Works' },
      { href: '#capabilities', label: 'Capabilities' },
      { href: '#enterprise', label: 'Enterprise Scope' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '#', label: 'Documentation' },
      { href: '#request-access', label: 'Request Access' },
      { href: 'mailto:hello@pathment.me', label: 'Contact Support' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '#', label: 'About Us' },
      { href: '#', label: 'Careers' },
      { href: '#', label: 'Privacy Policy' },
    ],
  },
] as const;
