import type { Workflow, WorkflowMeta } from '@/types';

const STORAGE_PREFIX = 'wf_';
const INDEX_KEY = 'wf_index';

function getIndex(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setIndex(ids: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export function saveWorkflow(workflow: Workflow): void {
  const key = STORAGE_PREFIX + workflow.id;
  localStorage.setItem(key, JSON.stringify(workflow));

  const index = getIndex();
  if (!index.includes(workflow.id)) {
    index.push(workflow.id);
    setIndex(index);
  }
}

export function loadWorkflow(id: string): Workflow | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    return raw ? (JSON.parse(raw) as Workflow) : null;
  } catch {
    return null;
  }
}

export function deleteWorkflow(id: string): void {
  localStorage.removeItem(STORAGE_PREFIX + id);
  setIndex(getIndex().filter((i) => i !== id));
}

export function listWorkflows(): WorkflowMeta[] {
  const index = getIndex();
  const metas: WorkflowMeta[] = [];

  for (const id of index) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + id);
      if (raw) {
        const wf = JSON.parse(raw) as Workflow;
        metas.push({
          id: wf.id,
          name: wf.name,
          description: wf.description,
          tags: wf.tags,
          version: wf.version,
          createdAt: wf.createdAt,
          updatedAt: wf.updatedAt,
        });
      }
    } catch {
      // Skip corrupt entries
    }
  }

  return metas.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function exportWorkflowAsJson(workflow: Workflow): void {
  const blob = new Blob([JSON.stringify(workflow, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importWorkflowFromJson(file: File): Promise<Workflow> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wf = JSON.parse(e.target?.result as string) as Workflow;
        resolve(wf);
      } catch {
        reject(new Error('Invalid workflow JSON'));
      }
    };
    reader.readAsText(file);
  });
}
