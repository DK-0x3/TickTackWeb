import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Task } from '@/entities/task';

import { TaskListWidget } from './TaskListWidget';

const task: Task = {
  id: 'task-1',
  userId: 'user-1',
  title: 'Review pagination',
  description: null,
  priority: 'none',
  completedAt: null,
  createdAt: '2026-09-25T12:00:00Z',
  updatedAt: '2026-09-25T12:00:00Z',
  version: 1,
};

const baseProps = {
  completedCount: 0,
  hasMore: false,
  isLoadingMore: false,
  status: 'success' as const,
  tasks: [task],
  title: 'Inbox',
  totalCount: 1,
  onCreateTask: vi.fn(() => Promise.resolve(true)),
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
  onToggleCompleted: vi.fn(),
};

describe('TaskListWidget', () => {
  it('loads the next page when the sentinel becomes visible', () => {
    let notifyIntersection: IntersectionObserverCallback | undefined;
    class ObserverStub {
      constructor(callback: IntersectionObserverCallback) {
        notifyIntersection = callback;
      }

      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', ObserverStub);
    const onLoadMore = vi.fn();

    render(<TaskListWidget {...baseProps} hasMore onLoadMore={onLoadMore} />);
    expect(notifyIntersection).toBeDefined();
    act(() => {
      notifyIntersection?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('pauses automatic loading after an error and offers retry', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    render(
      <TaskListWidget
        {...baseProps}
        hasMore
        loadMoreErrorMessage="Page failed"
        onLoadMore={onLoadMore}
      />,
    );

    expect(screen.getByRole('alert').textContent).toContain('Page failed');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('toggles the selected task and shows completion of all tasks', async () => {
    const user = userEvent.setup();
    const onToggleCompleted = vi.fn();
    render(<TaskListWidget {...baseProps} completedCount={7} totalCount={42} onToggleCompleted={onToggleCompleted} />);

    expect(screen.getByText('7 of 42 tasks completed')).toBeTruthy();
    expect(screen.getByLabelText('Total tasks: 42').textContent).toBe('42');
    await user.click(screen.getByRole('checkbox', { name: 'Change status of task “Review pagination”' }));
    expect(onToggleCompleted).toHaveBeenCalledWith(task);
  });
});
