import { useState, useEffect } from "react";
import {
  getAllAccounts,
  createAccount,
  getAllPayments,
  updateAccount,
  createPayment,
  updatePayment,
  createTransfer,
} from "../services/balanceService";
import { getCategories } from "../services/categoryService";
import "./BalanceView.css";

function BalanceView() {
  const [categories, setCategories] = useState([]);
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [editPaymentData, setEditPaymentData] = useState({
    accountId: "",
    categoryId: "",
    amount: "",
    type: "ingreso",
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });
  const [submittingEditPayment, setSubmittingEditPayment] = useState(false);
  const [page, setPage] = useState(1);
  const [totalpages, setTotalPages] = useState(0);

  // States for filters
  const [filters, setFilters] = useState({
    type: "", // empty = "Todos"
    categoryId: "",
    startDate: "",
    endDate: "",
  });

  const handleEditPayment = (payment) => {
    setEditPaymentId(payment.id);
    setEditPaymentData({
      accountId: payment.accountId?.toString() || "",
      categoryId: payment.categoryId?.toString() || "",
      amount: payment.amount?.toString() || "",
      type: payment.type || "ingreso",
      date: payment.date
        ? payment.date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      description: payment.description || "",
    });
  };

  const handleUpdatePayment = async () => {
    if (
      !editPaymentData.accountId ||
      !editPaymentData.amount ||
      !editPaymentData.type ||
      !editPaymentData.date
    ) {
      setError("Cuenta, monto, tipo y fecha son obligatorios");
      return;
    }
    setSubmittingEditPayment(true);
    try {
      await updatePayment(editPaymentId, {
        accountId: Number(editPaymentData.accountId),
        categoryId: editPaymentData.categoryId ? Number(editPaymentData.categoryId) : null,
        amount: Number(editPaymentData.amount),
        type: editPaymentData.type,
        date: editPaymentData.date,
        description: editPaymentData.description,
      });
      setEditPaymentId(null);
      setEditPaymentData({
        accountId: "",
        categoryId: "",
        amount: "",
        type: "ingreso",
        date: new Date().toISOString().slice(0, 10),
        description: "",
      });
      await loadData();
    } catch (err) {
      setError(err.message || "Error al actualizar transacción");
    } finally {
      setSubmittingEditPayment(false);
    }
  };

  const [showTransactionFormPayment, setShowTransactionFormPayment] =
    useState(false);
  const [transactionPaymentData, setTransactionPaymentData] = useState({
    accountId: "",
    categoryId: "",
    amount: "",
    type: "ingreso",
    description: "",
  });

  const [showTransactionFormBill, setShowTransactionFormBill] = useState(false);
  const [transactionBillData, setTransactionBillData] = useState({
    accountId: "",
    categoryId: "",
    amount: "",
    type: "egreso",
    description: "",
  });

  const [submittingTransaction, setSubmittingTransaction] = useState(false);

  // --- Estados para transferencia de ahorros ---
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferMode, setTransferMode] = useState("save"); // "save" = añadir ahorros, "withdraw" = sacar de ahorros
  const [transferData, setTransferData] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const openTransferModal = (mode) => {
    setTransferMode(mode);
    setTransferData({
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      description: "",
    });
    setShowTransferModal(true);
  };

  const handleCreateTransfer = async () => {
    // La cuenta "Ahorros" siempre es una parte fija de la transferencia
    const ahorrosAccount = accounts.find((a) => a.name === "Ahorros");
    if (!ahorrosAccount) {
      setError('No existe una cuenta llamada "Ahorros". Créala primero desde la sección de cuentas.');
      return;
    }

    const fromId = transferMode === "save"
      ? Number(transferData.fromAccountId)   // cuenta del usuario→ahorros
      : ahorrosAccount.id;                   // ahorros→cuenta del usuario

    const toId = transferMode === "save"
      ? ahorrosAccount.id
      : Number(transferData.toAccountId);

    if (!transferData.fromAccountId && transferMode === "save") {
      setError("Seleccioná la cuenta de origen");
      return;
    }
    if (!transferData.toAccountId && transferMode === "withdraw") {
      setError("Seleccioná la cuenta destino");
      return;
    }
    if (!transferData.amount) {
      setError("Ingresá un monto");
      return;
    }

    setSubmittingTransfer(true);
    try {
      await createTransfer({
        fromAccountId: fromId,
        toAccountId: toId,
        amount: Number(transferData.amount),
        date: transferData.date,
        description: transferData.description ||
          (transferMode === "save" ? "Añadir a ahorros" : "Sacar de ahorros"),
      });
      setShowTransferModal(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Error al realizar la transferencia");
    } finally {
      setSubmittingTransfer(false);
    }
  };
  const handleCreateTransaction = async (type) => {
    setSubmittingTransaction(true);
    try {
      if (type === "ingreso") {
        if (
          !transactionPaymentData.accountId ||
          !transactionPaymentData.amount
        ) {
          setError("Cuenta y monto son obligatorios");
          return;
        }
        await createPayment({
          accountId: Number(transactionPaymentData.accountId),
          categoryId: transactionPaymentData.categoryId ? Number(transactionPaymentData.categoryId) : null,
          amount: Number(transactionPaymentData.amount),
          type,
          date: transactionPaymentData.date,
          description: transactionPaymentData.description,
        });

        setShowTransactionFormPayment(false);
        setTransactionPaymentData({
          accountId: "",
          categoryId: "",
          amount: "",
          type: "ingreso",
          date: new Date().toISOString().slice(0, 10),
          description: "",
        });
        await loadData();
      } else if (type === "egreso") {
        if (!transactionBillData.accountId || !transactionBillData.amount) {
          setError("Cuenta y monto son obligatorios");
          return;
        }
        await createPayment({
          accountId: Number(transactionBillData.accountId),
          categoryId: transactionBillData.categoryId ? Number(transactionBillData.categoryId) : null,
          amount: Number(transactionBillData.amount),
          type,
          date: transactionBillData.date,
          description: transactionBillData.description,
        });
        setShowTransactionFormBill(false);
        setTransactionBillData({
          accountId: "",
          categoryId: "",
          amount: "",
          type: "egreso",
          date: new Date().toISOString().slice(0, 10),
          description: "",
        });
        await loadData();
      }
    } catch (err) {
      setError(err.message || "Error al crear transacción");
    } finally {
      setSubmittingTransaction(false);
    }
  };

  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: "", alias: "" });
  const [editAccountId, setEditAccountId] = useState(null);
  const [editAccountData, setEditAccountData] = useState({
    name: "",
    alias: "",
  });
  const handleEditAccount = (account) => {
    setEditAccountId(account.id);
    setEditAccountData({ name: account.name, alias: account.alias || "" });
  };

  const handleUpdateAccount = async () => {
    if (!editAccountData.name.trim()) {
      setError("El nombre de la cuenta no puede estar vacío");
      return;
    }
    try {
      await updateAccount(editAccountId, {
        name: editAccountData.name.trim(),
        alias: editAccountData.alias.trim(),
      });
      setEditAccountId(null);
      setEditAccountData({ name: "", alias: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Error al actualizar cuenta");
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
      .then(() => {
        console.log("Datos cargados correctamente");
      })
      .catch((err) => {
        console.error("Error al cargar datos:", err);
      });
  }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [accountsData, paymentsData, categoriesData] =
        await Promise.all([
          getAllAccounts(),
          getAllPayments(page, setTotalPages, filters),
          getCategories(),
        ]);
      setAccounts(accountsData);
      setPayments(paymentsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.name.trim()) {
      setError("El nombre de la cuenta no puede estar vacío");
      return;
    }

    try {
      await createAccount({
        name: newAccount.name.trim(),
        alias: newAccount.alias.trim(),
      });
      setNewAccount({ name: "", alias: "" });
      setShowNewAccountForm(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Error al crear cuenta");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return dateString;
  };

  return (
    <div className="balance-view">
      {/* Sección de error */}
      {error && (
        <div className="balance-error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button
            className="error-close"
            onClick={() => setError(null)}
            aria-label="Cerrar error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sección de loading */}
      {loading && (
        <div className="balance-loading">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Sección de Cuentas (Cards) */}
          <section className="accounts-section">
            <h2>Cuentas</h2>
            <div className="accounts-container">
              {/* Cards de cuentas existentes */}
              {accounts.map((account) => (
                <div key={account.id} className="account-card">
                  <div className="account-card-header">
                    {editAccountId === account.id ? (
                      <>
                        <input
                          type="text"
                          value={editAccountData.name}
                          onChange={(e) =>
                            setEditAccountData({
                              ...editAccountData,
                              name: e.target.value,
                            })
                          }
                          placeholder="Nombre de la cuenta"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editAccountData.alias}
                          onChange={(e) =>
                            setEditAccountData({
                              ...editAccountData,
                              alias: e.target.value,
                            })
                          }
                          placeholder="Alias (opcional)"
                        />
                        <div className="form-actions">
                          <button
                            className="btn-confirm"
                            onClick={handleUpdateAccount}
                          >
                            Guardar
                          </button>
                          <button
                            className="btn-cancel"
                            onClick={() => setEditAccountId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3>{account.name}</h3>
                        {account.alias && (
                          <div className="account-alias">{account.alias}</div>
                        )}
                        <button
                          className="btn-edit"
                          onClick={() => handleEditAccount(account)}
                          style={{ marginTop: 8 }}
                        >
                          Editar
                        </button>
                      </>
                    )}
                  </div>
                  <div className="account-card-body">
                    <div className="account-balance">
                      <span className="balance-label">Balance</span>
                      <span className="balance-amount">
                        {formatCurrency(account.balance || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Card para agregar nueva cuenta */}
              <div className="account-card add-account-card">
                {!showNewAccountForm ? (
                  <button
                    className="add-account-btn"
                    onClick={() => setShowNewAccountForm(true)}
                    aria-label="Agregar nueva cuenta"
                  >
                    <span className="plus-icon">+</span>
                    <span>Nueva Cuenta</span>
                  </button>
                ) : (
                  <div className="new-account-form">
                    <input
                      type="text"
                      placeholder="Nombre de la cuenta"
                      value={newAccount.name}
                      onChange={(e) =>
                        setNewAccount({
                          name: e.target.value,
                          alias: newAccount.alias,
                        })
                      }
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Alias (opcional)"
                      value={newAccount.alias}
                      onChange={(e) =>
                        setNewAccount({
                          name: newAccount.name,
                          alias: e.target.value,
                        })
                      }
                    />

                    <div className="form-actions">
                      <button
                        className="btn-confirm"
                        onClick={handleAddAccount}
                      >
                        Crear
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => {
                          setShowNewAccountForm(false);
                          setNewAccount({ name: "", alias: "" });
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Sección de Pagos (Tabla) */}
          <section className="payments-section">
            <h2>Historial de Transacciones</h2>

            <div className="filters-container">
              <div className="filter-group">
                <label>Tipo</label>
                <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                  <option value="ingreso">Ingresos</option>
                  <option value="egreso">Egresos</option>
                  <option value="">Todos</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Categoría</label>
                <select value={filters.categoryId} onChange={(e) => setFilters({...filters, categoryId: e.target.value})}>
                  <option value="">Todas</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Desde</label>
                <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
              </div>
              <div className="filter-group">
                <label>Hasta</label>
                <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
              </div>
              <div className="filter-group filter-actions">
                <button className="btn-filter" onClick={() => { setPage(1); loadData(); }}>
                  Aplicar Filtros
                </button>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="empty-state">
                <p>No hay pagos registrados</p>
              </div>
            ) : (
              <div className="payments-table-wrapper">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Monto</th>
                      <th>Tipo</th>
                      <th>Categoría</th>
                      <th>Fecha</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className={`payment-row ${payment.type}`}
                      >
                        {editPaymentId === payment.id ? (
                          <td
                            colSpan={6}
                            style={{ background: "#f8fafc", padding: 0 }}
                          >
                            <form
                              className="transaction-form"
                              style={{
                                boxShadow: "none",
                                margin: 0,
                                padding: 0,
                              }}
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdatePayment();
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 12,
                                }}
                              >
                                <label
                                  style={{ flex: "1 1 120px", minWidth: 120 }}
                                >
                                  Cuenta
                                  <select
                                    value={editPaymentData.accountId}
                                    onChange={(e) =>
                                      setEditPaymentData({
                                        ...editPaymentData,
                                        accountId: e.target.value,
                                      })
                                    }
                                    required
                                  >
                                    <option value="">Seleccionar cuenta</option>
                                    {accounts.map((acc) => (
                                      <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label
                                  style={{ flex: "1 1 120px", minWidth: 120 }}
                                >
                                  Categoría
                                  <select
                                    value={editPaymentData.categoryId}
                                    onChange={(e) =>
                                      setEditPaymentData({
                                        ...editPaymentData,
                                        categoryId: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="">Sin categoría</option>
                                    {categories.map((cat) => (
                                      <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label
                                  style={{ flex: "1 1 100px", minWidth: 100 }}
                                >
                                  Monto
                                  <input
                                    type="number"
                                    value={editPaymentData.amount}
                                    onChange={(e) =>
                                      setEditPaymentData({
                                        ...editPaymentData,
                                        amount: e.target.value,
                                      })
                                    }
                                    min="1"
                                    required
                                  />
                                </label>
                                <label
                                  style={{ flex: "1 1 140px", minWidth: 140 }}
                                >
                                  Fecha
                                  <input
                                    type="date"
                                    value={editPaymentData.date}
                                    onChange={(e) =>
                                      setEditPaymentData({
                                        ...editPaymentData,
                                        date: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                </label>
                                <label
                                  style={{ flex: "2 1 180px", minWidth: 180 }}
                                >
                                  Descripción
                                  <input
                                    type="text"
                                    value={editPaymentData.description}
                                    onChange={(e) =>
                                      setEditPaymentData({
                                        ...editPaymentData,
                                        description: e.target.value,
                                      })
                                    }
                                    maxLength={100}
                                  />
                                </label>
                              </div>
                              <div
                                className="form-actions"
                                style={{ marginTop: 8 }}
                              >
                                <button
                                  className="btn-confirm"
                                  type="submit"
                                  disabled={submittingEditPayment}
                                >
                                  {submittingEditPayment
                                    ? "Guardando..."
                                    : "Guardar"}
                                </button>
                                <button
                                  className="btn-cancel"
                                  type="button"
                                  onClick={() => setEditPaymentId(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          </td>
                        ) : (
                          <>
                            <td className="amount-cell">
                              <span className={`amount ${payment.isTransfer ? "transfer" : payment.type}`}>
                                {payment.type === "ingreso" ? "+ " : "- "}
                                {formatCurrency(Math.abs(payment.amount))}
                              </span>
                            </td>
                            <td className="type-cell">
                              {payment.isTransfer ? (
                                <span className="type-badge transfer">🔁 Transferencia</span>
                              ) : (
                                <span className={`type-badge ${payment.type}`}>
                                  {payment.type === "ingreso" ? "Ingreso" : "Egreso"}
                                </span>
                              )}
                            </td>
                            <td className="category-cell" style={{color: "black"}}>
                              {categories?.find(c => c.id === payment.categoryId)?.name || "-"}
                            </td>
                            <td className="date-cell">
                              {formatDate(payment.date)}
                            </td>
                            <td className="description-cell">
                              {payment.description || "-"}
                              {!payment.isTransfer && (
                                <button
                                  className="btn-edit-transaction"
                                  onClick={() => handleEditPayment(payment)}
                                >
                                  Editar
                                </button>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div>
                  <button
                    onClick={() => {
                      if (page > 1) setPage(page - 1);
                    }}
                  >
                    -
                  </button>
                  <span style={{ margin: "0 8px", color: "#555" }}>
                    {page} / {totalpages}
                  </span>
                  <button
                    onClick={() => {
                      if (page < totalpages) setPage(page + 1);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </section>
          {/* Botones para crear transacción y cerrar formulario */}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              gap: 16,
              justifyContent: "flex-end",
            }}
          >
            <div className="balance-action-footer">
              <button
                className="btn-income"
                onClick={() => {
                  setShowTransactionFormPayment(true);
                  setShowTransactionFormBill(false);
                  setShowTransferModal(false);
                }}
              >
                + CREAR INGRESO
              </button>
              <button
                className="btn-expense"
                onClick={() => {
                  setShowTransactionFormBill(true);
                  setShowTransactionFormPayment(false);
                  setShowTransferModal(false);
                }}
              >
                - CREAR EGRESO
              </button>
              <button
                className="btn-savings"
                onClick={() => {
                  setShowTransactionFormPayment(false);
                  setShowTransactionFormBill(false);
                  openTransferModal("save");
                }}
              >
                🏦 AÑADIR AHORROS
              </button>
              <button
                className="btn-withdraw-savings"
                onClick={() => {
                  setShowTransactionFormPayment(false);
                  setShowTransactionFormBill(false);
                  openTransferModal("withdraw");
                }}
              >
                💸 SACAR DE AHORROS
              </button>
              {(showTransactionFormPayment || showTransactionFormBill || showTransferModal) && (
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowTransactionFormPayment(false);
                    setShowTransactionFormBill(false);
                    setShowTransferModal(false);
                  }}
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>

          {/* Formulario para crear transacción */}
          {showTransactionFormPayment && (
            <div
              className="transaction-form"
              style={{
                marginTop: 24,
                background: "#f9f9f9",
                padding: 24,
                borderRadius: 8,
                boxShadow: "0 2px 8px #0001",
                maxWidth: 500,
              }}
            >
              <h3>Crear transacción</h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <form
                  className="transaction-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateTransaction("ingreso");
                  }}
                >
                  <h3>Crear transacción</h3>
                  <label>
                    Cuenta
                    <select
                      value={transactionPaymentData.accountId}
                      onChange={(e) =>
                        setTransactionPaymentData({
                          ...transactionPaymentData,
                          accountId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Seleccionar cuenta</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Categoría
                    <select
                      value={transactionPaymentData.categoryId}
                      onChange={(e) =>
                        setTransactionPaymentData({
                          ...transactionPaymentData,
                          categoryId: e.target.value,
                        })
                      }
                    >
                      <option value="">Sin categoría</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Monto
                    <input
                      type="number"
                      value={transactionPaymentData.amount}
                      onChange={(e) =>
                        setTransactionPaymentData({
                          ...transactionPaymentData,
                          amount: e.target.value,
                        })
                      }
                      min="1"
                      required
                    />
                  </label>
                  <label>
                    Fecha
                    <input
                      type="date"
                      value={transactionPaymentData.date}
                      onChange={(e) =>
                        setTransactionPaymentData({
                          ...transactionPaymentData,
                          date: e.target.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Descripción
                    <input
                      type="text"
                      value={transactionPaymentData.description}
                      onChange={(e) =>
                        setTransactionPaymentData({
                          ...transactionPaymentData,
                          description: e.target.value,
                        })
                      }
                      maxLength={100}
                    />
                  </label>
                  <div className="form-actions">
                    <button
                      className="btn-confirm"
                      type="submit"
                      disabled={submittingTransaction}
                    >
                      {submittingTransaction
                        ? "Guardando..."
                        : "Guardar transacción"}
                    </button>
                    <button
                      className="btn-cancel"
                      type="button"
                      onClick={() => setShowTransactionFormPayment(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Formulario para crear transacción (Egreso) */}
          {showTransactionFormBill && (          
          <div
            style={{
              marginTop: 32,
              display: "flex",
              gap: 16,
              justifyContent: "flex-end",
            }}
          >
            <div className="balance-action-footer">
              <button
                className="btn-confirm"
                onClick={() => setShowTransactionFormBill(true)}
              >
                Crear transacción
              </button>
              {showTransactionFormBill && (
                <button
                  className="btn-cancel"
                  onClick={() => setShowTransactionFormBill(false)}
                >
                  Cerrar formulario
                </button>
              )}
            </div>
          </div>)}

          {/* Formulario para crear transacción */}
          {showTransactionFormBill && (
            <div
              className="transaction-form"
              style={{
                marginTop: 24,
                background: "#f9f9f9",
                padding: 24,
                borderRadius: 8,
                boxShadow: "0 2px 8px #0001",
                maxWidth: 500,
              }}
            >
              <h3>Crear transacción</h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <form
                  className="transaction-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateTransaction("egreso");
                  }}
                >
                  <h3>Crear transacción</h3>
                  <label>
                    Cuenta
                    <select
                      value={transactionBillData.accountId}
                      onChange={(e) =>
                        setTransactionBillData({
                          ...transactionBillData,
                          accountId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Seleccionar cuenta</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Categoría
                    <select
                      value={transactionBillData.categoryId}
                      onChange={(e) =>
                        setTransactionBillData({
                          ...transactionBillData,
                          categoryId: e.target.value,
                        })
                      }
                    >
                      <option value="">Sin categoría</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Monto
                    <input
                      type="number"
                      value={transactionBillData.amount}
                      onChange={(e) =>
                        setTransactionBillData({
                          ...transactionBillData,
                          amount: e.target.value,
                        })
                      }
                      min="1"
                      required
                    />
                  </label>
                  <label>
                    Fecha
                    <input
                      type="date"
                      value={transactionBillData.date}
                      onChange={(e) =>
                        setTransactionBillData({
                          ...transactionBillData,
                          date: e.target.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Descripción
                    <input
                      type="text"
                      value={transactionBillData.description}
                      onChange={(e) =>
                        setTransactionBillData({
                          ...transactionBillData,
                          description: e.target.value,
                        })
                      }
                      maxLength={100}
                    />
                  </label>
                  <div className="form-actions">
                    <button
                      className="btn-confirm"
                      type="submit"
                      disabled={submittingTransaction}
                    >
                      {submittingTransaction
                        ? "Guardando..."
                        : "Guardar transacción"}
                    </button>
                    <button
                      className="btn-cancel"
                      type="button"
                      onClick={() => setShowTransactionFormBill(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de transferencia de ahorros */}
          {showTransferModal && (
            <div className="transfer-modal-overlay" onClick={() => setShowTransferModal(false)}>
              <div className="transfer-modal" onClick={(e) => e.stopPropagation()}>
                <div className="transfer-modal-header">
                  <span className="transfer-modal-icon">
                    {transferMode === "save" ? "🏦" : "💸"}
                  </span>
                  <h3>
                    {transferMode === "save" ? "Añadir Ahorros" : "Sacar de Ahorros"}
                  </h3>
                  <button className="transfer-modal-close" onClick={() => setShowTransferModal(false)}>✕</button>
                </div>

                <div className="transfer-modal-body">
                  <p className="transfer-hint">
                    {transferMode === "save"
                      ? "El dinero se moverá desde tu cuenta de origen hacia la cuenta de ahorros."
                      : "El dinero se moverá desde tu cuenta de ahorros hacia la cuenta destino."
                    }
                  </p>

                  <div className="transfer-form-grid">
                    {/* AÑADIR: usuario elige origen, destino = AHORROS fijo */}
                    {transferMode === "save" ? (
                      <>
                        <label className="transfer-label">
                          <span>Cuenta origen</span>
                          <select
                            value={transferData.fromAccountId}
                            onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                            required
                          >
                            <option value="">Seleccionar cuenta...</option>
                            {accounts.filter((a) => a.name !== "Ahorros").map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name}{acc.alias ? ` (${acc.alias})` : ""}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="transfer-arrow">→</div>

                        <div className="transfer-label">
                          <span>Destino (fijo)</span>
                          <div className="transfer-fixed-account">🏦 Ahorros</div>
                        </div>
                      </>
                    ) : (
                      /* SACAR: origen = AHORROS fijo, usuario elige destino */
                      <>
                        <div className="transfer-label">
                          <span>Origen (fijo)</span>
                          <div className="transfer-fixed-account">🏦 Ahorros</div>
                        </div>

                        <div className="transfer-arrow">→</div>

                        <label className="transfer-label">
                          <span>Cuenta destino</span>
                          <select
                            value={transferData.toAccountId}
                            onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
                            required
                          >
                            <option value="">Seleccionar cuenta...</option>
                            {accounts.filter((a) => a.name !== "Ahorros").map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name}{acc.alias ? ` (${acc.alias})` : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}

                    {/* Aviso si no existe la cuenta Ahorros */}
                    {!accounts.find((a) => a.name === "Ahorros") && (
                      <p className="transfer-warn" style={{ gridColumn: "1 / -1" }}>
                        ⚠️ No encontramos una cuenta llamada <strong>"Ahorros"</strong>. Créala desde la sección de cuentas para poder operar.
                      </p>
                    )}
                  </div>

                  <label className="transfer-label">
                    <span>Monto</span>
                    <input
                      type="number"
                      min="1"
                      value={transferData.amount}
                      onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </label>

                  <label className="transfer-label">
                    <span>Fecha</span>
                    <input
                      type="date"
                      value={transferData.date}
                      onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                      required
                    />
                  </label>

                  <label className="transfer-label">
                    <span>Descripción (opcional)</span>
                    <input
                      type="text"
                      value={transferData.description}
                      onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                      placeholder={transferMode === "save" ? "Ej: Ahorro de abril" : "Ej: Retiro para gastos"}
                      maxLength={100}
                    />
                  </label>
                </div>

                <div className="transfer-modal-footer">
                  <button
                    className={transferMode === "save" ? "btn-savings" : "btn-withdraw-savings"}
                    onClick={handleCreateTransfer}
                    disabled={submittingTransfer}
                  >
                    {submittingTransfer ? "Procesando..." : (transferMode === "save" ? "🏦 Confirmar Ahorro" : "💸 Confirmar Retiro")}
                  </button>
                  <button className="btn-cancel" onClick={() => setShowTransferModal(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BalanceView;
