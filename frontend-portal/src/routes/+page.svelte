<script>
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api.js';
  import { user } from '$lib/api.js';
  import {
    ArrowLeft,
    Inbox,
    Clock,
    CircleCheck,
    CircleX,
    ListOrdered,
    CircleAlert,
    Loader,
    StickyNote,
    Clipboard,
    UserPlus,
    LogIn,
    Users,
    CalendarDays,
    ChevronRight
  } from 'lucide-svelte';

  /**
   * @typedef {{
   *   id: number,
   *   title: string,
   *   category: string,
   *   description: string,
   *   slots: number,
   *   slots_used: number,
   *   start_date: string | null,
   *   requirements: string | null
   * }} Program
   */

  /** @type {Program[]} */
  let programs = $state([]);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      programs = await apiFetch('/programs?status=open');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error';
    } finally {
      loading = false;
    }
  });
</script>

<div class="space-y-6">
  <!-- Hero -->
  <div class="bg-linear-to-br from-blue-900 via-blue-800 to-blue-700 text-white rounded-2xl p-8 text-center shadow-lg">
    <div class="flex justify-center mb-3">
      <div class="bg-white/10 rounded-2xl p-3">
        <Clipboard class="w-10 h-10 text-blue-100" />
      </div>
    </div>
    <h1 class="text-2xl font-bold mb-2 tracking-tight">SK Beneficiary Programs</h1>
    <p class="text-blue-200 text-sm max-w-sm mx-auto">
      Mag-apply sa mga available na programs ng inyong Sangguniang Kabataan
    </p>
    {#if !$user}
      <div class="mt-5 flex gap-3 justify-center">
        <a href="/register"
          class="flex items-center gap-2 bg-white text-blue-900 font-semibold px-5 py-2 rounded-lg hover:bg-blue-50 transition text-sm shadow">
          <UserPlus class="w-4 h-4" />
          Mag-register
        </a>
        <a href="/login"
          class="flex items-center gap-2 bg-blue-700/60 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm border border-blue-500/50">
          <LogIn class="w-4 h-4" />
          Login
        </a>
      </div>
    {/if}
  </div>

  <!-- Programs List -->
  <div>
    <h2 class="text-lg font-bold text-slate-800 mb-4">Mga Available na Programs</h2>

    {#if loading}
      <div class="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
        <div class="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
        Loading programs...
      </div>
    {:else if error}
      <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
        <CircleAlert class="w-4 h-4 shrink-0" />
        {error}
      </div>
    {:else if programs.length === 0}
      <div class="bg-white border border-slate-200 rounded-2xl text-center py-16 shadow-sm">
        <Inbox class="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p class="text-slate-500 font-medium">Walang bukas na programs sa ngayon.</p>
        <p class="text-slate-400 text-sm mt-1">Bumalik ka ulit mamaya!</p>
      </div>
    {:else}
      <div class="grid gap-4">
        {#each programs as program}
          <div class="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <h3 class="font-semibold text-slate-900">{program.title}</h3>
                  <span class="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    <CircleCheck class="w-3 h-3" /> OPEN
                  </span>
                  <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{program.category}</span>
                </div>
                <p class="text-slate-500 text-sm mb-3">{program.description || 'Walang detalye.'}</p>
                <div class="flex gap-4 text-xs text-slate-500 flex-wrap">
                  <span class="flex items-center gap-1">
                    <Users class="w-3.5 h-3.5" />
                    Slots: <strong class="text-slate-700 ml-0.5">{program.slots - program.slots_used} natitira sa {program.slots}</strong>
                  </span>
                  {#if program.start_date}
                    <span class="flex items-center gap-1">
                      <CalendarDays class="w-3.5 h-3.5" />
                      {new Date(program.start_date).toLocaleDateString('fil-PH')}
                    </span>
                  {/if}
                </div>
                {#if program.requirements}
                  <div class="mt-2 text-xs text-slate-500">
                    <strong>Requirements:</strong> {program.requirements}
                  </div>
                {/if}
              </div>

              <div class="shrink-0">
                {#if $user}
                  {#if program.slots_used >= program.slots}
                    <span class="text-xs text-slate-400 bg-slate-100 px-3 py-2 rounded-lg block text-center">Puno na</span>
                  {:else}
                    <a href="/apply/{program.id}"
                      class="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition whitespace-nowrap">
                      Mag-apply <ChevronRight class="w-4 h-4" />
                    </a>
                  {/if}
                {:else}
                  <a href="/login"
                    class="flex items-center gap-1.5 text-blue-700 hover:text-blue-800 border border-blue-200 hover:border-blue-400 bg-blue-50 text-sm px-4 py-2 rounded-lg transition whitespace-nowrap">
                    <LogIn class="w-4 h-4" />
                    Login
                  </a>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>