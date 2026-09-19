import type { PropsWithChildren } from 'react';

import { ICON_SIZES } from './icon.constants';
import type { IconProps } from './icon.types';

export function Icon({
  children,
  size = ICON_SIZES.md,
  strokeWidth = 2,
  title,
  ...svgProps
}: PropsWithChildren<IconProps>) {
  const isDecorative = !title && !svgProps['aria-label'];

  return (
    <svg
      {...svgProps}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={isDecorative ? undefined : 'img'}
      aria-hidden={isDecorative ? true : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
