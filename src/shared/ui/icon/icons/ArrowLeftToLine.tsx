import { Icon } from '../Icon';

import type { IconProps } from '../icon.types';

export function ArrowLeftToLine(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 19V5" />
      <path d="m13 6-6 6 6 6" />
      <path d="M7 12h14" />
    </Icon>
  );
}
