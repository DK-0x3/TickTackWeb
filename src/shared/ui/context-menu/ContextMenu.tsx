import type { ComponentProps } from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import clsx from 'clsx';

import styles from './ContextMenu.module.scss';

export const ContextMenuRoot = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

export function ContextMenuContent({
  children,
  className,
  collisionPadding = 12,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={clsx(styles.content, className)}
        collisionPadding={collisionPadding}
        {...props}
      >
        {children}
      </ContextMenuPrimitive.Content>
    </ContextMenuPrimitive.Portal>
  );
}

interface ContextMenuItemProps extends ComponentProps<typeof ContextMenuPrimitive.Item> {
  tone?: 'default' | 'danger';
}

export function ContextMenuItem({
  className,
  tone = 'default',
  ...props
}: ContextMenuItemProps) {
  return (
    <ContextMenuPrimitive.Item
      className={clsx(styles.item, className)}
      data-tone={tone}
      {...props}
    />
  );
}

export function ContextMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return <ContextMenuPrimitive.Separator className={clsx(styles.separator, className)} {...props} />;
}
