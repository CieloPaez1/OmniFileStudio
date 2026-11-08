import { Component, OnInit, inject, signal, computed, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { Project } from '../../models/project.model';
import { Task } from '../../models/task.model';
import { TaskStatusPipe } from '../../pipes/task-status.pipe';
import { LucideCheckCircle, LucideClock, LucideListTodo, LucideClipboardList, LucideActivity, LucideDownload } from '@lucide/angular';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-project-report',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskStatusPipe, LucideCheckCircle, LucideClock, LucideListTodo, LucideClipboardList, LucideActivity, LucideDownload],
  templateUrl: './project-report.component.html',
  styleUrl: './project-report.component.css'
})
export class ProjectReportComponent implements OnInit, AfterViewInit {
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);

  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  selectedProjectId = signal('');

  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  private chartInst: Chart | null = null;

  constructor() {
    effect(() => {
      const data = [this.pendingTasks(), this.inProgressTasks(), this.doneTasks()];
      if (this.chartInst) {
        this.chartInst.data.datasets[0].data = data;
        this.chartInst.update();
      }
    });
  }

  ngOnInit(): void {
    this.projectService.getAll().subscribe({
      next: data => {
        this.projects.set(data);
        this.selectedProjectId.set(data[0]?.id?.toString() ?? '');
      },
      error: () => this.projects.set([])
    });

    this.taskService.getAll().subscribe({
      next: data => this.tasks.set(data),
      error: () => this.tasks.set([])
    });
  }

  ngAfterViewInit() {
    this.initChart();
  }

  private initChart() {
    if (!this.statusChartRef) return;
    
    setTimeout(() => {
      if (!this.statusChartRef?.nativeElement) return;
      const ctx = this.statusChartRef.nativeElement.getContext('2d');
      if (!ctx) return;

      this.chartInst = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Por Hacer', 'En Proceso', 'Terminadas'],
          datasets: [{
            data: [this.pendingTasks(), this.inProgressTasks(), this.doneTasks()],
            backgroundColor: ['#fef3c7', '#dbeafe', '#dcfce7'],
            borderColor: ['#f59e0b', '#3b82f6', '#22c55e'],
            borderWidth: 1,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: { display: false }
          }
        }
      });
    }, 100);
  }

  selectedProject = computed(() => {
    const id = Number(this.selectedProjectId());
    return this.projects().find(project => project.id === id);
  });

  projectTasks = computed(() => {
    const id = Number(this.selectedProjectId());
    return this.tasks().filter(task => task.projectId === id);
  });

  totalTasks = computed(() => this.projectTasks().length);
  pendingTasks = computed(() => this.projectTasks().filter(task => task.status === 'TODO').length);
  inProgressTasks = computed(() => this.projectTasks().filter(task => task.status === 'IN_PROGRESS').length);
  doneTasks = computed(() => this.projectTasks().filter(task => task.status === 'DONE').length);

  totalHours = computed(() => this.projectTasks().reduce((sum, task) => sum + (task.estimateHours || 0), 0));
  
  doneHours = computed(() => this.projectTasks()
    .filter(task => task.status === 'DONE')
    .reduce((sum, task) => sum + (task.estimateHours || 0), 0)
  );

  progress = computed(() => this.totalTasks() === 0 ? 0 : Math.round((this.doneTasks() / this.totalTasks()) * 100));

  exportToPDF() {
    const data = document.getElementById('pdfContainer');
    const projectName = this.selectedProject()?.name || 'Proyecto';
    if (data) {
      html2canvas(data, { 
        scale: 2,
        onclone: (doc) => {
          doc.documentElement.setAttribute('data-theme', 'minimal');
        }
      }).then((canvas: any) => {
        const imgWidth = 208;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        const contentDataURL = canvas.toDataURL('image/png');
        let pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Reporte_${projectName.replace(/\s+/g, '_')}.pdf`);
      });
    }
  }
}
