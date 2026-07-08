import { supabase } from '@/services/supabase';

type ProfileRow = { role?: string | null; disabled?: boolean | null } | null;

type RoleCheck = 'fan' | 'ops_manager';

/**
 * Asserts that the current session has an authenticated user.
 * @throws Error if no user is authenticated.
 */
export const requireAuthenticatedUser = async (): Promise<string> => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user?.id) {
    throw new Error('Unauthorized: Authentication required.');
  }

  return user.id;
};

const requireRole = async (userId: string, requiredRole: RoleCheck): Promise<void> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, disabled')
    .eq('id', userId)
    .single();

  const isValidRole = requiredRole === 'fan'
    ? profile?.role === 'fan'
    : profile?.role === 'ops_manager' || profile?.role === 'admin';

  if (error || !profile || profile.disabled || !isValidRole) {
    throw new Error(
      requiredRole === 'fan'
        ? 'Forbidden: Fan role required.'
        : 'Forbidden: Ops manager role required.'
    );
  }
};

/**
 * Asserts that the current session is a fan session.
 * @throws Error if the user is not a fan.
 */
export const requireFanSession = async (): Promise<string> => {
  const userId = await requireAuthenticatedUser();
  await requireRole(userId, 'fan');
  return userId;
};

/**
 * Asserts that the current session is an ops_manager session.
 * @throws Error if the user is not an ops manager.
 */
export const requireOpsSession = async (): Promise<string> => {
  const userId = await requireAuthenticatedUser();
  await requireRole(userId, 'ops_manager');
  return userId;
};

/**
 * Asserts that the fan has an active ticket context.
 * @throws Error if no valid ticket/match/stadium is loaded.
 */
export const requireActiveTicketContext = (ticket: any, match: any, stadium: any) => {
  if (!ticket || !match || !stadium || !ticket?.id || !match?.id || !stadium?.id) {
    throw new Error('Forbidden: Active ticket context required.');
  }
  return { ticket, match, stadium };
};
