import { Component, inject, OnInit } from '@angular/core';
import { TaskService } from '../../service/task-service';
import { ContactService } from '../../service/contact-service';
import { TaskInterface, TaskStatus } from '../../interface/task-interface';
import { TaskOverlayService } from '../../service/task-overlay-service';
import {
  CDK_DRAG_CONFIG,
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  DragDropConfig,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { DragDropTasks } from '../drag-drop-tasks/drag-drop-tasks';

const DRAG_CONFIG: DragDropConfig = {
  dragStartDelay: { touch: 300, mouse: 0 },
  listOrientation: 'mixed',
};

@Component({
  imports: [DragDropTasks, CdkDropList, CdkDropListGroup, CdkDrag],
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
    await this.contactService.getContacts();
    await this.taskService.getTasks();
  }

  openTaskDetails(task: TaskInterface) {
    this.openedTask = task;
  }

  closeTaskDetails() {
    this.openedTask = null;
  }

  /**
   * Öffnet das Add-Task-Overlay für den gewählten Status.
   * @param status Status, den der neue Task bekommt
   */
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
}