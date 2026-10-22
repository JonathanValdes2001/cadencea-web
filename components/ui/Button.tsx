import React, { useId } from 'react';
import Link from 'next/link';
import Tooltip from './Tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'onDark' | 'onDarkOutline';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_BASE: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white',
  secondary: 'border border-ink bg-canvas text-ink',
  ghost: 'text-ink',
  danger: 'bg-danger text-white',
  onDark: 'bg-canvas text-ink',
  onDarkOutline: 'border border-white/30 text-dark-text',
};

const VARIANT_HOVER: Record<ButtonVariant, string> = {
  primary: 'hover:bg-accent-hover',
  secondary: 'hover:bg-elevated',
  ghost: 'hover:bg-elevated',
  danger: 'hover:brightness-90',
  onDark: 'hover:bg-brand-50',
  onDarkOutline: 'hover:bg-white/10',
};

// sm grows to 44px on touch screens so every target stays at least 44×44.
const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-4 pointer-coarse:h-11',
  md: 'h-11 gap-2 px-6',
  lg: 'h-12 gap-2 px-8',
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and keeps the button's width. */
  loading?: boolean;
  disabled?: boolean;
  /** Why the action is unavailable; shown as a tooltip on hover and focus. */
  disabledReason?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps &
  Omit<React.ComponentPropsWithRef<'button'>, 'disabled' | 'children' | 'className'> & { href?: undefined };

type LinkProps = CommonProps &
  Omit<React.ComponentPropsWithRef<'a'>, 'href' | 'children' | 'className'> & { href: string; prefetch?: boolean };

/**
 * The site's one button. With `href` it renders a next/link. Disabled buttons
 * that carry a `disabledReason` stay focusable (aria-disabled) so keyboard and
 * screen-reader users can reach the explanation.
 */
export default function Button(props: ButtonProps | LinkProps) {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    disabledReason,
    iconLeft,
    iconRight,
    fullWidth = false,
    className = '',
    children,
    ...rest
  } = props;
  const reasonId = useId();
  const inactive = disabled || loading;

  const classes = [
    'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm text-sm font-semibold tracking-wide',
    SIZE[size],
    VARIANT_BASE[variant],
    inactive ? (disabled ? 'cursor-not-allowed opacity-50' : 'cursor-wait') : VARIANT_HOVER[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className={`inline-flex items-center gap-[inherit] ${loading ? 'invisible' : ''}`}>
        {iconLeft}
        {children}
        {iconRight}
      </span>
      {loading && (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
    </>
  );

  const withReason = (node: React.ReactElement) =>
    disabled && disabledReason ? (
      <Tooltip id={reasonId} content={disabledReason} className={fullWidth ? 'w-full' : ''}>
        {node}
      </Tooltip>
    ) : (
      node
    );

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest as Omit<LinkProps, keyof CommonProps>;
    if (disabled) {
      // A link that can't be followed is not a link: render it as inert text.
      return withReason(
        <span
          role="link"
          aria-disabled="true"
          tabIndex={disabledReason ? 0 : -1}
          aria-describedby={disabledReason ? reasonId : undefined}
          className={classes}
        >
          {content}
        </span>,
      );
    }
    return (
      <Link href={href} {...anchorProps} className={classes} aria-busy={loading || undefined}>
        {content}
      </Link>
    );
  }

  const { onClick, type = 'button', ...buttonProps } = rest as Omit<ButtonProps, keyof CommonProps>;
  // Disabled with a reason stays focusable; it simply has no click handler.
  const softDisabled = disabled && Boolean(disabledReason);
  return withReason(
    <button
      {...buttonProps}
      type={softDisabled ? 'button' : type}
      disabled={inactive && !softDisabled ? true : undefined}
      aria-disabled={softDisabled || undefined}
      aria-busy={loading || undefined}
      aria-describedby={softDisabled ? reasonId : buttonProps['aria-describedby']}
      onClick={inactive ? undefined : onClick}
      className={classes}
    >
      {content}
    </button>,
  );
}
