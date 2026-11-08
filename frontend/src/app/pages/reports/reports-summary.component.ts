import { Component, OnInit, inject, signal, computed, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { Project } from '../../models/project.model';
import { Task } from '../../models/task.model';
import { LucideBarChart3, LucidePieChart, LucideBriefcase, LucideAlertTriangle, LucideListTodo, LucideCheckCircle, LucideDownload } from '@lucide/angular';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-reports-summary',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideBarChart3, LucidePieChart, LucideBriefcase, LucideAlertTriangle, LucideListTodo, LucideCheckCircle, LucideDownload],
  templateUrl: './reports-summary.component.html',
  styleUrl: './reports-summary.component.css'
})
export class ReportsSummaryComponent implements OnInit, AfterViewInit {
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);

  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);

  @ViewChild('projectChart') projectChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('taskChart') taskChartRef!: ElementRef<HTMLCanvasElement>;

  private pChartInst: Chart | null = null;
  private tChartInst: Chart | null = null;

  constructor() {
    effect(() => {
      if (this.pChartInst) {
        this.pChartInst.data.datasets[0].data = [this.plannedProjects(), this.activeProjects(), this.closedProjects()];
        this.pChartInst.update();
      }
      if (this.tChartInst) {
        this.tChartInst.data.datasets[0].data = [this.pendingTasks(), this.inProgressTasks(), this.doneTasks()];
        this.tChartInst.update();
      }
    });
  }

  ngOnInit(): void {
    this.projectService.getAll().subscribe({
      next: data => this.projects.set(data),
      error: () => this.projects.set([])
    });

    this.taskService.getAll().subscribe({
      next: data => this.tasks.set(data),
      error: () => this.tasks.set([])
    });
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  private initCharts() {
    setTimeout(() => {
      if (this.projectChartRef?.nativeElement) {
        const pCtx = this.projectChartRef.nativeElement.getContext('2d');
        if (pCtx) {
          this.pChartInst = new Chart(pCtx, {
            type: 'doughnut',
            data: {
              labels: ['Planificados', 'Activos', 'Cerrados'],
              datasets: [{
                data: [this.plannedProjects(), this.activeProjects(), this.closedProjects()],
                backgroundColor: ['#e2e8f0', '#3b82f6', '#10b981'],
                borderWidth: 0,
                hoverOffset: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '75%',
              plugins: { legend: { display: false } }
            }
          });
        }
      }

      if (this.taskChartRef?.nativeElement) {
        const tCtx = this.taskChartRef.nativeElement.getContext('2d');
        if (tCtx) {
          this.tChartInst = new Chart(tCtx, {
            type: 'doughnut',
            data: {
              labels: ['Por Hacer', 'En Proceso', 'Hechas'],
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
              plugins: { legend: { display: false } }
            }
          });
        }
      }
    }, 100);
  }

  totalProjects = computed(() => this.projects().length);
  activeProjects = computed(() => this.projects().filter(p => p.status === 'ACTIVE').length);
  plannedProjects = computed(() => this.projects().filter(p => p.status === 'PLANNED').length);
  closedProjects = computed(() => this.projects().filter(p => p.status === 'CLOSED').length);

  totalTasks = computed(() => this.tasks().length);
  doneTasks = computed(() => this.tasks().filter(t => t.status === 'DONE').length);
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'IN_PROGRESS').length);
  pendingTasks = computed(() => this.tasks().filter(t => t.status === 'TODO').length);

  unassignedTasks = computed(() => this.tasks().filter(t => !t.assignee?.trim()).length);
  projectsWithoutTasks = computed(() => this.projects().filter(p => !this.tasks().some(t => t.projectId === p.id)).length);

  estimatedHours = computed(() => this.tasks().reduce((sum, t) => sum + (t.estimateHours || 0), 0));
  doneHours = computed(() => this.tasks().filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.estimateHours || 0), 0));

  taskProgress = computed(() => this.totalTasks() === 0 ? 0 : Math.round((this.doneTasks() / this.totalTasks()) * 100));
  projectProgress = computed(() => this.totalProjects() === 0 ? 0 : Math.round((this.closedProjects() / this.totalProjects()) * 100));

  exportToPDF() {
    const data = document.getElementById('pdfContainer');
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
        pdf.save('Reporte_Global.pdf');
      });
    }
  }
}
