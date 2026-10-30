import type { InboxViewsDto } from '../model/taskView.dto';

interface CollapseWrite {
  requestId: string;
  value: boolean;
  pending: boolean;
}

export interface InboxViewsCache extends InboxViewsDto {
  collapseWrites?: Record<string, CollapseWrite>;
  collapseRead?: {
    requestId: string;
    writes: Record<string, CollapseWrite>;
  };
}

export function mergeInboxViews(
  current: InboxViewsCache,
  incoming: InboxViewsDto,
  requestId: string,
): InboxViewsCache {
  const read = current.collapseRead?.requestId === requestId ? current.collapseRead : undefined;
  const retainedWrites: Record<string, CollapseWrite> = {};
  const views = incoming.views.map((view) => {
    const write = current.collapseWrites?.[view.id];
    const observed = read?.writes[view.id];
    // Only a GET started after a settled write can supersede its local value.
    if (write && (write.pending || observed?.requestId !== write.requestId || observed.pending)) {
      retainedWrites[view.id] = { ...write };
      return { ...view, is_collapsed: write.value };
    }
    return view;
  });
  return { ...incoming, views, collapseWrites: retainedWrites };
}
