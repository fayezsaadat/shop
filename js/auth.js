/* =========================================================================
   VOLT ATHLETICS — auth.js
   Two things:
     1. VOLT.validate — a small declarative form-validation helper used by
        login, register, checkout, newsletter and account forms.
     2. VOLT.auth     — demo session handling on localStorage.

   SECURITY NOTE (Phase 1 only): accounts live in localStorage and passwords
   are stored as a non-cryptographic digest purely so the demo can tell a
   right password from a wrong one. Phase 2 replaces this entire module with
   PHP sessions + password_hash() on the server.
   ========================================================================= */
(function (global) {
  'use strict';

  var VOLT = global.VOLT = global.VOLT || {};

  /* ======================================================== validation == */
  var RULES = {
    required: {
      test: function (v) { return String(v).trim().length > 0; },
      message: function (label) { return label + ' is required'; }
    },
    email: {
      test: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()); },
      message: function () { return 'Enter a valid email address'; }
    },
    name: {
      test: function (v) { return !v || /^[a-z\u00C0-\u024F' -]{2,40}$/i.test(v.trim()); },
      message: function (label) { return 'Enter a valid ' + label.toLowerCase(); }
    },
    phone: {
      test: function (v) { return !v || /^[+\d][\d\s()-]{6,19}$/.test(v.trim()); },
      message: function () { return 'Enter a valid phone number'; }
    },
    postcode: {
      test: function (v) { return !v || /^[a-z0-9][a-z0-9 -]{2,11}$/i.test(v.trim()); },
      message: function () { return 'Enter a valid postal / ZIP code'; }
    },
    password: {
      test: function (v) { return !v || (v.length >= 8 && /[a-z]/i.test(v) && /\d/.test(v)); },
      message: function () { return 'Use 8+ characters with at least one letter and one number'; }
    },
    card: {
      test: function (v) { return !v || luhn(v.replace(/\s+/g, '')); },
      message: function () { return 'Enter a valid card number'; }
    },
    expiry: {
      test: function (v) {
        if (!v) return true;
        var m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(v.trim());
        if (!m) return false;
        var month = Number(m[1]);
        var year = 2000 + Number(m[2]);
        if (month < 1 || month > 12) return false;
        var now = new Date();
        return new Date(year, month, 0) >= new Date(now.getFullYear(), now.getMonth(), 1);
      },
      message: function () { return 'Use a valid future date (MM/YY)'; }
    },
    cvc: {
      test: function (v) { return !v || /^\d{3,4}$/.test(v.trim()); },
      message: function () { return 'Enter the 3 or 4 digit code'; }
    },
    checked: {
      test: function (v, input) { return input.checked; },
      message: function (label) { return 'Please accept the ' + label.toLowerCase(); }
    }
  };

  function luhn(number) {
    if (!/^\d{12,19}$/.test(number)) return false;
    var sum = 0, alt = false;
    for (var i = number.length - 1; i >= 0; i--) {
      var digit = Number(number.charAt(i));
      if (alt) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function fieldOf(input) { return input.closest('.field') || input.parentElement; }

  function labelOf(input) {
    if (input.getAttribute('data-label')) return input.getAttribute('data-label');
    var field = fieldOf(input);
    var label = field && field.querySelector('label');
    var text = label ? label.textContent.replace(/\*/g, '').trim() : (input.placeholder || 'This field');
    return text.replace(/\s*\(optional\)\s*/i, '');
  }

  function showError(input, message) {
    var field = fieldOf(input);
    if (!field) return;
    field.classList.add('has-error');
    field.classList.remove('is-valid');
    var slot = field.querySelector('.error-text');
    if (!slot) {
      slot = document.createElement('p');
      slot.className = 'error-text';
      field.appendChild(slot);
    }
    slot.innerHTML = (VOLT.icon ? VOLT.icon('alert', 14) : '') + '<span>' + message + '</span>';
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input, markValid) {
    var field = fieldOf(input);
    if (!field) return;
    field.classList.remove('has-error');
    if (markValid) field.classList.add('is-valid');
    input.removeAttribute('aria-invalid');
  }

  function validateInput(input) {
    var raw = input.type === 'checkbox' ? String(input.checked) : input.value;
    var rules = (input.getAttribute('data-rules') || '').split('|').filter(Boolean);
    var label = labelOf(input);

    for (var i = 0; i < rules.length; i++) {
      var name = rules[i];
      var arg = null;
      if (name.indexOf(':') > -1) {
        var bits = name.split(':');
        name = bits[0];
        arg = bits[1];
      }

      if (name === 'min') {
        if (raw.trim().length < Number(arg)) {
          showError(input, label + ' must be at least ' + arg + ' characters');
          return false;
        }
        continue;
      }
      if (name === 'match') {
        var other = document.getElementById(arg);
        if (other && raw !== other.value) {
          showError(input, 'Passwords do not match');
          return false;
        }
        continue;
      }
      var rule = RULES[name];
      if (rule && !rule.test(raw, input)) {
        showError(input, rule.message(label));
        return false;
      }
    }
    clearError(input, raw.trim().length > 0);
    return true;
  }

  function validateForm(form) {
    var inputs = Array.prototype.slice.call(form.querySelectorAll('[data-rules]'));
    var ok = true;
    var firstBad = null;
    inputs.forEach(function (input) {
      if (input.disabled || input.closest('[hidden]') || input.offsetParent === null && input.type !== 'checkbox') {
        // Skip fields that are not currently in play (e.g. hidden payment panels)
        if (input.closest('[hidden]')) return;
      }
      if (!validateInput(input)) {
        ok = false;
        if (!firstBad) firstBad = input;
      }
    });
    if (firstBad) {
      firstBad.focus();
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return ok;
  }

  /* Wire a form up: live re-validation after the first failed submit. */
  function bindForm(form, onValid) {
    if (!form) return;
    var attempted = false;

    form.setAttribute('novalidate', 'novalidate');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      attempted = true;
      if (!validateForm(form)) return;
      onValid(collect(form), form);
    });

    form.addEventListener('blur', function (e) {
      if (e.target.matches('[data-rules]') && e.target.value) validateInput(e.target);
    }, true);

    form.addEventListener('input', function (e) {
      if (!attempted) return;
      if (e.target.matches('[data-rules]')) validateInput(e.target);
    });
  }

  function collect(form) {
    var data = {};
    Array.prototype.slice.call(form.elements).forEach(function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') data[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
      else data[el.name] = el.value.trim();
    });
    return data;
  }

  function passwordStrength(value) {
    var score = 0;
    if (!value) return 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value) && /[^\w\s]/.test(value)) score++;
    else if (/\d/.test(value)) score = Math.max(score, 2);
    return Math.min(4, score);
  }

  /* Show/hide password buttons + strength meters, anywhere on the page. */
  function enhancePasswords(scope) {
    var root = scope || document;
    Array.prototype.slice.call(root.querySelectorAll('.password-field')).forEach(function (wrap) {
      var input = wrap.querySelector('input');
      var toggle = wrap.querySelector('.password-toggle');
      if (!input || !toggle || toggle.dataset.bound) return;
      toggle.dataset.bound = '1';
      toggle.innerHTML = VOLT.icon('eye', 19);
      toggle.setAttribute('aria-label', 'Show password');
      toggle.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        toggle.innerHTML = VOLT.icon(show ? 'eyeOff' : 'eye', 19);
        toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        input.focus();
      });

      var meter = wrap.parentElement.querySelector('.meter');
      if (meter) {
        input.addEventListener('input', function () {
          meter.className = 'meter s' + passwordStrength(input.value);
        });
      }
    });
  }

  VOLT.validate = {
    input: validateInput,
    form: validateForm,
    bindForm: bindForm,
    collect: collect,
    rules: RULES,
    strength: passwordStrength,
    enhancePasswords: enhancePasswords,
    showError: showError,
    clearError: clearError
  };

  /* ============================================================== auth == */
  var USERS_KEY = 'users';
  var SESSION_KEY = 'session';

  function readUsers() {
    try { return JSON.parse(global.localStorage.getItem('volt.' + USERS_KEY)) || []; }
    catch (e) { return []; }
  }
  function writeUsers(list) {
    try { global.localStorage.setItem('volt.' + USERS_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function readSession() {
    try {
      return JSON.parse(global.localStorage.getItem('volt.' + SESSION_KEY)) ||
        JSON.parse(global.sessionStorage.getItem('volt.' + SESSION_KEY));
    } catch (e) { return null; }
  }

  /* Deliberately simple, non-cryptographic. Demo only — see note above. */
  function digest(value) {
    var hash = 5381;
    for (var i = 0; i < value.length; i++) hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
    return 'd1$' + hash.toString(36) + '$' + value.length;
  }

  function seed() {
    var users = readUsers();
    if (!users.some(function (u) { return u.email === 'demo@voltathletics.com'; })) {
      users.push({
        id: 'u-demo',
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'demo@voltathletics.com',
        password: digest('Volt1234'),
        phone: '+1 415 555 0134',
        createdAt: '2024-11-02T10:20:00.000Z',
        addresses: [{
          id: 'a1', label: 'Home', default: true, firstName: 'Alex', lastName: 'Rivera',
          line1: '218 Harrison Street', line2: 'Apt 4B', city: 'San Francisco',
          state: 'CA', postcode: '94105', country: 'United States', phone: '+1 415 555 0134'
        }, {
          id: 'a2', label: 'Work', default: false, firstName: 'Alex', lastName: 'Rivera',
          line1: '900 Market Street', line2: 'Floor 12', city: 'San Francisco',
          state: 'CA', postcode: '94102', country: 'United States', phone: '+1 415 555 0134'
        }]
      });
      writeUsers(users);
    }
  }

  function currentUser() {
    var session = readSession();
    if (!session) return null;
    var user = readUsers().filter(function (u) { return u.id === session.userId; })[0];
    if (!user) return null;
    var copy = Object.assign({}, user);
    delete copy.password;
    return copy;
  }

  function login(email, password, remember) {
    var users = readUsers();
    var user = users.filter(function (u) {
      return u.email.toLowerCase() === String(email).toLowerCase().trim();
    })[0];
    if (!user) return { ok: false, message: 'We could not find an account with that email.' };
    if (user.password !== digest(password)) return { ok: false, message: 'That password is not correct.' };

    var session = { userId: user.id, at: Date.now() };
    try {
      if (remember) global.localStorage.setItem('volt.' + SESSION_KEY, JSON.stringify(session));
      else global.sessionStorage.setItem('volt.' + SESSION_KEY, JSON.stringify(session));
    } catch (e) {}
    if (VOLT.util) VOLT.util.emit('volt:auth:change', { user: currentUser() });
    return { ok: true, user: currentUser() };
  }

  function register(data) {
    var users = readUsers();
    var email = String(data.email).toLowerCase().trim();
    if (users.some(function (u) { return u.email.toLowerCase() === email; })) {
      return { ok: false, message: 'An account with that email already exists.', field: 'email' };
    }
    var user = {
      id: 'u-' + Date.now().toString(36),
      firstName: data.firstName,
      lastName: data.lastName,
      email: email,
      password: digest(data.password),
      phone: data.phone || '',
      newsletter: !!data.newsletter,
      createdAt: new Date().toISOString(),
      addresses: []
    };
    users.push(user);
    writeUsers(users);
    login(email, data.password, true);
    return { ok: true, user: currentUser() };
  }

  function logout() {
    try {
      global.localStorage.removeItem('volt.' + SESSION_KEY);
      global.sessionStorage.removeItem('volt.' + SESSION_KEY);
    } catch (e) {}
    if (VOLT.util) VOLT.util.emit('volt:auth:change', { user: null });
  }

  function updateProfile(patch) {
    var session = readSession();
    if (!session) return { ok: false };
    var users = readUsers();
    users = users.map(function (u) {
      if (u.id !== session.userId) return u;
      return Object.assign({}, u, patch, { password: u.password });
    });
    writeUsers(users);
    if (VOLT.util) VOLT.util.emit('volt:auth:change', { user: currentUser() });
    return { ok: true, user: currentUser() };
  }

  function changePassword(currentPw, nextPw) {
    var session = readSession();
    if (!session) return { ok: false, message: 'Not signed in.' };
    var users = readUsers();
    var user = users.filter(function (u) { return u.id === session.userId; })[0];
    if (!user || user.password !== digest(currentPw)) {
      return { ok: false, message: 'Your current password is not correct.' };
    }
    user.password = digest(nextPw);
    writeUsers(users);
    return { ok: true };
  }

  function saveAddress(address) {
    var user = currentUser();
    if (!user) return { ok: false };
    var list = (user.addresses || []).slice();
    if (address.id) {
      list = list.map(function (a) { return a.id === address.id ? Object.assign({}, a, address) : a; });
    } else {
      address.id = 'a-' + Date.now().toString(36);
      list.push(address);
    }
    if (address.default) {
      list = list.map(function (a) { return Object.assign({}, a, { default: a.id === address.id }); });
    }
    return updateProfile({ addresses: list });
  }

  function removeAddress(id) {
    var user = currentUser();
    if (!user) return { ok: false };
    return updateProfile({
      addresses: (user.addresses || []).filter(function (a) { return a.id !== id; })
    });
  }

  seed();

  VOLT.auth = {
    current: currentUser,
    isLoggedIn: function () { return !!currentUser(); },
    login: login,
    register: register,
    logout: logout,
    updateProfile: updateProfile,
    changePassword: changePassword,
    saveAddress: saveAddress,
    removeAddress: removeAddress,
    demo: { email: 'demo@voltathletics.com', password: 'Volt1234' }
  };
}(window));
