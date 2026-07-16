// ============================================================
// EAT IT — Script commun à toutes les pages
// ============================================================

// Animations au défilement (AOS)
if (typeof AOS !== 'undefined') {
    AOS.init({
        duration: 1000,
        once: true,
        easing: 'ease-out-quad'
    });
}

// Menu de navigation mobile (hamburger)
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('mobile-menu-icon');
    if (!menu) return;
    menu.classList.toggle('open');
    if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
    }
}

// Touche Échap : ferme les fenêtres actives (modales, panier, menu mobile)
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.menu-modal.active').forEach(m => m.classList.remove('active'));
    const drawer = document.getElementById('cart-drawer');
    if (drawer) drawer.classList.remove('active');
    const deliveryModal = document.getElementById('delivery-modal');
    if (deliveryModal) {
        deliveryModal.classList.remove('flex');
        deliveryModal.classList.add('hidden');
    }
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.remove('open');
    document.body.classList.remove('modal-open');
});