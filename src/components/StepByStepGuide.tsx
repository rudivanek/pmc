import React from 'react';
import { Link } from 'react-router-dom';
import { 
  List, 
  Sparkles, 
  Settings, 
  Target, 
  MessageSquare, 
  Eye, 
  Zap, 
  Save, 
  RefreshCw, 
  Users, 
  FileText, 
  Copy, 
  Code,
  Globe,
  BarChart3,
  BookCheck,
  Wand2,
  Download,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Tag,
  Sliders,
  PenTool
} from 'lucide-react';

const StepByStepGuide: React.FC = () => {
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

  const StepCard = ({ step, title, description, icon: Icon, children }: { step: number; title: string; description: string; icon: React.ElementType; children?: React.ReactNode }) => {
    return (
      <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
            {step}
          </div>
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Icon size={20} className="text-primary-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
            {children}
          </div>
        </div>
      </div>
    );
  };

  const ControlCard = ({ name, type, description, example }: { name: string; type: string; description: string; example?: string }) => (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
      <div className="flex items-center mb-2">
        <span className="font-medium text-gray-800 dark:text-gray-200">{name}</span>
        <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">{type}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{description}</p>
      {example && (
        <div className="text-xs text-gray-500 dark:text-gray-500 italic bg-gray-100 dark:bg-gray-800 p-2 rounded">
          <strong>Example:</strong> {example}
        </div>
      )}
    </div>
  );

  const FeatureHighlight = ({ title, description, benefit }: { title: string; description: string; benefit: string }) => (
    <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">{title}</h4>
      <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">{description}</p>
      <div className="text-xs text-blue-600 dark:text-blue-500">
        <strong className="text-gray-600 dark:text-gray-500">Benefit:</strong> <span className="text-gray-600 dark:text-gray-500">{benefit}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* TL;DR Summary */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-sm text-gray-800 dark:text-gray-300">
            <strong>TL;DR:</strong> This comprehensive step-by-step guide walks you through every feature and control in PimpMyCopy's Copy Maker interface, 
            from project setup to advanced voice styling and SEO optimization, helping you master AI-powered marketing copy generation.
          </p>
        </div>

        <div className="flex items-center mb-8">
          <List size={28} className="text-primary-500 mr-2" />
          <h1 className="text-3xl font-bold text-black dark:text-white">Step-by-Step Guide: Mastering Copy Maker</h1>
        </div>
        
        <Section title="Overview: The Copy Maker Advantage" icon={Sparkles}> {/* Changed from bg-blue-50, text-blue-800 */}
          <p>
            PimpMyCopy's Copy Maker revolutionizes content creation with its unified, card-based interface. Unlike traditional tools that force you to regenerate everything for variations, Copy Maker allows you to selectively enhance only the content pieces you want to develop further.
          </p>
          
          <FeatureHighlight 
            title="Dynamic Card System"
            description="Each piece of generated content appears as an interactive card with its own action buttons."
            benefit="Generate alternatives, apply voice styles, or add scores to specific content without affecting other pieces."
          />
          
          <FeatureHighlight 
            title="Visual Threading"
            description="Clear visual lines show relationships between original content and derived variations."
            benefit="Understand how each piece of content relates to others in your generation session."
          />
          
          <FeatureHighlight 
            title="Progressive Enhancement"
            description="Start with basic copy and progressively enhance only the pieces you want to develop."
            benefit="Save time and API costs by generating content selectively based on your needs."
          />
        </Section>

        <Section title="Step 1: Choose Your Goal" icon={Target}>
          <StepCard 
            step={1} 
            title="Understanding the Copy Maker Interface" 
            description="Copy Maker provides a unified interface for all your content generation needs."
            icon={Target}
          >
            <div className="space-y-3">
              <ControlCard 
                name="Unified Copy Maker Interface" 
                type="Single Interface"
                description="Complete card-based experience with dynamic output cards, on-demand generation, and comprehensive creative control for all copy needs."
                example="Generate new copy from business descriptions, improve existing copy, create alternatives, apply voice styles, and get detailed analysis - all in one place"
              />
            </div>
          </StepCard>
        </Section>

        <Section title="Step 2: Project Setup" icon={Users}>
          <StepCard 
            step={2} 
            title="Configure Your Project Foundation" 
            description="Set up the basic project context and organization."
            icon={Users}
          >
            <div className="space-y-3">
              <ControlCard 
                name="Model Selection" 
                type="Dropdown"
                description="Choose which AI model will generate your copy. Different models offer varying quality, speed, and cost."
                example="DeepSeek V3 (cost-effective), GPT-4o (premium quality), Grok 4 (unique perspectives)"
              />
              <ControlCard 
                name="Project Description" 
                type="Text Input (Required)"
                description="Internal field for your organization - not sent to AI. Helps you identify and manage projects."
                example="Homepage redesign for Q1 campaign, Product launch copy, Email sequence"
              />
              <ControlCard 
                name="Customer" 
                type="Dropdown + Add New"
                description="Select existing customer profile or create new one. Organizes work by client."
                example="Acme Corp, Local Restaurant, Tech Startup"
              />
              <ControlCard 
                name="Product/Service Name" 
                type="Text Input"
                description="Name of what you're promoting. Ensures accurate, branded content."
                example="Premium Web Hosting, Marketing Consultation, Mobile App Development"
              />
            </div>
          </StepCard>
        </Section>

        <Section title="Step 3: Core Content Configuration" icon={FileText}>
          <StepCard 
            step={3} 
            title="Provide Primary Content Information" 
            description="The foundation of your content generation - choose your approach."
            icon={FileText}
          >
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">What Happens During Generation:</h4>
                <ol className="text-sm text-gray-700 dark:text-gray-300 list-decimal pl-4 space-y-2">
                  <li><strong>Create New Copy:</strong> Provide business description and page details</li>
                  <li><strong>Improve Existing Copy:</strong> Paste current copy and specify what to exclude</li>
                </ol>
              </div>
              
              <ControlCard 
                name="Page Type" 
                type="Dropdown"
                description="Specifies the type of content you're creating, influencing structure and approach."
                example="Homepage, About, Services, Contact, Other"
              />
              <ControlCard 
                name="Section" 
                type="Dropdown"
                description="The specific section within a page type for focused guidance."
                example="Hero Section, Benefits, Features, FAQ, Full Copy"
              />
              <ControlCard 
                name="Business Description" 
                type="Text Area + Quality Evaluation"
                description="(Create Mode) Detailed information about your business, product, or service. Click the Zap button to get AI feedback on quality."
                example="A cloud-based project management tool that helps remote teams collaborate efficiently with real-time task tracking, file sharing, and integrated communication features."
              />
              <ControlCard 
                name="Original Copy" 
                type="Text Area + Quality Evaluation"
                description="(Improve Mode) Existing copy to enhance. Click the Zap button for quality assessment."
                example="Our software makes projects easier. Teams can work together and share files."
              />
              <ControlCard 
                name="Excluded Terms" 
                type="Text Area"
                description="(Improve Mode) Words, phrases, or competitor names to avoid in generated content."
                example="DeepSeek V3, GPT-4o, competitor names, inappropriate terms"
              />
            </div>
          </StepCard>
        </Section>

        <Section title="Step 4: Copy Targeting" icon={Target}>
          <StepCard 
            step={4} 
            title="Define Your Audience and Competitive Landscape" 
            description="Advanced targeting controls for precise audience alignment and competitive differentiation."
            icon={Target}
          >
            <div className="space-y-3">
              <ControlCard 
                name="Industry/Niche" 
                type="Category Tags + Suggestions"
                description="Select from categorized industry options or create custom niches. Click Zap for AI suggestions."
                example="SaaS/Tech, Real Estate, Healthcare, E-commerce"
              />
              <ControlCard 
                name="Target Audience" 
                type="Text Area + Suggestions"
                description="Detailed description of your ideal readers, including demographics and pain points."
                example="Small business owners aged 30-50 who struggle with digital marketing and need affordable, easy-to-implement solutions"
              />
              <ControlCard 
                name="Reader's Stage in Funnel" 
                type="Tags + Suggestions"
                description="Where your audience is in their buyer's journey, influencing messaging approach."
                example="Awareness, Consideration, Decision, Retention, Advocacy"
              />
              <ControlCard 
                name="Competitor URLs" 
                type="3 URL Inputs"
                description="Up to 3 competitor website URLs for AI to analyze for differentiation opportunities."
                example="https://competitor1.com, https://competitor2.com, https://competitor3.com"
              />
              <ControlCard 
                name="Target Audience Pain Points" 
                type="Text Area + Suggestions"
                description="Specific problems your audience faces that your solution addresses."
                example="Struggling with time management, losing customers to competitors, overwhelmed by manual processes"
              />
            </div>
          </StepCard>
        </Section>

        <Section title="Step 5: Strategic Messaging" icon={MessageSquare}>
          <StepCard 
            step={5} 
            title="Define Core Message and Emotional Impact" 
            description="Control the key message, emotions, and strategic elements that will guide your copy."
            icon={MessageSquare}
          >
            <div className="space-y-3">
              <ControlCard 
                name="Key Message" 
                type="Text Area + Suggestions"
                description="The main point or value proposition you want to communicate throughout the content."
                example="Our platform reduces project delays by 40% while improving team collaboration and accountability"
              />
              <ControlCard 
                name="Call to Action" 
                type="Text Input + Suggestions"
                description="The specific action you want readers to take after reading your content."
                example="Start your free trial, Schedule a consultation, Download our guide"
              />
              <ControlCard 
                name="Desired Emotion" 
                type="Tags + Suggestions (Pro Mode)"
                description="The emotional response you want to evoke in your readers."
                example="Trust, Excitement, Relief, Confidence, Urgency"
              />
              <ControlCard 
                name="Brand Values" 
                type="Tags + Suggestions (Pro Mode)"
                description="Core values that represent your brand and should be reflected in messaging."
                example="Innovation, Reliability, Transparency, Customer-first, Sustainability"
              />
              <ControlCard 
                name="Keywords" 
                type="Tags + Suggestions (Pro Mode)"
                description="SEO keywords that should be naturally integrated throughout the content."
                example="project management, team collaboration, productivity software, remote work"
              />
              <ControlCard 
                name="Context" 
                type="Text Area + Suggestions (Pro Mode)"
                description="Additional situational information to help AI understand the broader context."
                example="Launching during competitive season, targeting cost-conscious buyers, post-pandemic remote work trends"
              />
            </div>
          </StepCard>
        </Section>

        <Section title="Step 6: Tone & Style Controls" icon={PenTool}>
          <StepCard 
            step={6} 
            title="Fine-tune Voice and Formatting" 
            description="Control the voice, tone, and formatting to match your brand or campaign goals."
            icon={PenTool}
          >
            <div className="space-y-3">
              <ControlCard 
                name="Language" 
                type="Dropdown"
                description="Choose from 6 supported languages for content generation."
                example="English, Spanish, French, German, Italian, Portuguese"
              />
              <ControlCard 
                name="Tone" 
                type="Dropdown"
                description="Overall writing style that influences vocabulary and sentence structure."
                example="Professional, Friendly, Bold, Minimalist, Creative, Persuasive"
              />
              <ControlCard 
                name="Target Word Count" 
                type="Dropdown + Custom Input"
                description="Specify desired content length. Custom option allows precise word count targeting."
                example="Short (50-100), Medium (100-200), Long (200-400), Custom (any number)"
              />
              <ControlCard 
                name="Tone Level" 
                type="Slider (0-100)"
                description="Fine-tune formality from 0 (very formal/academic) to 100 (very casual/conversational)."
                example="0 = Academic style, 50 = Balanced professional, 100 = Friendly conversation"
              />
              <ControlCard 
                name="Preferred Writing Style" 
                type="Tags + Suggestions"
                description="Specific writing approach that guides information presentation."
                example="Persuasive, Conversational, Informative, Storytelling, Educational"
              />
              <ControlCard 
                name="Language Style Constraints" 
                type="Checkboxes"
                description="Specific writing rules to follow for brand consistency."
                example="Avoid passive voice, No idioms, Short sentences, Gender-neutral language"
              />
              <ControlCard 
                name="Output Structure" 
                type="Draggable Elements + Word Counts"
                description="Define exactly how content should be organized with individual word count allocation."
                example="Header 1 (50 words), Problem (100 words), Solution (150 words), Benefits (100 words), Call to Action (50 words)"
              />
            </div>
          </StepCard>
        </Section>

        <Section title="Step 7: Optional Features & Enhancements" icon={Settings}>
          <StepCard 
            step={7} 
            title="Enable Advanced Capabilities" 
            description="Toggle additional features to enhance your generated content."
            icon={Settings}
          >
            <div className="space-y-3">
              <ControlCard 
                name="Generate SEO Metadata" 
                type="Checkbox + Count Controls"
                description="Creates comprehensive SEO elements including URL slugs, meta descriptions, headings, and Open Graph tags with strict character limits."
                example="3 URL slugs (max 60 chars), 3 meta descriptions (155-160 chars), 3 H1 variants (max 60 chars)"
              />
              <ControlCard 
                name="Generate content scores" 
                type="Checkbox"
                description="Automatically evaluates quality of each generated version with detailed scoring breakdown."
                example="Overall score 85/100 + assessments for clarity, persuasiveness, tone match, engagement"
              />
              <ControlCard 
                name="Generate GEO scores" 
                type="Checkbox"
                description="Evaluates optimization for AI assistants (ChatGPT, Claude) and geographical visibility."
                example="Scores on direct answer clarity, scannable structure, quote-friendly sentences, local relevance"
              />
              <ControlCard 
                name="Strictly adhere to target word count" 
                type="Checkbox + Tolerance %"
                description="Forces AI to perform multiple revisions to achieve exact word count. Set tolerance for revision trigger."
                example="Target 200 words with 2% tolerance = revision triggered if below 196 words"
              />
              <ControlCard 
                name="Flexible word count for short content" 
                type="Checkbox + Tolerance % (for <100 words)"
                description="Allows percentage tolerance for short content to maintain natural phrasing."
                example="40 words ±20% = 32-48 words acceptable range for natural flow"
              />
              <ControlCard 
                name="Force SEO keyword integration" 
                type="Checkbox"
                description="Ensures all specified keywords appear naturally throughout the copy."
                example="If keywords are 'project management, collaboration', AI will weave them into sentences naturally"
              />
              <ControlCard 
                name="Force detailed elaborations and examples" 
                type="Checkbox"
                description="Instructs AI to provide comprehensive explanations, examples, and case studies."
                example="Instead of 'Our tool helps teams', AI writes 'Our tool helps teams by providing real-time updates, automated notifications, and shared workspaces that have reduced project delays by 40% for clients like TechCorp'"
              />
              <ControlCard 
                name="Enhance for GEO" 
                type="Checkbox + Region Targeting"
                description="Optimizes content for AI assistants with optional geographical targeting."
                example="Structures content to be quotable by ChatGPT, includes regional references for 'México, LATAM'"
              />
              <ControlCard 
                name="Add TL;DR Summary" 
                type="Checkbox (when GEO enabled)"
                description="Prepends a brief 1-2 sentence summary at the beginning for immediate comprehension."
                example="TL;DR: This project management tool reduces delays by 40% through automated task tracking and team collaboration features."
              />
            </div>
          </StepCard>
        </Section>

        <Section title="Step 8: Generate Your Initial Copy" icon={Sparkles}>
          <StepCard 
            step={8} 
            title="Create Your First Content Card" 
            description="Click 'Make Copy' to generate your initial content based on all configured inputs."
            icon={Sparkles}
          >
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">What Happens During Generation:</h4>
              <ol className="text-sm text-gray-700 dark:text-gray-300 list-decimal pl-4 space-y-2">
                <li><strong>Progress Display:</strong> Real-time messages show generation steps (e.g., "Starting copy generation...", "Generating score for copy...")</li>
                <li><strong>Content Creation:</strong> AI processes your inputs and creates the initial copy</li>
                <li><strong>Quality Scoring:</strong> If enabled, AI evaluates the generated content</li>
                <li><strong>SEO Metadata:</strong> If enabled, comprehensive SEO elements are generated</li>
                <li><strong>GEO Scoring:</strong> If enabled, content is analyzed for AI assistant optimization</li>
                <li><strong>Card Display:</strong> Generated content appears as the first card in "Generated Copies" section</li>
              </ol>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded">
              <p className="text-gray-800 dark:text-gray-300 text-sm">
                <strong>Expected Output:</strong> Your first content card will display the generated copy, word count analysis, 
                and any enabled features (scores, SEO metadata, GEO analysis) in an organized, readable format.
              </p>
            </div>
          </StepCard>
        </Section>

        <Section title="Step 9: Understanding Generated Content Cards" icon={Eye}>
          <StepCard 
            step={9} 
            title="Navigate Your Generated Content" 
            description="Each piece of content appears as an interactive card with comprehensive information."
            icon={Eye}
          >
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Card Components:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ControlCard 
                  name="Header Section" 
                  type="Display"
                  description="Shows content title, persona (if applied), word count, target comparison, and accuracy indicators."
                  example="'Generated Copy 1' - 245 words | Target: 200 | 45 words over"
                />
                <ControlCard 
                  name="Content Preview" 
                  type="Display"
                  description="Full content with proper formatting (headings, paragraphs, lists) for easy reading."
                />
                <ControlCard 
                  name="Quality Score" 
                  type="Display (if enabled)"
                  description="Overall score (0-100) with color coding and detailed breakdown of clarity, persuasiveness, tone match, engagement."
                  example="Overall: 87/100 (Blue = Good) + detailed explanations for each metric"
                />
                <ControlCard 
                  name="GEO Score" 
                  type="Display (if enabled)"
                  description="Optimization score for AI assistants with criterion breakdown and improvement suggestions."
                  example="Overall: 75/100 + breakdown for answer clarity, structure, local relevance, etc."
                />
                <ControlCard 
                  name="SEO Metadata" 
                  type="Display (if enabled)"
                  description="All SEO elements with character counters and color-coded length validation."
                  example="URL Slugs: 'premium-web-hosting' (22/60 chars - Green), Meta Description: 'Get reliable...' (158/160 chars - Green)"
                />
                <ControlCard 
                  name="Action Buttons" 
                  type="Interactive"
                  description="Copy, Copy HTML, Create Alternative, Apply Voice Style, Generate Score, Generate FAQ Schema buttons."
                />
              </div>
            </div>
          </StepCard>
        </Section>

        <Section title="Step 10: On-Demand Generation Features" icon={Wand2}>
          <StepCard 
            step={10} 
            title="Enhance Specific Content Pieces" 
            description="Use card-level action buttons to selectively improve content without regenerating everything."
            icon={Wand2}
          >
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Available Actions for Each Card:</h4>
              </div>
              
              <ControlCard 
                name="Create Alternative Copy" 
                type="Button (Wand Icon)"
                description="Generates a fresh approach with different angles or tones from the selected content."
                example="Original focus on features → Alternative focuses on benefits and outcomes"
              />
              <ControlCard 
                name="Apply Voice Style" 
                type="Dropdown + Button"
                description="Transform content to match iconic personalities or brand archetypes. Select persona, then click Apply."
                example="Transform standard copy to sound like Steve Jobs (bold, visionary) or Seth Godin (punchy, thought-provoking)"
              />
              <ControlCard 
                name="Generate Score" 
                type="Button (BookCheck Icon)"
                description="Creates detailed quality assessment for the specific content piece."
                example="Adds quality score section with 0-100 rating and improvement explanations"
              />
              <ControlCard 
                name="Generate FAQPage Schema" 
                type="Button (Code Icon, Admin Only)"
                description="Extracts Q&A content and generates JSON-LD schema for SEO."
                example="Converts FAQ content into structured data markup for search engines"
              />
            </div>
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded">
              <p className="text-gray-800 dark:text-gray-300 text-sm">
                <strong>Key Advantage:</strong> Each action creates a new card while preserving the original, 
                allowing you to compare versions and build a comprehensive content library.
              </p>
            </div>
          </StepCard>
        </Section>

        <Section title="Step 11: Voice Style Library" icon={Sparkles}>
          <StepCard 
            step={11} 
            title="Transform Content with Iconic Voices" 
            description="Apply distinctive communication styles from renowned personalities and brand archetypes."
            icon={Sparkles}
          >
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Voice Style Categories:</h4>
              
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Personas (Iconic Personalities)</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Steve Jobs - Bold, visionary</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Seth Godin - Punchy, contrarian</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">David Ogilvy - Fact-driven, elegant</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Marie Forleo - Upbeat, empowering</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Gary Halbert - Direct, emotional</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Simon Sinek - Purpose-driven</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Generic Tone/Style</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Luxury Brand</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Tech Startup</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Professional Formal</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Friendly Conversational</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Bold Direct</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Minimalist</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Humanization Options</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Humanize - Natural, conversational flow</span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-center">Humanize (No AI Detection) - Avoids AI detection</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded">
                <p className="text-gray-800 dark:text-gray-300 text-sm">
                  <strong>How to Use:</strong> Select any content card, choose a voice style from the dropdown, 
                  then click "Apply". A new card will appear with the same content transformed to match that personality's distinctive voice and style.
                </p>
              </div>
            </div>
          </StepCard>
        </Section>

        <Section title="Step 12: Managing Your Generated Content" icon={Save}>
          <StepCard 
            step={12} 
            title="Save, Export, and Organize Your Work" 
            description="Use the floating action bars and buttons to manage your generated content."
            icon={Save}
          >
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Floating Action Bar (Right Side):</h4>
              
              <div className="space-y-3">
                <ControlCard 
                  name="Save Output" 
                  type="Button (Save Icon)"
                  description="Permanently saves current session's content to your account for future reference."
                  example="All cards, scores, and SEO metadata saved to Dashboard > Saved Outputs"
                />
                <ControlCard 
                  name="Copy as Markdown" 
                  type="Button (FileText Icon)"
                  description="Copies all content as formatted Markdown text for easy import into other applications."
                  example="Complete session output formatted with headers, lists, and sections ready for docs"
                />
                <ControlCard 
                  name="Export to Text" 
                  type="Button (Download Icon)"
                  description="Downloads complete content collection as a formatted text file."
                  example="Downloads 'copy-output-2025-01-13.txt' with all generated content"
                />
                <ControlCard 
                  name="View Prompts" 
                  type="Button (Code Icon, Admin Only)"
                  description="Shows exact AI prompts used for generation for transparency and learning."
                  example="Modal displaying system prompt and user prompt sent to AI model"
                />
              </div>
              
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Floating Buttons (Left Side):</h4>
              
              <div className="space-y-3">
                <ControlCard 
                  name="Evaluate Inputs" 
                  type="Button (Zap Icon)"
                  description="Analyzes current input parameters for quality and completeness before generation."
                  example="Score: 78/100 + tips like 'Add more specific target audience demographics'"
                />
                <ControlCard 
                  name="Save as Template" 
                  type="Button (Save Icon)"
                  description="Saves current form configuration as reusable template for similar projects."
                  example="Save settings for 'Homepage Hero Template' to quickly load for future homepage projects"
                />
              </div>
            </div>
          </StepCard>
        </Section>

        <Section title="Step 13: Advanced Workflow Techniques" icon={BarChart3}>
          <StepCard 
            step={13} 
            title="Master Advanced Copy Maker Workflows" 
            description="Learn professional techniques for maximizing Copy Maker's potential."
            icon={BarChart3}
          >
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-3">Professional Workflow Example:</h4>
                <ol className="text-gray-700 dark:text-gray-400 text-sm list-decimal pl-4 space-y-2">
                  <li><strong>Start with Evaluation:</strong> Use "Evaluate Inputs" to optimize your parameters before generation</li>
                  <li><strong>Generate Base Copy:</strong> Create initial content with scoring and SEO metadata enabled</li>
                  <li><strong>Create Alternative:</strong> Generate 1-2 alternative approaches from the base copy</li>
                  <li><strong>Apply Voice Styles:</strong> Transform the best version with 2-3 different personas</li>
                  <li><strong>Compare Results:</strong> Review scores and word count accuracy across all versions</li>
                  <li><strong>Save Best Options:</strong> Save the top performers as templates and outputs</li>
                  <li><strong>Export for Use:</strong> Copy HTML or Markdown for implementation</li>
                </ol>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">Pro Tips for Better Results:</h4>
                <ul className="text-gray-700 dark:text-gray-400 text-sm list-disc pl-4 space-y-1">
                  <li>Use suggestion buttons (Zap icons) to quickly populate fields with AI-generated ideas</li>
                  <li>Enable "Force detailed elaborations" for comprehensive, valuable content</li>
                  <li>Apply voice styles selectively - not every piece needs persona styling</li>
                  <li>Use competitor copy analysis to create differentiated positioning</li>
                  <li>Set up output structure with word count allocation for precise content organization</li>
                  <li>Save successful configurations as templates for brand consistency</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">Common Pitfalls to Avoid:</h4>
                <ul className="text-gray-700 dark:text-gray-400 text-sm list-disc pl-4 space-y-1">
                  <li>Don't enable strict word count for very short content (under 50 words) unless absolutely necessary</li>
                  <li>Avoid over-using voice styles - maintain some content in your natural brand voice</li>
                  <li>Don't generate alternatives for every piece - focus on the most important content</li>
                  <li>Be specific with target audience - "business owners" is too vague, "SaaS founders managing 10-50 employees" is better</li>
                </ul>
              </div>
            </div>
          </StepCard>
        </Section>

        <Section title="Step 14: Dashboard Integration" icon={BarChart3}>
          <StepCard 
            step={14} 
            title="Access Your Work from the Dashboard" 
            description="All your Copy Maker work is automatically organized in your dashboard."
            icon={BarChart3}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ControlCard 
                name="Copy Sessions" 
                type="Dashboard Tab"
                description="Access all Copy Maker sessions with input parameters. Resume any session to continue working."
                example="'Homepage redesign' session from Jan 13 - click to reload all inputs and continue"
              />
              <ControlCard 
                name="Templates" 
                type="Dashboard Tab"
                description="Manage saved template configurations for quick reuse across projects."
                example="'Blog Post Template' with SEO optimization and 1200-word structure"
              />
              <ControlCard 
                name="Saved Outputs" 
                type="Dashboard Tab"
                description="View specifically saved content including all variations, voice styles, and scores."
                example="Complete copy set with 3 alternatives, 2 voice styles, and full SEO metadata"
              />
              <ControlCard 
                name="Token Consumption" 
                type="Dashboard Tab"
                description="Track API usage, costs by model, and usage patterns for budget management."
                example="DeepSeek: 15,420 tokens ($0.04), GPT-4o: 8,230 tokens ($0.41)"
              />
            </div>
          </StepCard>
        </Section>

        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Master Copy Maker?</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Start with a simple project, experiment with different features, and gradually explore advanced capabilities as you become more comfortable with the interface.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/copy-maker"
              className="inline-flex items-center bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Sparkles size={20} className="mr-2" />
              Start Using Copy Maker
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg border border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Explore All Features
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepByStepGuide;