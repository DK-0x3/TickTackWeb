import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CreateTaskForm } from './CreateTaskForm';

describe('CreateTaskForm', () => {
  it('submits a trimmed title and closes only after a successful create', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(true));
    const onCancel = vi.fn();
    render(<CreateTaskForm onSubmit={onSubmit} onCancel={onCancel} />);

    await user.type(screen.getByRole('textbox', { name: 'Task title' }), '  Plan release  ');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      title: 'Plan release',
      dueDate: null,
      dueTime: null,
    }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('keeps the title after a failed create and blocks blank input', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(false));
    const onCancel = vi.fn();
    render(<CreateTaskForm onSubmit={onSubmit} onCancel={onCancel} errorMessage="Create failed" />);

    const submit = screen.getByRole('button', { name: 'Add task' });
    expect(submit.hasAttribute('disabled')).toBe(true);
    await user.type(screen.getByRole('textbox', { name: 'Task title' }), 'Keep me');
    await user.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Task title' }).value).toBe('Keep me');
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('Create failed');
  });
});
