import { usePermission } from "../hooks/usePermission";
import { useState } from 'react';
import { Plus, Search, AlertTriangle, X, Package } from 'lucide-react';
import { PARTS } from '../data/mockData';
import { useToast } from '../context/ToastContext';

function StockBadge({ qty, reorder }) {
  if (qty === 0)        return <span className="badge badge-cancelled">Out of Stock</span>;
  if (qty <= reorder)   return <span className="badge badge-low-stock">Low Stock</span>;
  return <span className="badge badge-completed">In Stock</span>;
}

function AddPartModal({ onClose, onSave }) {
  const [partNo,   setPartNo]   = useState('');
  const [name,     setName]     = useState('');
  const [category, setCategory] = useState('Oils & Fluids');
  const [unit,     setUnit]     = useState('pcs');
  const [cost,     setCost]     = useState('');
  const [price,    setPrice]    = useState('');
  const [stock,    setStock]    = useState('');
  const [reorder,  setReorder]  = useState('5');
  const [supplier, setSupplier] = useState('');
  const [location, setLocation] = useState('');
  const [desc,     setDesc]     = useState('');
  const toast = useToast();

  const handleSave = () => {
    if (!name.trim() || !cost || !price) {
      toast.warning('Required Fields', 'Part Name, Cost Price and Selling Price are required.');
      return;
    }
    onSave({
      id: `PART-${Math.floor(10000 + Math.random() * 90000)}`,
      partNo: partNo.trim() || `P-${Date.now()}`,
      name: name.trim(),
      category,
      unit,
      cost: Number(cost),
      price: Number(price),
      stock: Number(stock) || 0,
      reorder: Number(reorder) || 5,
      supplier: supplier.trim() || '—',
      location: location.trim() || '—',
      desc: desc.trim() || '',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <span className="modal-title">Add New Part</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Part Number</label>
              <input className="form-control" placeholder="e.g. OIL-5W30-4L" value={partNo} onChange={e => setPartNo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Part Name <span>*</span></label>
              <input className="form-control" placeholder="Descriptive name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                <option>Oils & Fluids</option><option>Filters</option>
                <option>Brakes</option><option>AC & Cooling</option>
                <option>Engine</option><option>Exterior</option><option>Tyres</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-control" value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="pcs">pcs</option><option value="pair">pair</option>
                <option value="set">set</option><option value="litre">litre</option>
                <option value="bottle">bottle</option><option value="can">can</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cost Price (Rs.) <span>*</span></label>
              <input type="number" className="form-control" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (Rs.) <span>*</span></label>
              <input type="number" className="form-control" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Opening Stock</label>
              <input type="number" className="form-control" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Reorder Level</label>
              <input type="number" className="form-control" placeholder="5" value={reorder} onChange={e => setReorder(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <input className="form-control" placeholder="Supplier name" value={supplier} onChange={e => setSupplier(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Storage Location</label>
              <input className="form-control" placeholder="e.g. Shelf A-3" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" placeholder="Optional description…" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Plus size={15} /> Add Part
          </button>
        </div>
      </div>
    </div>
  );
}

function AdjustStockModal({ part, onClose, onAdjust }) {
  const [txType,  setTxType]  = useState('purchase');
  const [qty,     setQty]     = useState('');
  const [cost,    setCost]    = useState(String(part.cost));
  const [notes,   setNotes]   = useState('');
  const toast = useToast();

  const handleSave = () => {
    const n = Number(qty);
    if (!n || n <= 0) { toast.warning('Invalid Qty', 'Enter a positive quantity.'); return; }
    const delta = txType === 'purchase' || txType === 'return' ? n : -n;
    onAdjust(part.id, delta, txType, notes);
    toast.success('Stock Updated', `${part.name}: ${delta > 0 ? '+' : ''}${delta} ${part.unit} (${txType.replace('_',' ')})`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <span className="modal-title">Adjust Stock — {part.name}</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <Package size={14} />
            Current stock: <strong>{part.stock} {part.unit}</strong>
          </div>
          <div className="form-group">
            <label className="form-label">Transaction Type <span>*</span></label>
            <select className="form-control" value={txType} onChange={e => setTxType(e.target.value)}>
              <option value="purchase">Purchase (Stock In)</option>
              <option value="adjustment">Manual Adjustment (Stock In)</option>
              <option value="return">Return from Job (Stock In)</option>
              <option value="issue">Issue to Job (Stock Out)</option>
              <option value="write_off">Write Off / Damage (Stock Out)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity <span>*</span></label>
            <input type="number" className="form-control" placeholder={`Enter quantity in ${part.unit}`} value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Unit Cost (Rs.)</label>
            <input type="number" className="form-control" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-control" placeholder="Reason or reference…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Transaction</button>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { canWrite, canDelete } = usePermission("inventory");
  const toast = useToast();

  const [parts, setParts] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('autolab_inventory') || '[]');
      return stored.length > 0 ? stored : PARTS;
    } catch { return PARTS; }
  });

  const [search,     setSearch]     = useState('');
  const [tab,        setTab]        = useState('all');
  const [showAdd,    setShowAdd]    = useState(false);
  const [adjustPart, setAdjustPart] = useState(null);

  const saveParts = (updated) => {
    setParts(updated);
    try { localStorage.setItem('autolab_inventory', JSON.stringify(updated)); } catch (e) {}
  };

  const handleAddPart = (newPart) => {
    saveParts([newPart, ...parts]);
    toast.success('Part Added', `${newPart.name} added to inventory.`);
  };

  const handleAdjustStock = (partId, delta) => {
    saveParts(parts.map(p => p.id === partId
      ? { ...p, stock: Math.max(0, p.stock + delta) }
      : p
    ));
  };

  const lowStockParts = parts.filter(p => p.stock <= p.reorder);

  const filtered = parts.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.partNo.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'all' || (tab === 'low_stock' && p.stock <= p.reorder);
    return matchSearch && matchTab;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-heading">Inventory &amp; Parts</div>
          <div className="page-subheading">
            {parts.length} parts · {lowStockParts.length} low/out of stock
          </div>
        </div>
        <div className="page-actions">
          {canWrite && (<button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Part
          </button>)}
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockParts.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>{lowStockParts.length} parts need reorder:</strong>{' '}
            {lowStockParts.map(p => p.name).join(', ')}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Parts',   value: parts.length,                                    color: 'var(--brand-primary)' },
          { label: 'In Stock',      value: parts.filter(p=>p.stock>p.reorder).length,       color: 'var(--brand-success)' },
          { label: 'Low / Reorder', value: parts.filter(p=>p.stock<=p.reorder&&p.stock>0).length, color: 'var(--brand-warning)' },
          { label: 'Out of Stock',  value: parts.filter(p=>p.stock===0).length,             color: 'var(--brand-danger)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input
              style={{ width: '100%' }}
              placeholder="Search part name, number, category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab${tab==='all'?' active':''}`} onClick={()=>setTab('all')}>All Parts</button>
            <button className={`tab${tab==='low_stock'?' active':''}`} onClick={()=>setTab('low_stock')}>
              Low Stock {lowStockParts.length > 0 && `(${lowStockParts.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Parts Table */}
      <div className="card desktop-table-view">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Part No.</th><th>Name</th><th>Category</th>
                <th>Stock</th><th>Reorder</th><th>Unit</th>
                <th>Cost</th><th>Sell Price</th><th>Supplier</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>No parts match your filter.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td><span className="mono">{p.partNo}</span></td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td className="muted">{p.category}</td>
                  <td style={{ fontWeight: 700, color: p.stock === 0 ? 'var(--brand-danger)' : p.stock <= p.reorder ? 'var(--brand-warning)' : 'var(--text-primary)' }}>
                    {p.stock}
                  </td>
                  <td className="muted">{p.reorder}</td>
                  <td className="muted">{p.unit}</td>
                  <td className="muted">Rs. {p.cost}</td>
                  <td style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>Rs. {p.price}</td>
                  <td className="muted">{p.supplier}</td>
                  <td><StockBadge qty={p.stock} reorder={p.reorder} /></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => setAdjustPart(p)}>
                      Stock In/Out
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Stack (< 768px Viewports) */}
      <div className="mobile-card-stack">
        {filtered.length === 0 ? (
          <div className="card empty-state" style={{ padding: 24, textAlign: 'center' }}>
            <Package size={36} className="empty-icon" style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
            <div className="empty-title">No parts found</div>
            <div className="empty-desc">Try adjusting your filter or search query</div>
          </div>
        ) : (
          filtered.map(p => {
            const isLow = p.stock <= p.reorder;
            const isOut = p.stock === 0;
            return (
              <div key={p.id} className="mobile-data-card">
                <div className="mobile-card-header">
                  <div>
                    <div className="mobile-card-title">{p.name}</div>
                    <div className="mobile-card-subtitle flex items-center gap-2">
                      <span className="mono" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                        {p.partNo}
                      </span>
                      <span>&middot;</span>
                      <span>{p.category}</span>
                    </div>
                  </div>
                  <StockBadge qty={p.stock} reorder={p.reorder} />
                </div>

                <div className="mobile-card-row">
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block' }}>IN STOCK</span>
                    <span style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: isOut ? 'var(--brand-danger)' : isLow ? 'var(--brand-warning)' : 'var(--text-primary)'
                    }}>
                      {p.stock} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{p.unit}</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                      (Min: {p.reorder})
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block' }}>SELL PRICE</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-primary)' }}>
                      Rs. {p.price}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                      Cost: Rs. {p.cost}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 4 }}>
                  Supplier: <strong style={{ color: 'var(--text-secondary)' }}>{p.supplier}</strong>
                  {p.location && ` · Shelf: ${p.location}`}
                </div>

                <div className="mobile-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setAdjustPart(p)}
                  >
                    <Package size={14} /> Adjust Stock (In / Out)
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAdd    && <AddPartModal onClose={() => setShowAdd(false)} onSave={handleAddPart} />}
      {adjustPart && <AdjustStockModal part={adjustPart} onClose={() => setAdjustPart(null)} onAdjust={handleAdjustStock} />}
    </div>
  );
}
