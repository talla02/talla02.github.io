// ============================================================
// EAT IT — Panier & commande WhatsApp (page Menu)
// ============================================================
const CART_STORAGE_KEY = 'eatit_cart_v1';
const WHATSAPP_NUMBER = '221771050009'; // Numéro Eat It Keur Massar

// Gestion des fenêtres modales des catégories
function openCategoryModal(slug) {
    const modal = document.getElementById('modal-' + slug);
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

function closeCategoryModal(slug) {
    const modal = document.getElementById('modal-' + slug);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

// Charge le panier depuis le stockage local du navigateur
function loadCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

// Sauvegarde le panier dans le stockage local
function saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) { /* Fonctionne en mémoire seule si le stockage est désactivé */ }
}

let cart = loadCart();

// Ajout, mise à jour ou retrait d'éléments dans le panier
function cartChange(itemId, delta, price, name) {
    const existing = cart[itemId];
    if (!existing && delta > 0) {
        cart[itemId] = { name: name, price: price, qty: 1 };
    } else if (existing) {
        existing.qty += delta;
        if (existing.qty <= 0) {
            delete cart[itemId];
        }
    }
    saveCart();
    renderCart();
}

// Retrait d'une ligne d'article complète
function cartRemove(itemId) {
    delete cart[itemId];
    saveCart();
    renderCart();
}

function cartTotal() {
    return Object.values(cart).reduce((sum, it) => sum + it.price * it.qty, 0);
}

function cartCount() {
    return Object.values(cart).reduce((sum, it) => sum + it.qty, 0);
}

// Rafraîchissement complet de l'affichage du panier
function renderCart() {
    // Badge numérique sur l'icône de panier flottante
    const count = cartCount();
    const badge = document.getElementById('cart-fab-count');
    if (badge) {
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
    }

    // Met à jour les compteurs de quantité sur chaque élément du menu
    document.querySelectorAll('.cart-qty[id^="qty-"]').forEach(el => {
        const id = el.id.replace('qty-', '');
        el.textContent = cart[id] ? cart[id].qty : 0;
    });

    // Construction du HTML dynamique pour le récapitulatif du panier
    const body = document.getElementById('cart-drawer-body');
    if (!body) return;
    const entries = Object.entries(cart);
    if (entries.length === 0) {
        body.innerHTML = '<div class="cart-drawer-empty">Votre panier est vide.<br>Ajoutez des plats depuis le menu !</div>';
    } else {
        body.innerHTML = entries.map(([id, it]) => `
            <div class="cart-line">
                <div class="cart-line-info">
                    <div class="cart-line-name">${it.name}</div>
                    <div class="cart-line-price">${it.price.toLocaleString('fr-FR')} F l'unité</div>
                </div>
                <div class="cart-line-controls">
                    <button class="cart-btn-minus" onclick="cartChange('${id}', -1)" aria-label="Retirer">−</button>
                    <span class="cart-qty">${it.qty}</span>
                    <button class="cart-btn-plus cart-controls-variant-plus" style="width:28px;height:28px;padding:0;font-size:1rem;" onclick="cartChange('${id}', 1, ${it.price}, '${it.name.replace(/'/g, "\\'")}')" aria-label="Ajouter">+</button>
                    <i class="fa-solid fa-trash cart-line-remove" onclick="cartRemove('${id}')" role="button" aria-label="Supprimer"></i>
                </div>
            </div>
        `).join('');
    }

    // Calcul du prix total final et mise à jour du bouton d'action
    const total = document.getElementById('cart-total-amount');
    if (total) total.textContent = cartTotal().toLocaleString('fr-FR') + ' F';
    const btn = document.getElementById('cart-order-btn');
    if (btn) btn.disabled = entries.length === 0;
}

