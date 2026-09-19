import { Icon } from '../Icon';

import type { IconProps } from '../icon.types';

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2v3" />
      <path d="M16 2v3" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
    </Icon>
  );
}
