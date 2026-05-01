<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api.js';

  interface ReportSummary {
    totalPrograms: number;
    activePrograms: number;
    pendingApps: number;
    approvedBeneficiaries: number;
    rejectedApps: number;
  }

  interface ProgramStat {
    title: string;
    category: string;
    beneficiary_count: number;
    slots: number;
  }

  interface MostAssisted {
    full_name: string;
    address: string;
    program_count: number;
  }

  interface RepeatBeneficiary {
    full_name: string;
    address: string;
    times_assisted: number;
  }

  interface Report {
    summary: ReportSummary;
    perProgram: ProgramStat[];
    mostAssisted: MostAssisted[];
    repeatBeneficiaries: RepeatBeneficiary[];
  }

  let report = $state<Report | null>(null);
  let loading = $state(true);

  onMount(async () => {
    report = await apiFetch('/beneficiaries/reports/summary');
    loading = false;
  });
</script>

<div class="p-6 space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
    <p class="text-gray-500 text-sm">Buod at analytics ng lahat ng programs at beneficiaries</p>
  </div>

  {#if loading}
    <div class="text-gray-400 text-sm">Loading...</div>
  {:else if report}
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {#each [
        { val: report.summary.totalPrograms, label: 'Total Programs', color: 'bg-blue-50 border-blue-100 text-blue-700' },
        { val: report.summary.activePrograms, label: 'Active Programs', color: 'bg-green-50 border-green-100 text-green-700' },
        { val: report.summary.pendingApps, label: 'Pending', color: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
        { val: report.summary.approvedBeneficiaries, label: 'Beneficiaries', color: 'bg-purple-50 border-purple-100 text-purple-700' },
        { val: report.summary.rejectedApps, label: 'Rejected', color: 'bg-red-50 border-red-100 text-red-700' },
      ] as s}
        <div class="card border {s.color}">
          <div class="text-3xl font-bold">{s.val}</div>
          <div class="text-xs font-medium mt-1">{s.label}</div>
        </div>
      {/each}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="card">
        <h2 class="font-semibold text-gray-800 mb-4">Beneficiaries per Program</h2>
        {#if report.perProgram.length === 0}
          <p class="text-gray-400 text-sm">Walang data pa</p>
        {:else}
          <div class="space-y-3">
            {#each report.perProgram as p}
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium truncate flex-1 mr-2">{p.title}</span>
                  <span class="text-gray-500 shrink-0">{p.beneficiary_count}/{p.slots}</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full"
                    style="width: {p.slots > 0 ? Math.round(p.beneficiary_count/p.slots*100) : 0}%"></div>
                </div>
                <div class="text-xs text-gray-400 mt-0.5">{p.category}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="card">
        <h2 class="font-semibold text-gray-800 mb-4">Pinaka-maraming Natanggap na Tulong</h2>
        {#if report.mostAssisted.length === 0}
          <p class="text-gray-400 text-sm">Walang data pa</p>
        {:else}
          <div class="space-y-2">
            {#each report.mostAssisted.slice(0,10) as r, i}
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-400 w-5 text-right">{i+1}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{r.full_name}</div>
                  <div class="text-xs text-gray-400 truncate">{r.address}</div>
                </div>
                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{r.program_count}x</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="card lg:col-span-2">
        <h2 class="font-semibold text-gray-800 mb-4">⚠️ Paulit-ulit na Nakatanggap ng Benefits</h2>
        {#if report.repeatBeneficiaries.length === 0}
          <p class="text-gray-400 text-sm py-4 text-center">✅ Walang paulit-ulit na beneficiary</p>
        {:else}
          <table class="w-full text-sm">
            <thead class="text-left text-gray-500">
              <tr class="border-b">
                <th class="pb-2 font-medium">Pangalan</th>
                <th class="pb-2 font-medium">Address</th>
                <th class="pb-2 font-medium text-right">Beses</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              {#each report.repeatBeneficiaries as r}
                <tr class="hover:bg-gray-50">
                  <td class="py-2.5 font-medium">{r.full_name}</td>
                  <td class="py-2.5 text-gray-500">{r.address}</td>
                  <td class="py-2.5 text-right">
                    <span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">{r.times_assisted}x</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    </div>
  {/if}
</div>