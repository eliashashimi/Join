import { TaskInterface, TaskStatus } from '../interface/task-interface';

/**
 * Liefert die Tasks einer Spalte nach Position sortiert.
 * @param tasks Alle Tasks.
 * @param status Die Spalte.
 * @returns Die sortierten Tasks dieser Spalte.
 */
function column(tasks: TaskInterface[], status: TaskStatus): TaskInterface[] {
  return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
}


/**
 * Nummeriert die Positionen einer Spalte von 0 an neu durch.
 * @param tasks Die Tasks einer Spalte in der gewünschten Reihenfolge.
 * @returns Die Tasks mit neuen Positionen.
 */
function renumber(tasks: TaskInterface[]): TaskInterface[] {
  return tasks.map((task, position) => ({ ...task, position }));
}


/**
 * Setzt einen Task an eine Stelle einer Spalte und nummeriert die betroffenen Spalten neu.
 * @param tasks Alle Tasks.
 * @param id Die ID des verschobenen Tasks.
 * @param status Die Zielspalte.
 * @param index Die Position in der Zielspalte.
 * @returns Alle Tasks mit den neuen Positionen.
 */
export function placeTask(
  tasks: TaskInterface[],
  id: string,
  status: TaskStatus,
  index: number,
): TaskInterface[] {
  const moved = tasks.find((t) => t.id === id);
  if (!moved) return tasks;
  const target = column(tasks, status).filter((t) => t.id !== id);
  target.splice(index, 0, { ...moved, status });
  const sourceTasks = column(tasks, moved.status).filter((t) => t.id !== id);
  const source = moved.status === status ? [] : renumber(sourceTasks);
  const rest = tasks.filter((t) => t.status !== status && t.status !== moved.status);
  return [...rest, ...renumber(target), ...source];
}


/**
 * Rechnet eine Position aus der gefilterten Ansicht in die Position in der vollständigen Spalte um.
 * @param all Alle Tasks.
 * @param shown Die gerade angezeigten (gefilterten) Tasks.
 * @param id Die ID des verschobenen Tasks.
 * @param status Die Zielspalte.
 * @param index Die Position in der angezeigten Spalte.
 * @returns Die Position in der vollständigen Spalte.
 */
export function toFullIndex(
  all: TaskInterface[],
  shown: TaskInterface[],
  id: string,
  status: TaskStatus,
  index: number,
): number {
  const fullColumn = column(all, status).filter((t) => t.id !== id);
  const shownColumn = column(shown, status).filter((t) => t.id !== id);
  if (shownColumn.length === fullColumn.length) return index;
  if (index < shownColumn.length) return fullColumn.indexOf(shownColumn[index]);
  const last = shownColumn[shownColumn.length - 1];
  return last ? fullColumn.indexOf(last) + 1 : fullColumn.length;
}
