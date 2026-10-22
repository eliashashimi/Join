import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TaskInterface } from '../../../interface/task-interface';

@Component({
  imports: [],
  selector: 'app-task-overlay',
  styleUrl: './task-overlay.scss',
  templateUrl: './task-overlay.html',
})
export class TaskOverlay {
  @Input({ required: true }) task!: TaskInterface;
  @Output() closeOverlay = new EventEmitter<void>();
}
