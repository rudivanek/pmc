import React from 'react';
import { Book, Sparkles, Zap, Sliders, FileText, Copy, BarChart2, AlignJustify, Lightbulb, PenTool, Settings, RefreshCw, Send, Award, Save, Globe, Users, Target, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Features: React.FC = () => {
  const { theme } = useTheme();

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

  const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
    return (
      <div className="mt-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
          <div className="w-1 h-5 bg-primary-500 mr-2 rounded-full"></div>
          {title}
        </h3>
        <div className="pl-3 space-y-3">
          {children}
        </div>
      </div>
    );
  };

  const Callout = ({ variant = 'info', title, children }: { variant?: 'info' | 'warning' | 'tip'; title: string; children: React.ReactNode }) => {
    const bgColorClass = 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    
    return (
      <div className={`p-4 rounded-md my-4 border ${bgColorClass}`}>
        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{title}</h4>
        <div className="text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </div>
    );
  };

  const FeatureGrid = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
      {children}
    </div>
  );

  const FeatureCard = ({ title, icon: Icon, description }: { title: string; icon: React.ElementType; description: string }) => (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-2">
        <Icon size={18} className="text-primary-500 mr-2" />
        <h4 className="font-medium text-gray-800 dark:text-gray-200">{title}</h4>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );

  const InputCard = ({ title, description, example }: { title: string; description: string; example?: string }) => (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{description}</p>
      {example && (
        <div className="text-xs text-gray-500 dark:text-gray-500 italic">
          Example: {example}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Book size={28} className="text-primary-500 mr-2" />
          <h1 className="text-3xl font-bold text-black dark:text-white">Features</h1>
        </div>
        
        <Section title="Copy Maker: AI-Powered Content Generation Platform" icon={Sparkles}>
          <p>
            PimpMyCopy's Copy Maker is the comprehensive AI-powered platform for all your content generation needs. It allows you to create entirely new marketing copy from scratch or enhance your existing content. Copy Maker provides a dynamic, card-based interface for complete creative control, leveraging cutting-edge AI models.
          </p>
          <Callout title="AI Models Available" variant="info"> {/* Changed from bg-blue-50, text-blue-800 */}
            <p>Copy Maker leverages multiple state-of-the-art AI models:</p>
            <ul className="mt-2 space-y-1 list-disc ml-5">
              <li><strong>DeepSeek V3</strong> - Latest DeepSeek Chat model for natural, high-quality content generation</li>
              <li><strong>GPT-4o Omni</strong> - OpenAI's advanced multimodal model for premium content creation</li>
              <li><strong>DeepSeek V3 (deepseek-chat)</strong> - Latest DeepSeek Chat model for natural, high-quality content generation.</li>
              <li><strong>GPT-4 Omni (gpt-4o)</strong> - OpenAI's advanced multimodal model for premium content creation.</li>
              <li><strong>GPT-4 Turbo (gpt-4-turbo)</strong> - High-performance model with extended context and enhanced capabilities.</li>
              <li><strong>GPT-3.5 Turbo (gpt-3.5-turbo)</strong> - Fast, economical option for efficient content generation.</li>
              <li><strong>Grok 4 Latest (grok-4-latest)</strong> - xAI's latest model, offering unique perspectives and capabilities.</li>
            </ul>
            <p className="mt-2">Switch between models based on your quality requirements, speed preferences, and budget considerations. Each model offers a distinct balance of performance, cost, and output style.</p>
          </Callout>

          <SubSection title="Dynamic Card-Based Interface">
            <p>
              Copy Maker uses a revolutionary card-based approach where each piece of generated content appears as an interactive card. This allows you to:
            </p>
            
            <div className="mt-4 space-y-2">
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Generate On-Demand:</strong> Create alternative versions, apply voice styles, or generate scores for any content piece without regenerating everything</li>
                <li><strong>Visual Threading:</strong> See clear relationships between original content and derived variations through visual connection lines</li>
                <li><strong>Independent Actions:</strong> Each card has its own action buttons for creating alternatives, applying personas, or generating quality scores</li>
                <li><strong>Flexible Workflow:</strong> Start with basic copy and progressively enhance only the pieces you want to develop further</li>
                <li><strong>Real-time Progress:</strong> Watch detailed progress messages as content generates, with the ability to cancel operations</li>
                <li><strong>Content Preservation:</strong> All generated content remains accessible until you choose to clear it</li>
              </ul>
            </div>
            
            <Callout title="Why Card-Based Generation?" variant="tip">
              <p>
                Traditional copy tools force you to regenerate everything when you want variations. Copy Maker eliminates this waste by letting you selectively enhance only the content pieces you want to develop further. Generate your base copy, then add alternatives, voice styles, or scores exactly where needed. This saves time, reduces API costs, and gives you complete creative control.
              </p>
            </Callout>
          </SubSection>
        </Section>
        
        <Section title="Input Parameters & Controls" icon={Settings}>
          <p>
            Copy Maker provides comprehensive input controls to precisely guide AI content generation. Each parameter influences how the AI understands your requirements and shapes the output accordingly.
          </p>
          
          <SubSection title="Project Setup">
            <p>Establish the foundational context for your content generation:</p>
            <FeatureGrid>
              <InputCard 
                title="Customer" 
                description="Select or create customer profiles to organize your work and maintain context across projects."
                example="Acme Corp, Local Restaurant, Tech Startup"
              />
              <InputCard 
                title="Product/Service Name" 
                description="Specify the exact name of what you're promoting to ensure accurate, branded content."
                example="Premium Web Hosting, Marketing Consultation, Mobile App"
              />
              <InputCard 
                title="Brief Description" 
                description="A short project identifier that helps you organize and find your work later."
                example="Homepage redesign, Product launch copy, Email campaign"
              />
            </FeatureGrid>
          </SubSection>

          <SubSection title="Core Content">
            <p>The foundation of your content generation - choose your approach:</p>
            <FeatureGrid>
              <InputCard 
                title="Business Description" 
                description="Detailed information about your business, product, or service. This is used when creating entirely new copy from scratch."
                example="A cloud-based project management tool that helps remote teams collaborate efficiently..."
              />
              <InputCard 
                title="Original Copy" 
                description="Existing copy that you want to improve, optimize, or use as a starting point for variations."
                example="Your current homepage text, email content, or marketing materials that need enhancement"
              />
              <InputCard 
                title="Page Type" 
                description="Specifies the type of page or content format you're creating, which influences structure and approach."
                example="Homepage, About, Services, Contact, Other"
              />
              <InputCard 
                title="Section" 
                description="The specific section within a page type, providing focused guidance for that content area."
                example="Hero Section, Benefits, Features, FAQ, Full Copy"
              />
              <InputCard 
                title="Excluded Terms" 
                description="Words, phrases, or competitor names you want the AI to avoid in the generated content."
                example="Competitor names, technical jargon, inappropriate terms"
              />
            </FeatureGrid>
          </SubSection>

          <SubSection title="Targeting & Audience">
            <p>Define your audience and competitive landscape for precise targeting:</p>
            <FeatureGrid>
              <InputCard 
                title="Target Audience" 
                description="Detailed description of who will read this content, including demographics, interests, and pain points."
                example="Small business owners aged 30-50 who struggle with digital marketing and need affordable solutions"
              />
              <InputCard 
                title="Industry/Niche" 
                description="Select from categorized industry options or create custom niches to ensure industry-appropriate language."
                example="SaaS/Tech, Healthcare, E-commerce, Real Estate, Legal Services"
              />
              <InputCard 
                title="Reader's Stage in Funnel" 
                description="Where your audience is in their buyer's journey, influencing the messaging approach and urgency level."
                example="Awareness, Consideration, Decision, Retention, Advocacy"
              />
              <InputCard 
                title="Competitor URLs" 
                description="Up to 3 competitor website URLs for the AI to consider when creating differentiated messaging."
                example="https://competitor1.com, https://competitor2.com"
              />
              <InputCard 
                title="Target Audience Pain Points" 
                description="Specific problems or challenges your audience faces that your solution addresses."
                example="Struggling with time management, losing customers to competitors, overwhelmed by manual processes"
              />
              <InputCard 
                title="Competitor Copy (Text)" 
                description="Paste competitor copy text that you want to outperform or differentiate from."
                example="Competitor's homepage text, email campaigns, or marketing materials"
              />
            </FeatureGrid>
          </SubSection>

          <SubSection title="Strategic Messaging">
            <p>Control the core message, emotions, and strategic elements:</p>
            <FeatureGrid>
              <InputCard 
                title="Key Message" 
                description="The main point or value proposition you want to communicate throughout the content."
                example="Our platform reduces project delays by 40% while improving team collaboration"
              />
              <InputCard 
                title="Call to Action" 
                description="The specific action you want readers to take after reading your content."
                example="Start your free trial, Schedule a consultation, Download our guide"
              />
              <InputCard 
                title="Desired Emotion" 
                description="The emotional response you want to evoke in your readers, influencing tone and approach."
                example="Trust, Excitement, Relief, Confidence, Urgency"
              />
              <InputCard 
                title="Brand Values" 
                description="Core values that represent your brand and should be reflected in the messaging."
                example="Innovation, Reliability, Transparency, Customer-first, Sustainability"
              />
              <InputCard 
                title="Keywords" 
                description="SEO keywords and key phrases that should be naturally integrated throughout the content."
                example="project management, team collaboration, productivity software"
              />
              <InputCard 
                title="Context" 
                description="Additional situational information that helps the AI understand the broader context."
                example="Launching during competitive season, targeting cost-conscious buyers, post-pandemic market"
              />
            </FeatureGrid>
          </SubSection>

          <SubSection title="Tone & Style Controls">
            <p>Fine-tune the voice, language, and formatting of your content:</p>
            <FeatureGrid>
              <InputCard 
                title="Language" 
                description="Choose from 6 supported languages for content generation."
                example="English, Spanish, French, German, Italian, Portuguese"
              />
              <InputCard 
                title="Tone" 
                description="Overall writing style that influences vocabulary choice and sentence structure."
                example="Professional, Friendly, Bold, Minimalist, Creative, Persuasive"
              />
              <InputCard 
                title="Tone Level" 
                description="Fine-tune formality on a scale from 0 (very formal) to 100 (very casual)."
                example="0 = Academic style, 50 = Balanced professional, 100 = Conversational friend"
              />
              <InputCard 
                title="Preferred Writing Style" 
                description="Specific writing approach that guides how information is presented."
                example="Persuasive, Conversational, Informative, Storytelling, Educational"
              />
              <InputCard 
                title="Language Style Constraints" 
                description="Specific writing rules to follow, ensuring consistency with your brand guidelines."
                example="Avoid passive voice, No idioms, Keep sentences short, Use gender-neutral language"
              />
              <InputCard 
                title="Output Structure" 
                description="Define exactly how your content should be organized with draggable elements and individual word count allocation."
                example="Header 1 (50 words), Problem (100 words), Solution (150 words), Benefits (100 words)"
              />
            </FeatureGrid>
          </SubSection>

          <SubSection title="Word Count & Length Controls">
            <p>Precise control over content length and distribution:</p>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Target Word Count Options</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
                  <li><strong>Short (50-100 words):</strong> Perfect for headlines, CTAs, and brief descriptions</li>
                  <li><strong>Medium (100-200 words):</strong> Ideal for product descriptions and short sections</li>
                  <li><strong>Long (200-400 words):</strong> Suitable for detailed explanations and full sections</li>
                  <li><strong>Custom:</strong> Specify any word count from 50 to 2000+ words</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Advanced Word Count Features</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc pl-5">
                  <li><strong>Strictly Adhere to Target:</strong> Forces multiple AI revisions until exact word count is achieved</li>
                  <li><strong>Flexible Word Count for Short Content:</strong> Allows ±20% tolerance for content under 100 words to maintain natural phrasing</li>
                  <li><strong>Section-Level Word Allocation:</strong> Distribute total word count across specific sections with drag-and-drop reordering</li>
                  <li><strong>Real-time Word Count Distribution:</strong> See exactly how words are allocated across structure elements</li>
                </ul>
              </div>
            </div>
          </SubSection>
        </Section>
        
        <Section title="Content Enhancement Options" icon={Zap}>
          <p>
            Copy Maker offers powerful enhancement options that can be applied to any generated content piece individually, giving you complete control over your creative process.
          </p>
          
          <SubSection title="Core Enhancement Features">
            <FeatureGrid>
              <FeatureCard 
                title="Generate Alternative Versions" 
                icon={RefreshCw}
                description="Create fresh approaches with different angles or tones from any existing content piece. Generate up to multiple alternatives on-demand."
              />
              <FeatureCard 
                title="Voice Style Application" 
                icon={PenTool}
                description="Transform any content to match the distinctive voice of iconic personalities like Steve Jobs, Seth Godin, or David Ogilvy."
              />
              <FeatureCard 
                title="Content Quality Scoring" 
                icon={BarChart2}
                description="Generate detailed quality assessments with scores for clarity, persuasiveness, tone match, and engagement, plus improvement explanations."
              />
              <FeatureCard 
                title="SEO Metadata Generation" 
                icon={Globe}
                description="Create comprehensive SEO elements including URL slugs, meta descriptions, headings, and Open Graph tags with strict character limits."
              />
              <FeatureCard 
                title="Keyword Integration" 
                icon={Target}
                description="Force natural integration of all specified keywords throughout the copy for enhanced SEO performance."
              />
              <FeatureCard 
                title="Content Elaboration" 
                icon={AlignJustify}
                description="Force detailed explanations, specific examples, and case studies to create more comprehensive, valuable content."
              />
            </FeatureGrid>
          </SubSection>
          
          <SubSection title="Voice Style Library">
            <p>Transform your content with distinctive voice styles from renowned communicators and brand archetypes:</p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Personas (Iconic Personalities & Experts)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Alex Hormozi</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Brené Brown</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">David Ogilvy</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Don Draper</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Donald Miller</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Elon Musk</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Gary Halbert</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Maider Tomasena</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Marie Forleo</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Richard Branson</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Seth Godin</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Simon Sinek</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Steve Jobs</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Tony Robbins</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Generic Tone/Style</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Bold Direct</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Cool Trendy</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Friendly Conversational</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">High-End Exclusive</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Luxury Brand</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Minimalist</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Playful</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Professional Formal</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Soft Empathetic</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Tech Startup</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Humanization Options</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Humanize (General)</div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Humanize (No AI Detection)</div>
                </div>
              </div>
            </div>
          </SubSection>

          <SubSection title="SEO Metadata & Structural Elements">
            <p>Generate comprehensive SEO optimization elements with strict character limits for maximum search engine compatibility:</p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Generated SEO Elements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-primary-600 dark:text-primary-400">URL Slugs</strong>
                    <p className="text-gray-600 dark:text-gray-400">1-5 variants, max 60 characters each</p>
                  </div>
                  <div>
                    <strong className="text-primary-600 dark:text-primary-400">Meta Descriptions</strong>
                    <p className="text-gray-600 dark:text-gray-400">1-5 variants, 155-160 characters optimal</p>
                  </div>
                  <div>
                    <strong className="text-primary-600 dark:text-primary-400">H1 Page Titles</strong>
                    <p className="text-gray-600 dark:text-gray-400">1-5 variants, max 60 characters each</p>
                  </div>
                  <div>
                    <strong className="text-primary-600 dark:text-primary-400">H2 Section Headings</strong>
                    <p className="text-gray-600 dark:text-gray-400">1-10 variants, max 70 characters each</p>
                  </div>
                  <div>
                    <strong className="text-primary-600 dark:text-primary-400">H3 Subsection Headings</strong>
                    <p className="text-gray-600 dark:text-gray-400">1-10 variants, max 70 characters each</p>
                  </div>
                  <div>
                    <strong className="text-primary-600 dark:text-primary-400">Open Graph Elements</strong>
                    <p className="text-gray-600 dark:text-gray-400">Titles (60 chars) & Descriptions (110 chars)</p>
                  </div>
                </div>
              </div>
              
              <Callout title="Character Limit Enforcement" variant="warning">
                All SEO elements are generated with strict character limit enforcement. The AI is instructed to count characters and intelligently shorten content while maintaining keywords and clarity if limits are approached.
              </Callout>
            </div>
          </SubSection>

          <SubSection title="Generative Engine Optimization (GEO)">
            <p>Optimize your content for AI assistants like ChatGPT, Claude, and Gemini:</p>
            
            <div className="space-y-4">
              <FeatureGrid>
                <FeatureCard 
                  title="AI-Friendly Structure" 
                  icon={Settings}
                  description="Content structured to be easily quotable and summarizable by AI assistants."
                />
                <FeatureCard 
                  title="TL;DR Summaries" 
                  icon={AlignJustify}
                  description="Optional 1-2 sentence summaries at the beginning of content for immediate AI comprehension."
                />
                <FeatureCard 
                  title="Location Targeting" 
                  icon={Target}
                  description="Include location-specific references to improve local AI search visibility."
                />
              </FeatureGrid>
              
              <Callout title="GEO Benefits" variant="tip">
                <p>Content optimized for Generative Engine Optimization helps your business appear in AI-generated responses, increasing visibility as more users rely on AI assistants for research and recommendations.</p>
              </Callout>
            </div>
          </SubSection>
        </Section>
        
        <Section title="Workspace & Management Tools" icon={BarChart2}>
          <p>
            Copy Maker includes comprehensive tools to organize, save, and analyze your content creation workflow.
          </p>
          
          <SubSection title="Template System">
            <p>Save and reuse your configurations for consistent content creation:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Save Current Settings:</strong> Capture all input parameters, enhancement options, and generation settings</li>
              <li><strong>Template Library:</strong> Organize templates with names and descriptions for easy identification</li>
              <li><strong>Quick Loading:</strong> Load any saved template to instantly populate all form fields</li>
              <li><strong>Brand Consistency:</strong> Maintain consistent voice, keywords, and messaging across projects</li>
              <li><strong>Team Collaboration:</strong> Share template configurations with team members</li>
            </ul>
          </SubSection>
          
          <SubSection title="Customer Management">
            <p>Organize your work by client or project:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Customer Profiles:</strong> Create and manage customer/client profiles</li>
              <li><strong>Project Organization:</strong> Associate all generated content with specific customers</li>
              <li><strong>Content Filtering:</strong> Filter dashboard content by customer for easy access</li>
              <li><strong>Client Reporting:</strong> Track content creation and usage by client</li>
            </ul>
          </SubSection>
          
          <SubSection title="Dashboard Analytics">
            <p>Comprehensive workspace with four main sections:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <FileText size={18} className="text-primary-500 mr-2" />
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Copy Sessions</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access all your Copy Maker sessions with input parameters and generation settings. Resume any session to continue working or create variations.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <Settings size={18} className="text-primary-500 mr-2" />
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Templates</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your saved template configurations for quick reuse across similar projects and clients.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <Save size={18} className="text-primary-500 mr-2" />
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Saved Outputs</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View your specifically saved content outputs including all variations, voice styles, SEO metadata, and quality scores.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <BarChart2 size={18} className="text-primary-500 mr-2" />
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Token Consumption</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track API usage, costs by model, and usage patterns across different Copy Maker features for budget management.
                </p>
              </div>
            </div>
          </SubSection>
        </Section>
        
        <Section title="Output & Export Features" icon={Copy}>
          <p>
            Copy Maker provides sophisticated tools for reviewing, comparing, and exporting your generated content.
          </p>
          
          <SubSection title="Dynamic Content Cards">
            <p>Each piece of generated content appears in its own interactive card with comprehensive information:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Content Preview:</strong> Full content display with proper formatting and structure</li>
              <li><strong>Word Count Analysis:</strong> Real-time word count with target comparison and accuracy indicators</li>
              <li><strong>Quality Indicators:</strong> Color-coded quality scores when available (Green 90+, Blue 75-89, Yellow 60-74, Red &lt;60)</li>
              <li><strong>Source Tracking:</strong> Clear indication of how each piece relates to others (alternatives, voice styles, etc.)</li>
              <li><strong>Action Buttons:</strong> Direct access to create alternatives, apply voice styles, or generate scores</li>
              <li><strong>Copy Functionality:</strong> One-click copying of individual content pieces with quality score information</li>
              <li><strong>Threading System:</strong> Visual lines showing relationships between parent and child content pieces</li>
            </ul>
          </SubSection>
          
          <SubSection title="Content Quality Scoring">
            <p>Detailed quality assessment for any generated content piece:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 mb-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">Overall Score (0-100)</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive quality rating with color-coded indicators</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">Clarity Assessment</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Evaluation of how clear and understandable the content is</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">Persuasiveness Rating</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assessment of how effectively it convinces and motivates readers</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">Tone Match Analysis</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">How well the content matches your requested tone and style</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">Engagement Level</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Evaluation of how interesting and engaging the content is to read</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">Improvement Explanation</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Detailed explanation of why and how the content succeeds</p>
              </div>
            </div>
          </SubSection>
          
          <SubSection title="Export & Sharing Options">
            <p>Multiple ways to export and share your generated content:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Save Output:</strong> Permanently save the current session's content to your account for future reference</li>
              <li><strong>Copy as Markdown:</strong> Export all content as formatted Markdown text for easy import into other applications</li>
              <li><strong>Export to Text File:</strong> Download the complete content collection as a formatted text file</li>
              <li><strong>Individual Copy:</strong> Copy any single content piece with its quality score information included</li>
              <li><strong>View Prompts:</strong> Access the exact AI prompts used to generate content for transparency and learning</li>
              <li><strong>Template Saving:</strong> Save your current input configuration as a reusable template</li>
            </ul>
          </SubSection>

          <SubSection title="SEO Metadata Display">
            <p>When SEO metadata generation is enabled, comprehensive SEO elements are displayed with:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Character Counters:</strong> Live character count feedback with color-coded status indicators</li>
              <li><strong>Multiple Variants:</strong> Various options for each SEO element to choose from</li>
              <li><strong>Optimization Guidance:</strong> Visual feedback when elements approach or exceed character limits</li>
              <li><strong>Copy Functionality:</strong> Easy copying of individual SEO elements for implementation</li>
              <li><strong>Structured Organization:</strong> Clear grouping of URL slugs, meta descriptions, headings, and Open Graph elements</li>
            </ul>
          </SubSection>
        </Section>
        
        <div className="mt-12 p-6 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <Lightbulb size={24} className="text-primary-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tips for Maximum Results</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Content Creation Tips</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Start with a <strong>detailed business description</strong> - the more context you provide, the better the AI understands your needs</li>
                <li>Use the <strong>Evaluate Inputs</strong> button to get feedback on your parameters before generating</li>
                <li>Define your <strong>target audience specifically</strong> - include demographics, pain points, and motivations</li>
                <li>Experiment with different <strong>AI models</strong> - each has unique strengths for different content types</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Advanced Workflow Tips</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Use <strong>suggestion buttons</strong> (<Zap size={16} className="inline-block text-primary-500 mx-1" />) to quickly populate fields with AI-generated ideas</li>
                <li>Apply <strong>voice styles selectively</strong> - not every piece needs persona styling</li>
                <li>Set up <strong>output structure</strong> with word count allocation for precise content organization</li>
                <li>Save successful configurations as <strong>templates</strong> for consistent brand messaging</li>
                <li>Use <strong>competitor copy analysis</strong> to create differentiated positioning</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link
              to="/step-by-step"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 mr-4"
            >
              <List size={20} className="mr-2" />
              Step-by-Step Guide
            </Link>
            <Link
              to="/copy-maker"
              className="inline-block bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-8 rounded-lg text-lg"
            >
              <Sparkles size={20} className="inline-block mr-2" />
              Start Using Copy Maker
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;