import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import clsx from 'clsx';

import { CheckIcon } from '@/shared/ui/icon';

import styles from './Checkbox.module.scss';

export interface CheckboxProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'checked' | 'defaultChecked' | 'onChange' | 'children'
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id,
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  'aria-label': ariaLabel,
  ...inputProps
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasDescription = description !== undefined && description !== null;
  const descriptionId = hasDescription ? `${inputId}-description` : undefined;
  const labelId = `${inputId}-label`;
  const describedBy = [ariaDescribedBy, descriptionId].filter(Boolean).join(' ') || undefined;

  return (
    <label className={clsx(styles.root, className)} htmlFor={inputId} data-disabled={disabled}>
      <span className={styles.control}>
        <input
          {...inputProps}
          className={styles.input}
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : labelId)}
          onChange={(event) => onCheckedChange(event.currentTarget.checked)}
        />
        <span className={styles.box} aria-hidden="true">
          <CheckIcon className={styles.check} />
        </span>
      </span>
      <span className={styles.text}>
        <span className={styles.label} id={labelId}>{label}</span>
        {hasDescription ? <span className={styles.description} id={descriptionId}>{description}</span> : null}
      </span>
    </label>
  );
}