function openCartDrawer() {
    document.getElementById('cart-drawer').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeCartDrawer() {
    document.getElementById('cart-drawer').classList.remove('active');
    document.body.classList.remove('modal-open');
}

// Coordonnées GPS partagées par le client pour la livraison (réinitialisées à chaque commande)
let deliveryLocation = null;

// Ouverture de la fenêtre de choix Livraison / À emporter
function openDeliveryModal() {
    const entries = Object.entries(cart);
    if (entries.length === 0) return;

    // Toujours revenir à l'étape 1 à l'ouverture
    const stepChoice = document.getElementById('delivery-modal-step-choice');
    const stepAddress = document.getElementById('delivery-modal-step-address');
    if (stepChoice) stepChoice.classList.remove('hidden');
    if (stepAddress) stepAddress.classList.add('hidden');
    resetDeliveryAddressStep();

    const modal = document.getElementById('delivery-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('modal-open');
}

function closeDeliveryModal() {
    const modal = document.getElementById('delivery-modal');
    if (!modal) return;
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Remet à zéro le formulaire d'adresse (champ texte, position GPS, bouton, statut)
function resetDeliveryAddressStep() {
    deliveryLocation = null;
    const input = document.getElementById('delivery-address-input');
    if (input) input.value = '';
    const btn = document.getElementById('delivery-geo-btn');
    if (btn) {
        btn.disabled = false;
        btn.classList.remove('bg-gold', 'text-white');
        btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Partager ma position GPS';
    }
    const statusEl = document.getElementById('delivery-geo-status');
    if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.add('hidden');
    }
}

// Demande la position GPS du client via le navigateur et la conserve pour l'envoi
function shareLocation() {
    const btn = document.getElementById('delivery-geo-btn');
    const statusEl = document.getElementById('delivery-geo-status');

    if (!navigator.geolocation) {
        if (statusEl) {
            statusEl.textContent = "Géolocalisation indisponible sur cet appareil. Indiquez votre adresse ci-dessous.";
            statusEl.className = 'text-xs mb-4 text-red-500';
            statusEl.classList.remove('hidden');
        }
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Localisation en cours...';
    }
    if (statusEl) statusEl.classList.add('hidden');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            deliveryLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            if (btn) {
                btn.disabled = false;
                btn.classList.add('bg-gold', 'text-white');
                btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Position partagée';
            }
            if (statusEl) {
                statusEl.textContent = 'Parfait, votre position exacte sera envoyée avec la commande.';
                statusEl.className = 'text-xs mb-4 text-green-600';
                statusEl.classList.remove('hidden');
            }
        },
        (error) => {
            deliveryLocation = null;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Partager ma position GPS';
            }
            let msg = "Impossible de récupérer votre position. Indiquez votre adresse ci-dessous.";
            if (error.code === error.PERMISSION_DENIED) {
                msg = "Localisation refusée : pas de souci, indiquez simplement votre adresse ci-dessous.";
            }
            if (statusEl) {
                statusEl.textContent = msg;
                statusEl.className = 'text-xs mb-4 text-red-500';
                statusEl.classList.remove('hidden');
            }
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// L'utilisateur choisit son mode de récupération
function chooseDeliveryMode(mode) {
    if (mode === 'pickup') {
        sendOrderWhatsApp('pickup');
        closeDeliveryModal();
    } else {
        // Mode livraison : on demande la position / l'adresse avant d'envoyer
        resetDeliveryAddressStep();
        document.getElementById('delivery-modal-step-choice').classList.add('hidden');
        document.getElementById('delivery-modal-step-address').classList.remove('hidden');
    }
}

// Retour à l'étape de choix depuis le formulaire d'adresse
function backToChoice() {
    document.getElementById('delivery-modal-step-address').classList.add('hidden');
    document.getElementById('delivery-modal-step-choice').classList.remove('hidden');
}

// Confirmation du mode livraison avec la position GPS et/ou l'adresse saisie
function confirmDeliveryOrder() {
    const input = document.getElementById('delivery-address-input');
    const address = input ? input.value.trim() : '';
    const statusEl = document.getElementById('delivery-geo-status');

    if (!address && !deliveryLocation) {
        if (statusEl) {
            statusEl.textContent = 'Merci de partager votre position ou d\'indiquer une adresse avant de continuer.';
            statusEl.className = 'text-xs mb-4 text-red-500';
            statusEl.classList.remove('hidden');
        }
        return;
    }

    sendOrderWhatsApp('delivery', address, deliveryLocation);
    closeDeliveryModal();
}

// Génère le message textuel formaté et l'envoie via l'API WhatsApp
// mode : 'delivery' (livraison) ou 'pickup' (à emporter)
function sendOrderWhatsApp(mode, address, location) {
    const entries = Object.entries(cart);
    if (entries.length === 0) return;

    let message = 'Bonjour Eat It, je souhaite commander :\n\n';

    if (mode === 'delivery') {
        message += `🛵 *LIVRAISON*\n`;
        if (location) {
            message += `📍 Position GPS : https://maps.google.com/?q=${location.lat},${location.lng}\n`;
        }
        if (address) {
            message += `🏠 Adresse / repère : ${address}\n`;
        }
        message += '\n';
    } else if (mode === 'pickup') {
        message += `🏃 *À EMPORTER SUR PLACE*\n\n`;
    }

    entries.forEach(([id, it]) => {
        message += `• ${it.qty} x ${it.name} — ${(it.price * it.qty).toLocaleString('fr-FR')} F\n`;
    });
    message += `\nTotal : ${cartTotal().toLocaleString('fr-FR')} F`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Premier affichage au chargement (synchronisation panier local)
renderCart();