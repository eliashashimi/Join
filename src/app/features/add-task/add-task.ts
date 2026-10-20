import { Component } from '@angular/core';
import { TaskForm } from './task-form/task-form';

@Component({
  imports: [TaskForm],
  selector: 'app-add-task',
  styleUrl: './add-task.scss',
  templateUrl: './add-task.html',
})
export class AddTask {}