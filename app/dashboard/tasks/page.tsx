import { TodoForm } from '@/components/todo/TodoForm';
import { TodoList } from '@/components/todo/TodoList';
import { TaskDetailView } from '@/components/todo/TaskDetailView';

export default function MyTasksPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-ink">
          My Tasks (Toàn bộ công việc)
        </h2>
        <p className="text-xs text-ink-subtle font-normal">
          Quản lý, tìm kiếm và sắp xếp danh sách việc cần làm của bạn.
        </p>
      </div>

      <TodoForm />
      <TodoList />
      <TaskDetailView />
    </div>
  );
}
