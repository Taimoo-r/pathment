export const navItems = [
  { href: '#problem', label: 'Problem and Solution' },
  { href: '#workflow', label: 'How It Works' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#enterprise', label: 'Enterprise' },
] as const;

export const workflowSteps = [
  {
    step: '01',
    title: 'Progression Blueprint',
    description:
      'Define capability pathways with measurable milestones and role-specific targets.',
  },
  {
    step: '02',
    title: 'Guided Mentorship Execution',
    description:
      'Run mentor-mentee workflows with structured submissions, reviews, and accountability.',
  },
  {
    step: '03',
    title: 'Outcome Intelligence',
    description:
      'Track progression health and identify intervention points through AI-assisted signals.',
  },
] as const;

export const capabilities = [
  {
    title: 'Mentorship Tracking',
    bullets: [
      'Role-aware assignment and oversight',
      'Submission and feedback lifecycle visibility',
      'Program-level progress transparency',
    ],
  },
  {
    title: 'Progress Systems',
    bullets: [
      'Milestone and competency progression',
      'Pathway standardization across teams',
      'Measurable capability advancement',
    ],
  },
  {
    title: 'AI-Assisted Insights',
    bullets: [
      'Early detection of mentorship stalls',
      'Roadmap acceleration recommendations',
      'Leader-ready decision summaries',
    ],
  },
] as const;

export const enterprisePillars = [
  {
    title: 'Security',
    description:
      'Enterprise-grade controls with isolated deployment patterns and governed access.',
  },
  {
    title: 'Scalability',
    description:
      'Operate mentorship systems across business units without losing process integrity.',
  },
  {
    title: 'Team-Level Control',
    description:
      'Program leaders can configure standards, progression rules, and reporting boundaries.',
  },
] as const;
