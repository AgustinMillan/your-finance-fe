import { getApiUrl } from "../config/api";

const CATEGORY_ENDPOINTS = {
  CATEGORIES: "/api/categories",
};

export const getCategories = async () => {
  try {
    const url = getApiUrl(CATEGORY_ENDPOINTS.CATEGORIES);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al obtener categorías: ${response.statusText}`);
    }
    const data = await response.json();
    // Assuming backend returns an array directly, according to the backend controller example: res.status(200).json(result);
    return data.data || [];
  } catch (error) {
    console.error("Error en getCategories:", error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const url = getApiUrl(CATEGORY_ENDPOINTS.CATEGORIES);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      throw new Error(`Error al crear categoría: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en createCategory:", error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const url = getApiUrl(`${CATEGORY_ENDPOINTS.CATEGORIES}/${id}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      throw new Error(`Error al actualizar categoría: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en updateCategory:", error);
    throw error;
  }
};
