import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>Halaman Tidak Ditemukan</h2>
      <p>Rute yang Anda cari tidak ada (404).</p>
      <button
        onClick={() => navigate('/liquidity')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Kembali ke Liquidity
      </button>
    </div>
  );
}

export default NotFound;