<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api.js';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import CheckSquare from 'lucide-svelte/icons/check-square';
  import Clock from 'lucide-svelte/icons/clock';
  import Users from 'lucide-svelte/icons/users';
  import XCircle from 'lucide-svelte/icons/x-circle';

  interface AppRow {
    full_name: string;
    program_title: string;
    created_at: string;
    status: string;
  }

  interface Stats {
    totalPrograms: number;
    activePrograms: number;
    pendingApps: number;
    approvedBeneficiaries: number;
    rejectedApps: number;
  }

  let stats = $state<Stats | null>(null);
  let recentApps = $state<AppRow[]>([]);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      const [rep, apps] = await Promise.all([
        apiFetch('/beneficiaries/reports/summary'),
        apiFetch('/applications?status=pending')
      ]);
      stats = rep.summary;
      recentApps = (apps as AppRow[]).slice(0, 8);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error';
    } finally {
      loading = false;
    }
  });

  const cards = [
    { key: 'totalPrograms',         label: 'Total Programs',        icon: ClipboardList, color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { key: 'activePrograms',        label: 'Active Programs',       icon: CheckSquare,   color: 'bg-green-50 text-green-700 border-green-100' },
    { key: 'pendingApps',           label: 'Pending Applications',  icon: Clock,         color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    { key: 'approvedBeneficiaries', label: 'Total Beneficiaries',   icon: Users,         color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { key: 'rejectedApps',          label: 'Rejected Applications', icon: XCircle,       color: 'bg-red-50 text-red-700 border-red-100' },
  ] as const;
</script>

<div class="p-6 space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
    <p class="text-gray-500 text-sm">Overview of SK Beneficiary Tracking and Management System</p>
  </div>

  {#if loading}
    <div class="text-gray-400 text-sm">Loading...</div>
  {:else if error}
    <div class="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
  {:else}
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {#each cards as card}
        <div class="card border {card.color} flex flex-col gap-1">
          <card.icon size={28} />
          <div class="text-3xl font-bold">{stats?.[card.key] ?? 0}</div>
          <div class="text-xs font-medium">{card.label}</div>
        </div>
      {/each}
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-gray-800">Pending Applications</h2>
        <a href="/applications" class="text-blue-600 text-sm hover:underline">View all →</a>
      </div>
      {#if recentApps.length === 0}
        <p class="text-gray-400 text-sm py-4 text-center">No pending applications</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 border-b">
                <th class="pb-2 font-medium">Applicant</th>
                <th class="pb-2 font-medium">Program</th>
                <th class="pb-2 font-medium">Date</th>
                <th class="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              {#each recentApps as app}
                <tr class="hover:bg-gray-50">
                  <td class="py-2.5 font-medium">{app.full_name}</td>
                  <td class="py-2.5 text-gray-600">{app.program_title}</td>
                  <td class="py-2.5 text-gray-400">{new Date(app.created_at).toLocaleDateString('fil-PH')}</td>
                  <td class="py-2.5"><span class="badge-pending">Pending</span></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>