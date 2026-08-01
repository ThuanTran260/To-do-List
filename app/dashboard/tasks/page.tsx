import { TodoForm } from '@/components/todo/TodoForm';
import { TodoList } from '@/components/todo/TodoList';

export const dynamic = 'force-dynamic';

export default function MyTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          My Tasks (Toàn bộ công việc)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Quản lý, tìm kiếm và sắp xếp danh sách việc cần làm của bạn.
        </p>
      </div>

      <TodoForm />
      <TodoList />
    </div>
  );
}
