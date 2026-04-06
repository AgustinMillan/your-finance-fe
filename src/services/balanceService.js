/**
 * Actualiza una transacción (pago)
 * @param {number} id - ID de la transacción
 * @param {Object} paymentData - Datos a actualizar { accountId, motorBikeId, amount, type, date, description }
 * @returns {Promise<Object>} Transacción actualizada
 */
export const updatePayment = async (id, paymentData) => {
  try {
    const url = getApiUrl(`${BALANCE_ENDPOINTS.PAYMENTS}/${id}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) {
      throw new Error(
        `Error al actualizar transacción: ${response.statusText}`,
      );
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error en updatePayment:", error);
    throw error;
  }
};
/**
 * Actualiza una cuenta de balance
 * @param {number} id - ID de la cuenta
 * @param {Object} accountData - Datos a actualizar { name, alias }
 * @returns {Promise<Object>} Cuenta actualizada
 */
export const updateAccount = async (id, accountData) => {
  try {
    const url = getApiUrl(`${BALANCE_ENDPOINTS.ACCOUNTS}/${id}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accountData),
    });
    if (!response.ok) {
      throw new Error(`Error al actualizar cuenta: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error en updateAccount:", error);
    throw error;
  }
};
import { getApiUrl } from "../config/api";

// Endpoint para cuentas de balance
const BALANCE_ENDPOINTS = {
  ACCOUNTS: "/api/balance/accounts",
  PAYMENTS: "/api/balance/payments",
};

/**
 * Obtiene todas las cuentas de balance
 * @returns {Promise<Array>} Lista de cuentas con su balance
 */
export const getAllAccounts = async () => {
  try {
    const url = getApiUrl(BALANCE_ENDPOINTS.ACCOUNTS);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al obtener cuentas: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error en getAllAccounts:", error);
    throw error;
  }
};

/**
 * Crea una nueva cuenta de balance
 * @param {Object} accountData - Datos de la cuenta { name }
 * @returns {Promise<Object>} Cuenta creada
 */
export const createAccount = async (accountData) => {
  try {
    const url = getApiUrl(BALANCE_ENDPOINTS.ACCOUNTS);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accountData),
    });
    if (!response.ok) {
      throw new Error(`Error al crear cuenta: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error en createAccount:", error);
    throw error;
  }
};

/**
 * Obtiene todos los pagos/transacciones
 * @returns {Promise<Array>} Lista de pagos
 */
export const getAllPayments = async (page = 1, setTotalPages, filters = {}) => {
  try {
    const params = new URLSearchParams({ page: page.toString() });
    
    if (filters.motorBikeId) params.append("motorBikeId", filters.motorBikeId);
    if (filters.type) params.append("type", filters.type);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const url = `${getApiUrl(BALANCE_ENDPOINTS.PAYMENTS)}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al obtener transacciones: ${response.statusText}`);
    }
    const data = await response.json();
    setTotalPages(Math.ceil(data.count / 10));
    return data.data || [];
  } catch (error) {
    console.error("Error en getAllPayments:", error);
    throw error;
  }
};

/**
 * Obtiene todos los gastos/transacciones
 * @returns {Promise<Array>} Lista de gastos
 */
export const getAllBills = async (page = 1, setTotal) => {
  try {
    const url =
      getApiUrl(BALANCE_ENDPOINTS.PAYMENTS) + "?type=egreso&page=" + page;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al obtener pagos: ${response.statusText}`);
    }
    const data = await response.json();
    setTotal(Math.ceil(data.count / 10));
    return data.data || [];
  } catch (error) {
    console.error("Error en getAllPayments:", error);
    throw error;
  }
};

/**
 * Crea un nuevo pago/transacción
 * @param {Object} paymentData - Datos del pago { accountId, motorBikeId, amount, type, date, description }
 * @returns {Promise<Object>} Pago creado
 */
export const createPayment = async (paymentData) => {
  try {
    const url = getApiUrl(BALANCE_ENDPOINTS.PAYMENTS);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) {
      throw new Error(`Error al crear pago: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error en createPayment:", error);
    throw error;
  }
};
