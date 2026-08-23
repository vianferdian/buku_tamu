import axios from 'axios';

const API_BASE_URL = 'http://localhost:5005/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to automatically attach authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API helpers
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  me: () => api.get('/auth/me'),
};

// Department API helpers
export const deptApi = {
  getAll: (activeOnly = false) => api.get(`/departments?activeOnly=${activeOnly}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Employee API helpers
export const employeeApi = {
  getAll: (params = {}) => api.get('/employees', { params }),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  syncEmployees: () => api.post('/employees/sync'),
  getTemplateUrl: () => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/employees/template?token=${token}`;
  },
  importExcel: (formData) => api.post('/employees/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// Visitor Type API helpers
export const visitorTypeApi = {
  getAll: (activeOnly = false) => api.get(`/visitor-types?activeOnly=${activeOnly}`),
  create: (data) => api.post('/visitor-types', data),
  update: (id, data) => api.put(`/visitor-types/${id}`, data),
  delete: (id) => api.delete(`/visitor-types/${id}`),
};

// Visit Purpose API helpers
export const purposeApi = {
  getAll: (params = {}) => api.get('/visit-purposes', { params }),
  create: (data) => api.post('/visit-purposes', data),
  update: (id, data) => api.put(`/visit-purposes/${id}`, data),
  delete: (id) => api.delete(`/visit-purposes/${id}`),
};

// Visit API helpers
export const visitApi = {
  searchBankDataStudents: (search) => api.get('/visits/bank-data/students', { params: { search } }),
  submit: (data) => api.post('/visits', data),
  getAll: (params = {}) => api.get('/visits', { params }),
  contact: (id) => api.patch(`/visits/${id}/contact`),
  complete: (id) => api.patch(`/visits/${id}/complete`),
  delete: (id) => api.delete(`/visits/${id}`),
  deleteAll: () => api.delete('/visits'),
};

// Setting API helpers
export const settingApi = {
  get: (key) => api.get(`/settings/${key}`),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
};

// User API helpers
export const userApi = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Student API helpers
export const studentApi = {
  getAll: (params = {}) => api.get('/students', { params }),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  deleteAll: () => api.delete('/students'),
  syncStudents: (page) => api.post(`/students/sync?page=${page}`),
};

// Report API helpers
export const reportApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getExportUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/reports/export-excel?${query}`;
  },
};

export default api;
