import * as Select from '@radix-ui/react-select';

import { CheckIcon } from '@/shared/ui/icon';

import styles from './ScheduleSelect.module.scss';

export interface ScheduleSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ScheduleSelectProps {
  ariaLabel: string;
  disabled?: boolean;
  options: ScheduleSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
}

export function ScheduleSelect({
  ariaLabel,
  disabled = false,
  options,
  value,
  onValueChange,
}: ScheduleSelectProps) {
  return (
    <Select.Root value={value} disabled={disabled} onValueChange={onValueChange}>
      <Select.Trigger
        className={styles.captionTrigger}
        type="button"
        aria-label={ariaLabel}
      >
        <Select.Value />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className={styles.content}
          position="popper"
          sideOffset={4}
          collisionPadding={12}
        >
          <Select.Viewport className={styles.viewport}>
            {options.map((option) => (
              <Select.Item
                className={styles.item}
                key={option.value}
                value={option.value}
                disabled={Boolean(option.disabled)}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className={styles.indicator}>
                  <CheckIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
