import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Sparkles, Zap, FileText, Copy, BarChart2, AlignJustify, Lightbulb, PenTool, Settings, RefreshCw, Target, Globe, Users, List, AlertCircle } from 'lucide-react';

const Documentation: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* TL;DR Summary */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-sm text-gray-800 dark:text-gray-300">
            <strong>TL;DR:</strong> Complete documentation for PimpMyCopy's Copy Maker - the unified AI-powered platform for creating, improving, and optimizing marketing copy with advanced features like voice styling, content scoring, and SEO metadata generation.
          </p>
        </div>

        <div className="flex items-center mb-8">
          <Book size={28} className="text-primary-500 mr-2" />
          <h1 className="text-3xl font-bold text-black dark:text-white">PimpMyCopy Documentation</h1>
        </div>
        
        <Section title="Getting Started with Copy Maker" icon={Sparkles}> {/* Changed from bg-blue-50, text-blue-800 */}
          <p>
            Copy Maker is PimpMyCopy's unified AI-powered platform for all your content generation needs. It combines the power of multiple AI models (DeepSeek V3, GPT-4o, GPT-4 Turbo, Grok 4) with advanced features like voice styling, content scoring, and comprehensive SEO optimization.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4 my-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">What Makes Copy Maker Different?</h3>
            <ul className="text-gray-700 dark:text-gray-400 text-sm list-disc pl-5 space-y-1">
              <li><strong>Dynamic Card Interface:</strong> Each piece of content appears as an interactive card</li>
              <li><strong>On-Demand Generation:</strong> Create alternatives and voice styles without regenerating everything</li>
              <li><strong>Visual Threading:</strong> Clear relationships between original content and variations</li>
              <li><strong>Progressive Enhancement:</strong> Start basic and selectively improve only what you need</li>
            </ul>
          </div>
        </Section>

        <Section title="Core Features" icon={Zap}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Content Generation</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-6">
            <li><strong>Create New Copy:</strong> Generate fresh marketing copy from business descriptions</li>
            <li><strong>Improve Existing Copy:</strong> Enhance and optimize your current content</li>
            <li><strong>Alternative Versions:</strong> Create different approaches and angles on-demand</li>
            <li><strong>Voice Styling:</strong> Transform content with iconic personalities (Steve Jobs, Seth Godin, etc.)</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Quality & Analysis</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-6">
            <li><strong>Content Scoring:</strong> Detailed quality assessments with improvement explanations</li>
            <li><strong>Input Evaluation:</strong> Analyze form parameters before generating content</li>
            <li><strong>Word Count Analysis:</strong> Real-time tracking with target comparison</li>
            <li><strong>GEO Scoring:</strong> Optimization analysis for AI assistants and geographical visibility</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">SEO & Optimization</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>SEO Metadata Generation:</strong> URL slugs, meta descriptions, headings, Open Graph tags</li>
            <li><strong>Keyword Integration:</strong> Natural integration of specified keywords throughout content</li>
            <li><strong>Structure Control:</strong> Define exact content organization with word count allocation</li>
            <li><strong>Character Limit Enforcement:</strong> Strict adherence to SEO character limits</li>
          </ul>
        </Section>

        <Section title="Interface Overview" icon={Target}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Form Sections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Project Setup</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Model selection, customer management, product naming, and project organization</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Core Content</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Business descriptions, page types, sections, and exclusion terms</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Copy Targeting</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Audience definition, industry selection, competitor analysis, pain points</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Strategic Messaging</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Key messages, calls to action, emotions, brand values, keywords</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Tone & Style</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Language, tone, word count, formality level, writing style, constraints</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Optional Features</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">SEO metadata, content scoring, GEO optimization, word count adherence</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Generated Content Cards</h3>
          <p className="mb-4">
            Each piece of generated content appears as an interactive card with comprehensive information and action buttons for creating alternatives, applying voice styles, and generating quality scores.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">Card Features:</h4>
            <ul className="text-gray-700 dark:text-gray-400 text-sm list-disc pl-5 space-y-1">
              <li>Full content preview with proper formatting</li>
              <li>Word count analysis with target comparison</li>
              <li>Quality scores when enabled (0-100 with color coding)</li>
              <li>SEO metadata with character counters</li>
              <li>GEO optimization scores and suggestions</li>
              <li>Individual action buttons for alternatives, voice styles, and scoring</li>
              <li>Copy functionality for text and HTML formats</li>
            </ul>
          </div>
        </Section>

        <Section title="Voice Style Library" icon={PenTool}>
          <p>
            Transform your content with distinctive voice styles from renowned communicators and brand archetypes. Copy Maker includes over 20 voice options organized in three categories:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Personas</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Iconic personalities and experts</p>
              <div className="text-xs space-y-1">
                <div>• Steve Jobs - Bold, visionary</div>
                <div>• Seth Godin - Punchy, contrarian</div>
                <div>• David Ogilvy - Fact-driven, elegant</div>
                <div>• Marie Forleo - Upbeat, empowering</div>
                <div>• And 10 more...</div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Generic Styles</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Brand archetypes and tones</p>
              <div className="text-xs space-y-1">
                <div>• Luxury Brand - Sophisticated, exclusive</div>
                <div>• Tech Startup - Modern, innovative</div>
                <div>• Professional Formal - Polished, authoritative</div>
                <div>• Friendly Conversational - Warm, approachable</div>
                <div>• And 6 more...</div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Humanization</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Natural, human-like variations</p>
              <div className="text-xs space-y-1">
                <div>• Humanize - Warm, conversational</div>
                <div>• Humanize (No AI Detection) - Avoids detection</div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Advanced Features" icon={Settings}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Word Count Control</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-6">
            <li><strong>Strict Adherence:</strong> Forces multiple AI revisions until exact word count is achieved</li>
            <li><strong>Flexible Mode:</strong> Allows ±20% tolerance for content under 100 words to maintain natural phrasing</li>
            <li><strong>Section Allocation:</strong> Distribute total word count across specific sections with drag-and-drop reordering</li>
            <li><strong>Real-time Distribution:</strong> See exactly how words are allocated across structure elements</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">SEO Optimization</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-6">
            <li><strong>Comprehensive Metadata:</strong> URL slugs, meta descriptions, H1/H2/H3 headings, Open Graph tags</li>
            <li><strong>Character Limit Enforcement:</strong> Strict adherence to optimal SEO character limits</li>
            <li><strong>Multiple Variants:</strong> Generate 1-10 options for each SEO element</li>
            <li><strong>Live Character Counters:</strong> Real-time feedback with color-coded status indicators</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Generative Engine Optimization (GEO)</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li><strong>AI Assistant Optimization:</strong> Content structured for ChatGPT, Claude, and Gemini quotability</li>
            <li><strong>TL;DR Summaries:</strong> Optional 1-2 sentence summaries for immediate AI comprehension</li>
            <li><strong>Location Targeting:</strong> Include regional references for local AI search visibility</li>
            <li><strong>Scannable Structure:</strong> Question-based headings and quote-friendly sentences</li>
          </ul>
        </Section>

        <Section title="Dashboard & Organization" icon={BarChart2}>
          <p>
            Copy Maker integrates seamlessly with your dashboard, providing comprehensive tools to organize, save, and analyze your content creation workflow.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2">
                <FileText size={18} className="text-primary-500 mr-2" />
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Copy Sessions</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access all your Copy Maker sessions with input parameters and generation settings. Resume any session to continue working.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2">
                <Settings size={18} className="text-primary-500 mr-2" />
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Templates</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save form configurations as reusable templates for consistent brand messaging across projects.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2">
                <Copy size={18} className="text-primary-500 mr-2" />
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Saved Outputs</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View permanently saved content including all variations, voice styles, SEO metadata, and quality scores.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2">
                <BarChart2 size={18} className="text-primary-500 mr-2" />
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Token Consumption</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track API usage, costs by model, and usage patterns for budget management and optimization.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Best Practices" icon={Lightbulb}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Content Creation Tips</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Start with detailed business descriptions - more context produces better results</li>
                <li>Use the "Evaluate Inputs" button to optimize parameters before generating</li>
                <li>Define target audiences specifically with demographics and pain points</li>
                <li>Experiment with different AI models for varying styles and quality levels</li>
                <li>Use competitor copy analysis for differentiated positioning</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Advanced Workflow Tips</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Use suggestion buttons (⚡) to quickly populate fields with AI-generated ideas</li>
                <li>Apply voice styles selectively - not every piece needs persona styling</li>
                <li>Set up output structure with word count allocation for precise organization</li>
                <li>Save successful configurations as templates for brand consistency</li>
                <li>Enable strict word count only when precision is critical</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Troubleshooting" icon={AlertCircle}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Common Issues & Solutions</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">Word Count Not Matching Target</h4>
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">
                <strong>Problem:</strong> Generated content doesn't match your specified word count.
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-sm">
                <strong>Solution:</strong> Enable "Strictly adhere to target word count" in Optional Features. This forces the AI to revise content until it matches your target exactly.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">Voice Style Not Applying Correctly</h4>
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">
                <strong>Problem:</strong> Applied voice style doesn't sound like the selected persona.
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-sm">
                <strong>Solution:</strong> Try different AI models (GPT-4o often performs better for voice styling), or apply the voice style to longer content pieces where the personality can be more evident.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">SEO Character Limits Exceeded</h4>
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">
                <strong>Problem:</strong> Generated SEO elements exceed recommended character limits.
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-sm">
                <strong>Solution:</strong> The AI is instructed to enforce character limits, but you can manually edit any SEO elements that are too long. Copy Maker provides live character counters to help you optimize.
              </p>
            </div>
          </div>
        </Section>

        <div className="mt-12 p-6 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Need More Detailed Guidance?</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Our comprehensive step-by-step guide walks you through every feature and control in detail.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/step-by-step"
              className="inline-flex items-center bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <List size={20} className="mr-2" />
              View Step-by-Step Guide
            </Link>
            <Link
              to="/copy-maker"
              className="inline-flex items-center bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg border border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Start Using Copy Maker
              <RefreshCw size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;