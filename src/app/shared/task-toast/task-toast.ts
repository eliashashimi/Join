import { Component, inject } from '@angular/core';
import { TaskService } from '../../service/task-service';

@Component({
  imports: [],
  selector: 'app-task-toast',
  styleUrl: './task-toast.scss',
  templateUrl: './task-toast.html',
})
export class TaskToast {
  taskService = inject(TaskService);
}
