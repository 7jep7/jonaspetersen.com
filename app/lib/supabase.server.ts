import { createClient } from '@supabase/supabase-js';

// Database types for type safety
export interface QueueEntry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  waiting_to_play: boolean;
  played: boolean;
  queue_session: number;
  robot_elo: number | null;
  result: 'win' | 'draw' | 'loss' | null;
  registered_at: string;
  position_notified_3: boolean;
  position_notified_2: boolean;
  position_notified_1: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsletterEntry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  source: 'play_robot' | 'about' | 'other';
  created_at: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get current queue position for an email
 * Returns the active queue entry if waiting, null otherwise
 */
export async function getQueuePosition(email: string): Promise<{
  entry: QueueEntry | null;
  position: number | null;
  totalInQueue: number;
}> {
  // Get the user's latest active entry
  const { data: userEntry, error: userError } = await supabase
    .from('queue')
    .select('*')
    .eq('email', email)
    .eq('waiting_to_play', true)
    .order('queue_session', { ascending: false })
    .limit(1)
    .single();

  if (userError && userError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" - that's expected
    console.error('Error fetching user queue entry:', userError);
  }

  // Get total count of people waiting
  const { count: totalInQueue } = await supabase
    .from('queue')
    .select('*', { count: 'exact', head: true })
    .eq('waiting_to_play', true);

  if (!userEntry) {
    return { entry: null, position: null, totalInQueue: totalInQueue || 0 };
  }

  // Calculate position by counting entries with lower queue_session
  const { count: position } = await supabase
    .from('queue')
    .select('*', { count: 'exact', head: true })
    .eq('waiting_to_play', true)
    .lt('queue_session', userEntry.queue_session);

  return {
    entry: userEntry,
    position: (position || 0) + 1, // +1 because we want 1-indexed positions
    totalInQueue: totalInQueue || 0,
  };
}

/**
 * Get all active queue entries ordered by queue_session
 */
export async function getActiveQueue(): Promise<QueueEntry[]> {
  const { data, error } = await supabase
    .from('queue')
    .select('*')
    .eq('waiting_to_play', true)
    .order('queue_session', { ascending: true });

  if (error) {
    console.error('Error fetching active queue:', error);
    return [];
  }

  return data || [];
}

/**
 * Register a new person in the queue
 */
export async function registerInQueue(
  firstName: string,
  lastName: string,
  email: string,
  subscribeNewsletter: boolean
): Promise<{ success: boolean; error?: string; queueSession?: number }> {
  // Get the highest queue_session number
  const { data: maxSession } = await supabase
    .from('queue')
    .select('queue_session')
    .order('queue_session', { ascending: false })
    .limit(1)
    .single();

  const nextSession = (maxSession?.queue_session || 0) + 1;

  // Insert new queue entry
  const { error: queueError } = await supabase
    .from('queue')
    .insert({
      first_name: firstName,
      last_name: lastName,
      email: email,
      queue_session: nextSession,
      waiting_to_play: true,
      played: false,
    });

  if (queueError) {
    console.error('Error registering in queue:', queueError);
    return { success: false, error: queueError.message };
  }

  // If user wants newsletter, add them
  if (subscribeNewsletter) {
    const { error: newsletterError } = await supabase
      .from('newsletter')
      .upsert(
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          source: 'play_robot',
        },
        { onConflict: 'email' }
      );

    if (newsletterError) {
      console.error('Error adding to newsletter:', newsletterError);
      // Don't fail the whole operation if newsletter fails
    }
  }

  return { success: true, queueSession: nextSession };
}

/**
 * Unregister from queue (set waiting_to_play to false)
 */
export async function unregisterFromQueue(email: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('queue')
    .update({ waiting_to_play: false, updated_at: new Date().toISOString() })
    .eq('email', email)
    .eq('waiting_to_play', true);

  if (error) {
    console.error('Error unregistering from queue:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
