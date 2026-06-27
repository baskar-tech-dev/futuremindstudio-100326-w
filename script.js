document.addEventListener('DOMContentLoaded', () => {
  // Enable premium CSS-based scroll reveal triggers safely
  document.body.classList.add('js-enabled');
  
  /* ==========================================================================
     1. CUSTOM INTERACTIVE CURSOR WITH LERP LAGGING
     ========================================================================== */
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  const lerpFactor = 0.15; // Smoothness factor for outer ring tracking

  // Update mouse position coordinates on move
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Position dot immediately
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
    
    // Set custom properties for hover effects (e.g. text attachment positioning)
    document.body.style.setProperty('--mouse-x', `${mouseX}px`);
    document.body.style.setProperty('--mouse-y', `${mouseY}px`);
  });

  // Map touch coordinates to mouseX and mouseY for mobile interactions
  const handleTouch = (e) => {
    if (e.touches && e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
      
      document.body.style.setProperty('--mouse-x', `${mouseX}px`);
      document.body.style.setProperty('--mouse-y', `${mouseY}px`);
    }
  };
  document.addEventListener('touchstart', handleTouch, { passive: true });
  document.addEventListener('touchmove', handleTouch, { passive: true });

  let activeMagnetic = null;

  // Smoothly interpolate the outer cursor ring position
  function updateCursor() {
    let targetX = mouseX;
    let targetY = mouseY;

    if (activeMagnetic) {
      document.body.classList.add('hover-magnetic');
      const rect = activeMagnetic.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
      
      const style = window.getComputedStyle(activeMagnetic);
      cursorRing.style.width = `${rect.width + 16}px`;
      cursorRing.style.height = `${rect.height + 16}px`;
      cursorRing.style.borderRadius = style.borderRadius;
    } else {
      document.body.classList.remove('hover-magnetic');
      cursorRing.style.width = '';
      cursorRing.style.height = '';
      cursorRing.style.borderRadius = '';
    }

    ringX += (targetX - ringX) * lerpFactor;
    ringY += (targetY - ringY) * lerpFactor;
    
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
    
    if (typeof updateCardPhysics === 'function') {
      updateCardPhysics();
    }
    
    requestAnimationFrame(updateCursor);
  }
  requestAnimationFrame(updateCursor);

  // Add hover state classes and magnetic pull for interactive elements
  const setupHoverEffects = () => {
    const clickables = document.querySelectorAll('a, button, .play-button, .tag-btn, .overlay-close');
    clickables.forEach(el => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('hover-clickable');
        activeMagnetic = el;
      });
      
      el.addEventListener('mousemove', (e) => {
        if (activeMagnetic === el) {
          const rect = el.getBoundingClientRect();
          const elCenterX = rect.left + rect.width / 2;
          const elCenterY = rect.top + rect.height / 2;
          const deltaX = e.clientX - elCenterX;
          const deltaY = e.clientY - elCenterY;
          
          // Gentle magnetic pull on the actual button/link element (max translation)
          const pullX = deltaX * 0.22;
          const pullY = deltaY * 0.22;
          el.style.transform = `translate(${pullX}px, ${pullY}px)`;
        }
      });

      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('hover-clickable');
        el.style.transform = '';
        if (activeMagnetic === el) {
          activeMagnetic = null;
        }
      });
    });

    const draggables = document.querySelectorAll('.hover-draggable');
    draggables.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('hover-draggable'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('hover-draggable'));
    });
  };
  setupHoverEffects();


  /* ==========================================================================
     2. PREMIUM 3D LERP PHYSICS FOR FLOATING CARDS
     ========================================================================== */
  const cardElements = document.querySelectorAll('.floating-card');
  const cardPhysics = [];

  const weights = [
    { x: 18, y: 12 },   // cardBranding
    { x: -22, y: 16 },  // cardWebdesign
    { x: 14, y: -18 },  // cardStrategy
    { x: -16, y: -12 }  // cardContent
  ];

  cardElements.forEach((el, index) => {
    const weight = weights[index] || { x: 15, y: 15 };
    
    const record = {
      element: el,
      weightX: weight.x,
      weightY: weight.y,
      
      currentDriftX: 0,
      currentDriftY: 0,
      currentTiltX: 0,
      currentTiltY: 0,
      currentShiftX: 0,
      currentShiftY: 0,
      currentLiftZ: 0,
      
      targetDriftX: 0,
      targetDriftY: 0,
      targetTiltX: 0,
      targetTiltY: 0,
      targetShiftX: 0,
      targetShiftY: 0,
      targetLiftZ: 0,
      
      isHovered: false
    };
    
    cardPhysics.push(record);

    el.addEventListener('mousemove', (e) => {
      if (el.classList.contains('dragging')) return;
      
      record.isHovered = true;
      const rect = el.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      el.style.setProperty('--mx', `${mx}px`);
      el.style.setProperty('--my', `${my}px`);
      
      const relX = (mx / w) - 0.5;
      const relY = (my / h) - 0.5;
      
      const maxTilt = 12; // Extremely premium, subtle tilt angle
      record.targetTiltX = -relY * maxTilt;
      record.targetTiltY = relX * maxTilt;
      
      record.targetShiftX = relX * 10;
      record.targetShiftY = relY * 10;
      
      record.targetLiftZ = 20; // Gorgeous translateZ lift
    });

    el.addEventListener('mouseenter', () => {
      record.isHovered = true;
    });

    el.addEventListener('mouseleave', () => {
      record.isHovered = false;
      record.targetTiltX = 0;
      record.targetTiltY = 0;
      record.targetShiftX = 0;
      record.targetShiftY = 0;
      record.targetLiftZ = 0;
    });
  });

  function updateCardPhysics() {
    const normX = (mouseX / window.innerWidth) - 0.5;
    const normY = (mouseY / window.innerHeight) - 0.5;
    
    cardPhysics.forEach(card => {
      if (card.element.classList.contains('dragging')) return;
      
      card.targetDriftX = normX * card.weightX;
      card.targetDriftY = normY * card.weightY;
      
      // Interpolate drifting
      card.currentDriftX += (card.targetDriftX - card.currentDriftX) * 0.05;
      card.currentDriftY += (card.targetDriftY - card.currentDriftY) * 0.05;
      
      // Interpolate tilt, shift, and lift
      card.currentTiltX += (card.targetTiltX - card.currentTiltX) * 0.12;
      card.currentTiltY += (card.targetTiltY - card.currentTiltY) * 0.12;
      card.currentShiftX += (card.targetShiftX - card.currentShiftX) * 0.12;
      card.currentShiftY += (card.targetShiftY - card.currentShiftY) * 0.12;
      card.currentLiftZ += (card.targetLiftZ - card.currentLiftZ) * 0.12;
      
      const tx = card.currentDriftX + card.currentShiftX;
      const ty = card.currentDriftY + card.currentShiftY;
      
      card.element.style.transform = `perspective(1000px) translate3d(${tx}px, ${ty}px, ${card.currentLiftZ}px) rotateX(${card.currentTiltX}deg) rotateY(${card.currentTiltY}deg)`;
    });

    // Update wires automatically inside the frame loop
    drawConnectiveWires();
  }


  /* ==========================================================================
     3. PHYSICS-BASED MOUSE DRAGGING MODULE
     ========================================================================== */
  /* ==========================================================================
     3. PHYSICS-BASED MOUSE & TOUCH DRAGGING MODULE
     ========================================================================== */
  let activeDragElement = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let elementStartX = 0;
  let elementStartY = 0;
  let highestZIndex = 50;

  const dragElements = document.querySelectorAll('.hover-draggable');

  dragElements.forEach(el => {
    // Set absolute positions using offsetLeft/offsetTop so they are completely independent of CSS scale transformations on mobile!
    const initLeft = el.offsetLeft;
    const initTop = el.offsetTop;
    
    el.style.left = `${initLeft}px`;
    el.style.top = `${initTop}px`;
    el.style.position = 'absolute';
    el.style.margin = '0';

    // MOUSE DRAG START
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      activeDragElement = el;
      
      // Move to top of stack
      highestZIndex += 1;
      el.style.zIndex = highestZIndex;
      
      // Add dragging classes
      el.classList.add('dragging');
      document.body.classList.add('hover-draggable');
      
      // Record mouse click offset
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      elementStartX = parseInt(el.style.left) || 0;
      elementStartY = parseInt(el.style.top) || 0;
      
      // Reset tilt/parallax transform during drag
      el.style.transform = 'perspective(1000px) translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)';
    });

    // TOUCH DRAG START (Native mobile feel)
    el.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        // e.preventDefault() blocks browser viewport drag-scrolls while dragging card
        e.preventDefault();
        activeDragElement = el;
        
        // Move to top of stack
        highestZIndex += 1;
        el.style.zIndex = highestZIndex;
        
        // Add dragging classes
        el.classList.add('dragging');
        document.body.classList.add('hover-draggable');
        
        const touch = e.touches[0];
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        elementStartX = parseInt(el.style.left) || 0;
        elementStartY = parseInt(el.style.top) || 0;
        
        // Reset tilt/parallax transform during drag
        el.style.transform = 'perspective(1000px) translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)';
      }
    }, { passive: false });
  });

  // MOUSE DRAGGING COORDINATES TRACKER
  document.addEventListener('mousemove', (e) => {
    if (!activeDragElement) return;
    
    const parentRect = document.getElementById('interactiveScene').getBoundingClientRect();
    
    // Scale drag coordinates dynamically on shrunken viewports to keep drag 1:1 precise
    let scale = 1;
    if (window.innerWidth < 480) {
      scale = 0.55;
    } else if (window.innerWidth < 768) {
      scale = 0.8;
    }
    
    // Calculate new position
    const deltaX = (e.clientX - dragStartX) / scale;
    const deltaY = (e.clientY - dragStartY) / scale;
    let newX = elementStartX + deltaX;
    let newY = elementStartY + deltaY;
    
    // Boundaries setup
    const elWidth = activeDragElement.offsetWidth;
    const elHeight = activeDragElement.offsetHeight;
    
    // Clamp inside interactive visual container
    newX = Math.max(-50, Math.min(parentRect.width - elWidth + 50, newX));
    newY = Math.max(-50, Math.min(parentRect.height - elHeight + 50, newY));
    
    activeDragElement.style.left = `${newX}px`;
    activeDragElement.style.top = `${newY}px`;
    
    // Live update wire lines during drag
    drawConnectiveWires();
  });

  // TOUCH DRAGGING COORDINATES TRACKER
  document.addEventListener('touchmove', (e) => {
    if (!activeDragElement) return;
    if (e.touches && e.touches.length > 0) {
      e.preventDefault(); // Prevent background scroll bounce
      
      const parentRect = document.getElementById('interactiveScene').getBoundingClientRect();
      const touch = e.touches[0];
      
      // Scale drag coordinates dynamically on shrunken viewports to keep drag 1:1 precise
      let scale = 1;
      if (window.innerWidth < 480) {
        scale = 0.55;
      } else if (window.innerWidth < 768) {
        scale = 0.8;
      }
      
      // Calculate new position
      const deltaX = (touch.clientX - dragStartX) / scale;
      const deltaY = (touch.clientY - dragStartY) / scale;
      let newX = elementStartX + deltaX;
      let newY = elementStartY + deltaY;
      
      // Boundaries setup
      const elWidth = activeDragElement.offsetWidth;
      const elHeight = activeDragElement.offsetHeight;
      
      // Clamp inside interactive visual container
      newX = Math.max(-50, Math.min(parentRect.width - elWidth + 50, newX));
      newY = Math.max(-50, Math.min(parentRect.height - elHeight + 50, newY));
      
      activeDragElement.style.left = `${newX}px`;
      activeDragElement.style.top = `${newY}px`;
      
      // Live update wire lines during drag
      drawConnectiveWires();
    }
  }, { passive: false });

  // RESET DRAG FUNCTIONALITY (Unified)
  const resetDragStates = () => {
    if (!activeDragElement) return;
    
    activeDragElement.classList.remove('dragging');
    
    const record = cardPhysics.find(c => c.element === activeDragElement);
    if (record) {
      record.currentDriftX = 0;
      record.currentDriftY = 0;
      record.currentTiltX = 0;
      record.currentTiltY = 0;
      record.currentShiftX = 0;
      record.currentShiftY = 0;
      record.currentLiftZ = 0;
      
      record.targetDriftX = 0;
      record.targetDriftY = 0;
      record.targetTiltX = 0;
      record.targetTiltY = 0;
      record.targetShiftX = 0;
      record.targetShiftY = 0;
      record.targetLiftZ = 0;
    }

    activeDragElement = null;
  };

  document.addEventListener('mouseup', resetDragStates);
  document.addEventListener('touchend', resetDragStates);


  /* ==========================================================================
     4. DYNAMIC CONNECTIVE DOTTED WIRE CANVAS (SVG)
     ========================================================================== */
  const wireCanvas = document.getElementById('wireCanvas');
  const portal = document.getElementById('portalContainer');

  function drawConnectiveWires() {
    // Clear canvas
    wireCanvas.innerHTML = '';
    
    const parentRect = document.getElementById('interactiveScene').getBoundingClientRect();
    const portalRect = portal.getBoundingClientRect();
    
    // Compute portal center coords relative to the visual container
    const portalCenterX = (portalRect.left - parentRect.left) + portalRect.width / 2;
    const portalCenterY = (portalRect.top - parentRect.top) + portalRect.height / 2;
    
    // Connect portal center to draggable elements
    const elementsToConnect = document.querySelectorAll('.floating-card');
    
    elementsToConnect.forEach(el => {
      const elRect = el.getBoundingClientRect();
      const elCenterX = (elRect.left - parentRect.left) + elRect.width / 2;
      const elCenterY = (elRect.top - parentRect.top) + elRect.height / 2;
      
      // Calculate curved control points for elegant Bezier curves
      const dx = elCenterX - portalCenterX;
      const dy = elCenterY - portalCenterY;
      
      // Control points curve away beautifully
      const cpX1 = portalCenterX + dx * 0.25 - dy * 0.15;
      const cpY1 = portalCenterY + dy * 0.25 + dx * 0.15;
      const cpX2 = portalCenterX + dx * 0.75 - dy * 0.1;
      const cpY2 = portalCenterY + dy * 0.75 + dx * 0.1;

      // Draw SVG Bezier Curve
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const dAttr = `M ${portalCenterX} ${portalCenterY} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${elCenterX} ${elCenterY}`;
      
      path.setAttribute('d', dAttr);
      path.setAttribute('stroke', '#F4C400');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-dasharray', '4, 4');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0.25');
      
      // Add subtle glow animation to path
      path.style.transition = 'opacity 0.3s ease';
      
      wireCanvas.appendChild(path);
    });
  }

  // Draw initially and handle window resizing
  drawConnectiveWires();
  window.addEventListener('resize', () => {
    drawConnectiveWires();
  });


  /* ==========================================================================
     5. PORTAL MOUSE PARALLAX EFFECT
     ========================================================================== */
  const portalImg = document.getElementById('portalImg');
  
  document.addEventListener('mousemove', (e) => {
    const strength = 18; // Maximum parallax offset pixel strength
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    // Normalize coordinates (-0.5 to 0.5)
    const normX = (e.clientX / w) - 0.5;
    const normY = (e.clientY / h) - 0.5;
    
    // Shift image inside the frame in opposite direction of mouse movement
    const shiftX = -normX * strength;
    const shiftY = -normY * strength;
    
    portalImg.style.transform = `translate(${shiftX}px, ${shiftY}px) scale(1.15)`;
  });


  /* ==========================================================================
     6. GLASSMORPHIC SEARCH & TAG INTERACTION MODAL
     ========================================================================== */
  const exploreOverlay = document.getElementById('exploreOverlay');
  const btnLetCreate = document.getElementById('btnLetCreate');
  const btnExploreWork = document.getElementById('btnExploreWork');
  const btnOverlayClose = document.getElementById('btnOverlayClose');
  const overlaySearchInput = document.getElementById('overlaySearchInput');
  const tagBtns = document.querySelectorAll('.tag-btn');
  const btnOverlaySearch = document.getElementById('btnOverlaySearch');

  // Open search overlay
  const openOverlay = () => {
    exploreOverlay.classList.add('active');
    overlaySearchInput.focus();
  };

  // Close search overlay
  const closeOverlay = () => {
    exploreOverlay.classList.remove('active');
  };

  // Open search overlay on clicking CTA buttons
  if (btnLetCreate) {
    btnLetCreate.addEventListener('click', (e) => {
      e.preventDefault();
      openOverlay();
    });
  }

  if (btnExploreWork) {
    btnExploreWork.addEventListener('click', (e) => {
      e.preventDefault();
      openOverlay();
    });
  }

  btnOverlayClose.addEventListener('click', closeOverlay);

  // Close overlay on clicking outside the card
  exploreOverlay.addEventListener('click', (e) => {
    if (e.target === exploreOverlay) {
      closeOverlay();
    }
  });

  // Handle suggested tags
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      overlaySearchInput.value = btn.innerText;
      overlaySearchInput.focus();
      
      // Dynamic color flash on selection
      btn.style.background = 'var(--accent-gold)';
      btn.style.color = 'var(--text-dark)';
      btn.style.borderColor = 'var(--accent-gold)';
      
      setTimeout(() => {
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
      }, 500);
    });
  });

  // Handle Search Execution
  btnOverlaySearch.addEventListener('click', () => {
    const value = overlaySearchInput.value.trim();
    if (value) {
      alert(`Future Mind Studio Inquiry Sent:\n"Looking for: ${value}"\n\nOur creative consultants will contact you shortly!`);
      closeOverlay();
      overlaySearchInput.value = '';
    }
  });

  overlaySearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnOverlaySearch.click();
    }
  });


  /* ==========================================================================
     7. VIDEO REEL LIGHTBOX MODAL
     ========================================================================== */
  const reelOverlay = document.getElementById('reelOverlay');
  const btnWatchReel = document.getElementById('btnWatchReel');
  const btnReelClose = document.getElementById('btnReelClose');
  const reelVideo = document.getElementById('reelVideo');

  const openReel = () => {
    reelOverlay.classList.add('active');
    // In a real application, you'd set the video source here
    // reelVideo.src = "assets/reel_video.mp4"; 
    // reelVideo.play();
  };

  const closeReel = () => {
    reelOverlay.classList.remove('active');
    reelVideo.pause();
  };

  if (btnWatchReel) {
    btnWatchReel.addEventListener('click', openReel);
  }
  if (btnReelClose) {
    btnReelClose.addEventListener('click', closeReel);
  }
  
  reelOverlay.addEventListener('click', (e) => {
    if (e.target === reelOverlay) {
      closeReel();
    }
  });


  /* ==========================================================================
     8. STICKY HEADER SCROLL DETECTION
     ========================================================================== */
  const headerEl = document.querySelector('header');
  const handleScroll = () => {
    if (window.scrollY > 20) {
      headerEl.classList.add('scrolled');
    } else {
      headerEl.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial run on DOM load


  /* ==========================================================================
     9. MOBILE GLASS HAMBURGER NAV OVERLAY HANDLER
     ========================================================================== */
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  const openMobileMenu = () => {
    if (mobileMenuToggle) mobileMenuToggle.classList.add('active');
    if (mobileMenuOverlay) mobileMenuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Lock background scrolling
  };

  const closeMobileMenu = () => {
    if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
    if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Release background scroll lock
  };

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      if (mobileMenuOverlay && mobileMenuOverlay.classList.contains('active')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
  }

  // Auto-close mobile menu when clicking nav links
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Auto-close when clicking on the CTA inside the mobile menu
  const mobileLetCreate = document.getElementById('mobileLetCreate');
  if (mobileLetCreate) {
    mobileLetCreate.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileMenu();
      if (typeof openOverlay === 'function') {
        openOverlay(); // Open the premium search overlay
      }
    });
  }

  /* ==========================================================================
     10. CUSTOM WORK CARD CURSOR HOVER TAGS
     ========================================================================== */
  const workCards = document.querySelectorAll('.work-card');
  workCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      document.body.classList.add('hover-work');
    });
    card.addEventListener('mouseleave', () => {
      document.body.classList.remove('hover-work');
    });
  });

  /* ==========================================================================
     11. BENTO BOX LIGHT COORDINATE TRACKING
     ========================================================================== */
  const bentoBoxes = document.querySelectorAll('.bento-box');
  bentoBoxes.forEach(box => {
    box.addEventListener('mousemove', (e) => {
      const rect = box.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      box.style.setProperty('--mx', `${x}px`);
      box.style.setProperty('--my', `${y}px`);
    });
  });

  /* ==========================================================================
     12. PREMIUM SMOOTH SCROLLING WITH STICKY HEADER OFFSET
     ========================================================================== */
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  internalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      
      // Skip tags that trigger overlays/modals
      if (link.id === 'btnLetCreate' || link.id === 'btnExploreWork' || link.id === 'mobileLetCreate') {
        return;
      }
      
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        
        // Dynamic header height reading
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 80;
        
        const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = targetPosition - headerHeight - 16;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ==========================================================================
     13. INTERSECTION OBSERVER FOR HIGH-END SCROLL REVEALS
     ========================================================================== */
  const revealElements = document.querySelectorAll(
    '.work-card, .bento-box, .process-step, .insight-card, .studio-copy-container, .studio-cards-container, .contact-split, .section-title, .section-badge'
  );
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target); // Trigger once per load
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });
  
  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

});
