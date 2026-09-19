import { Icon } from '../Icon';

import type { IconProps } from '../icon.types';

export function ArrowRightToLine(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17 12H3" />
      <path d="m11 18 6-6-6-6" />
      <path d="M21 5v14" />
    </Icon>
  );
}
