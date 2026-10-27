import { Component, inject, OnInit } from '@angular/core';
import { TaskService } from '../../service/task-service';
import { ContactService } from '../../service/contact-service';
import { TaskInterface, TaskStatus } from '../../interface/task-interface';
import { TaskOverlayService } from '../../service/task-overlay-service';
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
  dragStartDelay: { touch: 300, mouse: 0 },
  listOrientation: 'mixed',
};

const TILT_DEGREES = 5;

@Component({
  imports: [DragDropTasks, CdkDropList, CdkDropListGroup, CdkDrag, TaskOverlay],
  providers: [{ provide: CDK_DRAG_CONFIG, useValue: DRAG_CONFIG }],
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

  async ngOnInit() {
    this.taskService.searchText.set('');
    await this.contactService.getContacts();
    await this.taskService.getTasks();
  }

  openTaskDetails(task: TaskInterface) {
    this.openedTask = task;
  }

  closeTaskDetails() {
    this.openedTask = null;
  }

  openAddTask(status: TaskStatus = 'todo'): void {
    this.taskOverlay.open(status);
  }

  deleteTask() {
    if (this.openedTask) {
      this.taskService.deleteTask(this.openedTask.id);
      this.closeTaskDetails();
    }
  }

  doneCount(task: TaskInterface) {
    return task.subtasks.filter((s) => s.done).length;
  }

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
  
  onDragMoved(event: CdkDragMove<TaskInterface>): void {
    if (event.delta.x === 0) return;
    this.setTilt(event.delta.x > 0 ? TILT_DEGREES : -TILT_DEGREES);
  }

  onDragEnded(): void {
    document.documentElement.style.removeProperty('--drag-tilt');
  }

  private setTilt(degrees: number): void {
    document.documentElement.style.setProperty('--drag-tilt', `${degrees}deg`);
  }
}
