import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export interface SystemStatus {
  online: boolean;
  lastChecked: Date;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemStatusService {
  private apiUrl = 'http://localhost:3000/api';
  private statusSubject = new BehaviorSubject<SystemStatus>({
    online: true,
    lastChecked: new Date()
  });

  public status$ = this.statusSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check status every 30 seconds
    interval(30000).subscribe(() => this.checkStatus());
    // Initial check
    this.checkStatus();
  }

  private checkStatus(): void {
    this.http.get(`${this.apiUrl}/products?limit=1`).pipe(
      map(() => ({
        online: true,
        lastChecked: new Date()
      })),
      catchError(() => of({
        online: false,
        lastChecked: new Date(),
        message: 'Unable to connect to the server. Please try again later.'
      }))
    ).subscribe(status => {
      this.statusSubject.next(status);
    });
  }

  public isOnline(): boolean {
    return this.statusSubject.value.online;
  }

  public forceCheck(): void {
    this.checkStatus();
  }
}
