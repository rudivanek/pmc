import React from 'react';
import { BookOpen, Sparkles, Zap, FileText, Copy, BarChart2, AlignJustify, Lightbulb, PenTool, Settings, RefreshCw, Target, Globe, Users, List } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQ: React.FC = () => {
  const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => {
    return (
      <div className="mb-12 p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg shadow-sm">
        <div className="flex items-center mb-4 pb-2 border-b border-gray-300 dark:border-gray-700">
          <Icon size={24} className="text-primary-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="text-gray-700 dark:text-gray-300 space-y-4">
          {children}
        </div>
      </div>
    );
  };

  const QuestionAnswer = ({ question, answer }: { question: string; answer: React.ReactNode }) => {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {question}
        </h3>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          {answer}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* TL;DR Summary */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-sm text-gray-800 dark:text-gray-300">
            This comprehensive FAQ page for PimpMyCopy answers 30 common questions about the app's features, benefits, and usage to help users maximize their marketing copy potential.
          </p>
        </div>

        <div className="flex items-center mb-8">
          <BookOpen size={28} className="text-primary-500 mr-2" />
          <h1 className="text-3xl font-bold text-black dark:text-white">PimpMyCopy FAQ: Your Complete Guide to Powerful Copywriting</h1>
        </div>
        
        <Section title="Getting Started" icon={Sparkles}> {/* Changed from bg-blue-50, text-blue-800 */}
          <QuestionAnswer
            question="1. What is PimpMyCopy?"
            answer={
              <p>PimpMyCopy is an AI-powered copywriting assistant that helps marketers, entrepreneurs, and content creators generate high-converting marketing copy. Using advanced natural language processing, it transforms basic ideas into compelling content for ads, emails, websites, and more.</p>
            }
          />
          <QuestionAnswer
            question="2. How do I create an account?"
            answer={
              <p>Visit pimpmycopy.xyz and click "Sign Up." You can register using your email or through Google authentication. The process takes under 60 seconds.</p>
            }
          />
          <QuestionAnswer
            question="3. Is there a free trial?"
            answer={
              <p>Yes! We offer a 7-day free trial with access to all core features. No credit card required during trial period.</p>
            }
          />
          <QuestionAnswer
            question="4. What platforms does PimpMyCopy support?"
            answer={
              <p>Our web app works on all modern browsers (Chrome, Safari, Firefox, Edge). Mobile optimization is coming in Q3 2024.</p>
            }
          />
          <QuestionAnswer
            question="5. Can I use PimpMyCopy for my entire marketing team?"
            answer={
              <p>Absolutely. We offer team plans with shared workspaces, collaborative editing, and centralized billing.</p>
            }
          />
        </Section>

        <Section title="Core Features" icon={Zap}>
          <QuestionAnswer
            question="6. What types of copy can PimpMyCopy generate?"
            answer={
              <>
                <p>Our AI specializes in:</p>
                <ul className="list-disc pl-5">
                  <li>High-converting ad copy (Facebook, Google, LinkedIn)</li>
                  <li>Email sequences (welcome series, nurture campaigns)</li>
                  <li>Landing page content</li>
                  <li>Product descriptions</li>
                  <li>Social media posts</li>
                  <li>SEO-optimized blog outlines</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="7. How does the AI improve my existing copy?"
            answer={
              <>
                <p>Paste your draft into the editor, and our AI will:</p>
                <ul className="list-disc pl-5">
                  <li>Enhance clarity and readability</li>
                  <li>Strengthen value propositions</li>
                  <li>Optimize for emotional triggers</li>
                  <li>Suggest power words and CTAs</li>
                  <li>Adjust tone (professional, friendly, authoritative)</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="8. Can PimpMyCopy match my brand voice?"
            answer={
              <p>Yes! Our Brand Voice Trainer learns from your existing content to maintain consistent tone across all generated copy.</p>
            }
          />
          <QuestionAnswer
            question="9. What's the difference between Quick Generate and Advanced Mode?"
            answer={
              <>
                <p>Quick Generate delivers instant copy with basic parameters. Advanced Mode offers granular control over:</p>
                <ul className="list-disc pl-5">
                  <li>Target audience personas</li>
                  <li>Emotional triggers</li>
                  <li>Keyword density</li>
                  <li>Sentence structure preferences</li>
                </ul>
              </>
            }
          />
        </Section>

        <Section title="Content Quality & Originality" icon={FileText}>
          <QuestionAnswer
            question="10. How does PimpMyCopy ensure content uniqueness?"
            answer={
              <>
                <p>Our proprietary algorithm combines:</p>
                <ul className="list-disc pl-5">
                  <li>Real-time plagiarism checking</li>
                  <li>Semantic variation technology</li>
                  <li>Dynamic sentence restructuring</li>
                </ul>
                <p>All content passes Copyscape verification.</p>
              </>
            }
          />
          <QuestionAnswer
            question="11. Can the AI copy my competitors?"
            answer={
              <>
                <p>We don't recommend direct copying, but our Competitive Analysis tool helps you:</p>
                <ul className="list-disc pl-5">
                  <li>Identify competitor messaging strengths</li>
                  <li>Discover untapped angles</li>
                  <li>Find high-performing keywords</li>
                  <li>Benchmark your positioning</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="12. What if I need industry-specific terminology?"
            answer={
              <>
                <p>Our Industry Expert mode includes specialized knowledge bases for:</p>
                <ul className="list-disc pl-5">
                  <li>SaaS and tech</li>
                  <li>E-commerce</li>
                  <li>Professional services</li>
                  <li>Healthcare</li>
                  <li>Finance</li>
                  <li>Real estate</li>
                </ul>
              </>
            }
          />
        </Section>

        <Section title="SEO Optimization" icon={Target}>
          <QuestionAnswer
            question="13. How does PimpMyCopy help with SEO?"
            answer={
              <>
                <p>Our SEO Assistant provides:</p>
                <ul className="list-disc pl-5">
                  <li>Keyword clustering suggestions</li>
                  <li>Semantic keyword integration</li>
                  <li>Readability scoring</li>
                  <li>Meta description generation</li>
                  <li>Header tag optimization</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="14. Can it analyze my competitors' SEO strategy?"
            answer={
              <>
                <p>Yes! Paste a competitor's URL to get:</p>
                <ul className="list-disc pl-5">
                  <li>Keyword gap analysis</li>
                  <li>Content length benchmarks</li>
                  <li>Backlink opportunities</li>
                  <li>Topic cluster recommendations</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="15. Does it support local SEO?"
            answer={
              <>
                <p>Our upcoming Local Pack update (June 2024) will include:</p>
                <ul className="list-disc pl-5">
                  <li>Geo-targeted keyword suggestions</li>
                  <li>NAP consistency checking</li>
                  <li>Local schema markup generation</li>
                </ul>
              </>
            }
          />
        </Section>

        <Section title="Integrations & Workflow" icon={Settings}>
          <QuestionAnswer
            question="16. What platforms does PimpMyCopy integrate with?"
            answer={
              <>
                <p>Current integrations include:</p>
                <ul className="list-disc pl-5">
                  <li>WordPress (direct publishing)</li>
                  <li>Google Docs</li>
                  <li>Slack</li>
                  <li>HubSpot</li>
                  <li>Mailchimp</li>
                  <li>Shopify</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="17. Can I export to different formats?"
            answer={
              <>
                <p>Export options include:</p>
                <ul className="list-disc pl-5">
                  <li>HTML</li>
                  <li>Markdown</li>
                  <li>Plain text</li>
                  <li>CSV for bulk content</li>
                  <li>PDF with styling options</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="18. Is there a Chrome extension?"
            answer={
              <>
                <p>Our browser extension (coming May 2024) will enable:</p>
                <ul className="list-disc pl-5">
                  <li>One-click copy generation from any webpage</li>
                  <li>In-situ editing for CMS platforms</li>
                  <li>Social media post drafting from any platform</li>
                </ul>
              </>
            }
          />
        </Section>

        <Section title="Pricing & Plans" icon={BarChart2}>
          <QuestionAnswer
            question="19. What's included in the free trial?"
            answer={
              <>
                <p>Full access to:</p>
                <ul className="list-disc pl-5">
                  <li>50 copy generations/month</li>
                  <li>Basic SEO tools</li>
                  <li>3 brand voice trainings</li>
                  <li>Standard integrations</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="20. What are the subscription tiers?"
            answer={
              <>
                <ul className="list-disc pl-5">
                  <li>Starter ($29/mo): 200 generations</li>
                  <li>Pro ($79/mo): Unlimited generations + advanced features</li>
                  <li>Enterprise (custom): API access, dedicated support</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="21. Do you offer annual discounts?"
            answer={
              <p>Save 20% with annual billing. Team plans get additional volume discounts.</p>
            }
          />
        </Section>

        <Section title="Advanced Features" icon={Lightbulb}>
          <QuestionAnswer
            question="22. What's A/B testing mode?"
            answer={
              <>
                <p>Generate multiple copy variations to:</p>
                <ul className="list-disc pl-5">
                  <li>Test different emotional appeals</li>
                  <li>Compare headline formulas</li>
                  <li>Evaluate CTA placements</li>
                  <li>Measure engagement potential</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="23. How does the Performance Predictor work?"
            answer={
              <>
                <p>Our algorithm scores your copy on:</p>
                <ul className="list-disc pl-5">
                  <li>Click-through probability</li>
                  <li>Conversion potential</li>
                  <li>Readability</li>
                  <li>Emotional resonance</li>
                </ul>
                <p>Based on analysis of 10M+ high-performing ads.</p>
              </>
            }
          />
          <QuestionAnswer
            question="24. Can I train the AI on my past successful campaigns?"
            answer={
              <>
                <p>Yes! Our Campaign Analyzer:</p>
                <ul className="list-disc pl-5">
                  <li>Identifies your top-performing elements</li>
                  <li>Creates custom templates</li>
                  <li>Recommends replication strategies</li>
                </ul>
              </>
            }
          />
        </Section>

        <Section title="Support & Resources" icon={BookOpen}>
          <QuestionAnswer
            question="25. Where can I find tutorials?"
            answer={
              <>
                <p>Our comprehensive Knowledge Base includes:</p>
                <ul className="list-disc pl-5">
                  <li>Video walkthroughs</li>
                  <li>Copywriting frameworks</li>
                  <li>Industry-specific guides</li>
                  <li>Weekly webinars</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="26. How responsive is customer support?"
            answer={
              <>
                <p>Average response times:</p>
                <ul className="list-disc pl-5">
                  <li>Email: &lt;4 hours</li>
                  <li>Live chat: &lt;15 minutes</li>
                  <li>Priority support (Pro plans): &lt;30 minutes</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="27. Do you offer custom training?"
            answer={
              <>
                <p>Enterprise clients receive:</p>
                <ul className="list-disc pl-5">
                  <li>Dedicated onboarding</li>
                  <li>Workflow consultation</li>
                  <li>Team training sessions</li>
                  <li>Quarterly strategy reviews</li>
                </ul>
              </>
            }
          />
        </Section>

        <Section title="Security & Compliance" icon={Users}>
          <QuestionAnswer
            question="28. Is my data secure?"
            answer={
              <>
                <p>We use:</p>
                <ul className="list-disc pl-5">
                  <li>AES-256 encryption</li>
                  <li>SOC 2 compliance</li>
                  <li>Regular penetration testing</li>
                  <li>GDPR-ready data policies</li>
                </ul>
              </>
            }
          />
          <QuestionAnswer
            question="29. Who owns the generated content?"
            answer={
              <p>You retain full rights to all content created with PimpMyCopy. Our Terms of Service explicitly state no claim over your intellectual property.</p>
            }
          />
          <QuestionAnswer
            question="30. How often is the AI updated?"
            answer={
              <>
                <p>Our models receive:</p>
                <ul className="list-disc pl-5">
                  <li>Weekly performance enhancements</li>
                  <li>Monthly feature updates</li>
                  <li>Quarterly major releases</li>
                </ul>
                <p>Based on user feedback and technological advancements.</p>
              </>
            }
          />
        </Section>
        
        <div className="mt-12 p-6 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Transform Your Copy?</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Master Copy Maker with our comprehensive guides and start creating amazing copy today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/step-by-step"
              className="inline-flex items-center bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg border border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <List size={20} className="mr-2" />
              Step-by-Step Guide
            </Link>
            <Link
              to="/copy-maker"
              className="inline-flex items-center bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <RefreshCw size={20} className="mr-2" />
              Start Using Copy Maker
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;