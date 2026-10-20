import React from 'react';
import Button from '@/components/ui/Button';

export type DownloadPlatform = 'Windows' | 'Mac (Apple Silicon)' | 'Mac (Intel)';

/**
 * One Cadencea Vault download button for the showroom surface. Without an
 * `href` (the update feed didn't answer) it shows as unavailable. The URLs come
 * from lib/cadencea-vault-releases.mjs, which picks the released or the beta
 * feed for this deployment. Used by /cadenceavault and /activate/<id>.
 */
export default function DownloadButton({
  platform,
  variant,
  href,
}: {
  platform: DownloadPlatform;
  variant: 'primary' | 'onDark';
  href?: string;
}) {
  if (!href) {
    // The longest label is wider than a phone; it wraps inside the button instead of overflowing.
    return (
      <Button variant="onDarkOutline" size="lg" disabled className="max-w-full">
        <span className="whitespace-normal text-center leading-tight">{platform} download unavailable</span>
      </Button>
    );
  }
  return (
    <Button href={href} variant={variant} size="lg" rel="noopener noreferrer" prefetch={false}>
      Download for {platform}
    </Button>
  );
}
