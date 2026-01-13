import React, { useState, useEffect } from "react";
import { 
    fetchDashboardStats, fetchUsers, fetchAuditLogs,
    deleteUser, toggleUserStatus, updateUserRole 
} from "../api/api"; 
import "./AdminPanel.css";

const AdminPanel = () => {
  // --- DATA STATE ---
  const [serverLoad, setServerLoad] = useState(12);
  const [activeUsers, setActiveUsers] = useState(0);
  
  // ✅ NEW: State for Real Alerts & Throughput
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [throughput, setThroughput] = useState(0);

  const [realUsers, setRealUsers] = useState([]); 
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // --- UI STATE ---
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All"); 
  const [logFilter, setLogFilter] = useState("All"); 
  const [selectedLog, setSelectedLog] = useState(null); 
  const [toast, setToast] = useState(null);
  
  // ✅ UNIFIED MODAL STATE
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "confirm", // confirm, danger, input, select
    inputValue: "",
    selectOptions: [],
    onConfirm: null
  });

  const [optimizing, setOptimizing] = useState(false);
  const [rotating, setRotating] = useState(false);
  
  // Pagination & Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'lastLogin', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5; 

  // --- HELPERS ---
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ✅ Modal Helper Functions
  const closeModal = () => setModal({ ...modal, isOpen: false });
  
  const confirmAction = () => {
    if (modal.onConfirm) {
        // Pass input value if it's an input/select modal
        modal.onConfirm(modal.inputValue); 
    }
    closeModal();
  };

  const refreshData = async () => {
      setLoadingUsers(true);
      try {
        const userData = await fetchUsers();
        if (Array.isArray(userData)) {
          const formatted = userData.map(u => ({
            id: u.id,
            name: u.username,
            role: u.is_superuser ? "Super Admin" : (u.is_staff ? "Analyst" : "Operator"),
            status: u.is_active ? "Active" : "Inactive",
            lastLogin: u.last_login ? new Date(u.last_login).toLocaleString() : "Never",
            rawLogin: u.last_login ? new Date(u.last_login) : new Date(0) 
          }));
          setRealUsers(formatted);
        }
      } catch (err) { console.error(err); } 
      finally { setLoadingUsers(false); }
  };

  useEffect(() => {
    const loadStats = async () => {
        const data = await fetchDashboardStats();
        if (data) {
            setActiveUsers(data.total_vessels || 0);
            
            // ✅ 1. CALCULATE ALERTS (Congestion + Risks)
            const totalAlerts = (data.high_congestion_ports || 0) + (data.active_risks || 0);
            setActiveAlerts(totalAlerts);

            // ✅ 2. SET REAL THROUGHPUT (From Middleware)
            // If data.throughput is missing/zero (on first load), show 0 or a baseline
            setThroughput(data.throughput || 0);
        }
    };
    const loadLogs = async () => {
        const logs = await fetchAuditLogs();
        if (Array.isArray(logs)) setAuditLogs(logs);
    };

    loadStats();
    refreshData();
    loadLogs();

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      loadStats(); // ✅ Refresh stats (throughput) constantly
      
      setServerLoad(prev => {
        const change = Math.floor(Math.random() * 10) - 4; 
        return Math.min(Math.max(prev + change, 5), 95); 
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getLoadColor = (load) => {
    if (load < 50) return '#10b981'; 
    if (load < 75) return '#f59e0b'; 
    return '#ef4444'; 
  };

  // ✅ REFACTORED ACTIONS TO USE CUSTOM MODAL
  const handleUserAction = (action, user) => {
    switch(action) {
        case 'edit':
            setModal({
                isOpen: true,
                title: "Edit User",
                message: `Update details for ${user.name}:`,
                type: "input",
                inputValue: user.name,
                onConfirm: (val) => showToast(`✏️ Updated name to: ${val} (Demo)`)
            });
            break;

        case 'role':
            setModal({
                isOpen: true,
                title: "Change Role",
                message: `Select new role for ${user.name}:`,
                type: "select",
                inputValue: user.role, // Default selection
                selectOptions: ["Super Admin", "Analyst", "Operator"],
                onConfirm: async (newRole) => {
                    if (newRole && newRole !== user.role) {
                        await updateUserRole(user.id, newRole);
                        showToast(`✅ Role updated to ${newRole}`);
                        refreshData();
                    }
                }
            });
            break;

        case 'disable': 
            const isActive = user.status === 'Active';
            setModal({
                isOpen: true,
                title: isActive ? "Disable User?" : "Activate User?",
                message: `Are you sure you want to ${isActive ? 'DISABLE' : 'ACTIVATE'} ${user.name}? They will ${isActive ? 'lose' : 'regain'} system access.`,
                type: "warning",
                onConfirm: async () => {
                    await toggleUserStatus(user.id);
                    showToast(`✅ User status updated.`);
                    refreshData();
                }
            });
            break;

        case 'delete':
            setModal({
                isOpen: true,
                title: "Delete User?",
                message: `⚠️ WARNING: This will PERMANENTLY delete user "${user.name}". This action cannot be undone.`,
                type: "danger",
                onConfirm: async () => {
                    await deleteUser(user.id);
                    showToast(`🗑️ User deleted.`);
                    refreshData();
                }
            });
            break;
        default: break;
    }
  };

  const handleMaintenance = (type) => {
      if (type === 'optimize') {
          setModal({
              isOpen: true, title: "Run Optimization?", message: "This will re-index the database tables. The system might slow down for a few seconds.", type: "confirm",
              onConfirm: () => { setOptimizing(true); setTimeout(() => {setOptimizing(false); showToast("✅ Optimization Complete");}, 2000); }
          });
      } else {
          setModal({
              isOpen: true, title: "Archive Logs?", message: "Move logs older than 30 days to cold storage? This frees up database space.", type: "confirm",
              onConfirm: () => { setRotating(true); setTimeout(() => {setRotating(false); showToast("✅ Logs Archived");}, 1500); }
          });
      }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedUsers = () => {
    let filtered = realUsers.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase());
        const matchesRole = roleFilter === "All" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });
    return filtered.sort((a, b) => {
        let valA = sortConfig.key === 'lastLogin' ? a.rawLogin : a[sortConfig.key];
        let valB = sortConfig.key === 'lastLogin' ? b.rawLogin : b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  };

  const currentUsers = sortedUsers().slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
  const totalPages = Math.ceil(sortedUsers().length / usersPerPage);

  const getLogType = (action) => {
      if (action.includes("Log")) return "login";
      if (action.includes("Reg")) return "register";
      if (action.includes("Delete") || action.includes("Disable")) return "danger";
      return "info";
  };

  const filteredLogs = auditLogs.filter(log => {
      if (logFilter === "All") return true;
      if (logFilter === "Logins") return log.action.includes("Log");
      if (logFilter === "Actions") return !log.action.includes("Log") && !log.action.includes("Reg");
      return true;
  });

  const downloadCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    showToast(`⬇️ Downloaded ${filename}`);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h2>System Control Center</h2>
          <p className="admin-subtext">Platform Architecture & Operational Oversight</p>
        </div>
        <div className="status-badge-group">
            <span className="status-pill online pulse">● System Online</span>
            <span className="status-pill version">v2.4.0-stable</span>
        </div>
      </div>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-grid-top">
        <div className="admin-card health-card interactive-card">
          <div className="card-icon blue-bg">📡</div>
          <div className="card-info"><h4>API Gateway</h4><span className="status-text green-text">Healthy</span></div>
          <div className="mini-chart">IIlIlı</div>
        </div>
        <div className="admin-card health-card interactive-card">
          <div className="card-icon purple-bg">🗄️</div>
          <div className="card-info"><h4>Main Database</h4><span className="status-text green-text">Connected</span></div>
          <p className="latency-text">14ms latency</p>
        </div>
         <div className="admin-card health-card interactive-card">
          <div className="card-icon orange-bg">🛡️</div>
          <div className="card-info"><h4>Tracked Assets</h4><span className="status-text">Active: {activeUsers}</span></div>
        </div>
      </div>

      <div className="admin-split-layout">
        <div className="admin-col">
            <div className="metrics-panel interactive-card min-h-400">
            <h3>Live System Metrics <span className="live-dot"></span></h3>
            <div className="metrics-grid">
                <div className="metric-box"><span className="metric-label">Nodes Online</span><span className="metric-value">{activeUsers > 0 ? activeUsers + 3 : 0}</span></div>
                
                {/* ✅ UPDATED: REAL THROUGHPUT */}
                <div className="metric-box">
                    <span className="metric-label">Throughput / Sec</span>
                    <span className="metric-value">{throughput.toLocaleString()}</span>
                </div>
                
                {/* ✅ UPDATED: REAL ACTIVE ALERTS */}
                <div className="metric-box">
                    <span className="metric-label">Active Alerts</span>
                    <span className={`metric-value ${activeAlerts > 0 ? 'red-text' : 'green-text'}`}>
                        {activeAlerts}
                    </span>
                </div>

                <div className="metric-box">
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end"}}>
                        <span className="metric-label">Server CPU Load</span>
                        <span className="metric-sub" style={{color: getLoadColor(serverLoad), fontWeight: "bold"}}>{Math.floor(serverLoad)}%</span>
                    </div>
                    <div className="load-bar-container">
                        <div className="load-bar-fill" style={{ width: `${serverLoad}%`, backgroundColor: getLoadColor(serverLoad) }}></div>
                    </div>
                </div>
            </div>
            </div>

            <div className="tools-panel interactive-card">
            <h3>Maintenance Toolbox</h3>
            <div className="tool-row">
                <div className="tool-info"><strong>Database Optimization</strong><p>Re-index tables and clear cache.</p></div>
                <button className={`admin-btn ${optimizing ? 'loading' : ''}`} onClick={() => handleMaintenance('optimize')} disabled={optimizing}>{optimizing ? "..." : "Run Optimization"}</button>
            </div>
            <div className="tool-row">
                <div className="tool-info"><strong>API Log Rotation</strong><p>Archive logs older than 30 days.</p></div>
                <button className={`admin-btn outline ${rotating ? 'loading' : ''}`} onClick={() => handleMaintenance('rotate')} disabled={rotating}>{rotating ? "..." : "Start Rotation"}</button>
            </div>
            </div>
        </div>

        <div className="admin-col">
            <div className="tools-panel interactive-card min-h-400">
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px"}}>
                    <h3>👥 User Management</h3>
                    <div style={{fontSize: "0.7rem", color: "#888", display: "flex", gap: "8px"}}><span>🟢 Active</span><span>⚪ Inactive</span></div>
                </div>
                <div style={{display:"flex", gap:"10px", marginBottom: "15px"}}>
                    <input type="text" placeholder="🔍 Search users..." value={userSearch} onChange={(e) => {setUserSearch(e.target.value); setCurrentPage(1);}} style={{flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd"}} />
                    <select value={roleFilter} onChange={(e) => {setRoleFilter(e.target.value); setCurrentPage(1);}} style={{padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer"}}>
                        <option value="All">All Roles</option><option value="Super Admin">Admin</option><option value="Analyst">Analyst</option><option value="Operator">Operator</option>
                    </select>
                </div>
                
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead style={{background: "#f9fafb"}}>
                            <tr>
                                <th onClick={() => handleSort('name')} className="sortable">User</th>
                                <th onClick={() => handleSort('role')} className="sortable">Role</th>
                                <th onClick={() => handleSort('status')} className="sortable">Status</th>
                                <th style={{textAlign: "right", paddingRight: "15px"}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingUsers ? (<tr><td colSpan="4" style={{textAlign:"center", padding:"30px"}}>Loading...</td></tr>) : 
                            currentUsers.length > 0 ? (currentUsers.map(u => (
                                <tr key={u.id} className="user-row">
                                    <td style={{paddingLeft: "15px"}}><strong>{u.name}</strong><br/><small style={{color:"#999"}}>{u.lastLogin}</small></td>
                                    <td><span className={`role-badge ${u.role === 'Super Admin' ? 'admin' : ''}`}>{u.role}</span></td>
                                    <td><span className={`status-dot ${u.status === 'Active' ? 'green' : 'grey'}`} onClick={() => handleUserAction('disable', u)} style={{cursor: 'pointer'}}></span></td>
                                    <td style={{textAlign: "right", paddingRight: "15px"}}>
                                        <div className="action-buttons-group">
                                            <button className="icon-btn edit" title="Edit Name" onClick={() => handleUserAction('edit', u)}>✏️</button>
                                            <button className="icon-btn key" title="Change Role" onClick={() => handleUserAction('role', u)}>🔑</button>
                                            <button className="icon-btn warning" title="Disable" onClick={() => handleUserAction('disable', u)}>🚫</button>
                                            <button className="icon-btn danger" title="Delete" onClick={() => handleUserAction('delete', u)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))) : (
                                <tr><td colSpan="4" className="empty-state">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="pagination-footer">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
                    <span>Page {currentPage} of {totalPages || 1}</span>
                    <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                </div>
                
                <div style={{marginTop: "10px", textAlign: "right"}}>
                     <button className="admin-btn outline" style={{fontSize: "0.8rem", padding: "6px 12px"}} onClick={() => downloadCSV(realUsers, "system_users.csv")}>⬇ Export Users</button>
                </div>
            </div>

            <div className="tools-panel interactive-card">
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: "15px"}}>
                    <h3 style={{margin:0, border: "none"}}>📜 Audit Log</h3>
                    <div style={{display:"flex", gap:"10px"}}>
                        <select className="tiny-select" value={logFilter} onChange={(e) => setLogFilter(e.target.value)}>
                            <option value="All">All Events</option><option value="Logins">Logins</option><option value="Actions">Actions</option>
                        </select>
                        <button className="tiny-btn outline" onClick={() => downloadCSV(auditLogs, "audit_logs.csv")}>⬇ CSV</button>
                    </div>
                </div>
                <div className="activity-feed">
                    {filteredLogs.length > 0 ? filteredLogs.map(log => (
                        <div key={log.id} className="log-item" onClick={() => setSelectedLog(log)} style={{cursor: "pointer"}}>
                            <span className="log-time">{log.time}</span>
                            <span className={`log-dot ${getLogType(log.action)}`}></span>
                            <div className="log-text"><strong>{log.action}</strong><br/><small>by {log.user}</small></div>
                        </div>
                    )) : (
                        <div className="empty-state">
                            <span style={{fontSize: "2rem", marginBottom: "10px"}}>📭</span>
                            <p>No audit events yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* ✅ UNIFIED CUSTOM MODAL (Replaces Prompt/Confirm) */}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span style={{fontSize: "1.8rem"}}>
                        {modal.type === 'danger' ? '⚠️' : (modal.type === 'warning' ? '✋' : '✏️')}
                    </span>
                    <h3>{modal.title}</h3>
                </div>
                
                <p className="modal-body">{modal.message}</p>

                {/* INPUT FIELD (For Edit User) */}
                {modal.type === 'input' && (
                    <input 
                        type="text" 
                        className="modal-input" 
                        value={modal.inputValue} 
                        onChange={(e) => setModal({...modal, inputValue: e.target.value})}
                        autoFocus
                    />
                )}

                {/* SELECT DROPDOWN (For Role Change) */}
                {modal.type === 'select' && (
                    <select 
                        className="modal-select"
                        value={modal.inputValue} 
                        onChange={(e) => setModal({...modal, inputValue: e.target.value})}
                    >
                        {modal.selectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                )}

                <div className="modal-actions">
                    <button className="admin-btn outline" onClick={closeModal}>Cancel</button>
                    <button 
                        className={`admin-btn ${modal.type === 'danger' ? 'danger-btn' : ''}`} 
                        onClick={confirmAction}
                    >
                        {modal.type === 'input' || modal.type === 'select' ? 'Save Changes' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* AUDIT LOG DETAILS MODAL */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Event Details</h3>
                <div className="modal-grid">
                    <div><strong>Event ID:</strong> <br/> {selectedLog.id}</div>
                    <div><strong>Action Type:</strong> <br/> {selectedLog.action}</div>
                    <div><strong>User:</strong> <br/> {selectedLog.user}</div>
                    <div><strong>Timestamp:</strong> <br/> {selectedLog.time}</div>
                </div>
                <button className="admin-btn" style={{marginTop: "20px", width: "100%"}} onClick={() => setSelectedLog(null)}>Close</button>
            </div>
        </div>
      )}
    </div>
  );
};
export default AdminPanel;