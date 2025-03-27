import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  GitFork, 
  Activity, 
  BookOpen, 
  ArrowRight, 
  Check, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import logo from '../assets/branding/logo-primary.svg';

export const LandingPage: React.FC<{ onStart: (view: 'signin' | 'signup') => void }> = ({ onStart }) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <Layers className="w-5 h-5 text-charcoal" />,
      title: "Workspace Operating System",
      description: "Manage organizations, nested teams, and complex product scopes in a single ivory dashboard."
    },
    {
      icon: <GitFork className="w-5 h-5 text-charcoal" />,
      title: "Interactive Dependency Graphs",
      description: "A flagship React Flow dependency mapper. Link, delete, and view task pipelines interactively."
    },
    {
      icon: <Activity className="w-5 h-5 text-charcoal" />,
      title: "Live Collaboration",
      description: "Socket.IO synchronizes presence, active tasks, typing indicators, and threaded commentary instantly."
    },
    {
      icon: <BookOpen className="w-5 h-5 text-charcoal" />,
      title: "Analytics Engine",
      description: "Inspect velocity, cycle time scatterplots, burndown curves, and team workload balances in detail."
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      tagline: "For small teams and founders",
      price: billingPeriod === 'monthly' ? 0 : 0,
      features: [
        "1 Organization, 3 Workspaces",
        "Up to 10 active projects",
        "Visual Dependency Graph (read-only)",
        "Basic task management & comments",
        "Standard Analytics summary"
      ],
      cta: "Get Started",
      action: () => onStart('signup'),
      popular: false
    },
    {
      name: "Growth",
      tagline: "For scaling teams and startups",
      price: billingPeriod === 'monthly' ? 12 : 10,
      features: [
        "Unlimited Workspaces & Teams",
        "Interactive Dependency Mapping",
        "Real-time Collaboration & Presence",
        "Advanced Analytics & Burndown charts",
        "24/7 Slack & Email support"
      ],
      cta: "Start Free Trial",
      action: () => onStart('signup'),
      popular: true
    },
    {
      name: "Enterprise",
      tagline: "For organizations needing compliance",
      price: billingPeriod === 'monthly' ? 36 : 30,
      features: [
        "Everything in Growth",
        "Custom field mappings",
        "SAML SSO & Advanced RBAC controls",
        "Dedicated Database options",
        "Custom SLAS and uptime contracts"
      ],
      cta: "Contact Sales",
      action: () => onStart('signup'),
      popular: false
    }
  ];

  const faqs = [
    {
      q: "Is PMS a task manager or a Trello clone?",
      a: "Neither. PMS is a comprehensive workspace operating system. It connects organizations, subteams, tasks, sprint scopes, roadmap milestones, and visual task relationship maps (React Flow) together, avoiding isolated information silos."
    },
    {
      q: "How does the visual dependency graph function?",
      a: "The flagship visual canvas (using React Flow) loads tasks as interactive nodes. You can drag lines between nodes to construct 'blocking' or 'related' dependencies, which update database models instantly and notify users if blocker dependencies resolve."
    },
    {
      q: "Can I host this within our private cloud?",
      a: "Yes. Our repository is monorepo-structured and fully dockerized. Running 'docker-compose' enables quick deployments to any AWS, Azure, or GCP VM environment."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-charcoal font-sans flex flex-col antialiased">
      {/* Floating Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-pastel-lilac/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="PMS Logo" className="h-9 w-auto" />
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-graphite">
          <a href="#features" className="hover:text-charcoal transition-colors">Features</a>
          <a href="#pricing" className="hover:text-charcoal transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-charcoal transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onStart('signin')} 
            className="text-sm font-semibold text-graphite hover:text-charcoal px-3 py-1.5 transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => onStart('signup')} 
            className="text-sm font-semibold bg-pastel-lilac hover:bg-pastel-lilac/80 px-4 py-2 rounded-xl shadow-sm transition-smooth"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Abstract Pastel Background Blurs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-pastel-lavender/40 blur-[90px] -z-10" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-pastel-sky/50 blur-[90px] -z-10" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-pastel-rose/40 rounded-full border border-pastel-rose/60 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Redefining Project Operations</span>
          </div>

          <h1 className="font-outfit text-4xl md:text-6xl font-extrabold tracking-tight text-charcoal leading-[1.1] mb-6">
            A premium operating system <br />
            <span className="bg-gradient-to-r from-pastel-lilac to-pastel-blue bg-clip-text text-transparent">
              built for modern product teams
            </span>
          </h1>

          <p className="text-lg md:text-xl text-graphite max-w-xl mb-10 leading-relaxed">
            Beautiful task workflows, interactive dependency pipelines, live presence synchronizations, and advanced telemetry analytics in one ivory canvas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button 
              onClick={() => onStart('signup')} 
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-charcoal text-background hover:bg-charcoal/90 px-6 py-3.5 rounded-xl shadow-lg transition-smooth"
            >
              Start Building Now
              <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              href="#features" 
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-pastel-mint border border-pastel-mint/80 hover:bg-pastel-mint/80 px-6 py-3.5 rounded-xl transition-smooth"
            >
              Explore Capabilities
            </a>
          </div>
        </motion.div>

        {/* Hero Interactive Teaser */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="w-full max-w-5xl glass-panel rounded-3xl p-3 shadow-2xl border border-pastel-lilac/30"
        >
          <div className="w-full h-[400px] md:h-[500px] bg-background-bone rounded-2xl overflow-hidden flex flex-col relative border border-pastel-lilac/10">
            {/* Top Bar Mimic */}
            <div className="h-12 border-b border-pastel-lilac/15 px-4 flex items-center justify-between bg-background-cream">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pastel-rose" />
                <div className="w-3 h-3 rounded-full bg-pastel-peach" />
                <div className="w-3 h-3 rounded-full bg-pastel-sage" />
                <span className="text-xs text-slateMuted font-mono ml-4">workspace / roadmap / graph-view</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pastel-mint animate-pulse" />
                <span className="text-xs text-graphite font-medium">3 active users online</span>
              </div>
            </div>
            
            {/* Graph Interface Mimic (Static SVG Preview) */}
            <div className="flex-1 flex bg-[#FAF7F2] p-8 relative overflow-hidden">
              {/* Fake Sidebar */}
              <div className="w-44 border-r border-pastel-lilac/10 pr-6 flex flex-col gap-3">
                <div className="h-6 w-full bg-pastel-sky/40 rounded-md" />
                <div className="h-6 w-5/6 bg-pastel-sky/20 rounded-md" />
                <div className="h-6 w-4/5 bg-pastel-sky/20 rounded-md" />
                <div className="h-6 w-full bg-pastel-sky/20 rounded-md" />
              </div>
              {/* Canvas Mimic */}
              <div className="flex-1 pl-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="glass-card p-4 rounded-2xl w-48 shadow-sm flex flex-col gap-2">
                    <span className="text-[10px] bg-pastel-rose text-charcoal font-semibold px-2 py-0.5 rounded w-max">EPIC</span>
                    <span className="font-semibold text-xs">PMS-101: Core Auth Module</span>
                    <div className="h-1.5 w-full bg-pastel-lilac/30 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-pastel-lilac rounded-full" />
                    </div>
                  </div>
                  
                  <div className="glass-card p-4 rounded-2xl w-48 shadow-sm flex flex-col gap-2">
                    <span className="text-[10px] bg-pastel-blue text-charcoal font-semibold px-2 py-0.5 rounded w-max">BUG</span>
                    <span className="font-semibold text-xs">PMS-104: Socket.IO dropoff</span>
                    <span className="text-[10px] text-slateMuted">Assigned: Lakshya Chopra</span>
                  </div>
                </div>

                {/* SVG connection lines representing dependency flow */}
                <svg className="absolute inset-0 pointer-events-none w-full h-full">
                  <path d="M 320 180 Q 420 180, 520 140" stroke="#CFC5E6" stroke-width="2" stroke-dasharray="4" fill="none" />
                  <path d="M 320 180 Q 420 280, 520 260" stroke="#EFD7D7" stroke-width="2" fill="none" />
                </svg>

                <div className="flex justify-center">
                  <div className="glass-card p-4 rounded-2xl w-52 shadow-sm flex flex-col gap-2 relative z-10">
                    <span className="text-[10px] bg-pastel-mint text-charcoal font-semibold px-2 py-0.5 rounded w-max">FEATURE</span>
                    <span className="font-semibold text-xs">PMS-102: Dependency Board</span>
                    <span className="text-[10px] text-slateMuted">Priority: Urgent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 px-6 bg-background-bone relative border-t border-pastel-lilac/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold mb-4">
              Premium features, zero noise
            </h2>
            <p className="text-graphite">
              Every interface layer has been tailored with custom design elements to present rich software metrics elegantly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <div key={i} className="glass-panel p-8 rounded-3xl shadow-sm hover:shadow-md transition-smooth flex gap-4">
                <div className="p-3 bg-background rounded-xl border border-pastel-lilac/30 h-max flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-graphite leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="font-outfit text-3xl md:text-4xl font-extrabold mb-4">
              Flexible options for any team size
            </h2>
            <p className="text-graphite mb-8">
              All plans include complete workspace setup and initial template databases.
            </p>
            
            {/* Custom billing period slider */}
            <div className="inline-flex bg-background-bone p-1 rounded-xl border border-pastel-lilac/25">
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-smooth ${billingPeriod === 'monthly' ? 'bg-charcoal text-background shadow' : 'text-slateMuted'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingPeriod('yearly')}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-smooth ${billingPeriod === 'yearly' ? 'bg-charcoal text-background shadow' : 'text-slateMuted'}`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map((plan, i) => (
              <div 
                key={i} 
                className={`glass-panel p-8 rounded-3xl flex flex-col relative ${
                  plan.popular ? 'border-2 border-pastel-lilac shadow-md' : 'border border-pastel-lilac/25 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-pastel-lilac text-charcoal text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-pastel-lilac">
                    Most Popular
                  </span>
                )}
                
                <h3 className="font-outfit font-extrabold text-xl mb-1">{plan.name}</h3>
                <p className="text-xs text-slateMuted mb-6">{plan.tagline}</p>
                
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-outfit font-extrabold">${plan.price}</span>
                  <span className="text-sm text-slateMuted">/ user / mo</span>
                </div>

                <ul className="flex-1 flex flex-col gap-3.5 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex gap-2.5 items-start text-sm text-graphite">
                      <Check className="w-4 h-4 text-pastel-lilac shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={plan.action}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-smooth ${
                    plan.popular 
                      ? 'bg-charcoal text-background hover:bg-charcoal/90 shadow'
                      : 'bg-background-bone hover:bg-background border border-pastel-lilac/30 text-charcoal'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 bg-background-bone border-t border-pastel-lilac/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-outfit text-3xl font-extrabold text-center mb-16">
            Frequently Asked Questions
          </h2>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, i) => (
              <div key={i} className="glass-panel rounded-2xl overflow-hidden border border-pastel-lilac/20">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 pt-1 text-sm text-graphite border-t border-pastel-lilac/10 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="mt-auto bg-background px-6 py-12 border-t border-pastel-lilac/15">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PMS Logo" className="h-8 w-auto" />
          </div>
          <p className="text-xs text-slateMuted">
            &copy; {new Date().getFullYear()} PMS Inc. All rights reserved. Made by Self-Lakshh.
          </p>
        </div>
      </footer>
    </div>
  );
};
