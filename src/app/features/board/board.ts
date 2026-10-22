import { Component, inject, OnInit } from '@angular/core';
import { TaskService } from '../../service/task-service';
import { ContactService } from '../../service/contact-service';
import { TaskInterface } from '../../interface/task-interface';
import { TaskOverlay } from './task-overlay/task-overlay';
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
