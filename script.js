const root = document.documentElement;
const ADMIN_PASSWORD = 'iris-admin';
const STORAGE_PREFIX = 'irisprofile:text:';

window.addEventListener('pointermove', (event) => {
  const x = `${(event.clientX / window.innerWidth) * 100}%`;
  const y = `${(event.clientY / window.innerHeight) * 100}%`;
  root.style.setProperty('--pointer-x', x);
  root.style.setProperty('--pointer-y', y);
});

const yearTarget = document.getElementById('year');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

const editableNodes = [...document.querySelectorAll('[data-edit-key]')];
const adminSwitch = document.querySelector('[data-admin-switch]');
const adminModal = document.querySelector('[data-admin-modal]');
const adminForm = document.querySelector('[data-admin-form]');
const adminPasswordInput = document.querySelector('[data-admin-password]');
const adminError = document.querySelector('[data-admin-error]');
const adminCancel = document.querySelector('[data-admin-cancel]');
const adminToolbar = document.querySelector('[data-admin-toolbar]');
const adminStatus = document.querySelector('[data-admin-status]');
const adminSave = document.querySelector('[data-admin-save]');
const adminLock = document.querySelector('[data-admin-lock]');
const copyButton = document.querySelector('[data-copy]');
const revealTargets = [...document.querySelectorAll('.hero, .panel, .site-footer')];

let isAdminMode = false;
let statusTimer;
let copyButtonIdleLabel = copyButton ? copyButton.textContent.trim() : '';

const readStoredText = (key) => {
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    return null;
  }
};

const writeStoredText = (key, value) => {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
    return true;
  } catch (error) {
    return false;
  }
};

const setStatus = (message, tone = '') => {
  if (!adminStatus) {
    return;
  }

  window.clearTimeout(statusTimer);
  adminStatus.textContent = message;
  adminStatus.dataset.tone = tone;

  if (!message) {
    return;
  }

  statusTimer = window.setTimeout(() => {
    if (!isAdminMode && tone !== 'error') {
      adminStatus.textContent = '';
      adminStatus.dataset.tone = '';
    }
  }, 2200);
};

const loadEditableContent = () => {
  editableNodes.forEach((node) => {
    const key = node.dataset.editKey;
    const savedValue = readStoredText(key);
    if (savedValue !== null) {
      node.textContent = savedValue;
    }
  });

  if (copyButton) {
    copyButtonIdleLabel = copyButton.textContent.trim();
  }
};

const saveEditableContent = () => {
  const saved = editableNodes.every((node) => {
    return writeStoredText(node.dataset.editKey, node.textContent);
  });

  if (copyButton) {
    copyButtonIdleLabel = copyButton.textContent.trim();
  }

  setStatus(saved ? 'Saved locally.' : 'Save failed.', saved ? '' : 'error');
};

const setAdminMode = (enabled) => {
  isAdminMode = enabled;
  document.body.classList.toggle('is-admin-editing', enabled);

  if (adminToolbar) {
    adminToolbar.hidden = !enabled;
  }

  editableNodes.forEach((node) => {
    node.setAttribute('contenteditable', enabled ? 'true' : 'false');
    node.spellcheck = enabled;
  });

  if (!enabled && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

const openAdminModal = () => {
  if (!adminModal) {
    return;
  }

  adminModal.hidden = false;
  adminError.textContent = '';
  adminPasswordInput.value = '';
  window.requestAnimationFrame(() => {
    adminPasswordInput.focus();
  });
};

const closeAdminModal = () => {
  if (!adminModal) {
    return;
  }

  adminModal.hidden = true;
  adminError.textContent = '';
  adminPasswordInput.value = '';
};

loadEditableContent();

if (copyButton) {
  copyButton.addEventListener('click', async (event) => {
    if (isAdminMode) {
      event.preventDefault();
      return;
    }

    const content = event.currentTarget.getAttribute('data-copy');
    try {
      await navigator.clipboard.writeText(content);
      copyButton.textContent = 'Copied';
      window.setTimeout(() => {
        copyButton.textContent = copyButtonIdleLabel;
      }, 1500);
    } catch (error) {
      copyButton.textContent = content;
      window.setTimeout(() => {
        copyButton.textContent = copyButtonIdleLabel;
      }, 2000);
    }
  });
}

if (adminSwitch) {
  adminSwitch.addEventListener('click', openAdminModal);
}

if (adminCancel) {
  adminCancel.addEventListener('click', closeAdminModal);
}

if (adminForm) {
  adminForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (adminPasswordInput.value !== ADMIN_PASSWORD) {
      adminError.textContent = 'Incorrect password.';
      return;
    }

    closeAdminModal();
    setAdminMode(true);
    setStatus('Edit mode unlocked.');
  });
}

if (adminSave) {
  adminSave.addEventListener('click', () => {
    saveEditableContent();
  });
}

if (adminLock) {
  adminLock.addEventListener('click', () => {
    saveEditableContent();
    setAdminMode(false);
    setStatus('Locked.');
  });
}

editableNodes.forEach((node) => {
  node.addEventListener('input', () => {
    if (isAdminMode) {
      setStatus('Unsaved changes.');
    }
  });
});

document.addEventListener(
  'click',
  (event) => {
    if (!isAdminMode) {
      return;
    }

    const editableTarget = event.target.closest('[data-edit-key]');
    if (!editableTarget) {
      return;
    }

    const tagName = editableTarget.tagName;
    if (tagName !== 'A' && tagName !== 'BUTTON') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    editableTarget.focus();
  },
  true
);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && adminModal && !adminModal.hidden) {
    closeAdminModal();
  }
});

revealTargets.forEach((element) => {
  element.classList.add('reveal');
});

const revealVisible = (element) => {
  element.classList.add('is-visible');
};

const hideReveal = (element) => {
  element.classList.remove('is-visible');
};

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  revealTargets.forEach(revealVisible);
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealVisible(entry.target);
        } else {
          hideReveal(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px',
    }
  );

  revealTargets.forEach((element) => {
    observer.observe(element);
  });
}
