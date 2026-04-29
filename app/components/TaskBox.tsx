export interface TaskItem {
  id: string;
  title: string;
  issue: string;
}

export function TaskBox({ tasks }: { tasks: TaskItem[] }) {
  if (tasks.length === 0) {
    return (
      <s-box padding="base" borderWidth="base" borderRadius="base">
        <s-text tone="success">✨ All products are fully optimized! No tasks found.</s-text>
      </s-box>
    );
  }

  return (
    <s-box padding="base" borderWidth="base" borderRadius="base">
      <s-text>⚠️ Attention Required ({tasks.length})</s-text>
      <div style={{ maxHeight: '250px', overflowY: 'auto', marginTop: '1rem' }}>
        {tasks.map((task, idx) => (
          <div key={`${task.id}-${idx}`} style={{ padding: '10px', borderBottom: idx !== tasks.length - 1 ? '1px solid #eee' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <s-text><strong>{task.title}</strong></s-text>
              <br />
              <span style={{ fontSize: '11px', color: '#ef4444' }}>Missing: {task.issue}</span>
            </div>
            <s-button href="/app/metafield" variant="tertiary">Fix</s-button>
          </div>
        ))}
      </div>
    </s-box>
  );
}
