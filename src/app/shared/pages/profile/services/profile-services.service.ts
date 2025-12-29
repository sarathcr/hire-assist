import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { ASSESSMENT_URL, Profile_URL } from '../../../constants/api';
import { FileDto, FileRequest } from '../../../models/files.models';
import { ApiService } from '../../../services/api.service';
import { StoreService } from '../../../services/store.service';
import { ProfileDetails, SkillsDto } from '../models/basic-information.model';

@Injectable({
  providedIn: 'root',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ProfileServicesService extends ApiService<any> {
  constructor(
    private readonly httpClient: HttpClient,
    sanitizer: DomSanitizer,
    store: StoreService,
  ) {
    super(httpClient, sanitizer, store);
  }

  override getResourceUrl(): string {
    return Profile_URL;
  }

  public uploadFiles(payload: FileRequest) {
    const formData = new FormData();
    formData.append('IdType', payload.attachmentType.toString());
    formData.append('File', payload.file);

    return this.httpClient.post<FileDto>(
      `${this.getResourceUrl()}/upload-cover-profile-image`,
      formData,
    );
  }
  public GetProfileDetails() {
    return this.httpClient.get<ProfileDetails>(
      `${this.getResourceUrl()}/get-detailsBy-user`,
    );
  }
  public GetPhoto(blobId: string, attachmentTypeId: number): Observable<Blob> {
    const url = `${ASSESSMENT_URL}/files?blobId=${blobId}&attachmentId=${attachmentTypeId}`;
    return this.httpClient.get(url, { responseType: 'blob' });
  }

  public DeleteImage(
    blobId: string,
    attachmentTypeId: number,
  ): Observable<Blob> {
    const url = `${Profile_URL}/delete-image?blobId=${blobId}&attachmentTypeId=${attachmentTypeId}`;
    return this.httpClient.delete(url, { responseType: 'blob' });
  }

  public getSkills(): Observable<SkillsDto[]> {
    return this.httpClient.get<SkillsDto[]>(
      `${this.getResourceUrl()}/get-skills`,
    );
  }

  public postUserSkills(skills: SkillsDto[]): Observable<void> {
    return this.httpClient.post<void>(
      `${this.getResourceUrl()}/post-user-skills`,
      skills,
    );
  }

  public deleteUserSkill(id: number): Observable<void> {
    return this.httpClient.delete<void>(
      `${this.getResourceUrl()}/delete-user-skills/${id}`,
    );
  }

  public createSkill(skillName: string): Observable<SkillsDto> {
    return this.httpClient.post<SkillsDto>(
      `${this.getResourceUrl()}/post-skill`,
      { name: skillName },
    );
  }
}
