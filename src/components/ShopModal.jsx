import React from 'react';

const SLOT_ITEMS = [
  { slot: 1, label: 'Next Preview 2', price: 1000 },
  { slot: 2, label: 'Next Preview 3', price: 5000 },
  { slot: 3, label: 'Next Preview 4', price: 15000 },
  { slot: 4, label: 'Next Preview 5', price: 40000 },
];

function formatCoins(n) {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return String(n);
}

export default function ShopModal({ coins, purchased, onBuy, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card shop-modal-card" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">Shop</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="shop-coins-row">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="#f59e0b">
            <circle cx="10" cy="10" r="9" />
            <text x="10" y="14.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#1a1a2e">C</text>
          </svg>
          <span className="shop-coins-label">{coins.toLocaleString()} coins</span>
        </div>

        <div className="modal-body shop-body">
          {SLOT_ITEMS.map(({ slot, label, price }) => {
            const owned = purchased.includes(slot);
            const canAfford = coins >= price;
            return (
              <div key={slot} className={`shop-item${owned ? ' shop-item-owned' : ''}`}>
                <div className="shop-item-info">
                  <span className="shop-item-label">{label}</span>
                  {owned
                    ? <span className="shop-item-status owned">Unlocked</span>
                    : <span className="shop-item-status price">
                        <svg viewBox="0 0 20 20" width="11" height="11" fill="#f59e0b" style={{ marginRight: 3, verticalAlign: 'middle' }}>
                          <circle cx="10" cy="10" r="9" />
                          <text x="10" y="14.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#1a1a2e">C</text>
                        </svg>
                        {formatCoins(price)}
                      </span>
                  }
                </div>
                <button
                  className={`shop-buy-btn${owned ? ' owned' : canAfford ? ' can-afford' : ' cant-afford'}`}
                  disabled={owned || !canAfford}
                  onClick={() => !owned && canAfford && onBuy(slot, price)}
                >
                  {owned ? 'Owned' : canAfford ? 'Buy' : 'Need more'}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
