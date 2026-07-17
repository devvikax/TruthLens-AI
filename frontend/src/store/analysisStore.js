import { create } from 'zustand';
import apiClient from '../services/api';

const INITIAL_STEPS = [
  { id: 1, text: "Reading content payload...", status: "idle" },
  { id: 2, text: "Extracting named claims...", status: "idle" },
  { id: 3, text: "Searching global factcheck registry...", status: "idle" },
  { id: 4, text: "Evaluating sentiment and biases...", status: "idle" },
  { id: 5, text: "Aggregating weighted trust scores...", status: "idle" },
  { id: 6, text: "Generating bilingual narrative explanations...", status: "idle" }
];

export const MOCK_TEMPLATES = {
  credible: {
    rawInput: "NASA's James Webb Space Telescope has captured a stunning new image of an ancient galaxy formed just 400 million years after the Big Bang. Astronomers confirm the findings are backed by spectroscopic verification published in the Journal of Astrophysics.",
    sourceUrl: "https://science.nasa.gov/missions/webb/ancient-galaxy-discovery"
  },
  caution: {
    rawInput: "Warning to everyone! The new OS version 14.2 update is causing batteries to swell up and explode. Avoid downloading it immediately. Reports are coming in from online discussion forums that phones are overheating within minutes.",
    sourceUrl: ""
  },
  misleading: {
    rawInput: "🚨 MUST SHARE WITH FAMILY!!! A secret message from a top research lab says drinking lemon juice with baking soda in hot water completely cures and prevents all viral infections. Big Pharma doesn't want you to know this simple home remedy. Share it before it gets deleted!",
    sourceUrl: ""
  }
};

