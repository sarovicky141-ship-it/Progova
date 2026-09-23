import { Bell, BriefcaseBusiness, MessageCircle, Send, Star, UserRound } from 'lucide-react'

const illustrationContent = {
  student: {
    eyebrow: 'New learner',
    title: 'Build a stronger student profile.',
    description: 'Capture the essentials so every learner starts with a clear path forward.',
    Icon: UserRound,
  },
  placement: {
    eyebrow: 'Career opportunity',
    title: 'Connect talent with the right opportunity.',
    description: 'Keep every placement detail clear, useful, and ready for students to explore.',
    Icon: BriefcaseBusiness,
  },
  message: {
    eyebrow: 'Stay connected',
    title: 'Make every message count.',
    description: 'Share timely updates with the people who need them most.',
    Icon: MessageCircle,
  },
  announcement: {
    eyebrow: 'Keep everyone informed',
    title: 'Turn important news into action.',
    description: 'Publish clear announcements that help your campus move together.',
    Icon: Bell,
  },
  feedback: {
    eyebrow: 'Your voice matters',
    title: 'Help Progova keep improving.',
    description: 'A thoughtful review can make the next student experience better.',
    Icon: Star,
  },
}

const FormIllustration = ({ variant }) => {
  const content = illustrationContent[variant]
  const Icon = content.Icon

  return (
    <aside className="form-illustration" aria-label={`${content.eyebrow} illustration`}>
      <div className="form-illustration-art" aria-hidden="true">
        <span className="illustration-spark spark-one" />
        <span className="illustration-spark spark-two" />
        <div className="illustration-orbit orbit-one" />
        <div className="illustration-orbit orbit-two" />
        <div className="illustration-icon"><Icon size={48} strokeWidth={1.7} /></div>
        <div className="illustration-paper paper-one"><span /><span /><span /></div>
        <div className="illustration-paper paper-two"><Send size={16} /></div>
      </div>
      <p className="form-illustration-eyebrow">{content.eyebrow}</p>
      <h3>{content.title}</h3>
      <p>{content.description}</p>
    </aside>
  )
}

export default FormIllustration
