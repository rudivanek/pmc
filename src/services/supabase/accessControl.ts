import { supabase } from './client';

export async function checkUserAccess(userId: string, userEmail: string): Promise<{
  hasAccess: boolean;
  message: string;
  tokensUsed?: number;
  tokensAllowed?: number;
  isWithinLimit?: boolean;
  costToday?: number;
  startDate?: string | null;
  untilDate?: string | null;
}> {
  try {
    // Get user data including subscription details
    const { data: userData, error: userError } = await supabase
      .from('pmc_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return {
        hasAccess: false,
        message: 'Unable to verify user account. Please try again.'
      };
    }

    if (!userData) {
      return {
        hasAccess: false,
        message: 'User account not found. Please contact support.'
      };
    }

    // Check subscription dates if they exist
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (userData.start_date) {
      const startDate = new Date(userData.start_date);
      if (now < startDate) {
        return {
          hasAccess: false,
          message: `Your subscription starts on ${startDate.toLocaleDateString()}. Please try again after this date.`,
          startDate: userData.start_date,
          untilDate: userData.until_date
        };
      }
    }

    if (userData.until_date) {
      const untilDate = new Date(userData.until_date);
      if (now > untilDate) {
        return {
          hasAccess: false,
          message: `Your subscription expired on ${untilDate.toLocaleDateString()}. Please contact support to renew.`,
          startDate: userData.start_date,
          untilDate: userData.until_date
        };
      }
    }

    // Get token usage for today
    const { data: todayUsage, error: usageError } = await supabase
      .from('pmc_user_tokens_usage')
      .select('token_usage, token_cost')
      .eq('user_email', userEmail)
      .eq('usage_date', today);

    let tokensUsed = 0;
    let costToday = 0;

    if (usageError) {
      console.error('Error fetching token usage:', usageError);
      // Continue with access check even if token usage fetch fails
    } else if (todayUsage) {
      tokensUsed = todayUsage.reduce((sum, record) => sum + (record.token_usage || 0), 0);
      costToday = todayUsage.reduce((sum, record) => sum + (parseFloat(record.token_cost) || 0), 0);
    }

    // Calculate token limit (default to high limit if not set)
    const tokensAllowed = userData.tokens_allowed || 999999;
    const isWithinTokenLimit = tokensUsed <= tokensAllowed;

    if (!isWithinTokenLimit) {
      return {
        hasAccess: false,
        message: `Daily token limit exceeded (${tokensUsed}/${tokensAllowed}). Please try again tomorrow or contact support.`,
        tokensUsed,
        tokensAllowed,
        isWithinLimit: false,
        costToday,
        startDate: userData.start_date,
        untilDate: userData.until_date
      };
    }

    return {
      hasAccess: true,
      message: 'Access granted',
      tokensUsed,
      tokensAllowed,
      isWithinLimit: true,
      costToday,
      startDate: userData.start_date,
      untilDate: userData.until_date
    };

  } catch (error: any) {
    console.error('Error checking user access:', error);
    return {
      hasAccess: false,
      message: 'Unable to verify account access. Please try again or contact support.'
    };
  }
}