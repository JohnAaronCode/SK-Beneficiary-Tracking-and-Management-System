<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api.js';
  import BarChart2 from 'lucide-svelte/icons/bar-chart-2';
  import Trophy from 'lucide-svelte/icons/trophy';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import CheckSquare from 'lucide-svelte/icons/check-square';
  import CalendarDays from 'lucide-svelte/icons/calendar-days';
  import TrendingUp from 'lucide-svelte/icons/trending-up';
  import ChevronLeft from 'lucide-svelte/icons/chevron-left';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';

  interface ProgramStat   { title: string; category: string; beneficiary_count: number; slots: number; }
  interface MostAssisted  { full_name: string; address: string; program_count: number; }
  interface RepeatBeneficiary { full_name: string; address: string; times_assisted: number; }
  interface Report {
    summary: { totalPrograms: number; activePrograms: number; pendingApps: number; approvedBeneficiaries: number; rejectedApps: number; };
    perProgram: ProgramStat[];
    mostAssisted: MostAssisted[];
    repeatBeneficiaries: RepeatBeneficiary[];
  }
  interface MonthlyRow { month: number; month_name: string; beneficiary_count: number; programs_active: number; }
  interface YearlyRow  { year: number; beneficiary_count: number; programs_count: number; }
  interface MonthlyReport { monthly: MonthlyRow[]; yearly: YearlyRow[]; year: number; }

  let report        = $state<Report | null>(null);
  let monthlyReport = $state<MonthlyReport | null>(null);
  let loading       = $state(true);
  let selectedYear  = $state(new Date().getFullYear());

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  onMount(async () => {
    await loadAll();
  });

  async function loadAll() {
    loading = true;
    [report, monthlyReport] = await Promise.all([
      apiFetch('/beneficiaries/reports/summary'),
      apiFetch(`/beneficiaries/reports/monthly?year=${selectedYear}`)
    ]);
    loading = false;
  }

  async function changeYear(dir: number) {
    selectedYear += dir;
    monthlyReport = await apiFetch(`/beneficiaries/reports/monthly?year=${selectedYear}`);
  }

  let monthGrid = $derived(
    MONTHS.map((name, i) => {
      const found = monthlyReport?.monthly.find(m => m.month === i + 1);
      return { month: i + 1, name, count: found?.beneficiary_count ?? 0, programs: found?.programs_active ?? 0 };
    })
  );

  let maxMonthCount = $derived(Math.max(...(monthGrid.map(m => m.count)), 1));
</script>

