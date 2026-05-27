document.addEventListener('DOMContentLoaded', () => {
  
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

  // Smoothly interpolate the outer cursor ring position
  function updateCursor() {
    ringX += (mouseX - ringX) * lerpFactor;
    ringY += (mouseY - ringY) * lerpFactor;
    
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
    
    requestAnimationFrame(updateCursor);
  }
  requestAnimationFrame(updateCursor);

  // Add hover state classes to body for interactive elements
  const setupHoverEffects = () => {
    const clickables = document.querySelectorAll('a, button, .play-button, .tag-btn, .overlay-close');
    clickables.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('hover-clickable'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('hover-clickable'));
    });

    const draggables = document.querySelectorAll('.hover-draggable');
    draggables.forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('hover-draggable'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('hover-draggable'));
    });
  };
  setupHoverEffects();


  /* ==========================================================================
     2. 3D TILT EFFECT FOR FLOATING CARDS
     ========================================================================== */
  const cards = document.querySelectorAll('.floating-card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if (card.classList.contains('dragging')) return; // Disable tilt during drag

      const rect = card.getBoundingClientRect();
      const cardWidth = rect.width;
      const cardHeight = rect.height;
      
      // Get mouse position relative to the card's center
      const mouseXCard = e.clientX - rect.left - cardWidth / 2;
      const mouseYCard = e.clientY - rect.top - cardHeight / 2;
      
      // Calculate rotation degree (max 15 degrees)
      const maxTilt = 15;
      const rotateX = -(mouseYCard / (cardHeight / 2)) * maxTilt;
      const rotateY = (mouseXCard / (cardWidth / 2)) * maxTilt;
      
      // Shift card slightly in direction of mouse for perspective
      const shiftX = (mouseXCard / (cardWidth / 2)) * 6;
      const shiftY = (mouseYCard / (cardHeight / 2)) * 6;

      // Apply 3D hardware-accelerated transform
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${shiftX}px, ${shiftY}px, 10px)`;
    });

    // Reset card layout smoothly on mouse leave
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translate3d(0px, 0px, 0px)';
    });
  });


  /* ==========================================================================
     3. PHYSICS-BASED MOUSE DRAGGING MODULE
     ========================================================================== */
  let activeDragElement = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let elementStartX = 0;
  let elementStartY = 0;
  let highestZIndex = 50;

  const dragElements = document.querySelectorAll('.hover-draggable');

  dragElements.forEach(el => {
    // Record initial coordinates relative to parent layout on page load
    const rect = el.getBoundingClientRect();
    const parentRect = el.parentElement.getBoundingClientRect();
    
    // Set absolute positions initially so draggability remains flawless
    el.style.left = `${rect.left - parentRect.left}px`;
    el.style.top = `${rect.top - parentRect.top}px`;
    el.style.position = 'absolute';
    el.style.margin = '0';

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
      const elRect = el.getBoundingClientRect();
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      elementStartX = elRect.left - parentRect.left;
      elementStartY = elRect.top - parentRect.top;
      
      // Disable tilt during drag
      el.style.transform = 'scale(1.05)';
    });
  });

  document.addEventListener('mousemove', (e) => {
    if (!activeDragElement) return;
    
    const parentRect = document.getElementById('interactiveScene').getBoundingClientRect();
    
    // Calculate new position
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
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

  document.addEventListener('mouseup', () => {
    if (!activeDragElement) return;
    
    activeDragElement.classList.remove('dragging');
    activeDragElement.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
    
    // Subtle release impact bounce
    const el = activeDragElement;
    el.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.5)';
    el.style.transform = 'scale(1)';
    
    setTimeout(() => {
      el.style.transition = '';
    }, 400);

    activeDragElement = null;
  });


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
      path.setAttribute('stroke', '#ffb800');
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
      btn.style.background = '#ffb800';
      btn.style.color = '#0c0c0c';
      btn.style.borderColor = '#ffb800';
      
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

  btnWatchReel.addEventListener('click', openReel);
  btnReelClose.addEventListener('click', closeReel);
  
  reelOverlay.addEventListener('click', (e) => {
    if (e.target === reelOverlay) {
      closeReel();
    }
  });

});
