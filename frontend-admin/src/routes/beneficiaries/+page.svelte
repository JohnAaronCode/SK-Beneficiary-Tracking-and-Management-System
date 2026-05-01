<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api';

  interface Beneficiary {
    id: string | number;
    full_name: string;
    address: string;
    program_id: string | number;
    program_title: string;
    category: string;
  }

  interface Program { id: string | number; title: string; }

  let beneficiaries = $state<Beneficiary[]>([]);
  let programs = $state<Program[]>([]);
  let filterProgram = $state('');
  let search = $state('');
  let loading = $state(true);

  onMount(async () => {
    [beneficiaries, programs] = await Promise.all([
      apiFetch('/beneficiaries'),
      apiFetch('/programs')
    ]);
    loading = false;
  });

  let filtered = $derived(beneficiaries.filter(b => {
    const matchP = !filterProgram || b.program_id == filterProgram;
    const matchS = !search || b.full_name.toLowerCase().includes(search.toLowerCase());
    return matchP && matchS;
  }));

  let grouped = $derived(filtered.reduce<Record<string, { category: string; items: Beneficiary[] }>>((acc, b) => {
    const key = b.program_title || 'Unknown';
    if (!acc[key]) acc[key] = { category: b.category, items: [] };
    acc[key].items.push(b);
    return acc;
  }, {}));
</script>

<div class="p-6 space-y-5">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Beneficiaries</h1>
    <p class="text-gray-500 text-sm">Final list of all approved recipients</p>
  </div>

  <div class="card flex flex-wrap gap-3">
    <div class="flex-1 min-w-48">
      <label class="label" for="fp">Filter by Program</label>
      <select id="fp" bind:value={filterProgram} class="input">
        <option value="">All Programs</option>
        {#each programs as p}
          <option value={p.id}>{p.title}</option>
        {/each}
      </select>
    </div>
    <div class="flex-1 min-w-48">
      <label class="label" for="fs">Search</label>
      <input id="fs" bind:value={search} class="input" placeholder="Beneficiary name..." />
    </div>
  </div>

  {#if loading}
    <div class="text-gray-400 text-sm">Loading...</div>
  {:else}
    <div class="text-sm text-gray-500 font-medium">{filtered.length} beneficiaries total</div>
    {#each Object.entries(grouped) as [programTitle, group]}
      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
            {group.items.length}
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">{programTitle}</h3>
            <span class="text-xs text-gray-500">{group.category}</span>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {#each group.items as b}
            <div class="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
              <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {b.full_name.charAt(0)}
              </div>
              <div class="min-w-0">
                <div class="text-sm font-medium truncate">{b.full_name}</div>
                <div class="text-xs text-gray-400 truncate">{b.address}</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
    {#if Object.keys(grouped).length === 0}
      <div class="card text-center text-gray-400 py-12">No beneficiaries found</div>
    {/if}
  {/if}
</div>