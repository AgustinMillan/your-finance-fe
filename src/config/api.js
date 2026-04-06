// Configuración de la API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  ENDPOINTS: {
    MOTOR_BIKES: '/api/motor-bikes',
    MOTOR_BIKE_DEBTS: '/api/motor-bikes/reports/debts',
    TRACCAR_POSITIONS: '/api/traccar/get-positions',
    MOTOR_BIKE_DAYS: '/api/motor-bike-days',
  },
}

// Helper para construir URLs completas
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

