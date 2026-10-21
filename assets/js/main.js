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

  // Close navigation dropdown (<details class="site-nav__details">) when clicking outside, clicking an option, or pressing Escape
  const navDetailsList = document.querySelectorAll('.site-nav__details');
  if (navDetailsList.length > 0) {
    document.addEventListener('click', function (event) {
      navDetailsList.forEach(function (details) {
        if (details.open && !details.contains(event.target)) {
          details.open = false;
        }
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        navDetailsList.forEach(function (details) {
          if (details.open) {
            details.open = false;
            const summary = details.querySelector('summary');
            if (summary) summary.focus();
          }
        });
      }
    });

    navDetailsList.forEach(function (details) {
      details.addEventListener('click', function (event) {
        if (event.target.closest('a')) {
          details.open = false;
        }
      });
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

  /* ==========================================================================
     UNREAD MESSAGE NAVIGATION INDICATOR & POPUP MODAL
     ========================================================================== */
  const messageModal = document.getElementById('message-modal');
  const activeMessageId = messageModal
    ? (messageModal.getAttribute('data-message-id') || 'msg-sunday-time-change-20261021')
    : 'msg-sunday-time-change-20261021';
  const modalSeenKey = 'lot_modal_seen_' + activeMessageId;
  const messagesVisitedKey = 'lot_messages_visited_' + activeMessageId;
  const legacyDismissedKey = 'lot_dismissed_msg_' + activeMessageId;

  const isMessageBoardPage = window.location.pathname.indexOf('message-board') !== -1 ||
                             window.location.pathname.indexOf('messages') !== -1;

  // When visiting the message board, mark messages as read and modal as seen
  if (isMessageBoardPage) {
    try {
      localStorage.setItem(messagesVisitedKey, 'true');
      localStorage.setItem(modalSeenKey, 'true');
    } catch (e) {}
  }

  function updateNavMessageIndicators() {
    let hasVisited = false;
    try {
      hasVisited = localStorage.getItem(messagesVisitedKey) === 'true';
    } catch (e) {}

    const indicators = document.querySelectorAll('.nav-message-indicator');
    indicators.forEach(function (ind) {
      ind.hidden = hasVisited;
    });
  }

  // Update indicators across header and navigation
  updateNavMessageIndicators();

  if (messageModal) {
    let hasSeenModal = false;
    try {
      hasSeenModal = localStorage.getItem(modalSeenKey) === 'true' ||
                     localStorage.getItem(legacyDismissedKey) === 'true';
    } catch (e) {
      // Storage may be unavailable in private browsing
    }

    // Modal pops up only once across the entire site
    if (!isMessageBoardPage && !hasSeenModal && typeof messageModal.showModal === 'function') {
      // Mark as seen immediately so reloads or navigating will never pop it up again
      try {
        localStorage.setItem(modalSeenKey, 'true');
      } catch (e) {}

      // Short delay after load so page paints smoothly
      setTimeout(function () {
        if (!messageModal.open) {
          try {
            messageModal.showModal();
          } catch (err) {
            // Browser policy handling
          }
        }
      }, 600);
    }

    // Modal "Close" button
    const closeBtn = document.getElementById('message-modal-close-btn') ||
                     document.getElementById('message-modal-dont-show');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        messageModal.close();
      });
    }

    // Ensure closing via any method (Escape, backdrop, form submit, button) marks modal as seen
    messageModal.addEventListener('close', function () {
      try {
        localStorage.setItem(modalSeenKey, 'true');
      } catch (e) {}
    });

    // "Go to Messages" button / link
    const readBtn = messageModal.querySelector('.message-modal__read-btn');
    if (readBtn) {
      readBtn.addEventListener('click', function () {
        messageModal.close();
      });
    }

    // Light-dismiss fallback for browsers without native <dialog closedby>
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      messageModal.addEventListener('click', function (event) {
        if (event.target !== messageModal) return;
        const rect = messageModal.getBoundingClientRect();
        const isInside = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isInside) {
          messageModal.close();
        }
      });
    }
  }

  /* ==========================================================================
     MESSAGE BOARD FILTERING & ANCHOR HIGHLIGHTING
     ========================================================================== */
  const messageFilters = document.querySelectorAll('.message-filter-btn');
  const messageCards = document.querySelectorAll('.message-card');

  if (messageFilters.length > 0 && messageCards.length > 0) {
    messageFilters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filter = btn.getAttribute('data-filter');

        messageFilters.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');

        messageCards.forEach(function (card) {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = '';
            card.classList.add('animate-fade-in');
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Highlight card when targeted via URL hash (e.g. #msg-sunday-time-change)
  function highlightTargetMessage() {
    if (!window.location.hash) return;
    try {
      const targetCard = document.querySelector(window.location.hash);
      if (targetCard && targetCard.classList.contains('message-card')) {
        targetCard.classList.add('is-highlighted');
        const rect = targetCard.getBoundingClientRect();
        // Only scroll if the card is not already visible near the top
        if (rect.top > 350 || rect.top < 0) {
          setTimeout(function () {
            targetCard.scrollIntoView({
              behavior: reducedMotion.matches ? 'auto' : 'smooth',
              block: 'start'
            });
          }, 150);
        }
        setTimeout(function () {
          targetCard.classList.remove('is-highlighted');
        }, 4000);
      }
    } catch (e) {}
  }

  if (window.location.hash) {
    highlightTargetMessage();
  }
  window.addEventListener('hashchange', highlightTargetMessage);


  // Prevent clicking links inside checkbox labels from toggling the checkbox
  document.querySelectorAll('.application__check a').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.stopPropagation();
    });
  });

  // Application form handling for Google Apps Script backend
  const applicationForm = document.getElementById('applicationForm');
  if (applicationForm) {
    const submitBtn = applicationForm.querySelector('.application__submit');
    const statusMsg = document.getElementById('application-status');

    applicationForm.addEventListener('submit', async function (event) {
      const scriptUrl = applicationForm.getAttribute('action');

      // Check if URL is configured or still placeholder
      if (!scriptUrl || scriptUrl.indexOf('YOUR_APPS_SCRIPT_WEB_APP_URL') !== -1) {
        event.preventDefault();
        if (statusMsg) {
          statusMsg.hidden = false;
          statusMsg.className = 'application__status application__status--error';
          statusMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> The application backend is being configured. Please email your details directly to <a href="mailto:leeontrack5@gmail.com" style="color: inherit; text-decoration: underline; font-weight: 700;">leeontrack5@gmail.com</a>.';
          statusMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      // If pointing to Google Apps Script, handle asynchronously with fetch
      if (scriptUrl.indexOf('script.google.com') !== -1) {
        event.preventDefault();

        if (!applicationForm.checkValidity()) {
          applicationForm.reportValidity();
          return;
        }

        // Fast client-side honeypot trap check
        const trapField = applicationForm.querySelector('[name="league_ref"]');
        if (trapField && trapField.value.trim() !== '') {
          window.location.href = 'thank-you.html';
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Submitting Application... <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
        }
        if (statusMsg) {
          statusMsg.hidden = true;
        }

        try {
          const formData = new FormData(applicationForm);
          const params = new URLSearchParams();
          for (const [key, value] of formData.entries()) {
            params.append(key, value);
          }

          // Ensure active membership policy confirmation is explicitly included in payload
          const activePolicyCheckbox = applicationForm.querySelector('[name="Active Membership Policy"], #activeMembershipPolicy');
          if (activePolicyCheckbox && activePolicyCheckbox.checked) {
            if (!params.has('Active Membership Policy')) {
              params.append('Active Membership Policy', 'on');
            }
            if (!params.has('activeMembershipPolicy')) {
              params.append('activeMembershipPolicy', 'on');
            }
          }

          // Use mode: 'no-cors' so Google's 302 redirect doesn't trigger a browser CORS block
          await fetch(scriptUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: params.toString(),
            mode: 'no-cors'
          });

          // Redirect to thank-you page on completed submission
          window.location.href = 'thank-you.html';
        } catch (err) {
          console.error('Submission failed:', err);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'SUBMIT APPLICATION <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>';
          }
          if (statusMsg) {
            statusMsg.hidden = false;
            statusMsg.className = 'application__status application__status--error';
            statusMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> Something went wrong submitting your application. Please check your connection or email your details directly to <a href="mailto:leeontrack5@gmail.com" style="color: inherit; text-decoration: underline; font-weight: 700;">leeontrack5@gmail.com</a>.';
            statusMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    });
  }

  // Policy acknowledgement form handling for current members
  const policyAckForm = document.getElementById('policyAckForm');
  if (policyAckForm) {
    const submitBtn = policyAckForm.querySelector('#submitBtn') || policyAckForm.querySelector('.application__submit');
    const statusMsg = document.getElementById('acknowledgement-status');
    const successCard = document.getElementById('acknowledgementSuccess');
    const confirmedDriverSpan = document.getElementById('confirmedDriverName');

    policyAckForm.addEventListener('submit', async function (event) {
      const scriptUrl = policyAckForm.getAttribute('action');

      if (!scriptUrl || scriptUrl.indexOf('YOUR_APPS_SCRIPT_WEB_APP_URL') !== -1) {
        event.preventDefault();
        if (statusMsg) {
          statusMsg.hidden = false;
          statusMsg.className = 'application__status application__status--error';
          statusMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> The acknowledgement backend is being configured. Please confirm directly to <a href="mailto:leeontrack5@gmail.com" style="color: inherit; text-decoration: underline; font-weight: 700;">leeontrack5@gmail.com</a>.';
          statusMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      if (scriptUrl.indexOf('script.google.com') !== -1) {
        event.preventDefault();

        if (!policyAckForm.checkValidity()) {
          policyAckForm.reportValidity();
          return;
        }

        const trapField = policyAckForm.querySelector('[name="league_ref"]');
        if (trapField && trapField.value.trim() !== '') {
          policyAckForm.style.display = 'none';
          if (successCard) successCard.style.display = 'block';
          return;
        }

        const driverNameInput = policyAckForm.querySelector('#driverName');
        const driverName = driverNameInput ? driverNameInput.value.trim() : 'Driver';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Recording Confirmation... <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
        }
        if (statusMsg) {
          statusMsg.hidden = true;
        }

        try {
          const formData = new FormData(policyAckForm);
          const params = new URLSearchParams();
          for (const [key, value] of formData.entries()) {
            params.append(key, value);
          }

          // Ensure policy confirmation is explicitly present
          if (!params.has('Active Membership Policy')) {
            params.append('Active Membership Policy', 'on');
          }

          await fetch(scriptUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: params.toString(),
            mode: 'no-cors'
          });

          // Show immediate in-place confirmation
          policyAckForm.style.display = 'none';
          if (confirmedDriverSpan) {
            confirmedDriverSpan.textContent = driverName;
          }
          if (successCard) {
            successCard.style.display = 'block';
            successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } catch (err) {
          console.error('Acknowledgement failed:', err);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'CONFIRM POLICY ACCEPTANCE <i class="fa-solid fa-check" aria-hidden="true"></i>';
          }
          if (statusMsg) {
            statusMsg.hidden = false;
            statusMsg.className = 'application__status application__status--error';
            statusMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> Something went wrong recording your acknowledgement. Please check your connection or contact Lee and Naven directly.';
            statusMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    });
  }

})();
