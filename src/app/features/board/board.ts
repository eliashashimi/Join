import { Component, inject, OnInit } from '@angular/core';
import { TaskService } from '../../service/task-service';
import { ContactService } from '../../service/contact-service';
import { TaskInterface } from '../../interface/task-interface';
import {
  CdkDrag,
  CdkDropList,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { DragDropTasks } from '../drag-drop-tasks/drag-drop-tasks';

@Component({
  imports: [DragDropTasks, CdkDropList, CdkDropListGroup, CdkDrag],
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

  onTaskDrop(
    event: CdkDragDrop<TaskInterface[]>,
    newStatus: 'todo' | 'in_progress' | 'await_feedback' | 'done',
  ) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.item.data as TaskInterface;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}