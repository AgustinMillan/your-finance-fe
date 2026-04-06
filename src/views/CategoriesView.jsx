import { useState, useEffect } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
} from "../services/categoryService";
import "./CategoriesView.css";

function CategoriesView() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({
    id: null,
    name: "",
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      setError(err.message || "Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentCategory({
      id: null,
      name: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (category) => {
    setIsEditing(true);
    setCurrentCategory({
      id: category.id,
      name: category.name,
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentCategory.name.trim()) {
      alert("El nombre de la categoría es obligatorio");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateCategory(currentCategory.id, {
          name: currentCategory.name.trim(),
          isActive: currentCategory.isActive,
        });
      } else {
        await createCategory({
          name: currentCategory.name.trim(),
          isActive: currentCategory.isActive,
        });
      }
      setShowModal(false);
      await loadCategories();
    } catch (err) {
      alert(err.message || "Error al guardar la categoría");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="categories-view">
      <div className="categories-header">
        <h2>Categorías</h2>
        <button className="btn-add" onClick={handleOpenCreateModal}>
          + Nueva Categoría
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando categorías...</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">No hay categorías registradas</div>
      ) : (
        <div className="categories-grid">
          {categories?.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-info">
                <span className="category-name">{category.name}</span>
                <span className={`category-status ${category.isActive ? "status-active" : "status-inactive"}`}>
                  <span className="status-indicator"></span>
                  {category.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="category-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleOpenEditModal(category)}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{isEditing ? "Editar Categoría" : "Nueva Categoría"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label style={{color: "black"}}>Nombre</label>
                <input
                style={{color: "black"}}  
                  type="text"
                  value={currentCategory.name}
                  onChange={(e) =>
                    setCurrentCategory({
                      ...currentCategory,
                      name: e.target.value,
                    })
                  }
                  placeholder="Ej: Combustible, Mantenimiento..."
                  autoFocus
                  required
                />
              </div>

              {isEditing && (
                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      checked={currentCategory.isActive}
                      onChange={(e) =>
                        setCurrentCategory({
                          ...currentCategory,
                          isActive: e.target.checked,
                        })
                      }
                    />
                    Categoría Activa
                  </label>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={submitting}
                >
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriesView;
