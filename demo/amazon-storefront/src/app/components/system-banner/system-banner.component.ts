import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemStatusService, SystemStatus } from '../../services/system-status.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-system-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './system-banner.component.html',
  styleUrls: ['./system-banner.component.scss']
})
export class SystemBannerComponent {
  status$: Observable<SystemStatus>;

  constructor(public systemStatusService: SystemStatusService) {
    this.status$ = systemStatusService.status$;
  }

  retry(): void {
    this.systemStatusService.forceCheck();
  }
}