export const useAnalysisStore = create((set, get) => ({
  // Core Settings & Session state
  theme: localStorage.getItem('theme') || 'dark',
  language: localStorage.getItem('lang') || 'en',
  isAuthenticated: localStorage.getItem('user_authenticated') === 'true',
  user: JSON.parse(localStorage.getItem('user_profile')) || null,

  // App States
  isAnalyzing: false,
  currentAnalysis: null,
  lastAnalyzedFile: null,
  history: [],
  processingSteps: INITIAL_STEPS,

  // Theme & Language Setters
  setTheme: async (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    set({ theme });
    
    // Sync with DB if logged in
    if (get().isAuthenticated) {
      try {
        await apiClient.put('/users/profile', { preferences: { theme } });
      } catch (err) {
        console.warn('Failed to sync theme preference to DB:', err.message);
      }
    }
  },

  setLanguage: async (language) => {
    localStorage.setItem('lang', language);
    set({ language });

    // Sync with DB if logged in
    if (get().isAuthenticated) {
      try {
        await apiClient.put('/users/profile', { preferences: { language } });
      } catch (err) {
        console.warn('Failed to sync language preference to DB:', err.message);
      }
    }
  },

  // Auth Operations
  registerUser: async (name, email, password) => {
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      const { accessToken, user } = res.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_profile', JSON.stringify(user));
      
      set({ isAuthenticated: true, user });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      return { success: false, message: msg };
    }
  },

  loginUser: async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { accessToken, user } = res.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_profile', JSON.stringify(user));
      
      set({ isAuthenticated: true, user });
      
      // Auto-load settings from DB preferences
      if (user.preferences) {
        if (user.preferences.theme) {
          document.documentElement.setAttribute('data-theme', user.preferences.theme);
          set({ theme: user.preferences.theme });
          localStorage.setItem('theme', user.preferences.theme);
        }
        if (user.preferences.language) {
          set({ language: user.preferences.language });
          localStorage.setItem('lang', user.preferences.language);
        }
      }

      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid email or password credentials';
      return { success: false, message: msg };
    }
  },

  logoutUser: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('Revocation endpoint warning:', err.message);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user_authenticated');
    localStorage.removeItem('user_profile');
    set({ isAuthenticated: false, user: null, history: [] });
  },

  loadUserSession: async () => {
    if (localStorage.getItem('user_authenticated') === 'true') {
      try {
        const res = await apiClient.get('/users/profile');
        set({ user: res.data.user, isAuthenticated: true });
        
        // Apply saved preference tokens
        const pref = res.data.user.preferences;
        if (pref) {
          if (pref.theme) {
            document.documentElement.setAttribute('data-theme', pref.theme);
            set({ theme: pref.theme });
          }
          if (pref.language) {
            set({ language: pref.language });
          }
        }
      } catch (err) {
        console.warn('Session verification failed. Wiping tokens.');
        localStorage.removeItem('token');
        localStorage.removeItem('user_authenticated');
        localStorage.removeItem('user_profile');
        set({ isAuthenticated: false, user: null });
      }
    }
  },

  // Active Verification Pipeline
  resetAnalysis: () => {
    set({
      currentAnalysis: null,
      lastAnalyzedFile: null,
      isAnalyzing: false,
      processingSteps: INITIAL_STEPS.map(step => ({ ...step, status: "idle" }))
    });
  },

  analyzeContent: async (type, input, file = null) => {
    set({ isAnalyzing: true, currentAnalysis: null, lastAnalyzedFile: file });
    
    // Scaffolding steps
    const steps = INITIAL_STEPS.map(step => ({ ...step, status: "idle" }));
    set({ processingSteps: steps });

    // Step animation stepper helper
    let currentStepIdx = 0;
    const intervalTimer = setInterval(() => {
      if (currentStepIdx < steps.length) {
        steps[currentStepIdx].status = "running";
        if (currentStepIdx > 0) {
          steps[currentStepIdx - 1].status = "completed";
        }
        set({ processingSteps: [...steps] });
        currentStepIdx++;
      }
    }, 1500); // Progress tick every 1.5 seconds

    try {
      let res;
      if (type === 'image' || type === 'pdf') {
        const formData = new FormData();
        const isMock = file && !(file instanceof File) && !(file instanceof Blob);
        
        if (isMock) {
          formData.append('mockType', type);
          formData.append('mockFileName', file.name);
          if (input) formData.append('input', input);
        } else {
          formData.append('file', file);
          if (input) formData.append('input', input);
        }

        res = await apiClient.post('/analysis/deep', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await apiClient.post('/analysis/deep', { input });
      }

      clearInterval(intervalTimer);
      
      // Finalize all steps
      set({ 
        processingSteps: INITIAL_STEPS.map(step => ({ ...step, status: "completed" })) 
      });

      // Simple delay to let user see 100% completion before results screen load
      await new Promise(r => setTimeout(r, 600));

      const analysisResult = res.data.analysis;

      // Add computed verdict label if absent
      if (!analysisResult.verdict) {
        const ts = analysisResult.metrics.trustScore;
        analysisResult.verdict = ts >= 75 ? 'Likely Genuine' : ts < 40 ? 'Likely Misleading' : 'Needs Verification';
      }

      set({
        isAnalyzing: false,
        currentAnalysis: analysisResult
      });

      return { success: true };
    } catch (error) {
      clearInterval(intervalTimer);
      set({ isAnalyzing: false });

      if (error.response && error.response.status === 409 && error.response.data.requiresClarification) {
        return {
          success: false,
          requiresClarification: true,
          subject: error.response.data.subject,
          candidates: error.response.data.candidates,
          message: error.response.data.message
        };
      }

      const msg = error.response?.data?.message || 'Verification request timed out. Please check your connection.';
      return { success: false, message: msg };
    }
  },

  // Log History & Bookmarking
  loadHistory: async () => {
    if (get().isAuthenticated) {
      try {
        const res = await apiClient.get('/analysis/history');
        const historyData = res.data.history.map(item => {
          // Parse verdict
          const ts = item.metrics.trustScore;
          const verdict = ts >= 75 ? 'Likely Genuine' : ts < 40 ? 'Likely Misleading' : 'Needs Verification';
          return {
            id: item._id,
            title: item.title,
            trustScore: ts,
            inputType: item.inputType,
            createdAt: item.createdAt,
            verdict,
            bookmarked: false // Filled separately via bookmarks query if needed
          };
        });
        
        // Fetch bookmarks to overlay star icons
        const bRes = await apiClient.get('/analysis/bookmarks');
        const bookmarksIds = bRes.data.bookmarks.map(b => b._id);

        const mappedHistory = historyData.map(h => ({
          ...h,
          bookmarked: bookmarksIds.includes(h.id)
        }));

        set({ history: mappedHistory });
      } catch (err) {
        console.warn('Failed to fetch history from database:', err.message);
        set({ history: [] });
      }
    } else {
      // Guest Mode: Local Storage fallback
      const local = JSON.parse(localStorage.getItem('analysis_history')) || [];
      set({ history: local });
    }
  },

  deleteHistory: async (id) => {
    if (get().isAuthenticated) {
      try {
        await apiClient.delete(`/analysis/history/${id}`);
        await get().loadHistory();
      } catch (err) {
        console.error('Delete history DB failure:', err.message);
      }
    } else {
      const local = JSON.parse(localStorage.getItem('analysis_history')) || [];
      const updated = local.filter(item => item.id !== id);
      localStorage.setItem('analysis_history', JSON.stringify(updated));
      set({ history: updated });
    }
  },

  addBookmark: async (item) => {
    const id = item.id || item._id;
    if (get().isAuthenticated) {
      try {
        await apiClient.post(`/analysis/bookmark/${id}`);
        await get().loadHistory();
      } catch (err) {
        console.error('Bookmark toggle DB failure:', err.message);
      }
    } else {
      // Guest Mode: local toggle
      const local = JSON.parse(localStorage.getItem('analysis_history')) || [];
      const updated = local.map(h => 
        h.id === id ? { ...h, bookmarked: !h.bookmarked } : h
      );
      localStorage.setItem('analysis_history', JSON.stringify(updated));
      set({ history: updated });
    }
  }
}));
