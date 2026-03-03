import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface ProcessStep {
  label: string;
  stepNumber: number;
}

@Component({
  standalone: true,
  selector: 'app-process-step',
  imports: [CommonModule],
  templateUrl: './process-step.component.html',
  styleUrls: ['./process-step.component.scss'],
})
export class ProcessStepComponent {
  @Input() steps: ProcessStep[] = [];
  @Input() currentStep = 1;
}
