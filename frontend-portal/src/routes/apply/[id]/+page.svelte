<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { apiFetch, user } from '$lib/api.js';
  import {
    ClipboardList, Users, Send, ArrowLeft,
    CheckCircle2, AlertCircle, Loader2
  } from 'lucide-svelte';

  /**
   * @typedef {{
   *   id: number,
   *   title: string,
   *   category: string,
   *   slots: number,
   *   slots_used: number
   * }} Program
   */

  /** @type {Program | null} */
  let program = $state(null);
  let loading = $state(true);
  let submitting = $state(false);
  let error = $state('');
  let success = $state(false);

  let form = $state({
    full_name: '',
    address: '',
    age: '',
    contact: '',
    barangay: '',
    requirements_submitted: ''
  });

  onMount(async () => {
    if (!$user) { goto('/login'); return; }
    try {
      program = await apiFetch(`/programs/${$page.params.id}`);
      // Pre-fill from user data
      form.full_name = $user?.full_name ?? '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error';
    } finally {
      loading = false;
    }
  });

  async function submitApplication() {
    submitting = true;
    error = '';
    try {
      await apiFetch('/applications', {
        method: 'POST',
        body: {
          program_id: $page.params.id,
          full_name: form.full_name,
          address: form.address,
          age: parseInt(form.age),
          contact: form.contact,
          barangay: form.barangay,
          requirements_submitted: form.requirements_submitted
        }
      });
      success = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="max-w-lg mx-auto">
  {#if loading}
    <div class="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
      <Loader2 class="w-5 h-5 animate-spin" />
      Loading...
    </div>

  {:else if success}
    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm text-center py-14 px-8">
      <div class="flex justify-center mb-4">
        <div class="bg-emerald-100 rounded-full p-4">
          <CheckCircle2 class="w-10 h-10 text-emerald-600" />
        </div>
      </div>
      <h2 class="text-xl font-bold text-slate-900 mb-2">Na-submit na ang Application!</h2>
      <p class="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
        Hihintayin ang review ng SK Officials. Malalaman mo ang status sa "Aking Applications".
      </p>
      <div class="flex gap-3 justify-center">
        <a href="/my-applications"
          class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
          Tingnan ang Applications
        </a>
        <a href="/"
          class="border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-sm px-5 py-2.5 rounded-lg transition">
          Bumalik sa Home
        </a>
      </div>
    </div>

  {:else}
    <!-- Program Info -->
    {#if program}
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
        <div class="flex items-start gap-3">
          <div class="bg-blue-100 rounded-lg p-2 shrink-0">
            <ClipboardList class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 class="font-bold text-blue-900">{program.title}</h2>
            <p class="text-blue-700 text-sm">{program.category}</p>
            <p class="text-blue-600 text-xs mt-1 flex items-center gap-1">
              <Users class="w-3.5 h-3.5" />
              {program.slots - program.slots_used} slots natitira sa {program.slots} total
            </p>
          </div>
        </div>
      </div>
    {/if}

    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h1 class="text-lg font-bold text-slate-900 mb-1">Application Form</h1>
      <p class="text-slate-500 text-sm mb-5">Punan ang lahat ng fields ng tama at kumpleto.</p>

      <form onsubmit={(e) => { e.preventDefault(); submitApplication(); }} class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5" for="fn">Buong Pangalan *</label>
          <input id="fn" bind:value={form.full_name}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            required placeholder="Juan Dela Cruz" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5" for="age">Edad *</label>
            <input id="age" bind:value={form.age} type="number"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              required placeholder="18" min="1" max="30" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5" for="contact">Contact Number *</label>
            <input id="contact" bind:value={form.contact}
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              required placeholder="09XXXXXXXXX" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5" for="barangay">Barangay *</label>
          <input id="barangay" bind:value={form.barangay}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            required placeholder="Barangay mo" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5" for="address">Kumpletong Address *</label>
          <input id="address" bind:value={form.address}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            required placeholder="Blk/Lot, Street, Barangay, Lungsod" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5" for="req">Mga Sinubmit na Requirements</label>
          <textarea id="req" bind:value={form.requirements_submitted}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 h-20 resize-none"
            placeholder="e.g. Photocopy ng report card, Barangay certificate..."></textarea>
        </div>

        {#if error}
          <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">
            <AlertCircle class="w-4 h-4 shrink-0" />
            {error}
          </div>
        {/if}

        <div class="flex gap-3 pt-1">
          <button type="submit"
            class="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition"
            disabled={submitting}>
            {#if submitting}
              <Loader2 class="w-4 h-4 animate-spin" />
              Isinusumite...
            {:else}
              <Send class="w-4 h-4" />
              I-submit ang Application
            {/if}
          </button>
          <a href="/"
            class="flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 text-sm px-4 py-2.5 rounded-lg transition">
            <ArrowLeft class="w-4 h-4" />
            Bumalik
          </a>
        </div>
      </form>
    </div>
  {/if}
</div>