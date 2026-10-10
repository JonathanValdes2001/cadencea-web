import React from 'react';
import Link from 'next/link';

const PADDING = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' } as const;

type CardPadding = keyof typeof PADDING;

/**
 * A bordered card with no resting shadow. `interactive` adds the hover lift.
 * With `href` the whole card is one link; when a card needs a second control
 * (a play button), leave `href` off and put a link and the control side by side.
 */
function Card({
  href,
  interactive = false,
  padding = 'md',
  as: Tag = 'div',
  className = '',
  children,
}: {
  href?: string;
  interactive?: boolean;
  padding?: CardPadding;
  as?: 'div' | 'article' | 'section' | 'li';
  className?: string;
  children: React.ReactNode;
}) {
  const classes = `block overflow-hidden rounded-md border border-line bg-canvas ${PADDING[padding]} ${
    interactive || href ? 'hover-lift hover:border-line-strong' : ''
  } ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return <Tag className={classes}>{children}</Tag>;
}

export function CardMedia({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`relative ${className}`}>{children}</div>;
}

export function CardBody({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`border-t border-line px-4 py-3 ${className}`}>{children}</div>;
}

Card.Media = CardMedia;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
