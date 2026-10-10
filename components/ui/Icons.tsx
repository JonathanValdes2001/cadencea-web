import React from 'react';

/**
 * Inline SVG icons. Decorative by default (aria-hidden): the control or text
 * next to an icon carries its meaning. They draw in currentColor.
 */
export interface IconProps {
  size?: 16 | 20 | 24;
  className?: string;
}

type IconComponent = (props: IconProps) => React.JSX.Element;

function makeIcon(name: string, paths: React.ReactNode, filled = false): IconComponent {
  const Icon = ({ size = 20, className }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {paths}
    </svg>
  );
  Icon.displayName = `${name}Icon`;
  return Icon;
}

export const Check = makeIcon('Check', <path d="M5 12.5l4.5 4.5L19 7.5" />);
export const Play = makeIcon('Play', <path d="M8 5.5v13l11-6.5z" />, true);
export const Pause = makeIcon('Pause', <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />, true);
export const Chevron = makeIcon('Chevron', <path d="M6 9l6 6 6-6" />);
export const ArrowRight = makeIcon('ArrowRight', <path d="M5 12h14M13 6l6 6-6 6" />);
export const Search = makeIcon('Search', <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>);
export const Filter = makeIcon('Filter', <path d="M4 6h16M7 12h10M10 18h4" />);
export const Close = makeIcon('Close', <path d="M6 6l12 12M18 6L6 18" />);
export const Plus = makeIcon('Plus', <path d="M12 5v14M5 12h14" />);
export const Minus = makeIcon('Minus', <path d="M5 12h14" />);
export const Diamond = makeIcon('Diamond', <path d="M12 3l8 9-8 9-8-9z" />, true);
export const Shield = makeIcon('Shield', <><path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6z" /><path d="M9 12l2 2 4-4" /></>);
export const Clock = makeIcon('Clock', <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>);
export const Alert = makeIcon('Alert', <><path d="M12 3.5L21.5 20h-19z" /><path d="M12 10v4M12 17h.01" /></>);
export const Info = makeIcon('Info', <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>);
export const External = makeIcon('External', <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></>);
export const Upload = makeIcon('Upload', <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />);
export const Download = makeIcon('Download', <path d="M12 4v12M7 11l5 5 5-5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />);
export const Refresh = makeIcon('Refresh', <path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" />);
export const User = makeIcon('User', <><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0115 0" /></>);
export const Review = makeIcon('Review', <><path d="M5 4h10l4 4v12H5z" /><path d="M9 13l2 2 4-4" /></>);
export const Cadencea = makeIcon('Cadencea', <path d="M17 6.5a7.5 7.5 0 100 11M14.5 9.5a3.8 3.8 0 100 5" />);
export const Menu = makeIcon('Menu', <path d="M4 6h16M4 12h16M4 18h16" />);
export const More = makeIcon('More', <path d="M6 12h.01M12 12h.01M18 12h.01" />);
export const Waveform = makeIcon('Waveform', <path d="M3 12h2M7 8v8M11 4v16M15 7v10M19 10v4M21 12h0" />);
export const Pencil = makeIcon('Pencil', <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />);
export const Trash = makeIcon('Trash', <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />);
export const Copy = makeIcon('Copy', <><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></>);
