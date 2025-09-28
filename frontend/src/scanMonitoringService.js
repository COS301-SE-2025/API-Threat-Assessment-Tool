// This service encapsulates the logic for polling the backend for scan status.

const SCAN_STEPS = [
  { "label": "Initializing Scan Engine...", "duration": 2000 },
  { "label": "Analyzing API Structure...", "duration": 3000 },
  { "label": "Running Authentication Tests...", "duration": 5000 },
  { "label": "Testing for Injection Vulnerabilities...", "duration": 8000 },
  { "label": "Checking for Data Exposure...", "duration": 6000 },
  { "label": "Finalizing Report...", "duration": 4000 }
];

const callApi = async (endpoint, body) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || `API call to ${endpoint} failed`);
  }
  return result.data;
};

const startMonitoring = (scanId, options, callbacks) => {
  const { pollInterval = 5000, maxAttempts = 36 } = options;
  const { onProgress, onComplete, onError } = callbacks;

  let attempts = 0;
  let currentStep = 0;
  let stepStartTime = Date.now();
  let totalScanDuration = SCAN_STEPS.reduce((sum, step) => sum + step.duration, 0);

  const checkStatus = async () => {
    try {
      attempts++;
      const response = await callApi('/api/scan/status', { scan_id: scanId });

      // Simulate progress
      const elapsedTime = Date.now() - stepStartTime;
      const stepDuration = SCAN_STEPS[currentStep].duration;
      let progressPercentage = Math.min(100, Math.floor((elapsedTime / stepDuration) * 100));
      
      if (onProgress) {
        onProgress({
          currentStep: currentStep + 1,
          totalSteps: SCAN_STEPS.length,
          stepLabel: SCAN_STEPS[currentStep].label,
          progress: progressPercentage,
        });
      }
       if (elapsedTime >= stepDuration && currentStep < SCAN_STEPS.length - 1) {
          currentStep++;
          stepStartTime = Date.now();
        }


      if (response.status === 'completed') {
        if (onComplete) {
          onComplete(response.results);
        }
        return; // Stop polling
      }

      if (response.status === 'failed') {
        throw new Error('Scan failed on the backend.');
      }

      if (attempts >= maxAttempts) {
        throw new Error('Scan timed out. Please check the results later.');
      }
      
      // Schedule the next poll
      setTimeout(checkStatus, pollInterval);

    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };

  // Start the first check
  setTimeout(checkStatus, pollInterval);
};

export const scanMonitoringService = {
  startMonitoring,
};

