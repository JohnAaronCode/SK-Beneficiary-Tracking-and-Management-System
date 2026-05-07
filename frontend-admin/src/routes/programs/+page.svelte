<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { apiFetch } from '$lib/api.js';
  import Plus from 'lucide-svelte/icons/plus';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Users from 'lucide-svelte/icons/users';
  import X from 'lucide-svelte/icons/x';
  import CalendarDays from 'lucide-svelte/icons/calendar-days';
  import Tag from 'lucide-svelte/icons/tag';
  import ListChecks from 'lucide-svelte/icons/list-checks';
  import AlignLeft from 'lucide-svelte/icons/align-left';
  import Hash from 'lucide-svelte/icons/hash';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import FolderOpen from 'lucide-svelte/icons/folder-open';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import Search from 'lucide-svelte/icons/search';

  type ProgramStatus = 'open' | 'closed' | 'draft' | 'completed';

  interface Program {
    id: string | number;
    title: string;
    description: string;
    category: string;
    slots: number;
    slots_used: number;
    pending_count: number;
    approved_count: number;
    status: ProgramStatus;
    requirements: string;
    start_date: string;
    end_date: string;
  }
  interface Category { name: string; }
  interface FormData {
    title: string;
    description: string;
    category: string;
    slots: string;
    requirements: string;
    start_date: string;
    end_date: string;
  }

  let programs = $state<Program[]>([]);
  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let showForm = $state(false);
  let editMode = $state(false);
  let selectedProgram = $state<Program | null>(null);
  let error = $state('');
  let success = $state('');
  let searchTerm = $state('');

  let showDeleteConfirm = $state(false);
  let programToDelete = $state<Program | null>(null);

  let form = $state<FormData>({
    title: '', description: '', category: '', slots: '',
    requirements: '', start_date: '', end_date: '',
  });

  let statusFilter = $state($page.url.searchParams.get('status') ?? '');

  // Live filtered list derived from search term
  let filteredPrograms = $derived(
    searchTerm.trim() === ''
      ? programs
      : programs.filter(p =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
        )
  );

  onMount(async () => { await loadData(); });

  async function loadData() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      [programs, categories] = await Promise.all([
        apiFetch(`/programs${params.toString() ? '?' + params.toString() : ''}`),
        apiFetch('/categories'),
      ]);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load data';
    } finally {
      loading = false;
    }
  }

  function openCreate() {
    form = { title: '', description: '', category: '', slots: '', requirements: '', start_date: '', end_date: '' };
    editMode = false;
    showForm = true;
  }

  function openEdit(p: Program) {
    form = { ...p, slots: String(p.slots) };
    editMode = true;
    selectedProgram = p;
    showForm = true;
  }

  async function submitForm() {
    try {
      if (editMode && selectedProgram != null) {
        await apiFetch(`/programs/${selectedProgram.id}`, { method: 'PUT', body: form });
        success = 'Program updated successfully.';
      } else {
        await apiFetch('/programs', { method: 'POST', body: form });
        success = 'Program created successfully.';
      }
      showForm = false;
      await loadData();
      setTimeout(() => success = '', 3000);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save program';
    }
  }

  async function setStatus(id: string | number, status: string) {
    try {
      await apiFetch(`/programs/${id}/status`, { method: 'PATCH', body: { status } });
      await loadData();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update status';
    }
  }

  function confirmDelete(p: Program) {
    programToDelete = p;
    showDeleteConfirm = true;
  }

  async function executeDelete() {
    if (!programToDelete) return;
    try {
      await apiFetch(`/programs/${programToDelete.id}`, { method: 'DELETE' });
      showDeleteConfirm = false;
      programToDelete = null;
      await loadData();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete program';
      showDeleteConfirm = false;
    }
  }

  function cancelDelete() {
    showDeleteConfirm = false;
    programToDelete = null;
  }

  const statusConfig: Record<ProgramStatus, { label: string; classes: string }> = {
    open:      { label: 'Open',      classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    closed:    { label: 'Closed',    classes: 'bg-slate-100 text-slate-500 border border-slate-200' },
    draft:     { label: 'Draft',     classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
    completed: { label: 'Completed', classes: 'bg-blue-100 text-blue-700 border border-blue-200' },
  };
</script>

<!-- ── DELETE CONFIRMATION MODAL ─────────────────────────────────────────── -->
{#if showDeleteConfirm && programToDelete}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(10,31,68,0.5);">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
      <div class="px-5 pt-6 pb-4 text-center">
        <div class="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} class="text-red-500" />
        </div>
        <h2 class="text-base font-bold text-slate-900">Delete Program?</h2>
        <p class="text-sm text-slate-500 mt-1.5">
          You are about to delete
          <span class="font-semibold text-slate-700">"{programToDelete.title}"</span>.
          This action cannot be undone.
        </p>
      </div>
      <div class="mx-5 mb-5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
        <p class="text-xs text-red-600 leading-relaxed">
          All associated applications and data for this program will also be permanently removed.
        </p>
      </div>
      <div class="flex gap-2 px-5 pb-6">
        <button
          onclick={executeDelete}
          class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition"
        >
          Yes, Delete
        </button>
        <button
          onclick={cancelDelete}
          class="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ── CREATE / EDIT MODAL ────────────────────────────────────────────────── -->
{#if showForm}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style="background: rgba(10,31,68,0.5);">
    <div class="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-y-auto" style="max-height: 92dvh;">

      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div class="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 rounded-full sm:hidden"></div>
        <div class="mt-2 sm:mt-0">
          <h2 class="text-base font-bold text-slate-900">
            {editMode ? 'Edit Program' : 'New Program'}
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            {editMode ? 'Update the program details below' : 'Fill in the details to create a new program'}
          </p>
        </div>
        <button
          onclick={() => showForm = false}
          class="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
        >
          <X size={16} />
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); submitForm(); }} class="px-5 py-5 space-y-4">

        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide" for="title">
            <Hash size={11} /> Program Title <span class="text-red-400">*</span>
          </label>
          <input
            id="title"
            bind:value={form.title}
            required
            placeholder="e.g. Educational Assistance 2026"
            class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition bg-slate-50"
          />
        </div>

        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide" for="category">
            <Tag size={11} /> Category <span class="text-red-400">*</span>
          </label>
          <select
            id="category"
            bind:value={form.category}
            required
            class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition bg-slate-50 appearance-none"
          >
            <option value="">Select a category</option>
            {#each categories as cat}
              <option value={cat.name}>{cat.name}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide" for="slots">
            <Users size={11} /> Number of Slots <span class="text-red-400">*</span>
          </label>
          <input
            id="slots"
            bind:value={form.slots}
            type="number"
            required
            placeholder="100"
            min="1"
            class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition bg-slate-50"
          />
        </div>

        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide" for="desc">
            <AlignLeft size={11} /> Description
          </label>
          <textarea
            id="desc"
            bind:value={form.description}
            placeholder="Program details and objectives..."
            rows="3"
            class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition bg-slate-50 resize-none"
          ></textarea>
        </div>

        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide" for="req">
            <ListChecks size={11} /> Requirements <span class="text-red-400">*</span>
          </label>
          <textarea
            id="req"
            bind:value={form.requirements}
            required
            placeholder="List of requirements for applicants..."
            rows="3"
            class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition bg-slate-50 resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide" for="start">
              <CalendarDays size={11} /> Start Date
            </label>
            <input
              id="start"
              bind:value={form.start_date}
              type="date"
              class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition bg-slate-50"
            />
          </div>
          <div class="space-y-1.5">
            <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide" for="end">
              <CalendarDays size={11} /> End Date
            </label>
            <input
              id="end"
              bind:value={form.end_date}
              type="date"
              class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition bg-slate-50"
            />
          </div>
        </div>

        <div class="flex gap-2 pt-1 pb-safe">
          <button
            type="submit"
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            style="background: #0A1F44;"
          >
            {editMode ? 'Save Changes' : 'Create Program'}
          </button>
          <button
            type="button"
            onclick={() => showForm = false}
            class="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  </div>
{/if}

<!-- ── MAIN CONTENT ───────────────────────────────────────────────────────── -->
<div class="p-4 sm:p-6 space-y-4 sm:space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between gap-2 flex-wrap">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Programs</h1>
      <p class="text-gray-500 text-xs sm:text-sm">Manage SK assistance programs</p>
    </div>

    <!-- Search + New button row -->
    <div class="flex items-center gap-2">
      <!-- Live search input -->
      <div class="relative">
        <Search size={14} class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          bind:value={searchTerm}
          placeholder="Search programs..."
          class="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition w-44 sm:w-56"
        />
        {#if searchTerm}
          <button
            onclick={() => searchTerm = ''}
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        {/if}
      </div>

      <button
        onclick={openCreate}
        class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] shrink-0"
        style="background: #0A1F44;"
      >
        <Plus size={14} />
        <span class="hidden xs:inline">New Program</span>
        <span class="xs:hidden">New</span>
      </button>
    </div>
  </div>

  <!-- Alerts -->
  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{error}</div>
  {/if}
  {#if success}
    <div class="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-sm">{success}</div>
  {/if}

  <!-- Loading -->
  {#if loading}
    <div class="flex items-center gap-2 text-slate-400 text-sm py-12">
      <div class="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
      Loading programs...
    </div>

  <!-- Empty (no programs at all) -->
  {:else if programs.length === 0}
    <div class="bg-white border border-slate-200 rounded-2xl text-center py-16 shadow-sm">
      <FolderOpen size={36} class="mx-auto mb-3 text-slate-300" />
      <p class="text-slate-400 font-medium text-sm">No programs yet.</p>
      <p class="text-slate-300 text-xs mt-1">Click "New Program" to get started.</p>
    </div>

  <!-- No search results -->
  {:else if filteredPrograms.length === 0}
    <div class="bg-white border border-slate-200 rounded-2xl text-center py-14 shadow-sm">
      <Search size={32} class="mx-auto mb-3 text-slate-300" />
      <p class="text-slate-500 font-medium text-sm">No programs match "<span class="text-slate-700">{searchTerm}</span>"</p>
      <button onclick={() => searchTerm = ''} class="text-xs text-blue-500 hover:underline mt-2">Clear search</button>
    </div>

  <!-- Program Cards -->
  {:else}
    <div class="grid gap-3">
      {#each filteredPrograms as p}
        {@const cfg = statusConfig[p.status] ?? statusConfig.closed}
        <div class="bg-white border border-slate-200 rounded-2xl px-4 sm:px-5 py-4 hover:shadow-md hover:border-slate-300 transition-all">

          <!-- Top row: title + status badges -->
          <div class="flex items-start justify-between gap-2 mb-1">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-900 text-sm leading-snug">{p.title}</h3>
            </div>
            <div class="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              <span class="text-[11px] font-medium px-2 py-0.5 rounded-full {cfg.classes}">{cfg.label}</span>
              <span class="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 hidden sm:inline">{p.category}</span>
            </div>
          </div>

          <!-- Category badge on mobile -->
          <span class="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 inline sm:hidden mb-1">{p.category}</span>

          <!-- Description -->
          <p class="text-slate-400 text-xs mb-3 line-clamp-1">{p.description || 'No description provided'}</p>

          <!-- Stats row -->
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3">
            <span class="text-slate-400">Slots: <strong class="text-slate-700">{p.slots_used}/{p.slots}</strong></span>
            <span class="text-slate-400">Pending: <strong class="text-amber-600">{p.pending_count}</strong></span>
            <span class="text-slate-400">Approved: <strong class="text-emerald-600">{p.approved_count}</strong></span>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-1.5 flex-wrap items-center">

            {#if p.status === 'draft' || p.status === 'closed'}
              <button
                onclick={() => setStatus(p.id, 'open')}
                class="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition"
              >
                Open
              </button>
            {/if}
            {#if p.status === 'open'}
              <button
                onclick={() => setStatus(p.id, 'closed')}
                class="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition"
              >
                Close
              </button>
            {/if}

            <div class="relative group/tip">
              <a
                href="/applications?program={p.id}"
                class="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition"
              >
                <ClipboardList size={14} />
              </a>
              <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-20">
                Applicants
              </span>
            </div>

            <div class="relative group/tip">
              <button
                onclick={() => openEdit(p)}
                class="flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition"
              >
                <Pencil size={14} />
              </button>
              <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-20">
                Edit
              </span>
            </div>

            <div class="relative group/tip">
              <button
                onclick={() => confirmDelete(p)}
                class="flex items-center justify-center w-8 h-8 rounded-lg text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition"
              >
                <Trash2 size={14} />
              </button>
              <span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-20">
                Delete
              </span>
            </div>

          </div>
        </div>
      {/each}
    </div>
  {/if}

</div>