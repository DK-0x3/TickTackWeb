import { Icon } from '../Icon';
import type { IconProps } from '../icon.types';

export function RefreshIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M6.1 7a7 7 0 0 1 11.45-1.55L20 8" />
      <path d="M17.9 17a7 7 0 0 1-11.45 1.55L4 16" />
    </Icon>
  );
}
