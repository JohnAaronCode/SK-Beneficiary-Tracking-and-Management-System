<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { apiFetch } from '$lib/api.js';
  import Search from 'lucide-svelte/icons/search';
  import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import Clock from 'lucide-svelte/icons/clock';
  import XCircle from 'lucide-svelte/icons/x-circle';
  import CircleDashed from 'lucide-svelte/icons/circle-dashed';
  import ListFilter from 'lucide-svelte/icons/list-filter';
  import ThumbsUp from 'lucide-svelte/icons/thumbs-up';
  import Hourglass from 'lucide-svelte/icons/hourglass';
  import Ban from 'lucide-svelte/icons/ban';

  type StatusKey = 'pending' | 'approved' | 'rejected' | 'waitlist';

  interface Program { id: string | number; title: string; status: string; }
  interface Application {
    id: string | number;
    full_name: string;
    address: string;
    age: number;
    contact: string;
    status: StatusKey;
  }

  let programs = $state<Program[]>([]);
  let applications = $state<Application[]>([]);
  let selectedProgramId = $state('');
  let filterStatus = $state('');
  let searchTerm = $state('');
  let loading = $state(false);
  let error = $state('');
  let success = $state('');

  // Load programs on mount; auto-select program if passed via URL query param
  onMount(async () => {
    programs = await apiFetch('/programs');
    const pid = page.url.searchParams.get('program');
    if (pid) {
      selectedProgramId = pid;
      await loadApplications();
    }
  });

  // Fetch applications for the selected program with optional status/search filters
  async function loadApplications() {
    if (!selectedProgramId) return;
    loading = true;
    try {
      let url = `/applications/program/${selectedProgramId}?`;
      if (filterStatus) url += `status=${filterStatus}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}`;
      applications = await apiFetch(url);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load applications';
    } finally {
      loading = false;
    }
  }

  // Update an application's status (approve / waitlist / reject)
  async function updateStatus(id: string | number, status: string) {
    const notes = status === 'rejected'
      ? prompt('Reason for rejection (optional):')
      : null;
    try {
      await apiFetch(`/applications/${id}/status`, { method: 'PATCH', body: { status, notes } });
      success = `Application marked as ${status}.`;
      await loadApplications();
      setTimeout(() => success = '', 3000);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update status';
    }
  }

  // Badge CSS classes per status
  const statusClass: Record<StatusKey, string> = {
    pending:  'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    waitlist: 'badge-waitlist',
  };
</script>

<div class="p-6 space-y-5">

  <!-- Page Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Applications</h1>
    <p class="text-gray-500 text-sm">Review and manage applicant submissions</p>
  </div>

  <!-- Alert Messages -->
  {#if error}
    <div class="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
  {/if}
  {#if success}
    <div class="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>
  {/if}

  <!-- Filter Bar -->
  <div class="card flex flex-wrap gap-3 items-end">

    <!-- Program Selector -->
    <div class="flex-1 min-w-48">
      <label class="label flex items-center gap-1.5" for="prog">
        <SlidersHorizontal size={13} class="text-gray-400" /> Program
      </label>
      <select id="prog" bind:value={selectedProgramId} onchange={loadApplications} class="input">
        <option value="">— Select a Program —</option>
        {#each programs as p}
          <option value={p.id}>{p.title} ({p.status})</option>
        {/each}
      </select>
    </div>

    <!-- Status Filter -->
    <div class="w-44">
      <label class="label flex items-center gap-1.5" for="status">
        <ListFilter size={13} class="text-gray-400" /> Status
      </label>
      <select id="status" bind:value={filterStatus} onchange={loadApplications} class="input">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="waitlist">Waitlist</option>
      </select>
    </div>

    <!-- Name Search -->
    <div class="flex-1 min-w-48">
      <label class="label flex items-center gap-1.5" for="search">
        <Search size={13} class="text-gray-400" /> Search
      </label>
      <div class="relative">
        <Search size={15} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          id="search"
          bind:value={searchTerm}
          oninput={loadApplications}
          class="input pl-8"
          placeholder="Search by name..."
        />
      </div>
    </div>

  </div>

  <!-- Empty State: No Program Selected -->
  {#if !selectedProgramId}
    <div class="card text-center text-gray-400 py-16">
      <CircleDashed size={36} class="mx-auto mb-3 text-gray-300" />
      <p class="text-sm">Select a program above to view its applications</p>
    </div>

  {:else if loading}
    <div class="text-gray-400 text-sm">Loading applications...</div>

  <!-- Empty State: No Results -->
  {:else if applications.length === 0}
    <div class="card text-center text-gray-400 py-16">
      <Search size={36} class="mx-auto mb-3 text-gray-300" />
      <p class="text-sm">No applications found</p>
    </div>

  {:else}
    <!-- Applications Table -->
    <div class="card overflow-x-auto p-0">

      <!-- Table Header with Status Summary -->
      <div class="flex items-center gap-3">
        <span class="font-medium text-gray-800">{applications.length} application(s)</span>
        {#if applications.filter(a => a.status === 'pending').length > 0}
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition"
            onclick={async () => {
              if (!confirm(`Approve all ${applications.filter(a => a.status === 'pending').length} pending applications?`)) return;
              for (const app of applications.filter(a => a.status === 'pending')) {
                await updateStatus(app.id, 'approved');
              }
            }}
          >
            <CheckCircle size={13} /> Approve All Pending
          </button>
        {/if}
      </div>

      <!-- Data Table -->
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Address</th>
            <th class="px-4 py-3 font-medium">Age</th>
            <th class="px-4 py-3 font-medium">Contact</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          {#each applications as app}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{app.full_name}</td>
              <td class="px-4 py-3 text-gray-600">{app.address}</td>
              <td class="px-4 py-3">{app.age}</td>
              <td class="px-4 py-3 text-gray-600">{app.contact}</td>
              <td class="px-4 py-3">
                <span class={statusClass[app.status] ?? 'badge-pending'}>{app.status}</span>
              </td>
              <td class="px-4 py-3">
                {#if app.status === 'pending' || app.status === 'waitlist'}
                  <div class="flex gap-1.5">
                    <button
                      class="btn-success flex items-center gap-1"
                      onclick={() => updateStatus(app.id, 'approved')}
                    >
                      <ThumbsUp size={12} /> Approve
                    </button>
                    <button
                      class="btn-warning flex items-center gap-1"
                      onclick={() => updateStatus(app.id, 'waitlist')}
                    >
                      <Clock size={12} /> Waitlist
                    </button>
                    <button
                      class="btn-danger flex items-center gap-1"
                      onclick={() => updateStatus(app.id, 'rejected')}
                    >
                      <Ban size={12} /> Reject
                    </button>
                  </div>
                {:else}
                  <span class="text-gray-400 text-xs flex items-center gap-1">
                    <CheckCircle size={11} /> Processed
                  </span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

    </div>
  {/if}

</div>