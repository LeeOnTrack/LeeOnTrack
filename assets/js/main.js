(function () {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  const header = document.querySelector('.site-header');
  const scrollTop = document.querySelector('.scroll-top');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setMenu(open) {
    if (!toggle || !menu) {
      return;
    }
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open.toString());
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');

    if (open) {
      const firstLink = menu.querySelector('a');
      if (firstLink) {
        firstLink.focus({ preventScroll: true });
      }
    } else {
      toggle.focus({ preventScroll: true });
    }
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const isOpen = menu.classList.contains('is-open');
      setMenu(!isOpen);
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        setMenu(false);
      }
    });

    menu.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setMenu(false);
      }
    });
  }

  let ticking = false;

  function onScroll() {
    if (ticking) {
      return;
    }
    window.requestAnimationFrame(function () {
      const scrollY = window.scrollY;

      if (header) {
        header.classList.toggle('is-scrolled', scrollY > 50);
      }

      if (scrollTop) {
        scrollTop.classList.toggle('is-visible', scrollY > 400);
      }

      ticking = false;
    });
    ticking = true;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  if (scrollTop) {
    scrollTop.addEventListener('click', function () {
      const behavior = reducedMotion.matches ? 'auto' : 'smooth';
      window.scrollTo({ top: 0, behavior: behavior });
    });
  }

  const galleryCards = document.querySelectorAll('.gallery__card');
  const galleryModal = document.getElementById('gallery-modal');

  if (galleryModal && galleryCards.length) {
    const modalImage = galleryModal.querySelector('.gallery-modal__image');
    const modalTitle = galleryModal.querySelector('.gallery-modal__title');
    const modalDesc = galleryModal.querySelector('.gallery-modal__desc');

    galleryCards.forEach(function (card) {
      card.addEventListener('click', function () {
        if (modalImage) {
          modalImage.src = card.dataset.src || '';
          modalImage.alt = card.dataset.title || '';
        }
        if (modalTitle) modalTitle.textContent = card.dataset.title || '';
        if (modalDesc) modalDesc.textContent = card.dataset.desc || '';
        galleryModal.showModal();
      });
    });

    galleryModal.addEventListener('click', function (event) {
      const rect = galleryModal.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        galleryModal.close();
      }
    });
  }

  const consentBanner = document.getElementById('consent-banner');
  const consentKey = 'lot-consent';
  let consent = null;

  function applyConsent(choice) {
    document.querySelectorAll('[data-consent="analytics"]').forEach(function (el) {
      if (choice === 'accept') {
        if (el.dataset.src) {
          el.src = el.dataset.src;
          el.removeAttribute('data-src');
        }
        if (el.dataset.href) {
          el.href = el.dataset.href;
          el.removeAttribute('data-href');
        }
        if (el.type === 'text/plain') {
          el.type = 'text/javascript';
        }
      }
      el.hidden = choice !== 'accept';
    });
  }

  try {
    consent = localStorage.getItem(consentKey);
  } catch (e) {
    consent = null;
  }

  if (consent) {
    applyConsent(consent);
  }

  if (consentBanner) {
    if (!consent) {
      consentBanner.hidden = false;
      window.setTimeout(function () {
        consentBanner.classList.add('is-visible');
      }, 50);
    }

    consentBanner.addEventListener('click', function (event) {
      const button = event.target.closest('[data-consent]');
      if (!button) {
        return;
      }
      const choice = button.dataset.consent;
      try {
        localStorage.setItem(consentKey, choice);
      } catch (e) {
        // Storage may be unavailable in private browsing.
      }
      applyConsent(choice);
      consentBanner.classList.remove('is-visible');
      window.setTimeout(function () {
        consentBanner.hidden = true;
      }, 250);
    });
  }

  // Single-open accordion groups: opening one item closes the rest.
  document.querySelectorAll('.accordion--single').forEach(function (group) {
    group.addEventListener('toggle', function (event) {
      const item = event.target;
      if (item.tagName !== 'DETAILS' || !item.open) {
        return;
      }
      group.querySelectorAll('details').forEach(function (other) {
        if (other !== item) {
          other.open = false;
        }
      });
    }, true);
  });

  // Gallery: collapsible accordion on mobile/tablet, always open on desktop.
  const galleryAccordion = document.getElementById('gallery-accordion');
  if (galleryAccordion) {
    const galleryDesktop = window.matchMedia('(min-width: 64rem)');
    function syncGalleryAccordion() {
      galleryAccordion.open = galleryDesktop.matches;
    }
    galleryDesktop.addEventListener('change', syncGalleryAccordion);
    syncGalleryAccordion();
  }

  function openHashDetails() {
    if (!location.hash) {
      return;
    }
    const target = document.getElementById(location.hash.slice(1));
    if (target && target.tagName === 'DETAILS') {
      target.open = true;
    }
  }

  window.addEventListener('hashchange', openHashDetails);
  openHashDetails();

  // Week links open the accordion and scroll to it without adding a
  // hash to the URL, so a page refresh starts with all weeks closed.
  document.querySelectorAll('.results-nav a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) {
        return;
      }
      event.preventDefault();
      if (target.tagName === 'DETAILS') {
        target.open = true;
      }
      target.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });

  const promoModal = document.getElementById('promo-modal');
  const promoKey = 'lot-promo-seen';
  // Set to true to show the promo modal on a visitor's first visit.
  const promoEnabled = false;

  if (promoModal) {
    try {
      const hasSeen = localStorage.getItem(promoKey);
      if (promoEnabled && !hasSeen) {
        promoModal.showModal();
      }
    } catch (e) {
      // Storage may be unavailable in private browsing.
    }

    promoModal.addEventListener('click', function (event) {
      if (event.target === promoModal) {
        promoModal.close();
      }
    });

    promoModal.addEventListener('close', function () {
      try {
        localStorage.setItem(promoKey, '1');
      } catch (e) {
        // Storage may be unavailable in private browsing.
      }
    });
  }
})();
