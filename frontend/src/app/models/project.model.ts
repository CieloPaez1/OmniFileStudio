export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'CLOSED';

export interface Project {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  description?: string;
  // [IONIC 9 - CLASE 8] Foto de perfil / portada del proyecto guardada en Directory.Data
  photo?: string;
  photoPreview?: string;
}
