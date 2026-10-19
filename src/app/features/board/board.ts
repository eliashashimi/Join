import { Component, inject, OnInit } from '@angular/core';
import { TaskService } from '../../service/task-service';
import { ContactService } from '../../service/contact-service';
import { TaskInterface } from '../../interface/task-interface';
import {
  CdkDrag,
  CdkDropList,
  CdkDragDrop,
  CDK_DROP_LIST,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  imports: [NgTemplateOutlet],
  selector: 'app-board',
  styleUrl: './board.scss',
  templateUrl: './board.html',
})
export class Board implements OnInit {
  taskService = inject(TaskService);
  contactService = inject(ContactService);

  todo = this.taskService.tasksByStatus('todo');
  inProgress = this.taskService.tasksByStatus('in_progress');
  awaitFeedback = this.taskService.tasksByStatus('await_feedback');
  done = this.taskService.tasksByStatus('done');

  async ngOnInit() {
    await this.contactService.getContacts();
    await this.taskService.getTasks();
  }

  assigneesOf(task: TaskInterface) {
    return this.contactService.contacts().filter((c) => task.assigneeIds.includes(c.id));
  }

  doneCount(task: TaskInterface) {
    return task.subtasks.filter((s) => s.done).length;
  }

  drop(event: CdkDragDrop<string[]>) {
    // moveItemInArray(this.todo, event.previousIndex, event.currentIndex);
  }
}
