import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({
  url = 'https://pimpmycopy.com',
  title = 'PimpMyCopy - AI-Powered Copy That Converts',
  description = 'Harness advanced AI models like DeepSeek V3 and GPT-4o to generate, refine, and score high-quality marketing copy.',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  // Facebook SVG Logo
  const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  // X (Twitter) SVG Logo
  const XIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  // LinkedIn SVG Logo
  const LinkedInIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 ${className}`}>
      <div className="flex items-center space-x-1">
        <Share2 size={20} className="text-gray-600 dark:text-gray-400 mr-2" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Share:</span>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Facebook Share Button */}
        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          title="Share on Facebook"
          aria-label="Share on Facebook"
        >
          <FacebookIcon />
        </button>

        {/* X (Twitter) Share Button */}
        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          title="Share on X (Twitter)"
          aria-label="Share on X (Twitter)"
        >
          <XIcon />
        </button>

        {/* LinkedIn Share Button */}
        <button
          onClick={() => handleShare('linkedin')}
          className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          title="Share on LinkedIn"
          aria-label="Share on LinkedIn"
        >
          <LinkedInIcon />
        </button>

        {/* Copy URL Button */}
        <button
          onClick={handleCopyUrl}
          className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          title="Copy URL"
          aria-label="Copy URL to clipboard"
        >
          {copied ? (
            <Check size={16} className="text-green-500" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
    </div>
  );
};

export default SocialShare;