// mockData.js
const initialTemplates = [
  {
    id: 1,
    name: 'OWASP Top 10 Quick Scan',
    description: 'A quick scan based on the OWASP Top 10 vulnerabilities.',
    author: 'OWASP Community',
    dateAdded: '2025-05-01',
    usageCount: 150
  },
  {
    id: 2,
    name: 'Full Comprehensive Scan',
    description: 'A thorough scan covering all API security aspects.',
    author: 'AT-AT Team',
    dateAdded: '2025-04-15',
    usageCount: 75
  },
  {
    id: 3,
    name: 'Authentication & Authorization Focus',
    description: 'Specialized scan for auth and access control issues.',
    author: 'Security Experts',
    dateAdded: '2025-03-20',
    usageCount: 30
  },
  {
    id: 4,
    name: 'Rate Limiting Assessment',
    description: 'Checks for rate limiting vulnerabilities to prevent abuse.',
    author: 'CyberSec Group',
    dateAdded: '2025-05-20',
    usageCount: 90
  },
  {
    id: 5,
    name: 'Data Exposure Scan',
    description: 'Identifies risks of sensitive data exposure in API responses.',
    author: 'DataSafe Inc.',
    dateAdded: '2025-04-01',
    usageCount: 45
  },
  {
    id: 6,
    name: 'CORS Configuration Check',
    description: 'Evaluates CORS policies for potential misconfigurations.',
    author: 'WebSec Pros',
    dateAdded: '2025-02-15',
    usageCount: 20
  },
  {
    id: 7,
    name: 'Injection Vulnerability Scan',
    description: 'Scans for injection vulnerabilities like SQL and command injections.',
    author: 'SecureCode Team',
    dateAdded: '2025-05-10',
    usageCount: 110
  },
  {
    id: 8,
    name: 'API Inventory Audit',
    description: 'Audits API endpoints for proper inventory management.',
    author: 'API Guardians',
    dateAdded: '2025-03-01',
    usageCount: 60
  }
];

// Simulate persistence with localStorage
const loadData = (key, initialData) => {
  const savedData = localStorage.getItem(key);
  return savedData ? JSON.parse(savedData) : initialData;
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// In-memory state (with localStorage persistence)
let templates = loadData('templates', initialTemplates);
let usedTemplates = loadData('usedTemplates', []);

// Mock API functions for Public Templates
export const mockApi = {
  getTemplates: () => new Promise((resolve) => {
    setTimeout(() => resolve([...templates]), 500); // Simulate network latency
  }),

  useTemplate: (templateId) => new Promise((resolve) => {
    setTimeout(() => {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        usedTemplates = [...usedTemplates, { ...template, usedAt: new Date().toISOString() }];
        templates = templates.map(t => t.id === templateId ? { ...t, usageCount: t.usageCount + 1 } : t);
        saveData('usedTemplates', usedTemplates);
        saveData('templates', templates);
        resolve({ success: true, message: `Template "${template.name}" has been added to your profiles.` });
      } else {
        resolve({ success: false, message: 'Template not found.' });
      }
    }, 500);
  }),

  getUsedTemplates: () => new Promise((resolve) => {
    setTimeout(() => resolve([...usedTemplates]), 500);
  })
};

// Reset mock data (for testing purposes)
export const resetMockData = () => {
  templates = [...initialTemplates];
  usedTemplates = [];
  saveData('templates', templates);
  saveData('usedTemplates', usedTemplates);
};