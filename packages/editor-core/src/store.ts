import { create } from 'zustand';
import { Project, Clip, Track } from '@video-editor/timeline-schema';

interface EditorState {
  project: Project | null;
  playheadMs: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  
  activeTool: 'select' | 'blade';
  snappingEnabled: boolean;
  
  // Actions
  setProject: (project: Project) => void;
  setPlayhead: (ms: number) => void;
  setIsPlaying: (playing: boolean) => void;
  selectClip: (id: string | null) => void;
  setActiveTool: (tool: 'select' | 'blade') => void;
  setSnappingEnabled: (enabled: boolean) => void;
  
  // Mutations
  addTrack: (track: Track) => void;
  addClip: (trackId: string, clip: Clip) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void;
  moveClipTime: (trackId: string, clipId: string, newStartMs: number) => void;
  trimClip: (trackId: string, clipId: string, newStartMs: number, newDurationMs: number, sourceStartMs?: number) => void;
  deleteClip: (trackId: string, clipId: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  project: null,
  playheadMs: 0,
  isPlaying: false,
  selectedClipId: null,
  activeTool: 'select',
  snappingEnabled: true,

  setProject: (project) => set({ project }),
  setPlayhead: (ms) => set({ playheadMs: ms }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  selectClip: (id) => set({ selectedClipId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSnappingEnabled: (enabled) => set({ snappingEnabled: enabled }),

  addTrack: (track) => set((state) => {
    if (!state.project) return state;
    return { project: { ...state.project, tracks: [...state.project.tracks, track] } };
  }),

  addClip: (trackId, clip) => set((state) => {
    if (!state.project) return state;
    const newProject = { ...state.project };
    const trackIndex = newProject.tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return state;
    newProject.tracks[trackIndex].clips.push(clip);
    return { project: newProject };
  }),

  updateClip: (trackId, clipId, updates) => set((state) => {
    if (!state.project) return state;
    
    const trackIndex = state.project.tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return state;

    const clipIndex = state.project.tracks[trackIndex].clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) return state;

    const newProject = { ...state.project };
    newProject.tracks[trackIndex].clips[clipIndex] = {
      ...newProject.tracks[trackIndex].clips[clipIndex],
      ...updates
    } as Clip;

    return { project: newProject };
  }),

  moveClipTime: (trackId, clipId, newStartMs) => set((state) => {
     if (!state.project) return state;
     const newProject = { ...state.project };
     const trackIndex = newProject.tracks.findIndex(t => t.id === trackId);
     if (trackIndex === -1) return state;
     const clipIndex = newProject.tracks[trackIndex].clips.findIndex(c => c.id === clipId);
     if (clipIndex === -1) return state;
     
     newProject.tracks[trackIndex].clips[clipIndex].startAtMs = Math.max(0, newStartMs);
     return { project: newProject };
  }),

  trimClip: (trackId, clipId, startMs, durationMs, sourceStartMs) => set((state) => {
     if (!state.project) return state;
     const newProject = { ...state.project };
     const trackIndex = newProject.tracks.findIndex(t => t.id === trackId);
     if (trackIndex === -1) return state;
     const clipIndex = newProject.tracks[trackIndex].clips.findIndex(c => c.id === clipId);
     if (clipIndex === -1) return state;
     
     const clip = newProject.tracks[trackIndex].clips[clipIndex];
     clip.startAtMs = Math.max(0, startMs);
     clip.durationMs = Math.max(100, durationMs); // Ensure minimum duration
     
     if (sourceStartMs !== undefined && clip.type !== 'text') {
        (clip as any).sourceStartMs = Math.max(0, sourceStartMs);
     }
     return { project: newProject };
  }),

  deleteClip: (trackId, clipId) => set((state) => {
      if (!state.project) return state;
      const newProject = { ...state.project };
      const trackIndex = newProject.tracks.findIndex(t => t.id === trackId);
      if (trackIndex === -1) return state;
      newProject.tracks[trackIndex].clips = newProject.tracks[trackIndex].clips.filter(c => c.id !== clipId);
      return { project: newProject };
  }),
}));
