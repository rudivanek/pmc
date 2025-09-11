import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Sparkles, ArrowRight, Mail, Calendar, List } from 'lucide-react';
import SocialShare from './SocialShare';

const BetaThanks: React.FC = () => {
  // Track page view for conversion measurement
  useEffect(() => {
    // Google Analytics conversion tracking
    if (typeof window !== 'undefined' && window.gtag) {
      // Track conversion for Google Ads
      window.gtag('event', 'conversion', {
        'send_to': 'AW-17444532829'
      });
      
      // Also track as custom event for Google Analytics
      window.gtag('event', 'beta_registration_success', {
        'event_category': 'beta_registration',
        'event_label': 'registration_completed'
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-green-50 to-green-100 dark:from-black dark:via-green-900 dark:to-green-950">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-green-50/20 to-green-100/20 dark:from-transparent dark:via-green-900/20 dark:via-green-800/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-900/30 rounded-full mb-8">
              <CheckCircle size={48} className="text-gray-600 dark:text-gray-400" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Welcome to the{' '}
              <span className="text-primary-500">PimpMyCopy</span>{' '}
              Beta!
            </h1>
            
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-8">
              🎉 Your Registration is Complete
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Thank you for joining our exclusive beta program! You're now on the priority list to experience the future of AI-powered copywriting.
            </p>
          </div>
        </div>
      </section>

      {/* What Happens Next Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              What Happens Next?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                <Mail size={32} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Check Your Email
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We've sent you a confirmation email with your beta registration details and what to expect next.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                <Calendar size={32} className="text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Early Access Invitation
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                You'll receive your beta access invitation within the next 7-14 days with login credentials and exclusive features.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                <Sparkles size={32} className="text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Start Creating
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Begin generating high-converting copy with advanced AI models, voice styles, and comprehensive analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Benefits Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Exclusive Beta Benefits
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              As a beta user, you'll get special perks and early access to new features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  1
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Free Premium Access</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Complete access to all Copy Maker features, voice styles, content scoring, and SEO metadata generation at no cost during the beta period.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  2
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Priority Support</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Direct access to our development team for feedback, feature requests, and priority support via email.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  3
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Early Feature Access</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Be the first to test new AI models, voice styles, and features before they're released to the general public.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  4
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lifetime Discount</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Lock in special beta pricing when we launch our paid plans, with exclusive discounts for early supporters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Share Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Help Us Spread the Word
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Share PimpMyCopy with your network and help other marketers discover AI-powered copy generation
          </p>
          
          <SocialShare
            url="https://pimpmycopy.com"
            title="I just registered for PimpMyCopy beta - AI-powered copy generation is the future!"
            description="Just signed up for early access to PimpMyCopy, an AI copywriting tool that generates high-converting marketing copy with voice styles and content scoring."
            className="justify-center"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Want to Learn More While You Wait?
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/step-by-step" // Changed from bg-blue-600
              className="inline-flex items-center bg-gray-600 hover:bg-gray-500 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <List size={20} className="mr-2" />
              Step-by-Step Guide
            </Link>
            
            <Link
              to="/features"
              className="inline-flex items-center bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg border border-gray-300 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Sparkles size={20} className="mr-2" />
              Explore All Features
            </Link>
            
            <Link // Changed from bg-primary-600
              to="/documentation"
              className="inline-flex items-center bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Read Documentation
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Questions about your beta registration?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Contact us at{' '}
            <a href="mailto:privacy@pimpmycopy.com" className="text-primary-500 hover:text-primary-400 underline">
              privacy@pimpmycopy.com
            </a>
          </p>
          
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 PimpMyCopy - Powered by{' '}
              <a href="https://sharpen.studio" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400 underline">
                Sharpen.Studio
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BetaThanks;