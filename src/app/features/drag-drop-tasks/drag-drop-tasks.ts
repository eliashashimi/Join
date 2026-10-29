import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { TaskInterface, TaskStatus } from '../../interface/task-interface';
import { ContactService } from '../../service/contact-service';

interface MoveTarget {
  status: TaskStatus;
  label: string;
  arrow: string;
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To do' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'await_feedback', label: 'Await feedback' },
  { status: 'done', label: 'Done' },
];

@Component({
  imports: [OverlayModule],
  selector: 'app-drag-drop-tasks',
  styleUrl: './drag-drop-tasks.scss',
  templateUrl: './drag-drop-tasks.html',
})
export class DragDropTasks {
  @Input({ required: true }) task!: TaskInterface;
  @Output() openDetails = new EventEmitter<TaskInterface>();
  @Output() delete = new EventEmitter<string>();
  @Output() moveTo = new EventEmitter<TaskStatus>();
  contactService = inject(ContactService);

  readonly maxAvatars = 3;
  readonly menuOpen = signal(false);
  readonly menuPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  ];

  doneCount(task: TaskInterface): number {
    return task.subtasks?.filter((s) => s.done).length || 0;
  }

  assigneesOf(task: TaskInterface) {
    return this.contactService.contacts().filter((c) => task.assigneeIds.includes(c.id));
  }

  onCardClick() {
    this.openDetails.emit(this.task);
  }

  /**
   * Liefert alle Spalten außer der aktuellen Spalte des Tasks.
   * @returns Die Ziele für das "Move to"-Menü, mit Pfeil nach oben oder unten.
   */
  moveTargets(): MoveTarget[] {
    const current = COLUMNS.findIndex((c) => c.status === this.task.status);
    return COLUMNS.flatMap((column, i) =>
      i === current ? [] : [{ ...column, arrow: i < current ? '\u2191' : '\u2193' }],
    );
  }

  /**
   * Öffnet oder schließt das "Move to"-Menü, ohne die Detailansicht zu öffnen.
   * @param event Der Klick auf den Pfeil-Button.
   */
  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  /** Schließt das "Move to"-Menü. */
  closeMenu(): void {
    this.menuOpen.set(false);
  }

  /**
   * Schließt das Menü mit der Escape-Taste.
   * @param event Der Tastendruck im geöffneten Menü.
   */
  onMenuKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.closeMenu();
  }

  /**
   * Meldet der Board-Seite die gewählte Spalte und schließt das Menü.
   * @param status Die Spalte, in die der Task verschoben werden soll.
   * @param event Der Klick auf den Menüpunkt.
   */
  onMove(status: TaskStatus, event: Event): void {
    event.stopPropagation();
    this.closeMenu();
    this.moveTo.emit(status);
  }
}