<div class="p-6 space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
    <p class="text-gray-500 text-sm">Summary and analytics for all programs and beneficiaries</p>
  </div>

  {#if loading}
    <div class="flex items-center gap-2 text-gray-400 text-sm py-12">
      <div class="w-4 h-4 border-2 border-gray-200 rounded-full animate-spin" style="border-top-color:#0A1F44;"></div>
      Loading reports...
    </div>
  {:else if report}

    <!-- Monthly Summary -->
    <div class="card">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays size={16} style="color:#0A1F44;" /> Monthly Beneficiary Distribution
        </h2>
        <div class="flex items-center gap-2">
          <button
            onclick={() => changeYear(-1)}
            class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-500"
          >
            <ChevronLeft size={15} />
          </button>
          <span class="text-sm font-semibold text-gray-700 w-14 text-center">{selectedYear}</span>
          <button
            onclick={() => changeYear(1)}
            class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-500"
            disabled={selectedYear >= new Date().getFullYear()}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {#if monthGrid.every(m => m.count === 0)}
        <div class="text-center py-8 text-gray-400">
          <CalendarDays size={32} class="mx-auto mb-2 text-gray-300" />
          <p class="text-sm">No beneficiary data for {selectedYear}</p>
        </div>
      {:else}
        <div class="flex items-end gap-1.5 h-36 mb-2">
          {#each monthGrid as m}
            <div class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full flex flex-col justify-end" style="height: 120px;">
                {#if m.count > 0}
                  <div
                    class="w-full rounded-t-md transition-all duration-300 relative group cursor-default"
                    style="height: {Math.max(4, Math.round(m.count / maxMonthCount * 100))}%; background:#0A1F44;"
                  >
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-10">
                      {m.count} beneficiar{m.count === 1 ? 'y' : 'ies'}
                    </div>
                  </div>
                {:else}
                  <div class="w-full rounded-t-md bg-gray-100" style="height: 4px;"></div>
                {/if}
              </div>
              <span class="text-[10px] text-gray-400">{m.name}</span>
            </div>
          {/each}
        </div>

        <div class="overflow-x-auto mt-4">
          <table class="w-full text-sm">
            <thead class="text-left text-gray-500 border-b border-gray-100">
              <tr>
                <th class="pb-2 font-medium">Month</th>
                <th class="pb-2 font-medium text-right">Beneficiaries</th>
                <th class="pb-2 font-medium text-right">Programs Active</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              {#each monthGrid.filter(m => m.count > 0) as m}
                <tr class="hover:bg-gray-50">
                  <td class="py-2 font-medium">{m.name} {selectedYear}</td>
                  <td class="py-2 text-right">
                    <span class="font-semibold" style="color:#0A1F44;">{m.count}</span>
                  </td>
                  <td class="py-2 text-right text-gray-500">{m.programs}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Yearly Summary -->
    {#if monthlyReport && monthlyReport.yearly.length > 0}
      <div class="card">
        <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={16} style="color:#0A1F44;" /> Yearly Summary
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-left text-gray-500 border-b border-gray-100">
              <tr>
                <th class="pb-2 font-medium">Year</th>
                <th class="pb-2 font-medium text-right">Total Beneficiaries</th>
                <th class="pb-2 font-medium text-right">Programs</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              {#each monthlyReport.yearly as y}
                <tr class="hover:bg-gray-50">
                  <td class="py-2.5 font-semibold">{y.year}</td>
                  <td class="py-2.5 text-right">
                    <span class="font-bold" style="color:#0A1F44;">{y.beneficiary_count}</span>
                  </td>
                  <td class="py-2.5 text-right text-gray-500">{y.programs_count}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

      <!-- Beneficiaries per Program -->
      <div class="card">
        <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart2 size={16} style="color:#0A1F44;" /> Beneficiaries per Program
        </h2>
        {#if report.perProgram.length === 0}
          <p class="text-gray-400 text-sm">No data available yet</p>
        {:else}
          <div class="space-y-3">
            {#each report.perProgram as p}
              {@const pct = p.slots > 0 ? Math.round(p.beneficiary_count / p.slots * 100) : 0}
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium truncate flex-1 mr-2">{p.title}</span>
                  <span class="text-gray-500 shrink-0">{p.beneficiary_count} / {p.slots}</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" style="width:{pct}%; background:#0A1F44;"></div>
                </div>
                <div class="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>{p.category}</span><span>{pct}% filled</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Most Assisted -->
      <div class="card">
        <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy size={16} class="text-yellow-500" /> Most Assisted Individuals
        </h2>
        {#if report.mostAssisted.length === 0}
          <p class="text-gray-400 text-sm">No data yet</p>
        {:else}
          <div class="space-y-2">
            {#each report.mostAssisted.slice(0,10) as r, i}
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-400 w-5 text-right">{i+1}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{r.full_name}</div>
                  <div class="text-xs text-gray-400 truncate">{r.address}</div>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium text-white" style="background:#0A1F44;">
                  {r.program_count}x
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Repeat Beneficiaries -->
      <div class="card lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle size={16} class="text-orange-500" /> Repeat Benefit Recipients
          </h2>
          {#if report.repeatBeneficiaries.length > 0}
            <span class="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
              {report.repeatBeneficiaries.length} flagged
            </span>
          {/if}
        </div>
        {#if report.repeatBeneficiaries.length === 0}
          <div class="text-center py-6">
            <CheckSquare size={28} class="mx-auto mb-2 text-green-400" />
            <p class="text-gray-400 text-sm">No repeat beneficiaries — distribution looks fair!</p>
          </div>
        {:else}
          <div class="mb-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5 text-xs text-orange-700 flex items-center gap-2">
            <AlertTriangle size={13} />
            These residents received benefits more than once. Review before approving new applications.
          </div>
          <table class="w-full text-sm">
            <thead class="text-left text-gray-500 border-b border-gray-100">
              <tr>
                <th class="pb-2 font-medium">Name</th>
                <th class="pb-2 font-medium">Address</th>
                <th class="pb-2 font-medium text-right">Times Assisted</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              {#each report.repeatBeneficiaries as r}
                <tr class="hover:bg-gray-50">
                  <td class="py-2.5 font-medium">{r.full_name}</td>
                  <td class="py-2.5 text-gray-500">{r.address}</td>
                  <td class="py-2.5 text-right">
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold {r.times_assisted >= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}">
                      {r.times_assisted}x
                    </span>
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