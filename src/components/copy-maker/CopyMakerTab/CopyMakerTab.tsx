{/* Row: [TemplateLoader | QuickStartPicker | AI Prompt card] */}
<div className="flex flex-col sm:flex-row gap-3 items-stretch">
  {/* 1) Saved Template */}
  <div className="flex-1 min-w-0">
    <TemplateLoader
      templateLoadError={templateLoadError}
      isLoadingTemplates={isLoadingTemplates}
      templateSearchQuery={templateSearchQuery}
      setTemplateSearchQuery={setTemplateSearchQuery}
      filteredAndGroupedTemplates={filteredAndGroupedTemplates}
      selectedTemplateId={selectedTemplateId}
      onSelectTemplate={handleTemplateSelection}
    />
  </div>

  {/* 2) Quick Start */}
  <div className="flex-1 min-w-0">
    {/* Make sure the *outermost* element inside QuickStartPicker has no mb- classes.
        If it does, remove them in that component (see note below). */}
    <QuickStartPicker
      formState={formState}
      onApplyPrefill={handleApplyPrefill}
    />
  </div>

  {/* 3) AI Prompt – right-side card */}
  <div className="w-full sm:w-44 shrink-0">
    {/* ⬇️ h-full ensures equal height with the tallest sibling */}
    <div className="h-full p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg flex items-end">
      <button
        type="button"
        onClick={onOpenTemplateSuggestion}
        className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-xs rounded-lg focus:ring-primary-500 focus:border-primary-500 w-full p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center whitespace-nowrap"
        disabled={!currentUser}
        title="Generate template JSON from natural language"
      >
        {/* import { Lightbulb } from 'lucide-react' at top if not present */}
        <svg className="mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18h6M10 22h4M7.5 14.5a5.5 5.5 0 1 1 9 0L15 17h-6l-1.5-2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span className="hidden sm:inline">AI Prompt</span>
        <span className="sm:hidden">AI</span>
      </button>
    </div>
  </div>
</div>
