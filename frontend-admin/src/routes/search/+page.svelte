<script lang="ts">
  import { apiFetch } from '$lib/api.js';

  interface SearchResult {
    full_name: string;
    address: string;
    contact: string;
    program_title: string;
    category: string;
    received_at: string;
  }

  interface PersonGroup {
    full_name: string;
    address: string;
    contact: string;
    programs: SearchResult[];
  }

  let searchName = $state('');
  let results = $state<SearchResult[]>([]);
  let searched = $state(false);
  let loading = $state(false);
  let error = $state('');

  async function doSearch() {
    if (!searchName.trim()) return;
    loading = true;
    searched = true;
    error = '';
    try {
      results = await apiFetch(`/beneficiaries/search?name=${encodeURIComponent(searchName)}`);
    } catch (e) { error = e instanceof Error ? e.message : 'Error'; }
    finally { loading = false; }
  }

  let groupedByPerson = $derived(results.reduce<Record<string, PersonGroup>>((acc, r) => {
    const key = `${r.full_name}||${r.address}`;
    if (!acc[key]) acc[key] = { full_name: r.full_name, address: r.address, contact: r.contact, programs: [] };
    acc[key].programs.push(r);
    return acc;
  }, {}));
</script>

<div class="p-6 space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Search Records</h1>
    <p class="text-gray-500 text-sm">Hanapin ang isang tao at tingnan ang kanyang benefit history</p>
  </div>

  <div class="card">
    <label class="label text-base font-semibold text-gray-800" for="sn">Pangalan ng Resident</label>
    <div class="flex gap-3 mt-2">
      <input id="sn" bind:value={searchName} class="input text-base" placeholder="e.g. Juan Dela Cruz"
        onkeydown={(e) => e.key === 'Enter' && doSearch()} />
      <button class="btn-primary px-6" onclick={doSearch} disabled={loading}>
        {loading ? 'Hinahanap...' : '🔍 Hanapin'}
      </button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
  {/if}

  {#if searched && !loading}
    {#if Object.keys(groupedByPerson).length === 0}
      <div class="card text-center py-12">
        <div class="text-4xl mb-3">🔍</div>
        <div class="text-gray-500">Walang nahanap para sa "<strong>{searchName}</strong>"</div>
      </div>
    {:else}
      {#each Object.values(groupedByPerson) as person}
        <div class="card">
          <div class="flex items-start gap-4 mb-5">
            <div class="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {person.full_name.charAt(0)}
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">{person.full_name}</h2>
              <p class="text-gray-500 text-sm">{person.address}</p>
              <p class="text-gray-400 text-sm">{person.contact}</p>
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                {person.programs.length} program/s na natanggap
              </span>
            </div>
          </div>
          <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Benefit History</h3>
          <div class="space-y-2">
            {#each person.programs as prog}
              <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div class="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <span class="font-medium text-sm">{prog.program_title}</span>
                  <span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full ml-2">{prog.category}</span>
                </div>
                <div class="text-xs text-gray-400 shrink-0">
                  {new Date(prog.received_at).toLocaleDateString('fil-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  {/if}
</div>