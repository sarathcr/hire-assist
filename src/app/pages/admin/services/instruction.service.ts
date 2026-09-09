import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ASSESSMENT_URL } from '../../../shared/constants/api';
import {
  AptitudeInstruction,
  AptitudeInstructionSummary,
  CreateAptitudeInstructionRequest,
  SaveAsNewVersionRequest,
  UpdateAptitudeInstructionRequest,
  AssignInstructionToRoundRequest,
} from '../models/instruction.model';
import { PaginatedData, PaginatedPayload } from '../../../shared/models/pagination.models';

@Injectable({
  providedIn: 'root',
})
export class InstructionService {
  private http = inject(HttpClient);
  private baseUrl = `${ASSESSMENT_URL}/instructions`;

  /**
   * Get paginated instruction summaries
   */
  public getInstructionsPaginated(payload: PaginatedPayload): Observable<PaginatedData<AptitudeInstructionSummary>> {
    return this.http.post<PaginatedData<AptitudeInstructionSummary>>(`${this.baseUrl}/summary`, payload);
  }

  /**
   * Get all instruction summaries (with optional active-only filter)
   */
  public getInstructions(activeOnly = false): Observable<AptitudeInstructionSummary[]> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('activeOnly', 'true');
    }
    return this.http.get<AptitudeInstructionSummary[]>(this.baseUrl, { params });
  }

  /**
   * Get single instruction with full content by ID
   */
  public getInstructionById(id: number): Observable<AptitudeInstruction> {
    return this.http.get<AptitudeInstruction>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get system default instruction
   */
  public getDefaultInstruction(): Observable<AptitudeInstruction> {
    return this.http.get<AptitudeInstruction>(`${this.baseUrl}/default`);
  }

  /**
   * Create a brand new instruction template
   */
  public createInstruction(payload: CreateAptitudeInstructionRequest): Observable<AptitudeInstruction> {
    return this.http.post<AptitudeInstruction>(this.baseUrl, payload);
  }

  /**
   * Update existing instruction template
   */
  public updateInstruction(id: number, payload: UpdateAptitudeInstructionRequest): Observable<AptitudeInstruction> {
    return this.http.put<AptitudeInstruction>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Clone/fork existing instruction and save as a new version
   */
  public saveAsNewVersion(payload: SaveAsNewVersionRequest): Observable<AptitudeInstruction> {
    return this.http.post<AptitudeInstruction>(`${this.baseUrl}/version`, payload);
  }

  /**
   * Soft-delete / deactivate instruction
   */
  public deleteInstruction(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`);
  }

  /**
   * Assign instruction to an assessment round
   */
  public assignInstructionToRound(payload: AssignInstructionToRoundRequest): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/assign-round`, payload);
  }

  /**
   * Get paginated audit history for instruction
   */
  public getInstructionHistory(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/history`, payload);
  }
}
