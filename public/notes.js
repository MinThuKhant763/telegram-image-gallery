const notesGrid = document.querySelector('#notesGrid');
const notesStatus = document.querySelector('#notesStatus');
const addNoteButton = document.querySelector('#addNoteButton');
const noteEditor = document.querySelector('#noteEditor');
const noteForm = document.querySelector('#noteForm');
const noteContent = document.querySelector('#noteContent');
const noteAdminToken = document.querySelector('#noteAdminToken');
const noteTokenField = document.querySelector('#noteTokenField');
const noteCharacterCount = document.querySelector('#noteCharacterCount');
const noteFormError = document.querySelector('#noteFormError');
const saveNoteButton = document.querySelector('#saveNoteButton');
const closeNoteEditor = document.querySelector('#closeNoteEditor');
const cancelNoteButton = document.querySelector('#cancelNoteButton');

let notes = [];

const deleteIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>';

function getAdminToken() {
  return localStorage.getItem('galleryAdminToken') || '';
}

function setStatus(message, variant = '') {
  notesStatus.textContent = message;
  notesStatus.dataset.variant = variant;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

function updateCharacterCount() {
  noteCharacterCount.textContent = `${noteContent.value.length} / 1000`;
}

function renderNotes() {
  notesGrid.replaceChildren();

  if (!notes.length) {
    setStatus('No notes yet.', 'empty');
    return;
  }

  setStatus(`${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`, 'ready');
  const canManage = Boolean(getAdminToken());

  notes.forEach((note, index) => {
    const item = document.createElement('article');
    item.className = `sticky-note sticky-note--${index % 4}`;

    const content = document.createElement('p');
    content.className = 'sticky-note-content';
    content.textContent = note.content;

    const footer = document.createElement('footer');
    footer.className = 'sticky-note-footer';

    const date = document.createElement('time');
    date.dateTime = note.created_at;
    date.textContent = formatDate(note.created_at);
    footer.append(date);

    if (canManage) {
      const remove = document.createElement('button');
      remove.className = 'delete-note-button';
      remove.type = 'button';
      remove.title = 'Delete note';
      remove.setAttribute('aria-label', 'Delete note');
      remove.innerHTML = deleteIcon;
      remove.addEventListener('click', () => deleteNote(note));
      footer.append(remove);
    }

    item.append(content, footer);
    notesGrid.append(item);
  });
}

function openEditor() {
  noteFormError.textContent = '';
  noteAdminToken.value = getAdminToken();
  noteTokenField.hidden = Boolean(noteAdminToken.value);
  updateCharacterCount();
  noteEditor.showModal();
  noteContent.focus();
}

function closeEditor() {
  noteEditor.close();
  noteFormError.textContent = '';
}

async function saveNote(event) {
  event.preventDefault();
  const content = noteContent.value.trim();
  const adminToken = noteAdminToken.value.trim() || getAdminToken();

  if (!content) {
    noteFormError.textContent = 'Write a note before saving.';
    noteContent.focus();
    return;
  }

  if (!adminToken) {
    noteTokenField.hidden = false;
    noteFormError.textContent = 'Add your admin token to save a note.';
    noteAdminToken.focus();
    return;
  }

  saveNoteButton.disabled = true;
  noteFormError.textContent = '';

  try {
    const response = await fetch('/api/admin-notes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        noteAdminToken.value = '';
        noteTokenField.hidden = false;
      }

      throw new Error(payload.error || `Save failed with ${response.status}`);
    }

    const { note } = await response.json();
    localStorage.setItem('galleryAdminToken', adminToken);
    notes.unshift(note);
    renderNotes();
    noteForm.reset();
    updateCharacterCount();
    closeEditor();
    setStatus('Note saved.', 'ready');
  } catch (error) {
    noteFormError.textContent = error.message;
  } finally {
    saveNoteButton.disabled = false;
  }
}

async function deleteNote(note) {
  const adminToken = getAdminToken();

  if (!adminToken || !confirm('Delete this note permanently?')) {
    return;
  }

  try {
    const response = await fetch(`/api/admin-notes?id=${encodeURIComponent(note.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Delete failed with ${response.status}`);
    }

    notes = notes.filter((item) => item.id !== note.id);
    renderNotes();
    setStatus('Note deleted.', 'ready');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function loadNotes({ quiet = false } = {}) {
  if (!quiet) {
    setStatus('Loading notes...');
  }

  try {
    const response = await fetch('/api/notes');

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Notes request failed with ${response.status}`);
    }

    const payload = await response.json();
    const nextNotes = payload.notes || [];
    const hasChanged = nextNotes.map((note) => note.id).join(',') !== notes.map((note) => note.id).join(',');
    notes = nextNotes;

    if (hasChanged || !quiet) {
      renderNotes();
    }
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

addNoteButton.addEventListener('click', openEditor);
closeNoteEditor.addEventListener('click', closeEditor);
cancelNoteButton.addEventListener('click', closeEditor);
noteContent.addEventListener('input', updateCharacterCount);
noteForm.addEventListener('submit', saveNote);
noteEditor.addEventListener('click', (event) => {
  if (event.target === noteEditor) {
    closeEditor();
  }
});

loadNotes();
setInterval(() => loadNotes({ quiet: true }), 15000);
