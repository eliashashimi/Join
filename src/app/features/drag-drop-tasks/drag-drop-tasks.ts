import { Component } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  imports: [CdkDrag],
  selector: 'app-drag-drop-tasks',
  styleUrl: './drag-drop-tasks.scss',
  templateUrl: './drag-drop-tasks.html',
})
export class DragDropTasks {}
