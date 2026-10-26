import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TaskForm } from './task-form/task-form';

@Component({
  imports: [TaskForm],
  selector: 'app-add-task',
  styleUrl: './add-task.scss',
  templateUrl: './add-task.html',
})
export class AddTask {
  private readonly router = inject(Router);

  goToBoard(): void {
    this.router.navigate(['/board']);
  }
}
