// ── Inicialización ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('clienteSeleccionado').addEventListener('change', (e) => {
    const inputNuevo = document.getElementById('clienteNuevo');
    if (e.target.value === 'Nuevo') {
      inputNuevo.style.display = 'block';
    } else {
      inputNuevo.style.display = 'none';
      inputNuevo.value = '';
    }
  });

  loadScripts();
  loadClientes();
  agregarArea();
});
