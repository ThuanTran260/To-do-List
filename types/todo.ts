export interface ChecklistItem {
  id: string;
  title: string;
  is_done: boolean;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at?: string;
}

export interface TaskTemplate {
  id: string;
  user_id: string;
  name: string;
  template_data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    checklist?: ChecklistItem[];
    category_id?: string;
  };
  created_at?: string;
}

export interface TodoItemData {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_vital?: boolean;
  category_id?: string | null;
  image_url?: string | null;
  checklist?: ChecklistItem[];
  sort_order?: number;
  recurrence_rule?: string | null;
  recurrence_end?: string | null;
  parent_id?: string | null;
  pomodoro_count?: number;
  tags?: Tag[];
}
