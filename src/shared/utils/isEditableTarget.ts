export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.matches('input, textarea, select')
    || target.isContentEditable
    || target.closest('[role="textbox"]') !== null
  );
}
