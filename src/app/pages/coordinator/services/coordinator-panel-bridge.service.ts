/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { INTERVIEW_URL } from '../../../shared/constants/api';
import { ApiService } from '../../../shared/services/api.service';
import { StoreService } from '../../../shared/services/store.service';
import { CreatePanel } from '../../admin/models/assessment-schedule.model';
import { InterviewerPanelAssignment } from '../../admin/models/interviewers-model';
import {
  GetInterviewPanelsResponse,
  panelAssignment,
} from '../models/interview-panels.model';

@Injectable({
  providedIn: 'root',
})
export class CoordinatorPanelBridgeService extends ApiService<any> {
  constructor(
    private readonly httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }

  override getResourceUrl(): string {
    return INTERVIEW_URL;
  }
  public getinterviewPanles(interviewId: string) {
    return this.httpClient.get<GetInterviewPanelsResponse>(
      `${this.getResourceUrl()}/InterviewPanel/${interviewId}`,
    );
  }
  public addInterviewerPanels(payload: panelAssignment[]) {
    return this.httpClient.post(
      `${this.getResourceUrl()}/PanelAssignments`,
      payload,
    );
  }

  public deletePanelAssignments(id: number) {
    return this.httpClient.delete(
      `${this.getResourceUrl()}/PanelAssignments/${id}`,
      {},
    );
  }

  public getinterviewPanlesAssignment(PanelAssignmentsId: number) {
    return this.httpClient.get<InterviewerPanelAssignment[]>(
      `${this.getResourceUrl()}/PanelAssignments/${PanelAssignmentsId}`,
    );
  }
  public updatePanleAssignment(payload: panelAssignment) {
    return this.httpClient.post(
      `${this.getResourceUrl()}/PanelAssignments`,
      payload,
    );
  }

  public createPanel(payload: CreatePanel) {
    return this.httpClient.post(`${this.getResourceUrl()}/Panel`, payload);
  }
}
