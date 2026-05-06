<script lang="ts">
  import { apiFetch } from '$lib/api.js';
  import Search from 'lucide-svelte/icons/search';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import CheckCircle from 'lucide-svelte/icons/check-circle';
  import Calendar from 'lucide-svelte/icons/calendar';
  import Tag from 'lucide-svelte/icons/tag';
  import UserX from 'lucide-svelte/icons/user-x';
  import MapPin from 'lucide-svelte/icons/map-pin';
  import Phone from 'lucide-svelte/icons/phone';

  interface SearchResult {
    full_name: string; address: string; contact: string;
    program_title: string; category: string; received_at: string;
  }
  interface PersonGroup {
    full_name: string; address: string; contact: string;
    programs: SearchResult[];
  }

  let searchName = $state('');
  let results    = $state<SearchResult[]>([]);
  let searched   = $state(false);
  let loading    = $state(false);
  let error      = $state('');

  async function doSearch() {
    if (!searchName.trim()) return;
    loading = true; searched = true; error = '';
    try {
      results = await apiFetch(`/beneficiaries/search?name=${encodeURIComponent(searchName)}`);
    } catch (e) { error = e instanceof Error ? e.message : 'Search failed'; }
    finally { loading = false; }
  }

  let groupedByPerson = $derived(
    results.reduce<Record<string, PersonGroup>>((acc, r) => {
      const key = `${r.full_name}||${r.address}`;
      if (!acc[key]) acc[key] = { full_name: r.full_name, address: r.address, contact: r.contact, programs: [] };
      acc[key].programs.push(r);
      return acc;
    }, {})
  );
</script>

<div class="p-6 space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Search Records</h1>
    <p class="text-gray-500 text-sm">Search for a resident and view their complete benefit history</p>
  </div>

  <div class="card">
    <label class="label font-semibold text-gray-800" for="sn">Resident Full Name</label>
    <p class="text-xs text-gray-400 mb-2">Enter a partial or full name to search across all benefit records</p>
    <div class="flex gap-3 mt-1">
      <div class="relative flex-1">
        <Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input id="sn" bind:value={searchName} class="input pl-9 text-base"
          placeholder="e.g. Juan Dela Cruz" onkeydown={(e) => e.key === 'Enter' && doSearch()} />
      </div>
      <button
        class="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style="background:#0A1F44;" onclick={doSearch} disabled={loading}>
        <Search size={15} /> {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
  {/if}

  {#if searched && !loading}
    {#if Object.keys(groupedByPerson).length === 0}
      <div class="card text-center py-14">
        <UserX size={40} class="mx-auto mb-3 text-gray-300" />
        <p class="text-gray-600 font-medium">No records found</p>
        <p class="text-gray-400 text-sm mt-1">No beneficiary records match "<strong>{searchName}</strong>"</p>
      </div>
    {:else}
      <p class="text-sm text-gray-500 font-medium">
        Found {Object.keys(groupedByPerson).length} person(s) matching "{searchName}"
      </p>
      {#each Object.values(groupedByPerson) as person}
        <div class="card">
          <div class="flex items-start gap-4 mb-5">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0" style="background:#0A1F44;">
              {person.full_name.charAt(0)}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <h2 class="text-xl font-bold text-gray-900">{person.full_name}</h2>
                {#if person.programs.length >= 3}
                  <span class="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                    <AlertTriangle size={12} /> High Frequency — {person.programs.length} programs
                  </span>
                {:else if person.programs.length === 2}
                  <span class="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                    <AlertTriangle size={12} /> Repeat Recipient — {person.programs.length} programs
                  </span>
                {:else}
                  <span class="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                    <CheckCircle size={12} /> Single Recipient
                  </span>
                {/if}
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span class="flex items-center gap-1.5"><MapPin size={13} class="text-gray-400" /> {person.address}</span>
                <span class="flex items-center gap-1.5"><Phone size={13} class="text-gray-400" /> {person.contact}</span>
              </div>
            </div>
          </div>

          {#if person.programs.length > 1}
            <div class="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5">
              <AlertTriangle size={16} class="text-orange-500 shrink-0 mt-0.5" />
              <div class="text-sm text-orange-800">
                <strong>Duplicate Benefit Notice:</strong> This resident has received benefits from
                <strong>{person.programs.length} programs</strong>.
                Review carefully before approving additional applications.
              </div>
            </div>
          {/if}

          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Benefit History</h3>
            <span class="text-xs text-gray-400">{person.programs.length} record(s)</span>
          </div>
          <div class="space-y-2">
            {#each person.programs as prog, i}
              <div class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style="background:#0A1F44;">
                  {i + 1}
                </div>
                <div class="flex-1 min-w-0">
                  <span class="font-medium text-sm text-gray-900">{prog.program_title}</span>
                  <div class="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <Tag size={11} /> {prog.category}
                  </div>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                  <Calendar size={12} />
                  {new Date(prog.received_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  {/if}
</div>