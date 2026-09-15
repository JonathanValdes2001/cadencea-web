import { createClient } from '@supabase/supabase-js';
import { deriveUnsubscribeTokenHash, getNewsletterTokenSecret } from '../lib/newsletter-security.mjs';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  getNewsletterTokenSecret();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let updated = 0;
  while (true) {
    const { data: subscriptions, error } = await supabase
      .from('newsletter_subscriptions')
      .select('id,email,unsubscribe_token_version')
      .eq('status', 'confirmed')
      .is('unsubscribe_token_hash', null)
      .limit(100);
    if (error) throw new Error(`Newsletter token backfill query failed: ${error.code || 'unknown'}`);
    if (!subscriptions?.length) break;

    for (const subscription of subscriptions) {
      const version = Math.max(1, subscription.unsubscribe_token_version || 1);
      const tokenHash = deriveUnsubscribeTokenHash({
        id: subscription.id,
        email: subscription.email,
        version,
      });
      const { error: updateError } = await supabase
        .from('newsletter_subscriptions')
        .update({
          unsubscribe_token_hash: tokenHash,
          unsubscribe_token_version: version,
        })
        .eq('id', subscription.id)
        .is('unsubscribe_token_hash', null);
      if (updateError) {
        throw new Error(`Newsletter token backfill update failed: ${updateError.code || 'unknown'}`);
      }
      updated += 1;
    }
  }
  console.log(`Newsletter unsubscribe-token backfill complete: ${updated} rows updated.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Newsletter token backfill failed');
  process.exitCode = 1;
});
