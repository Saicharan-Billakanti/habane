/* HABÄNE ADMIN — Authentication Controller */

export function initAuth(onSuccess) {
  const loginWall = document.getElementById('loginWall');
  const adminShell = document.getElementById('adminShell');
  const loginForm = document.getElementById('loginForm');
  const digits = document.querySelectorAll('.pin-digit');
  const fullPinInput = document.getElementById('fullPin');
  const rememberCheckbox = document.getElementById('rememberSession');
  const forgotPinBtn = document.getElementById('forgotPinBtn');

  const CORRECT_PIN = '1234';

  // 1. Check existing session
  const isSessionAuth = sessionStorage.getItem('habane_admin_session') === 'true';
  const isLocalAuth = localStorage.getItem('habane_admin_session') === 'true';

  if (isSessionAuth || isLocalAuth) {
    authorizeUser();
    return;
  }

  // 2. PIN Digits auto-shifting & navigation
  digits.forEach((digit, index) => {
    // Focus first element on load
    if (index === 0) digit.focus();

    digit.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val) {
        // Shift focus forward
        if (index < digits.length - 1) {
          digits[index + 1].removeAttribute('disabled');
          digits[index + 1].focus();
        }
      }
      updateFullPin();
    });

    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!digit.value && index > 0) {
          // Shift focus back and clear previous
          digits[index - 1].focus();
          digits[index - 1].value = '';
          digit.setAttribute('disabled', 'true');
        } else {
          digit.value = '';
        }
        updateFullPin();
      }
    });

    // Handle paste events (e.g. paste "1234")
    digit.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').trim().slice(0, 4);
      if (/^\d{4}$/.test(text)) {
        digits.forEach((d, i) => {
          d.removeAttribute('disabled');
          d.value = text[i];
        });
        updateFullPin();
        digits[3].focus();
      }
    });
  });

  function updateFullPin() {
    let pin = '';
    digits.forEach(d => { pin += d.value; });
    fullPinInput.value = pin;
  }

  // 3. Forgot PIN Demo Action
  forgotPinBtn?.addEventListener('click', () => {
    alert("DEMO ASSISTANCE: The PIN is hardcoded to '1234' for client-side demo testing.");
  });

  // 4. Form Submit
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    updateFullPin();
    const pin = fullPinInput.value;

    if (pin === CORRECT_PIN) {
      if (rememberCheckbox?.checked) {
        localStorage.setItem('habane_admin_session', 'true');
      }
      sessionStorage.setItem('habane_admin_session', 'true');
      
      // Animate entry with GSAP
      if (window.gsap) {
        gsap.to(loginWall, {
          opacity: 0,
          y: -30,
          duration: 0.5,
          ease: 'power3.inOut',
          onComplete: () => {
            authorizeUser();
          }
        });
      } else {
        authorizeUser();
      }
    } else {
      // Vibrate/Shake error animation
      if (window.gsap) {
        gsap.to('.login-card', {
          x: -10,
          duration: 0.05,
          repeat: 5,
          yoyo: true,
          onComplete: () => {
            gsap.set('.login-card', { x: 0 });
          }
        });
      } else {
        alert("Access Denied: Incorrect PIN.");
      }
      // Reset PIN inputs
      digits.forEach((d, i) => {
        d.value = '';
        if (i > 0) d.setAttribute('disabled', 'true');
      });
      digits[0].focus();
      fullPinInput.value = '';
    }
  });

  function authorizeUser() {
    loginWall.style.display = 'none';
    adminShell.style.display = 'flex';
    
    // Seed generator run on authorization if empty
    if (window.generateSeedData) {
      window.generateSeedData(false);
    }
    
    onSuccess();
  }
}

export function logout() {
  localStorage.removeItem('habane_admin_session');
  sessionStorage.removeItem('habane_admin_session');
  window.location.reload();
}
