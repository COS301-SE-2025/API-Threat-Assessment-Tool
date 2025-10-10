import React, { createContext, useState, useContext } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

// Create the context
const TimezoneContext = createContext();

// Create a helper function for formatting timestamps that we can use anywhere
export const formatTimestamp = (timestamp, timezone, formatStr = 'yyyy-MM-dd p') => {
  if (!timestamp || !timezone) return 'N/A';
  try {
    // This function correctly converts a UTC timestamp string to the target timezone
    return formatInTimeZone(new Date(timestamp), timezone, formatStr);
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid Date";
  }
};

// Create the Provider component
export const TimezoneProvider = ({ children }) => {
  // Detect user's browser timezone as a sensible default
  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC+02:00';
  
  const [selectedTimezone, setSelectedTimezone] = useState(defaultTimezone);

  const value = { selectedTimezone, setSelectedTimezone };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};
