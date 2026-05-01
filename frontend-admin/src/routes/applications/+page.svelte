<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { apiFetch } from '$lib/api.js';
  import Search from 'lucide-svelte/icons/search';
  import Filter from 'lucide-svelte/icons/filter';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import Clock from 'lucide-svelte/icons/clock';
  import XCircle from 'lucide-svelte/icons/x-circle';

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

  onMount(async () => {
    programs = await apiFetch('/programs');
    const pid = page.url.searchParams.get('program');
    if (pid) { selectedProgramId = pid; await loadApplications(); }
  });

  async function loadApplications() {
    if (!selectedProgramId) return;
    loading = true;
    try {
      let url = `/applications/program/${selectedProgramId}?`;
      if (filterStatus) url += `status=${filterStatus}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}`;
      applications = await apiFetch(url);
    } catch (e) { error = e instanceof Error ? e.message : 'Error'; }
    finally { loading = false; }
  }

  async function updateStatus(id: string | number, status: string) {
    const notes = status === 'rejected' ? prompt('Reason for rejection (optional):') : null;
    try {
      await apiFetch(`/applications/${id}/status`, { method: 'PATCH', body: { status, notes } });
      success = `Application ${status}!`;
      await loadApplications();
      setTimeout(() => success = '', 3000);
    } catch (e) { error = e instanceof Error ? e.message : 'Error'; }
  }

  const statusClass: Record<StatusKey, string> = {
    pending: 'badge-pending', approved: 'badge-approved',
    rejected: 'badge-rejected', waitlist: 'badge-waitlist'
  };
</script>

<div class="p-6 space-y-5">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Applications</h1>
    <p class="text-gray-500 text-sm">Review and manage applicant submissions</p>
  </div>

  {#if error}<div class="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>{/if}
  {#if success}<div class="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>{/if}

  <!-- Filter Bar -->
  <div class="card flex flex-wrap gap-3 items-end">
    <div class="flex-1 min-w-48">
      <label class="label flex items-center gap-1.5" for="prog">
        <Filter size={13} class="text-gray-400" /> Program
      </label>
      <select id="prog" bind:value={selectedProgramId} onchange={loadApplications} class="input">
        <option value="">— Select a Program —</option>
        {#each programs as p}
          <option value={p.id}>{p.title} ({p.status})</option>
        {/each}
      </select>
    </div>
    <div class="w-44">
      <label class="label flex items-center gap-1.5" for="status">
        <Clock size={13} class="text-gray-400" /> Status
      </label>
      <select id="status" bind:value={filterStatus} onchange={loadApplications} class="input">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="waitlist">Waitlist</option>
      </select>
    </div>
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

  {#if !selectedProgramId}
    <div class="card text-center text-gray-400 py-16">
      <Filter size={36} class="mx-auto mb-3 text-gray-300" />
      <p class="text-sm">Select a program above to view its applications</p>
    </div>
  {:else if loading}
    <div class="text-gray-400 text-sm">Loading...</div>
  {:else if applications.length === 0}
    <div class="card text-center text-gray-400 py-16">
      <Search size={36} class="mx-auto mb-3 text-gray-300" />
      <p class="text-sm">No applications found</p>
    </div>
  {:else}
    <div class="card overflow-x-auto p-0">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <span class="font-medium text-gray-800">{applications.length} application(s)</span>
        <div class="flex gap-2 text-xs">
          <span class="badge-pending flex items-center gap-1">
            <Clock size={11} /> {applications.filter(a=>a.status==='pending').length} pending
          </span>
          <span class="badge-approved flex items-center gap-1">
            <CheckCircle size={11} /> {applications.filter(a=>a.status==='approved').length} approved
          </span>
          <span class="badge-rejected flex items-center gap-1">
            <XCircle size={11} /> {applications.filter(a=>a.status==='rejected').length} rejected
          </span>
        </div>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left text-gray-500">
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Address</th>
            <th class="px-4 py-3 font-medium">Age</th>
            <th class="px-4 py-3 font-medium">Contact</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Action</th>
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
                    <button class="btn-success" onclick={() => updateStatus(app.id, 'approved')}>Approve</button>
                    <button class="btn-warning" onclick={() => updateStatus(app.id, 'waitlist')}>Waitlist</button>
                    <button class="btn-danger" onclick={() => updateStatus(app.id, 'rejected')}>Reject</button>
                  </div>
                {:else}
                  <span class="text-gray-400 text-xs">Processed</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>