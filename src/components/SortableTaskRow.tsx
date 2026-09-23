import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProcessedTask } from '../types';
import { formatDate } from '../utils/dateUtils';
import { extractJiraTicketId } from '../utils/developerUtils';

interface SortableTaskRowProps {
  task: ProcessedTask;
  onEdit: (task: ProcessedTask) => void;
  onUnassign: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export default function SortableTaskRow({ task, onEdit, onUnassign, onDelete }: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-100 hover:bg-gray-50 ${isDragging ? 'bg-blue-50 shadow-lg' : ''}`}
    >
      {/* Drag Handle */}
      <td className="px-2 py-3 w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </button>
      </td>
      
      {/* Task ID */}
      <td className="px-4 py-3 text-sm font-mono text-gray-600">{task.id}</td>
      
      {/* Task Title */}
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.title}</td>
      
      {/* Project */}
      <td className="px-4 py-3 text-sm text-gray-600">{task.project}</td>
      
      {/* Jira */}
      <td className="px-4 py-3 text-sm">
        {task.jiraUrl ? (
          <a
            href={task.jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {extractJiraTicketId(task.jiraUrl)} ↗
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      
      {/* Hours */}
      <td className="px-4 py-3 text-sm text-center text-gray-600">{task.hours}h</td>
      
      {/* Start Date */}
      <td className="px-4 py-3 text-sm text-center text-gray-600 whitespace-nowrap">
        {formatDate(task.startDateObj)}
      </td>
      
      {/* End Date */}
      <td className="px-4 py-3 text-sm text-center text-gray-600 whitespace-nowrap">
        {formatDate(task.endDateObj)}
      </td>
      
      {/* Actions */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onUnassign(task.id)}
            className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded transition-colors"
            title="Unassign"
          >
            Unassign
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
