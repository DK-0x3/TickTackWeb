import type { ComponentProps } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import clsx from 'clsx';

import { CheckIcon } from '@/shared/ui/icon';

import styles from './Select.module.scss';

export interface SelectOption<Value extends string = string> {
  value: Value;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<Value extends string = string> extends Omit<
  ComponentProps<typeof SelectPrimitive.Trigger>,
  'children' | 'asChild' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'dir'
> {
  value: Value;
  options: readonly SelectOption<Value>[];
  onValueChange: (value: Value) => void;
  variant?: 'default' | 'compact';
  name?: string;
  required?: boolean;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
}

export function Select<Value extends string>({
  value,
  options,
  onValueChange,
  variant = 'default',
  disabled = false,
  required = false,
  name,
  form,
  dir,
  placeholder,
  className,
  ...triggerProps
}: SelectProps<Value>) {
  return (
    <SelectPrimitive.Root
      value={value}
      disabled={disabled}
      required={required}
      {...(name !== undefined ? { name } : {})}
      {...(form !== undefined ? { form } : {})}
      {...(dir !== undefined ? { dir } : {})}
      onValueChange={(nextValue) => {
        const option = options.find((item) => item.value === nextValue && !item.disabled);
        if (option) onValueChange(option.value);
      }}
    >
      <SelectPrimitive.Trigger
        {...triggerProps}
        className={clsx(styles.trigger, className)}
        data-variant={variant}
        type="button"
      >
        <SelectPrimitive.Value placeholder={placeholder} />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={styles.content}
          data-variant={variant}
          position="popper"
          sideOffset={4}
          collisionPadding={12}
        >
          <SelectPrimitive.Viewport className={styles.viewport} data-variant={variant}>
            {options.map((option) => (
              <SelectPrimitive.Item
                className={styles.item}
                data-variant={variant}
                key={option.value}
                value={option.value}
                disabled={option.disabled ?? false}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className={styles.indicator}>
                  <CheckIcon />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
