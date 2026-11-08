import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  collapsed = signal(false);

  toggleSidebar(): void {
    this.collapsed.update(value => !value);
  }
}
