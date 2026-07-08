import { supabase } from '@/services/supabase';

/**
 * Asserts that the current session has an authenticated user.
 * @throws Error if no user is authenticated.
 */
export const requireAuthenticatedUser = async (): Promise<string> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized: Authentication required.');
  }
  return user.id;
};

/**
 * Asserts that the current session is a fan session.
 * @throws Error if the user is not a fan.
 */
export const requireFanSession = async (): Promise<string> => {
  const userId = await requireAuthenticatedUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
  if (profile?.role !== 'fan') {
    throw new Error('Forbidden: Fan role required.');
  }
  return userId;
};

/**
 * Asserts that the current session is an ops_manager session.
 * @throws Error if the user is not an ops manager.
 */
export const requireOpsSession = async (): Promise<string> => {
  const userId = await requireAuthenticatedUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
  if (profile?.role !== 'ops_manager') {
    throw new Error('Forbidden: Ops manager role required.');
  }
  return userId;
};

/**
 * Asserts that the fan has an active ticket context.
 * @throws Error if no valid ticket/match/stadium is loaded.
 */
export const requireActiveTicketContext = (ticket: any, match: any, stadium: any) => {
  if (!ticket || !match || !stadium) {
    throw new Error('Forbidden: Active ticket context required.');
  }
  return { ticket, match, stadium };
};
