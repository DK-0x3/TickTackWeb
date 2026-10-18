import { useRef, type ReactNode, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';

import { XIcon } from '@/shared/ui/icon';

import styles from './Modal.module.scss';

export interface ModalProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  isBusy?: boolean;
  className?: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function Modal({
  open,
  title,
  description,
  closeLabel,
  children,
  footer,
  isBusy = false,
  className,
  returnFocusRef,
  onClose,
}: ModalProps) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const hasDescription = description !== undefined && description !== null;

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !isBusy) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={clsx(styles.content, className)}
          aria-busy={isBusy}
          {...(!hasDescription ? { 'aria-describedby': undefined } : {})}
          onOpenAutoFocus={() => {
            previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            // Programmatic dialogs have no Dialog.Trigger to restore focus to.
            event.preventDefault();
            const target = returnFocusRef?.current ?? previousFocus.current;
            if (target?.isConnected) target.focus({ preventScroll: true });
          }}
          onEscapeKeyDown={(event) => { if (isBusy) event.preventDefault(); }}
          onInteractOutside={(event) => { if (isBusy) event.preventDefault(); }}
        >
          <div className={styles.heading}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            {hasDescription ? <Dialog.Description className={styles.description}>{description}</Dialog.Description> : null}
          </div>
          <Dialog.Close asChild>
            <button className={styles.close} type="button" aria-label={closeLabel} disabled={isBusy}>
              <XIcon />
            </button>
          </Dialog.Close>
          <div className={styles.body}>{children}</div>
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
