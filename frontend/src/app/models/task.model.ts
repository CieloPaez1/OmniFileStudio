export interface Task {
  id?: number;
  projectId?: number;
  projectName?: string;
  title: string;
  estimateHours: number;
  assignee?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
  priority?: 'baja' | 'media' | 'alta';
  // ===========================================================================
  // [IONIC 9 - CLASE 8: SEPARAR BINARIO DE METADATOS]
  // Guardamos solo la referencia (nombre de archivo `task-<timestamp>.jpeg`) en
  // la tarea, mientras el binario real vive en Directory.Data del Filesystem.
  // ===========================================================================
  photo?: string;
  photoPreview?: string;
  // ===========================================================================
  // [IONIC 9 - CLASE 9: GEOLOCALIZACIÓN CON @capacitor/geolocation]
  // Coordenadas GPS (grados decimales) registradas al crear la tarea.
  // ===========================================================================
  lat?: number;
  lng?: number;
}
