import { Component, inject, OnInit } from '@angular/core';
import { TaskService } from '../../service/task-service';
import { ContactService } from '../../service/contact-service';
import { TaskInterface, TaskStatus } from '../../interface/task-interface';
import { TaskOverlayService } from '../../service/task-overlay-service';
import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  CDK_DRAG_CONFIG,
  CdkDrag,
  CdkDragDrop,
  CdkDragMove,
  CdkDropList,
  CdkDropListGroup,
  DragDropConfig,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { DragDropTasks } from '../drag-drop-tasks/drag-drop-tasks';
import { TaskOverlay } from './task-overlay/task-overlay';

const DRAG_CONFIG: DragDropConfig = {
  dragStartDelay: { touch: 100, mouse: 0 },
  listOrientation: 'mixed',
};

const TILT_DEGREES = 5;

/**
 * Die Board-Seite mit den vier Spalten, der Suche und der Detailansicht eines Tasks.
 */
@Component({
  imports: [DragDropTasks, CdkDropList, CdkDropListGroup, CdkDrag, TaskOverlay],
  providers: [{ provide: CDK_DRAG_CONFIG, useValue: DRAG_CONFIG }],
  hostDirectives: [CdkScrollable],
  selector: 'app-board',
  styleUrl: './board.scss',
  templateUrl: './board.html',
})
export class Board implements OnInit {
  taskService = inject(TaskService);
  contactService = inject(ContactService);
  taskOverlay = inject(TaskOverlayService);
  openedTask: TaskInterface | null = null;

  todo = this.taskService.tasksByStatus('todo');
  inProgress = this.taskService.tasksByStatus('in_progress');
  awaitFeedback = this.taskService.tasksByStatus('await_feedback');
  done = this.taskService.tasksByStatus('done');

  /**
   * Leert die Suche und lädt Kontakte und Tasks.
   */
  async ngOnInit() {
    this.taskService.searchText.set('');
    await this.contactService.getContacts();
    await this.taskService.getTasks();
  }

  /**
   * Öffnet die Detailansicht eines Tasks.
   * @param task Der Task, der angezeigt wird.
   */
  openTaskDetails(task: TaskInterface) {
    this.openedTask = task;
  }

  /**
   * Schließt die Detailansicht.
   */
  closeTaskDetails() {
    this.openedTask = null;
  }

  /**
   * Öffnet das Add-Task-Formular für eine Spalte.
   * @param status Die Spalte, in der der Task landet.
   */
  openAddTask(status: TaskStatus = 'todo'): void {
    this.taskOverlay.open(status);
  }

  /**
   * Löscht den geöffneten Task und schließt die Detailansicht.
   */
  deleteTask() {
    if (this.openedTask) {
      this.taskService.deleteTask(this.openedTask.id);
      this.closeTaskDetails();
    }
  }

  /**
   * Zählt die erledigten Subtasks eines Tasks.
   * @param task Der Task.
   * @returns Die Anzahl der erledigten Subtasks.
   */
  doneCount(task: TaskInterface) {
    return task.subtasks.filter((s) => s.done).length;
  }

  /**
   * Übernimmt einen abgelegten Task in die Zielspalte und speichert die neue Position.
   * @param event Das Drop-Ereignis des CDK.
   * @param newStatus Die Spalte, in der der Task abgelegt wurde.
   */
  async onTaskDrop(
    event: CdkDragDrop<TaskInterface[]>,
    newStatus: 'todo' | 'in_progress' | 'await_feedback' | 'done',
  ) {
    const task = event.item.data as TaskInterface;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    await this.taskService.moveTask(task.id, newStatus, event.currentIndex);
  }

  /**
   * Verschiebt einen Task ans Ende der gewählten Spalte (Menü "Move to").
   * @param task Der Task, der verschoben wird.
   * @param status Die Zielspalte.
   */
  onMoveTo(task: TaskInterface, status: TaskStatus): void {
    const index = this.taskService.filteredTasks().filter((t) => t.status === status).length;
    void this.taskService.moveTask(task.id, status, index);
  }

  /**
   * Neigt die gezogene Karte in die Richtung, in die sie bewegt wird.
   * @param event Das Bewegungs-Ereignis des CDK.
   */
  onDragMoved(event: CdkDragMove<TaskInterface>): void {
    if (event.delta.x === 0) return;
    this.setTilt(event.delta.x > 0 ? TILT_DEGREES : -TILT_DEGREES);
  }

  /**
   * Setzt die Neigung der Karte zurück, wenn das Ziehen endet.
   */
  onDragEnded(): void {
    document.documentElement.style.removeProperty('--drag-tilt');
  }

  /**
   * Setzt die Neigung der gezogenen Karte.
   * @param degrees Der Winkel in Grad.
   */
  private setTilt(degrees: number): void {
    document.documentElement.style.setProperty('--drag-tilt', `${degrees}deg`);
  }
}