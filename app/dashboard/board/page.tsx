import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { MotionPage } from '@/components/ui/MotionPage';

export default function KanbanPage() {
  return (
    <MotionPage className="space-y-6">
      <KanbanBoard />
    </MotionPage>
  );
}
